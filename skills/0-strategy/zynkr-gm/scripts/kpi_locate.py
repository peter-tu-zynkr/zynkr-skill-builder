#!/usr/bin/env python3
"""kpi_locate.py — find the row + A1 cells for one metric on the OKR & KPI Tracker `KPI Dashboard` tab.

Input: values.json — the 2-D array returned by read_sheet_values for the whole tab.
The header row (default row 0; auto-detected as the first row containing "Metric" or "Tracker")
is resolved BY HEADER TEXT, never by position. Recognised headers (case-insensitive contains):
  Function · Metric · Tracker # · Q3 target · Q4 target · Actual · Owner · As of · Source · Notes
Extra/unknown columns are ignored; missing optional columns yield null.

Selectors (one required):
  --tracker 1.03            match if the id appears in the row's Tracker cell after splitting on
                            "/ , ; 、 ， whitespace" and expanding ranges like "2.01–2.03" (same major only)
  --metric-substring Runway case-insensitive substring of the Metric cell (fallback for rows without a #)

Output (JSON): {row_index (0-based), a1_row (1-based), actual_a1, asof_a1|null, source_a1|null,
                notes_a1|null, tracker, metric, owner, function, q3_target, q4_target, actual,
                also: [other matching 0-based row indexes]}
Exit 1 with {"error": ...} when nothing matches or a required column is missing.

Python 3 stdlib only.
"""
import argparse
import json
import re
import sys

HEADER_ALIASES = {
    "function": ("function", "功能", "部門"),
    "metric": ("metric", "指標", "kpi"),
    "tracker": ("tracker", "tracker #", "追蹤", "#"),
    "q3": ("q3 target", "q3"),
    "q4": ("q4 target", "q4"),
    "actual": ("actual", "實際"),
    "owner": ("owner", "負責人"),
    "asof": ("as of", "asof", "as-of", "as_of", "更新日"),
    "source": ("source", "來源"),
    "notes": ("notes", "note", "備註"),
}
ID_RE = re.compile(r"^\d+\.\d+$")
RANGE_RE = re.compile(r"^(\d+)\.(\d+)\s*[–—\-~～→到]\s*(\d+)\.(\d+)$")
SPLIT_RE = re.compile(r"[/,;、，\s]+")


def col_letter(idx):
    """0-based column index → A1 letters."""
    s = ""
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        s = chr(65 + rem) + s
    return s


def find_header_row(values):
    for i, row in enumerate(values[:10]):
        joined = " ".join(str(c) for c in row).lower()
        if "metric" in joined or "tracker" in joined:
            return i
    return 0


def resolve_columns(header):
    """Map logical keys → column index by header text. Three passes: exact, startswith, contains;
    each column is claimed at most once, so 'Q3 target' cannot also serve as 'Actual'."""
    cols, claimed = {}, set()
    lowered = [str(h).strip().lower() for h in header]
    for mode in ("exact", "prefix", "contains"):
        for key, aliases in HEADER_ALIASES.items():
            if key in cols:
                continue
            for j, h in enumerate(lowered):
                if not h or j in claimed:
                    continue
                for a in aliases:
                    if a == "#":
                        hit = h == "#"
                    elif mode == "exact":
                        hit = h == a
                    elif mode == "prefix":
                        hit = h.startswith(a)
                    else:
                        hit = a in h
                    if hit:
                        cols[key] = j
                        claimed.add(j)
                        break
                if key in cols:
                    break
    return cols


def expand_ids(cell):
    """'1.01/1.02/1.10' → {...}; '2.01–2.03' → {2.01,2.02,2.03}; ranges only within the same major."""
    ids = set()
    if not cell:
        return ids
    text = str(cell).strip()
    # first split out slash/comma lists but keep range tokens intact (they contain a dash between two ids)
    for tok in re.split(r"[/,;、，]+|\s{2,}", text):
        tok = tok.strip()
        if not tok:
            continue
        m = RANGE_RE.match(tok.replace(" ", ""))
        if m:
            maj1, min1, maj2, min2 = m.groups()
            if maj1 == maj2:
                width = max(len(min1), len(min2))
                lo, hi = int(min1), int(min2)
                for k in range(min(lo, hi), max(lo, hi) + 1):
                    ids.add(f"{maj1}.{k:0{width}d}")
            else:
                ids.add(f"{maj1}.{min1}")
                ids.add(f"{maj2}.{min2}")
            continue
        for sub in SPLIT_RE.split(tok):
            sub = sub.strip()
            if ID_RE.match(sub):
                ids.add(sub)
    return ids


def norm_id(s):
    return str(s).strip()


def locate(values, tracker=None, metric_substring=None):
    if not values:
        return {"error": "empty values"}
    hrow = find_header_row(values)
    header = values[hrow]
    cols = resolve_columns(header)
    if "actual" not in cols:
        return {"error": f"no 'Actual' column in header row {hrow}: {header}"}
    if tracker is None and metric_substring is None:
        return {"error": "need --tracker or --metric-substring"}
    hits = []
    for i in range(hrow + 1, len(values)):
        row = values[i]

        def cell(key):
            j = cols.get(key)
            return str(row[j]).strip() if j is not None and j < len(row) else ""

        if tracker is not None:
            if "tracker" not in cols:
                return {"error": "no 'Tracker #' column; use --metric-substring"}
            if norm_id(tracker) in expand_ids(cell("tracker")):
                hits.append(i)
        else:
            if metric_substring.lower() in cell("metric").lower():
                hits.append(i)
    if not hits:
        return {"error": f"no row matches {'tracker=' + tracker if tracker else 'metric~' + metric_substring}"}
    i = hits[0]
    row = values[i]

    def cell(key):
        j = cols.get(key)
        return str(row[j]).strip() if j is not None and j < len(row) else ""

    def a1(key):
        j = cols.get(key)
        return f"{col_letter(j)}{i + 1}" if j is not None else None

    return {
        "row_index": i, "a1_row": i + 1,
        "actual_a1": a1("actual"), "asof_a1": a1("asof"), "source_a1": a1("source"), "notes_a1": a1("notes"),
        "tracker": cell("tracker"), "metric": cell("metric"), "owner": cell("owner"), "function": cell("function"),
        "q3_target": cell("q3"), "q4_target": cell("q4"), "actual": cell("actual"),
        "columns": {k: col_letter(v) for k, v in cols.items()},
        "also": hits[1:],
    }


SAMPLE_VALUES = [
    ["Function", "Metric", "Tracker #", "Q3 target", "Q4 target", "Actual", "Owner"],
    ["1.0 Marketing", "SEO 文章 cadence (articles/week)", "1.03", "1/wk", "1/wk", "", "Peter"],
    ["1.0 Marketing", "About / 敘事線 / 見證 / 廠商 shipped (n of 4)", "1.01/1.02/1.10/1.11", "2", "4", "", "Mark"],
    ["2.0 Sales", "Sales-ops P0 builds live", "2.01–2.03", "1", "3", "", "Peter"],
    ["8.0 Finance", "Runway (months) / Net monthly burn", "", "≥4", "≥4", "", "Peter"],
]
SAMPLE_VALUES_EXTRA = [
    ["Function", "Metric", "Tracker #", "Q3 target", "Q4 target", "Actual", "As of", "Source", "Owner", "Notes"],
    ["4.0 Training", "企業 AI 診斷 engagements", "4.01", "1", "3", "1", "2026-08-13", "CRM", "Peter", ""],
    ["4.0 Training", "陪跑課 / Vibe Coding", "4.05 / 4.07", "", "", "", "", "", "Peggy", ""],
]


def selftest():
    r = locate(SAMPLE_VALUES, tracker="1.03")
    assert r.get("row_index") == 1 and r["a1_row"] == 2 and r["actual_a1"] == "F2", r
    assert r["asof_a1"] is None and r["source_a1"] is None and r["owner"] == "Peter", r
    r = locate(SAMPLE_VALUES, tracker="1.10")
    assert r.get("row_index") == 2 and r["actual_a1"] == "F3", r
    r = locate(SAMPLE_VALUES, tracker="2.02")           # inside range 2.01–2.03
    assert r.get("row_index") == 3 and r["actual_a1"] == "F4", r
    r = locate(SAMPLE_VALUES, tracker="2.04")
    assert "error" in r, r
    r = locate(SAMPLE_VALUES, metric_substring="runway")
    assert r.get("row_index") == 4 and r["actual_a1"] == "F5" and r["tracker"] == "", r
    r = locate(SAMPLE_VALUES_EXTRA, tracker="4.01")
    assert r["actual_a1"] == "F2" and r["asof_a1"] == "G2" and r["source_a1"] == "H2" and r["notes_a1"] == "J2", r
    assert r["actual"] == "1" and r["owner"] == "Peter", r
    r = locate(SAMPLE_VALUES_EXTRA, tracker="4.07")
    assert r.get("row_index") == 2, r
    assert expand_ids("1.01/1.02/1.10/1.11") == {"1.01", "1.02", "1.10", "1.11"}
    assert expand_ids("2.01–2.03") == {"2.01", "2.02", "2.03"}
    assert expand_ids("2.01-2.03, 4.01") == {"2.01", "2.02", "2.03", "4.01"}
    assert expand_ids("1.08 — 6.01") == {"1.08", "6.01"}   # cross-major → endpoints only
    assert col_letter(0) == "A" and col_letter(25) == "Z" and col_letter(26) == "AA"
    assert "error" in locate([["Function", "Metric"]], tracker="1.03")
    print("kpi_locate selftest OK")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("values", nargs="?", help="values.json — 2-D array from read_sheet_values (whole tab)")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--tracker", help='tracker id, e.g. "1.03"')
    g.add_argument("--metric-substring", help='case-insensitive substring of the Metric cell, e.g. "Runway"')
    ap.add_argument("--selftest", action="store_true", help="run embedded sample and exit 0/1")
    args = ap.parse_args(argv)
    if args.selftest:
        try:
            return selftest()
        except AssertionError as e:
            print(f"SELFTEST FAILED: {e!r}", file=sys.stderr)
            return 1
    if not args.values:
        ap.error("values.json is required (or use --selftest)")
    if not (args.tracker or args.metric_substring):
        ap.error("one of --tracker / --metric-substring is required")
    with open(args.values, encoding="utf-8") as fh:
        values = json.load(fh)
    if isinstance(values, dict):  # tolerate the raw API envelope {"values": [...]}
        values = values.get("values", [])
    r = locate(values, tracker=args.tracker, metric_substring=args.metric_substring)
    json.dump(r, sys.stdout, ensure_ascii=False, indent=2)
    print()
    return 1 if "error" in r else 0


if __name__ == "__main__":
    sys.exit(main())
