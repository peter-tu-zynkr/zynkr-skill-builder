#!/usr/bin/env python3
"""pm-schema.py — validate a 管控表 tab against the SKB-011 PM shared seed.

The PMO's "status drift" is five DIFFERENT axes being read as one vocabulary: lifecycle (what a
task or project is doing) · health/RAG (derived from dates and blockers, never typed by a human) ·
risk lifecycle · decision lifecycle · closure verdict. This CLI checks a tab's HEADERS against the
declared v2 shape (with a distinct verdict for the legacy v1 shape) and a column's VALUES against
exactly ONE axis, so a health reading can never be written back as a lifecycle Status.

Sources of truth — this file embeds NONE of them (D7: the seed files hold the bytes):
  pm-sheet-schema.json      tab -> headers, v2 + legacy.v1, enum_columns
  pm-status-crosswalk.json  the five axes, surfaces, vocabularies, rejected_values
Both are looked up in TWO layouts, because this script is itself copied: `docs/pm-shared/` in the
repo, and `../references/` when check-pm-refs.sh has installed it at <skill>/scripts/pm-schema.py
next to <skill>/references/. One file, byte-identical in both places (R-B).

Usage
  pm-schema.py headers --file tests/pm-fixtures/headers-v2-good.json
  pm-schema.py headers --headers "no.,里程碑 Stage,…" [--tab 專案管理總表]
  pm-schema.py values  --file tests/pm-fixtures/values-good.json
  pm-schema.py values  --values "Done,WIP" --axis lifecycle_sheet
  pm-schema.py mirrors                    # make "the three cannot drift apart" true, not a comment
  pm-schema.py --self-test                # every fixture + every reachable verdict + mirrors

`--axis` takes either a `vocabularies` key (`lifecycle_sheet` — a named surface vocabulary, checked
against its RAW values) or an `axes` key (`lifecycle` — checked against the CANONICAL values).
Vocabularies are resolved first, per the schema's `conventions.crosswalk`. Three names (`risk`,
`decision`, `closure`) live in BOTH namespaces — prefix them `vocab:risk` or `axis:risk` to say
which one you mean.

Fixture shape (tests/pm-fixtures/*.json)
  headers: {"tab": "專案管理總表", "headers": [...]}          expected verdict from the filename
  values : {"axis": "lifecycle_sheet", "values": [...]}      (…-good -> 0 · …-bad -> 1 · …-legacy -> 2)
  An explicit "expect": <int> may PIN a verdict but may never CONTRADICT the filename: `*-good`
  must declare 0, `*-bad` a non-zero, `*-legacy` 2. A `*-bad` fixture declaring 0 is what a
  weakened fixture looks like in a diff, so it fails loudly instead of passing.

Exit codes
  0  valid
  1  invalid — every offender is printed (header mismatch, or unknown values)
  2  headers matched the LEGACY v1 shape (13 cols, 前置任務 absent) — reader must map A1:M
  3  cannot run — missing/unreadable seed, unknown tab/axis, bad arguments. Never a verdict.
`mirrors` uses 0/1 only: a missing renderer or dashboard_schema.json is a FAIL, not a skip.
"""

import argparse
import ast
import contextlib
import io
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent

# `mirrors` compares the two repo-side copies of the column map against the seed. Those copies do
# not exist in an installed skill folder, where this file ships as <skill>/scripts/pm-schema.py and
# ROOT is the skill itself. `headers` and `values` work from either root; `mirrors` is repo-only, so
# it announces that and passes rather than failing a user for running a check that cannot apply.
IN_REPO = (ROOT / "docs" / "pm-shared").is_dir() and (ROOT / "skills").is_dir()

# Two layouts hold the same bytes, and this script runs from both: the REPO, and an INSTALLED skill
# folder where check-pm-refs.sh has copied it to <skill>/scripts/pm-schema.py beside
# <skill>/references/*.json. ROOT is the parent of scripts/ in both cases, so one candidate list
# serves both and the copy stays byte-identical to the seed (R-B). First hit wins; an explicit
# --schema / --crosswalk always overrides.
SCHEMA_CANDIDATES = ("docs/pm-shared/pm-sheet-schema.json", "references/pm-sheet-schema.json")
CROSSWALK_CANDIDATES = ("docs/pm-shared/pm-status-crosswalk.json",
                        "references/pm-status-crosswalk.json")
RENDERER_CANDIDATES = ("skills/3-operations/project-status-update/scripts/render_dashboard_email.py",
                       "scripts/render_dashboard_email.py")
DASHBOARD_CANDIDATES = ("skills/3-operations/project-status-update/references/dashboard_schema.json",
                        "references/dashboard_schema.json")
FIXTURES_DEFAULT = ROOT / "tests" / "pm-fixtures"

CANNOT_RUN = 3


class CannotRun(Exception):
    """A setup problem, not a validation verdict — always exits 3."""


def resolve(explicit, candidates, what):
    """First existing candidate under ROOT, or CannotRun naming every place that was tried."""
    if explicit:
        return pathlib.Path(explicit)
    for rel in candidates:
        if (ROOT / rel).is_file():
            return ROOT / rel
    raise CannotRun(f"missing {what} — looked in " +
                    " · ".join(str(ROOT / rel) for rel in candidates))


def resolve_or_first(explicit, candidates):
    """Same lookup, but never raises: `mirrors` must REPORT an absent file, not decline to run."""
    if explicit:
        return pathlib.Path(explicit)
    return next((ROOT / rel for rel in candidates if (ROOT / rel).is_file()), ROOT / candidates[0])


def norm(text):
    """Compare-form for a header or value.

    NFKC folds the fullwidth punctuation a Sheets export drifts into (／ -> /), NBSP becomes a
    space, and runs of whitespace collapse. Originals are always what gets PRINTED.
    """
    s = unicodedata.normalize("NFKC", str(text)).replace("\u00a0", " ")   # a literal NBSP is invisible in a diff
    return " ".join(s.split())


def col_letter(index):
    """0 -> A, 25 -> Z, 26 -> AA."""
    letters = ""
    n = index
    while True:
        letters = chr(ord("A") + n % 26) + letters
        n = n // 26 - 1
        if n < 0:
            return letters


def load_json(path, what):
    p = pathlib.Path(path)
    if not p.is_file():
        raise CannotRun(f"missing {what}: {p}")
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise CannotRun(f"{what} is not valid JSON: {p} ({exc})")


# ---------------------------------------------------------------- headers ---

def tab_spec(schema, tab_name):
    """Resolve a tab name to its spec. No name given = the first tab in sheet order."""
    tabs = schema.get("tabs")
    if not isinstance(tabs, dict) or not tabs:
        raise CannotRun("pm-sheet-schema.json has no `tabs` object")
    if tab_name is None:
        name = next(iter(tabs))
        return name, tabs[name]
    for name, spec in tabs.items():
        if norm(name) == norm(tab_name):
            return name, spec
    raise CannotRun(f"unknown tab {tab_name!r} — schema declares: {' · '.join(tabs)}")


def legacy_headers(spec):
    """The declared legacy v1 header list for a tab, or None."""
    legacy = spec.get("legacy") or {}
    v1 = legacy.get("v1") if isinstance(legacy, dict) else None
    if isinstance(v1, dict) and isinstance(v1.get("headers"), list):
        return v1["headers"], v1.get("range")
    return None, None


def same(a, b):
    return len(a) == len(b) and all(norm(x) == norm(y) for x, y in zip(a, b))


def print_diff(expected, got):
    print(f"  expected {len(expected)} columns · got {len(got)}")
    for i in range(max(len(expected), len(got))):
        e = expected[i] if i < len(expected) else None
        g = got[i] if i < len(got) else None
        if e is None:
            mark = "EXTRA  "
        elif g is None:
            mark = "MISSING"
        elif norm(e) == norm(g):
            mark = "ok     "
        else:
            mark = "DIFF   "
        e_txt = "—" if e is None else repr(e)
        g_txt = "—" if g is None else repr(g)
        print(f"  {col_letter(i):>2} ({i + 1:>2})  {mark}  expected {e_txt}  got {g_txt}")


def cmd_headers(headers, tab_name, schema):
    name, spec = tab_spec(schema, tab_name)
    declared = spec.get("headers")

    if declared is None:
        # 所有檔案 declares a column_count only — its header strings were never captured, so
        # nothing is invented here. Width is the only assertion available.
        want = spec.get("column_count")
        if want is None:
            raise CannotRun(f"tab {name!r} declares neither `headers` nor `column_count`")
        if len(headers) == want:
            print(f"OK — tab {name} · {len(headers)} columns (headers not asserted by the schema)")
            return 0
        print(f"HEADER MISMATCH  tab={name}  expected {want} columns · got {len(headers)}")
        return 1

    if same(declared, headers):
        version = spec.get("version", "declared")
        rng = spec.get("range", "?")
        print(f"OK — tab {name} matches the {version} shape · {len(headers)} columns · range {rng}")
        enums = spec.get("enum_columns") or {}
        if enums:
            pairs = " · ".join(f"{c} -> {v}" for c, v in enums.items())
            print(f"     enum columns (prefix match): {pairs}")
        return 0

    legacy, legacy_range = legacy_headers(spec)
    if legacy and same(legacy, headers):
        print(f"LEGACY V1 DETECTED  tab={name} — reader must map {legacy_range or 'A1:M'}, "
              f"前置任務 absent")
        print("  A v1 sheet is 13 columns A-M. A reader that assumes v2 reads `Reference 連結` "
              "one column early;")
        print("  a reader that assumes v1 on a v2 sheet reads `前置任務 Depends on` AS "
              "`Reference 連結` (the live bug).")
        print("  Map by header name, never by fixed column letter.")
        return 2

    print(f"HEADER MISMATCH  tab={name}")
    print_diff(declared, headers)
    if legacy:
        print(f"  (not the legacy v1 shape either — that one is {len(legacy)} columns)")
    return 1


# ----------------------------------------------------------------- values ---

def resolve_axis(crosswalk, wanted):
    """Resolve a name to a checkable target: a surface vocabulary first, then a bare axis.

    Returns a dict with kind · axis · surface · accepted (the legal strings) · mapping (raw ->
    canonical, empty for a bare axis).
    """
    vocabs = crosswalk.get("vocabularies") or {}
    axes = crosswalk.get("axes") or {}
    if not axes:
        raise CannotRun("pm-status-crosswalk.json has no `axes` object")

    # `risk`, `decision` and `closure` name both a vocabulary and an axis. An explicit prefix
    # picks the namespace; bare names resolve vocabulary-first per conventions.crosswalk.
    only = None
    for prefix, namespace in (("vocab:", "v"), ("vocabularies:", "v"), ("axis:", "a"), ("axes:", "a")):
        if wanted.startswith(prefix):
            wanted, only = wanted[len(prefix):], namespace
            break

    key = None if only == "a" else next((k for k in vocabs if norm(k) == norm(wanted)), None)
    if key:
        vocab = vocabs[key]
        axis_name = vocab.get("axis")
        surface = vocab.get("surface")
        mapping = ((axes.get(axis_name) or {}).get("surfaces") or {}).get(surface) or {}
        accepted = vocab.get("values") or list(mapping)
        if mapping and vocab.get("values") and set(map(norm, mapping)) != set(map(norm, accepted)):
            print(f"WARN  seed drift: vocabularies.{key}.values and axes.{axis_name}."
                  f"surfaces['{surface}'] disagree")
        return {"kind": "vocabulary", "name": key, "axis": axis_name, "surface": surface,
                "accepted": accepted, "mapping": mapping}

    key = None if only == "v" else next((k for k in axes if norm(k) == norm(wanted)), None)
    if key:
        return {"kind": "axis", "name": key, "axis": key, "surface": None,
                "accepted": (axes[key].get("canonical") or []), "mapping": {}}

    raise CannotRun(f"unknown axis/vocabulary {wanted!r} — crosswalk declares "
                    f"vocabularies: {' · '.join(vocabs)} — axes: {' · '.join(axes)}")


def explain(value, target, crosswalk):
    """Why is this value an offender? Crosswalk-sourced reasons only, in specificity order."""
    axes = crosswalk.get("axes") or {}
    lines = []

    rejected = (crosswalk.get("rejected_values") or {}).get(value)
    if isinstance(rejected, dict):
        lines.append(f"reason: {rejected.get('reason', 'listed in rejected_values')}")
        if rejected.get("invalid_on"):
            lines.append(f"invalid on: {' · '.join(rejected['invalid_on'])}")
        if rejected.get("valid_on"):
            lines.append(f"valid on: {' · '.join(rejected['valid_on'])}")
        if rejected.get("did_you_mean"):
            lines.append(f"did you mean: {' · '.join(rejected['did_you_mean'])}")
        return lines

    # A canonical value typed into a surface column, or a raw value checked against a bare axis.
    canonical = (axes.get(target["axis"]) or {}).get("canonical") or []
    if target["kind"] == "vocabulary" and any(norm(value) == norm(c) for c in canonical):
        back = [r for r, c in target["mapping"].items() if norm(c) == norm(value)]
        hint = f" — write {' or '.join(repr(b) for b in back)} here" if back else ""
        lines.append(f"reason: canonical value, not a surface value on "
                     f"{target['surface']!r}{hint}")
        return lines

    for axis_name, axis in axes.items():
        for surface, mapping in (axis.get("surfaces") or {}).items():
            hit = next((c for r, c in mapping.items() if norm(r) == norm(value)), None)
            if hit is None:
                continue
            if axis_name == target["axis"]:
                lines.append(f"reason: a value of surface {surface!r} on the same axis "
                             f"(-> {hit}) — map it before checking")
            else:
                lines.append(f"reason: AXIS CONFUSION — {value!r} is a {axis_name} value on "
                             f"surface {surface!r} (-> {hit}), not a {target['axis']} value")
            return lines
    return lines


def cmd_values(values, axis_name, crosswalk):
    if not axis_name:
        raise CannotRun("values needs an axis — pass --axis or put \"axis\" in the fixture")
    target = resolve_axis(crosswalk, axis_name)
    where = f"surface {target['surface']}" if target["surface"] else "canonical values"
    print(f"values: axis={target['axis']} · {where} · checked against "
          f"{target['kind']} {target['name']}")

    accepted = {norm(a): a for a in target["accepted"]}
    offenders = []
    for value in values:
        if norm(value) in accepted:
            mapped = next((c for r, c in target["mapping"].items() if norm(r) == norm(value)), None)
            if mapped and ":" in str(mapped):
                print(f"  {value!r} -> {mapped}  (CROSS-AXIS — resolve on that axis, "
                      f"do not read as {target['axis']})")
            elif mapped:
                print(f"  {value!r} -> {mapped}")
            else:
                print(f"  {value!r} ok")
        else:
            offenders.append(value)

    for value in offenders:
        print(f"UNKNOWN  {value!r}  not a legal value for {target['name']} "
              f"(axis {target['axis']})")
        for line in explain(value, target, crosswalk) or ["reason: not recorded in the crosswalk"]:
            print(f"         {line}")

    if offenders:
        print(f"FAIL — {len(values)} values · {len(offenders)} offender(s) · legal set: "
              f"{' · '.join(target['accepted'])}")
        return 1
    print(f"OK — {len(values)} values, all legal")
    return 0


# ---------------------------------------------------------------- mirrors ---
# Three files claim to hold the same 管控表 column map and lifecycle vocabulary, and two of them
# say so in a comment ("so the three cannot drift apart"). Nothing compared them, so the guarantee
# was fiction: COLUMNS_V2 / COLUMNS_V1_LEGACY / SHEET_RANGE / LIFECYCLE_BUCKETS each appeared
# exactly once in the repo — at their own definition. This subcommand makes the claim true.


class Unevaluable(Exception):
    """This module-level assignment is not a constant expression — it cannot be read statically."""


_MISS = object()


def const_eval(node, env):
    """Evaluate one assignment's right-hand side WITHOUT executing the renderer.

    Deliberately tiny: literals, names already resolved above in the same module, f-strings over
    those, and the one filtering list-comprehension the renderer uses (`COLUMNS_V1_LEGACY`).
    Anything richer raises — a mirror that stops being a readable literal must FAIL the gate, never
    be silently skipped, because "unreadable" is exactly how a drifted copy would hide.
    """
    if isinstance(node, ast.Name):
        if node.id in env:
            return env[node.id]
        raise Unevaluable(f"name {node.id!r} is not a resolved module constant")
    if isinstance(node, ast.List):
        return [const_eval(e, env) for e in node.elts]
    if isinstance(node, ast.Tuple):
        return tuple(const_eval(e, env) for e in node.elts)
    if isinstance(node, ast.Dict):
        if any(k is None for k in node.keys):          # {**other} — no
            raise Unevaluable("dict unpacking")
        return {const_eval(k, env): const_eval(v, env) for k, v in zip(node.keys, node.values)}
    if isinstance(node, ast.JoinedStr):
        out = []
        for part in node.values:
            if isinstance(part, ast.Constant):
                out.append(str(part.value))
            elif isinstance(part, ast.FormattedValue):
                if part.conversion not in (-1, None) or part.format_spec is not None:
                    raise Unevaluable("f-string conversion or format-spec")
                out.append(str(const_eval(part.value, env)))
            else:
                raise Unevaluable("unsupported f-string part")
        return "".join(out)
    if isinstance(node, ast.ListComp):
        if len(node.generators) != 1:
            raise Unevaluable("multi-generator comprehension")
        gen = node.generators[0]
        if (getattr(gen, "is_async", 0) or not isinstance(gen.target, ast.Name)
                or not isinstance(node.elt, ast.Name) or node.elt.id != gen.target.id):
            raise Unevaluable("comprehension is not a plain filter that yields its own target")
        kept = []
        for item in const_eval(gen.iter, env):
            keep = True
            for test in gen.ifs:
                if (not isinstance(test, ast.Compare) or len(test.ops) != 1
                        or not isinstance(test.left, ast.Name) or test.left.id != gen.target.id):
                    raise Unevaluable("comprehension filter is not `<target> ==/!= <const>`")
                other = const_eval(test.comparators[0], env)
                if isinstance(test.ops[0], ast.NotEq):
                    keep = keep and item != other
                elif isinstance(test.ops[0], ast.Eq):
                    keep = keep and item == other
                else:
                    raise Unevaluable("comprehension filter uses an operator beyond == / !=")
            if keep:
                kept.append(item)
        return kept
    try:
        return ast.literal_eval(node)
    except (ValueError, TypeError, SyntaxError, MemoryError, RecursionError):
        raise Unevaluable(type(node).__name__)


def module_constants(path, wanted):
    """Read the named module-level constants out of a .py file. Missing = caller's failure."""
    try:
        tree = ast.parse(pathlib.Path(path).read_text(encoding="utf-8"), filename=str(path))
    except SyntaxError as exc:
        return None, [f"{path} does not parse: {exc}"]
    env = {}
    for node in tree.body:
        if (isinstance(node, ast.Assign) and len(node.targets) == 1
                and isinstance(node.targets[0], ast.Name)):
            try:
                env[node.targets[0].id] = const_eval(node.value, env)
            except Unevaluable:
                continue                                  # a colour, a helper — not a mirror
    missing = [w for w in wanted if w not in env]
    if missing:
        return None, [f"{path} defines no statically readable {w} — mirrors cannot check what it "
                      f"cannot read" for w in missing]
    return env, []


def agrees(a, b):
    """Compare two copies of one fact in their own shape, on the same NFKC compare-form as headers."""
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return same(list(a), list(b))
    if isinstance(a, (set, frozenset)) and isinstance(b, (set, frozenset)):
        return {norm(x) for x in a} == {norm(x) for x in b}
    if isinstance(a, dict) and isinstance(b, dict):
        if len(a) != len(b):
            return False
        for key, value in a.items():
            hit = next((v for k, v in b.items() if norm(k) == norm(key)), _MISS)
            if hit is _MISS or norm(hit) != norm(value):
                return False
        return True
    return norm(a) == norm(b)


def print_map_diff(seed_label, seed, copy_label, copy):
    keys = list(seed) + [k for k in copy if not any(norm(k) == norm(s) for s in seed)]
    for key in keys:
        s = next((v for k, v in seed.items() if norm(k) == norm(key)), None)
        c = next((v for k, v in copy.items() if norm(k) == norm(key)), None)
        mark = ("EXTRA  " if s is None else "MISSING" if c is None
                else "ok     " if norm(s) == norm(c) else "DIFF   ")
        print(f"  {mark}  {key!r}  {seed_label}={s!r}  {copy_label}={c!r}")


def print_set_diff(seed_label, seed, copy_label, copy):
    for value in sorted({norm(x) for x in seed} | {norm(x) for x in copy}):
        in_seed = any(norm(x) == value for x in seed)
        in_copy = any(norm(x) == value for x in copy)
        mark = "ok     " if in_seed and in_copy else ("MISSING" if in_seed else "EXTRA  ")
        print(f"  {mark}  {value!r}  in {seed_label}={in_seed}  in {copy_label}={in_copy}")


def compare(check, seed_label, seed, copies):
    """copies = [(label, value)]. Returns the number that diverged, printing a per-item diff."""
    bad = 0
    for label, value in copies:
        if agrees(seed, value):
            continue
        bad += 1
        print(f"DIVERGENCE  {check}  —  {label}  disagrees with  {seed_label}")
        if isinstance(seed, (list, tuple)) and isinstance(value, (list, tuple)):
            print_diff(list(seed), list(value))
        elif isinstance(seed, dict) and isinstance(value, dict):
            print_map_diff(seed_label, seed, label, value)
        elif isinstance(seed, (set, frozenset)) and isinstance(value, (set, frozenset)):
            print_set_diff(seed_label, seed, label, value)
        else:
            print(f"  {seed_label} = {seed!r}")
            print(f"  {label} = {value!r}")
    if not bad:
        print(f"ok  {check:<20} {len(copies)} copy/copies agree with {seed_label}")
    return bad


def compare_mentions(check, label, prose, needles, seed_label):
    """A prose copy of a fact: assert every needle is NAMED in it. Weaker than a list compare —
    it is all a sentence can carry — but it still goes red when the seed changes and prose doesn't."""
    missing = [n for n in needles if norm(n) not in norm(prose)]
    if missing:
        print(f"DIVERGENCE  {check}  —  {label}  never names {' · '.join(repr(m) for m in missing)}")
        print(f"  {seed_label} declares: {' · '.join(map(repr, needles))}")
        print(f"  {label} says: {prose.strip()[:200]!r}")
        return 1
    print(f"ok  {check:<20} {label} names all {len(needles)} value(s) from {seed_label}")
    return 0


def status_tab(schema):
    """The tab whose Status column carries the lifecycle enum — resolved structurally, not by name,
    so this file still embeds none of the seed."""
    hits = [(name, spec) for name, spec in (schema.get("tabs") or {}).items()
            if any(norm(k) == norm("Status") for k in (spec.get("enum_columns") or {}))]
    if len(hits) != 1:
        raise CannotRun(f"expected exactly one tab whose enum_columns declares `Status`, found "
                        f"{len(hits)} — cannot tell which tab the renderer mirrors")
    return hits[0]


def cmd_mirrors(schema, crosswalk, renderer_path, dashboard_path):
    """Enforce the "the three cannot drift apart" comment. Exit 1 on any divergence."""
    if not IN_REPO:
        print("MIRRORS SKIPPED — repo-only check. This is an installed skill copy, where the "
              "renderer and dashboard schema it compares do not ship. `check-pm-refs.sh` in the "
              "repo already proves this file is byte-identical to the seed that was mirror-checked.")
        return 0
    print(f"mirrors: seed      docs/pm-shared/pm-sheet-schema.json + pm-status-crosswalk.json")
    print(f"         copy 1    {renderer_path}")
    print(f"         copy 2    {dashboard_path}")

    failures = 0
    for path, what in ((renderer_path, "renderer"), (dashboard_path, "dashboard schema")):
        if not pathlib.Path(path).is_file():
            print(f"MISSING  {what}: {path} — a mirror that is absent is a FAIL, not a skip: the "
                  f"guarantee it carries has nowhere to live")
            failures += 1
    if failures:
        print(f"MIRRORS FAILED — {failures} divergence(s)")
        return 1

    consts, errors = module_constants(renderer_path, [
        "SOURCE_TAB", "COLUMNS_V2", "COLUMNS_V1_LEGACY", "SHEET_RANGE", "LIFECYCLE_BUCKETS",
        "HEALTH"])
    if errors:
        for line in errors:
            print(f"UNREADABLE  {line}")
        print(f"MIRRORS FAILED — {len(errors)} divergence(s)")
        return 1
    try:
        dash = load_json(dashboard_path, "dashboard_schema.json")
    except CannotRun as exc:
        print(f"UNREADABLE  {exc}")
        print("MIRRORS FAILED — 1 divergence(s)")
        return 1

    tab, spec = status_tab(schema)
    legacy, legacy_range = legacy_headers(spec)
    target = resolve_axis(crosswalk, spec["enum_columns"]["Status"])
    R = "render_dashboard_email.py"
    D = "dashboard_schema.json"

    failures += compare("source.tab", "pm-sheet-schema.json", tab,
                        [(f"{R} SOURCE_TAB", consts["SOURCE_TAB"])])

    failures += compare("columns.v2", "pm-sheet-schema.json headers", spec.get("headers") or [], [
        (f"{R} COLUMNS_V2", consts["COLUMNS_V2"]),
        (f"{D} _source_columns_v2", dash.get("_source_columns_v2") or []),
    ])

    failures += compare("columns.v1_legacy", "pm-sheet-schema.json legacy.v1.headers", legacy or [], [
        (f"{R} COLUMNS_V1_LEGACY", consts["COLUMNS_V1_LEGACY"]),
        (f"{D} _source_columns_v1_legacy", dash.get("_source_columns_v1_legacy") or []),
    ])

    ranges = consts["SHEET_RANGE"] if isinstance(consts["SHEET_RANGE"], dict) else {}
    failures += compare("range.v2", "pm-sheet-schema.json range", f"{tab}!{spec.get('range')}",
                        [(f"{R} SHEET_RANGE['v2']", ranges.get("v2"))])
    failures += compare("range.v1", "pm-sheet-schema.json legacy.v1.range", f"{tab}!{legacy_range}",
                        [(f"{R} SHEET_RANGE['v1']", ranges.get("v1"))])
    failures += compare_mentions("range.note", f"{D} _source_columns_note",
                                 str(dash.get("_source_columns_note") or ""),
                                 [spec.get("range"), legacy_range], "pm-sheet-schema.json")

    surface = f"pm-status-crosswalk.json {target['surface']}"
    failures += compare("lifecycle.buckets", surface, target["mapping"],
                        [(f"{R} LIFECYCLE_BUCKETS", consts["LIFECYCLE_BUCKETS"])])
    failures += compare_mentions("lifecycle.values", f"{D} _pack", str(dash.get("_pack") or ""),
                                 list(target["accepted"]), surface)

    health = resolve_axis(crosswalk, "health_dashboard")
    rendered = {k for k in (consts["HEALTH"] or {}) if norm(k) != norm("UNKNOWN")}
    failures += compare("health.dashboard", f"pm-status-crosswalk.json {health['surface']}",
                        set(health["accepted"]), [(f"{R} HEALTH keys (minus UNKNOWN)", rendered)])
    failures += compare_mentions("health.values", f"{D} health.status",
                                 str(((dash.get("health") or {}).get("status")) or ""),
                                 list(health["accepted"]),
                                 f"pm-status-crosswalk.json {health['surface']}")

    if failures:
        print(f"MIRRORS FAILED — {failures} divergence(s). The comment in {R} promises the three "
              f"cannot drift apart; they have.")
        return 1
    print("MIRRORS OK — renderer literals, dashboard_schema.json and the pm-shared seed all agree.")
    return 0



# -------------------------------------------------------------- self-test ---

# The verdict families a fixture NAME may promise. Matched on tokens split at non-alphanumerics,
# never on raw substrings — `invalid` must never be read as `valid`.
NAME_FAMILIES = (("legacy", ("legacy",), 2),
                 ("bad", ("bad", "invalid", "mismatch"), 1),
                 ("good", ("good", "valid", "ok"), 0))

# Every (mode, verdict) pair the validator can PRODUCE. `headers` returns 0 · 1 · 2; `values`
# returns 0 · 1 (there is no legacy shape on the values path). So these five are the whole
# producible space and the gate demands a live, passing fixture for each.
#
# A per-VERDICT guard was the hole a verifier walked through: delete values-bad.json and patch
# cmd_values to always return 0, and verdict 1 was still "covered" by headers-bad.json — the gate
# printed SELF-TEST OK while an entire validator was dead.
REQUIRED_PAIRS = (("headers", 0), ("headers", 1), ("headers", 2), ("values", 0), ("values", 1))


def name_family(stem):
    """Which verdict family the FILENAME promises: 'good' · 'bad' · 'legacy' · None · 'ambiguous'."""
    found = set()
    for token in re.split(r"[^a-z0-9]+", stem.lower()):
        if not token:
            continue
        for family, words, _ in NAME_FAMILIES:
            if token.startswith(words):
                found.add(family)
                break
    if len(found) > 1:
        return "ambiguous"
    return found.pop() if found else None


def expected_verdict(stem):
    """The verdict a fixture's NAME promises, or None when it promises nothing."""
    family = name_family(stem)
    return next((v for f, _, v in NAME_FAMILIES if f == family), None)


def declared_expectation(path, fixture):
    """(want, complaint) — what this fixture asserts, and why its name and its `expect` disagree.

    `expect` may PIN a verdict; it may never CONTRADICT the filename. A file called `*-bad` that
    declares `"expect": 0` is the second hole a verifier walked through: the fixture still ran, the
    validator still passed it, and the diff looked like a one-character change to a number. The
    filename is what a reviewer actually reads, so the filename wins and the mismatch is loud.
    """
    family = name_family(path.stem)
    explicit = fixture.get("expect", fixture.get("_expect"))
    if family is None:
        return None, ("name promises no verdict — rename it …-good / …-bad / …-legacy. An "
                      "\"expect\" alone is not enough: the NAME is what a reviewer reads in a diff")
    if family == "ambiguous":
        return None, "name mixes good/bad/legacy — exactly one family per fixture name"
    promised = expected_verdict(path.stem)
    if explicit is None:
        return promised, None
    if isinstance(explicit, bool) or not isinstance(explicit, int):
        return None, f"\"expect\": {explicit!r} is not an integer"
    if family == "bad":
        if explicit == 0:
            return None, ("named …-bad but declares \"expect\": 0 — a *-bad fixture MUST assert a "
                          "non-zero verdict. This is what a weakened fixture looks like in a diff")
    elif explicit != promised:
        return None, (f"named …-{family} (verdict {promised}) but declares \"expect\": {explicit} "
                      f"— the filename convention wins; rename the file or fix the number")
    return explicit, None


def run_fixture(path, schema, crosswalk):
    """Run one fixture. Returns (mode, exit_code, captured_output)."""
    fixture = load_json(path, f"fixture {path.name}")
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        if isinstance(fixture.get("headers"), list):
            mode = "headers"
            code = cmd_headers(fixture["headers"], fixture.get("tab"), schema)
        elif isinstance(fixture.get("values"), list):
            mode = "values"
            code = cmd_values(fixture["values"], fixture.get("axis"), crosswalk)
        else:
            raise CannotRun(f"fixture {path.name} has neither a `headers` nor a `values` list")
    return mode, code, buffer.getvalue()


def cmd_selftest(fixtures_dir, schema, crosswalk, renderer_path, dashboard_path):
    """Prove the gate fires: every fixture produces exactly the verdict its NAME promises, every
    (mode, verdict) pair the validator can reach has a live fixture, and the three-copy column-map
    guarantee actually holds."""
    fixtures = sorted(pathlib.Path(fixtures_dir).glob("*.json"))
    if not fixtures:
        print(f"NO FIXTURES in {fixtures_dir} — the gate proves nothing. Refusing to pass.")
        return 1

    failures = 0
    covered = set()
    for path in fixtures:
        fixture = load_json(path, f"fixture {path.name}")
        want, complaint = declared_expectation(path, fixture)
        if complaint:
            print(f"FAIL  {path.name:<30} {complaint}")
            failures += 1
            continue
        try:
            mode, got, detail = run_fixture(path, schema, crosswalk)
        except CannotRun as exc:
            print(f"FAIL  {path.name:<30} could not run: {exc}")
            failures += 1
            continue
        status = "PASS" if got == want else "FAIL"
        print(f"{status}  {path.name:<30} {mode:<7} expect {want}  got {got}")
        if got == want:
            covered.add((mode, want))      # only a PASSING fixture counts as coverage
        else:
            failures += 1
            for line in detail.rstrip("\n").split("\n"):
                print(f"        | {line}")

    for pair in REQUIRED_PAIRS:
        if pair not in covered:
            print(f"FAIL  no passing fixture produces (mode={pair[0]}, verdict={pair[1]}) — that "
                  f"path could be weakened to always-pass and this gate would not notice")
            failures += 1

    print()
    try:
        mirror_rc = cmd_mirrors(schema, crosswalk, renderer_path, dashboard_path)
    except CannotRun as exc:
        print(f"FAIL  mirrors could not run: {exc}")
        mirror_rc = 1
    if mirror_rc:
        failures += 1
    print()

    print(f"self-test: {len(fixtures)} fixture(s) · {len(covered)}/{len(REQUIRED_PAIRS)} "
          f"(mode, verdict) pairs covered · mirrors {'OK' if not mirror_rc else 'FAILED'} · "
          f"{failures} unexpected")
    if failures:
        print("SELF-TEST FAILED — the validator no longer behaves as the fixtures declare.")
        return 1
    print("SELF-TEST OK — every fixture produced the verdict its name promises, every reachable "
          "(mode, verdict) pair has one, and every mirror agrees.")
    return 0


# ------------------------------------------------------------------- main ---

def split_list(raw):
    return [part.strip() for part in raw.split(",") if part.strip()]


def build_parser():
    p = argparse.ArgumentParser(
        prog="pm-schema.py",
        description="Validate 管控表 headers and column values against the PM shared seed.")
    p.add_argument("command", nargs="?", choices=["headers", "values", "mirrors"],
                   help="headers = check a tab's header list · values = check values on one axis · "
                        "mirrors = check every copy of the column map and lifecycle vocabulary")
    p.add_argument("--file", help="fixture JSON carrying `headers` or `values`")
    p.add_argument("--headers", help='ad-hoc header list, comma-separated: "no.,里程碑 Stage,…"')
    p.add_argument("--values", help="ad-hoc value list, comma-separated")
    p.add_argument("--tab", help="tab name (default: the first tab in the schema)")
    p.add_argument("--axis", help="a `vocabularies` key (raw values) or an `axes` key (canonical)")
    p.add_argument("--self-test", action="store_true",
                   help="run every fixture and assert the verdict its name promises")
    p.add_argument("--schema", help="override the pm-sheet-schema.json lookup")
    p.add_argument("--crosswalk", help="override the pm-status-crosswalk.json lookup")
    p.add_argument("--renderer", help="mirrors: path to render_dashboard_email.py")
    p.add_argument("--dashboard", help="mirrors: path to references/dashboard_schema.json")
    p.add_argument("--fixtures", default=str(FIXTURES_DEFAULT))
    return p


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.self_test:
            schema = load_json(resolve(args.schema, SCHEMA_CANDIDATES, "pm-sheet-schema.json"),
                               "pm-sheet-schema.json")
            crosswalk = load_json(resolve(args.crosswalk, CROSSWALK_CANDIDATES,
                                          "pm-status-crosswalk.json"), "pm-status-crosswalk.json")
            return cmd_selftest(args.fixtures, schema, crosswalk,
                                resolve_or_first(args.renderer, RENDERER_CANDIDATES),
                                resolve_or_first(args.dashboard, DASHBOARD_CANDIDATES))

        if args.command == "mirrors":
            schema = load_json(resolve(args.schema, SCHEMA_CANDIDATES, "pm-sheet-schema.json"),
                               "pm-sheet-schema.json")
            crosswalk = load_json(resolve(args.crosswalk, CROSSWALK_CANDIDATES,
                                          "pm-status-crosswalk.json"), "pm-status-crosswalk.json")
            return cmd_mirrors(schema, crosswalk,
                               resolve_or_first(args.renderer, RENDERER_CANDIDATES),
                               resolve_or_first(args.dashboard, DASHBOARD_CANDIDATES))

        if not args.command:
            parser.print_help()
            return CANNOT_RUN

        fixture = load_json(args.file, f"fixture {args.file}") if args.file else {}

        if args.command == "headers":
            headers = split_list(args.headers) if args.headers else fixture.get("headers")
            if not isinstance(headers, list) or not headers:
                raise CannotRun("headers needs --headers or a --file carrying a `headers` list")
            schema = load_json(resolve(args.schema, SCHEMA_CANDIDATES, "pm-sheet-schema.json"),
                               "pm-sheet-schema.json")
            return cmd_headers(headers, args.tab or fixture.get("tab"), schema)

        values = split_list(args.values) if args.values else fixture.get("values")
        if not isinstance(values, list) or not values:
            raise CannotRun("values needs --values or a --file carrying a `values` list")
        crosswalk = load_json(resolve(args.crosswalk, CROSSWALK_CANDIDATES,
                                      "pm-status-crosswalk.json"), "pm-status-crosswalk.json")
        return cmd_values(values, args.axis or fixture.get("axis"), crosswalk)

    except CannotRun as exc:
        print(f"CANNOT RUN — {exc}", file=sys.stderr)
        return CANNOT_RUN


if __name__ == "__main__":
    sys.exit(main())
