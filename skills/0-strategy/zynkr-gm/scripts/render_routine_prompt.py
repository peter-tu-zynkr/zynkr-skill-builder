#!/usr/bin/env python3
"""render_routine_prompt.py — fill a prompt/brief template from a JSON config.

Placeholders: {{dotted.key.path}} resolved against the JSON config (nested dicts; list items by
index, e.g. {{owners.0.name}} or {{owners[0].name}}). Dict/list values render as compact JSON;
scalars as text (true/false/null in JSON form). Built-ins: {{today}} (system-local ISO date),
{{today_tpe}} (ISO date in Asia/Taipei), {{now_tpe}} (ISO datetime, minute precision, Asia/Taipei),
{{iso_week}} (YYYY-Www, Asia/Taipei).

Fails loud: exit 2 and list EVERY unresolved placeholder (missing key or null value); nothing is
written in that case. --check only reports (exit 0 = all resolvable, 2 = missing).

Usage: render_routine_prompt.py --config config.json --template prompt.tmpl [--out file] [--check]

Python 3 stdlib only.
"""
import argparse
import datetime as dt
import json
import re
import sys

PLACEHOLDER = re.compile(r"\{\{\s*([A-Za-z0-9_][A-Za-z0-9_.\-\[\]]*)\s*\}\}")
_MISSING = object()


def _tpe_now():
    try:
        from zoneinfo import ZoneInfo
        return dt.datetime.now(ZoneInfo("Asia/Taipei"))
    except Exception:  # no tz database → fixed UTC+8 (Taiwan has no DST)
        return dt.datetime.now(dt.timezone(dt.timedelta(hours=8)))


def builtins(now_tpe=None):
    n = now_tpe or _tpe_now()
    y, w, _ = n.isocalendar()
    return {
        "today": dt.date.today().isoformat(),
        "today_tpe": n.date().isoformat(),
        "now_tpe": n.strftime("%Y-%m-%dT%H:%M+08:00"),
        "iso_week": f"{y}-W{w:02d}",
    }


def lookup(config, path):
    """Resolve 'a.b.0.c' / 'a.b[0].c' against nested dict/list. Returns _MISSING when absent."""
    tokens = [t for t in re.split(r"\.|\[|\]", path) if t != ""]
    cur = config
    for t in tokens:
        if isinstance(cur, dict):
            if t in cur:
                cur = cur[t]
            else:
                return _MISSING
        elif isinstance(cur, list):
            if t.lstrip("-").isdigit() and -len(cur) <= int(t) < len(cur):
                cur = cur[int(t)]
            else:
                return _MISSING
        else:
            return _MISSING
    return cur


def to_text(v):
    if isinstance(v, str):
        return v
    if isinstance(v, bool) or v is None:
        return json.dumps(v)
    if isinstance(v, (int, float)):
        return str(v)
    return json.dumps(v, ensure_ascii=False, separators=(", ", ": "))


def render(template, config, extra=None):
    """Return (rendered_text, missing_keys[]). Built-ins may be overridden by config keys."""
    ctx_builtins = builtins()
    if extra:
        ctx_builtins.update(extra)
    missing = []

    def sub(m):
        key = m.group(1)
        v = lookup(config, key)
        if v is _MISSING and key in ctx_builtins:
            v = ctx_builtins[key]
        if v is _MISSING or v is None:
            if key not in missing:
                missing.append(key)
            return m.group(0)
        return to_text(v)

    return PLACEHOLDER.sub(sub, template), missing


SAMPLE_TEMPLATE = """# GM weekly brief — {{today_tpe}} ({{iso_week}})
Account: {{account}}
Tracker: {{sources.main_tracker.id}} tab {{sources.main_tracker.tab}}
First owner: {{owners.0.name}} / {{owners[1].name}}
Guardrails: {{guardrails}}
Runway floor: {{kpi.runway_floor_months}} months; draft_only={{routine.draft_only}}
"""
SAMPLE_CONFIG = {
    "account": "gm@example.com",
    "sources": {"main_tracker": {"id": "<tracker-sheet-id>", "tab": "H2 專案項目"}},
    "owners": [{"name": "Peter"}, {"name": "Jane"}],
    "guardrails": ["never edit tracker", "draft-only when unattended"],
    "kpi": {"runway_floor_months": 4},
    "routine": {"draft_only": True},
}


def selftest():
    text, missing = render(SAMPLE_TEMPLATE, SAMPLE_CONFIG)
    assert missing == [], missing
    assert "Account: gm@example.com" in text and "tab H2 專案項目" in text, text
    assert "First owner: Peter / Jane" in text, text
    assert 'Guardrails: ["never edit tracker", "draft-only when unattended"]' in text, text
    assert "Runway floor: 4 months; draft_only=true" in text, text
    assert re.search(r"brief — \d{4}-\d{2}-\d{2} \(\d{4}-W\d{2}\)", text), text
    text2, missing2 = render("{{a.b}} {{ nope.x }} {{owners.5.name}} {{today}} {{nullish}}",
                             {"a": {"b": 1}, "nullish": None, "owners": []})
    assert missing2 == ["nope.x", "owners.5.name", "nullish"], missing2
    assert text2.startswith("1 {{ nope.x }} {{owners.5.name}} 20"), text2   # unresolved left verbatim
    # config may override a built-in
    text3, m3 = render("{{today}}", {"today": "2026-01-01"})
    assert text3 == "2026-01-01" and m3 == []
    print("render_routine_prompt selftest OK")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", help="JSON config file")
    ap.add_argument("--template", help="template file with {{dotted.key}} placeholders")
    ap.add_argument("--out", help="output path (default: stdout)")
    ap.add_argument("--check", action="store_true", help="only report unresolved placeholders; write nothing")
    ap.add_argument("--selftest", action="store_true", help="run embedded sample and exit 0/1")
    args = ap.parse_args(argv)
    if args.selftest:
        try:
            return selftest()
        except AssertionError as e:
            print(f"SELFTEST FAILED: {e!r}", file=sys.stderr)
            return 1
    if not (args.config and args.template):
        ap.error("--config and --template are required (or use --selftest)")
    with open(args.config, encoding="utf-8") as fh:
        config = json.load(fh)
    with open(args.template, encoding="utf-8") as fh:
        template = fh.read()
    text, missing = render(template, config)
    if missing:
        print("UNRESOLVED placeholders (%d):" % len(missing), file=sys.stderr)
        for k in missing:
            print(f"  {{{{{k}}}}}", file=sys.stderr)
        return 2
    if args.check:
        print(f"OK — all {len(PLACEHOLDER.findall(template))} placeholders resolvable", file=sys.stderr)
        return 0
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"wrote {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
