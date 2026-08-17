#!/usr/bin/env python3
"""tracker_diff.py — diff two snapshots of Main Tracker 「H2 專案項目」 rows.

Usage: tracker_diff.py before.json after.json [--json]
Both files: JSON array of row dicts (keys "#","項目（正規化）","Priority","負責人","開始","結束","狀態", ...).
Category header rows (id like "1.0" / empty 項目) are ignored.

Output: {added:[ids], removed:[ids], changed:[{id,item,changes:{field:{before,after}}}], unchanged: n}
Compared fields: 狀態 · 開始 · 結束 · 負責人 · Priority.
Importable: diff_rows(before_rows, after_rows) -> dict.

Python 3 stdlib only.
"""
import argparse
import json
import re
import sys

ID_KEY = "#"
ITEM_KEYS = ("項目（正規化）", "項目(正規化)", "項目")
FIELDS = ("狀態", "開始", "結束", "負責人", "Priority")
HEADER_ID = re.compile(r"^\d+\.0$")


def _norm(v):
    return "" if v is None else str(v).strip()


def _get(row, *keys):
    for k in keys:
        if k in row:
            return _norm(row[k])
    stripped = {_norm(k): v for k, v in row.items()}
    for k in keys:
        if k in stripped:
            return _norm(stripped[k])
    return ""


def _index(rows):
    out = {}
    for r in rows:
        rid = _get(r, ID_KEY)
        item = _get(r, *ITEM_KEYS)
        if not rid or not item or HEADER_ID.match(rid):
            continue
        out[rid] = r
    return out


def _sort_key(rid):
    parts = rid.split(".")
    try:
        return tuple(int(p) for p in parts)
    except ValueError:
        return (9999, rid)


def diff_rows(before, after, fields=FIELDS):
    b, a = _index(before), _index(after)
    added = sorted(set(a) - set(b), key=_sort_key)
    removed = sorted(set(b) - set(a), key=_sort_key)
    changed, unchanged = [], 0
    for rid in sorted(set(a) & set(b), key=_sort_key):
        ch = {}
        for f in fields:
            bv, av = _get(b[rid], f), _get(a[rid], f)
            if bv != av:
                ch[f] = {"before": bv, "after": av}
        if ch:
            changed.append({"id": rid, "item": _get(a[rid], *ITEM_KEYS), "changes": ch})
        else:
            unchanged += 1
    return {"added": added, "removed": removed, "changed": changed, "unchanged": unchanged}


def render_text(d):
    lines = [f"added: {', '.join(d['added']) or '-'}", f"removed: {', '.join(d['removed']) or '-'}",
             f"changed: {len(d['changed'])}  unchanged: {d['unchanged']}"]
    for c in d["changed"]:
        parts = [f"{f}: {v['before'] or '∅'} → {v['after'] or '∅'}" for f, v in c["changes"].items()]
        lines.append(f"  {c['id']} {c['item']}: " + "; ".join(parts))
    return "\n".join(lines)


def _row(i, item, prio, owner, start, end, status):
    return {"#": i, "主類別": "", "子類別": "", "項目（正規化）": item, "重要": "", "緊急": "", "Priority": prio,
            "負責人": owner, "協助者": "", "開始": start, "結束": end, "狀態": status, "備註": ""}


def selftest():
    before = [
        _row("1.0", "", "", "", "", "", ""),
        _row("1.03", "SEO 文章", "P1", "Peter", "2026-07-01", "YYYY-MM-DD", "未開始"),
        _row("1.08", "電子報", "P0", "Mark", "YYYY-MM-DD", "YYYY-MM-DD", "未開始"),
        _row("2.05", "old item", "P2", "Jane", "", "", "未開始"),
        _row("4.01", "企業 AI 診斷", "P0", "Peter", "2026-08-03", "2026-08-28", "進行中"),
    ]
    after = [
        _row("1.0", "", "", "", "", "", ""),
        _row("1.03", "SEO 文章", "P1", "Peter", "2026-07-01", "YYYY-MM-DD", "未開始"),      # unchanged
        _row("1.08", "電子報", "P0", "Mark", "2026-08-01", "2026-09-30", "進行中"),          # 3 fields changed
        _row("4.01", "企業 AI 診斷", "P0", "Peter", "2026-08-03", "2026-08-28", "進行中"),  # unchanged
        _row("6.01", "公司 KPI 制度", "P0", "Peter+Jane", "", "", "未開始"),               # added
    ]
    d = diff_rows(before, after)
    assert d["added"] == ["6.01"] and d["removed"] == ["2.05"], d
    assert d["unchanged"] == 2, d
    assert len(d["changed"]) == 1 and d["changed"][0]["id"] == "1.08", d
    ch = d["changed"][0]["changes"]
    assert set(ch) == {"狀態", "開始", "結束"} and ch["狀態"] == {"before": "未開始", "after": "進行中"}, ch
    assert diff_rows(after, after) == {"added": [], "removed": [], "changed": [], "unchanged": 4}
    render_text(d)
    print("tracker_diff selftest OK")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("before", nargs="?", help="earlier snapshot rows.json")
    ap.add_argument("after", nargs="?", help="current snapshot rows.json")
    ap.add_argument("--json", action="store_true", help="emit JSON")
    ap.add_argument("--selftest", action="store_true", help="run embedded sample and exit 0/1")
    args = ap.parse_args(argv)
    if args.selftest:
        try:
            return selftest()
        except AssertionError as e:
            print(f"SELFTEST FAILED: {e!r}", file=sys.stderr)
            return 1
    if not (args.before and args.after):
        ap.error("before.json and after.json are required (or use --selftest)")
    with open(args.before, encoding="utf-8") as fh:
        before = json.load(fh)
    with open(args.after, encoding="utf-8") as fh:
        after = json.load(fh)
    d = diff_rows(before, after)
    if args.json:
        json.dump(d, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        print(render_text(d))
    return 0


if __name__ == "__main__":
    sys.exit(main())
