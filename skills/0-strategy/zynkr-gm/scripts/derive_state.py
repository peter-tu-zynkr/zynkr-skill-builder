#!/usr/bin/env python3
"""derive_state.py — derive GM states (ENDS_SOON / OVERDUE / UNDATED / CHANGED / PROPOSE_DONE) from Main Tracker rows.

Input: JSON array of row dicts as read from the Main Tracker tab 「H2 專案項目」, keys exactly:
  "#","主類別","子類別","項目（正規化）","重要","緊急","Priority","負責人","協助者","開始","結束","狀態","備註"
(the alias "項目" is accepted for the item column). Category header rows (id like "1.0" or
empty 項目) are skipped.

Tracker status vocabulary (observed 2026-08-24): 未開始 / 進行中 / 放棄 / 完成 / 暫停. 完成 and 暫停
were added by the GM on 2026-08-24; 延遲 still does not exist and stays INFERRED (OVERDUE). A row
carrying any other value gets UNKNOWN_STATUS — surfaced, never silently mapped. This script never
writes back to the tracker.

Status classes:
  TERMINAL  放棄 · 完成  — no live schedule, no owner load, no date asks
  PAUSED    暫停        — no live schedule (so no deadline/date flags), but still owned and surfaced
  LIVE      未開始 · 進行中

Rules (today = --today):
  ENDS_SOON     結束 is a real date, today <= 結束 <= today+14, and 狀態 is LIVE
  OVERDUE       (狀態 == 進行中 and 結束 < today) OR (狀態 == 未開始 and 開始 < today)
  UNDATED       Priority in {P0,P1}, 狀態 is LIVE, and 開始 or 結束 is blank / a `YYYY-MM-DD` placeholder
  CHANGED       any of 狀態/開始/結束/負責人 differs from the --prev snapshot (new rows count as CHANGED)
  PROPOSE_DONE  狀態 == 進行中 and 備註 matches 完成|shipped|done|上線|已上線
  DONE          狀態 == 完成 (terminal; excluded from load and from every deadline/date flag)
  PAUSED        狀態 == 暫停 (no schedule; check the weekly log — a "paused" row that is actually
                running is a real SOR divergence and belongs in the brief)
  UNKNOWN_STATUS 狀態 outside the vocabulary above
Placeholder dates ("YYYY-MM-DD", "MM-DD", "TBD", blank) are treated as undated.

Output (--json): {today, rows:[{id,item,priority,owner,status,start,end,states,evidence}],
                  summary:{...counts + id lists}, by_owner:{owner:{p0,p1,undated,overdue,ends_soon}}}
Default output is a compact text report of the same.

Python 3 stdlib only.
"""
import argparse
import datetime as dt
import json
import re
import sys

ITEM_KEYS = ("項目（正規化）", "項目(正規化)", "項目")
STATUS_KEY, START_KEY, END_KEY, OWNER_KEY, PRIO_KEY, NOTE_KEY, ID_KEY = "狀態", "開始", "結束", "負責人", "Priority", "備註", "#"
CHANGE_FIELDS = (STATUS_KEY, START_KEY, END_KEY, OWNER_KEY)
DONE_WORDS = re.compile(r"完成|shipped|done|已上線|上線", re.IGNORECASE)
STATUS_NOT_STARTED, STATUS_ACTIVE, STATUS_DROPPED, STATUS_DONE, STATUS_PAUSED = "未開始", "進行中", "放棄", "完成", "暫停"
KNOWN_STATUSES = frozenset({STATUS_NOT_STARTED, STATUS_ACTIVE, STATUS_DROPPED, STATUS_DONE, STATUS_PAUSED})
TERMINAL_STATUSES = frozenset({STATUS_DROPPED, STATUS_DONE})      # no owner load, no flags
NO_SCHEDULE_STATUSES = TERMINAL_STATUSES | frozenset({STATUS_PAUSED})  # no deadline / date flags
HEADER_ID = re.compile(r"^\d+\.0$")
OWNER_SPLIT = re.compile(r"[+＋/、,，&]|\s+and\s+|\s+&\s+")
ENDS_SOON_DAYS = 14


def norm(v):
    return "" if v is None else str(v).strip()


def get(row, *keys):
    for k in keys:
        if k in row:
            return norm(row[k])
    # tolerate keys with stray whitespace
    stripped = {norm(k): v for k, v in row.items()}
    for k in keys:
        if k in stripped:
            return norm(stripped[k])
    return ""


def parse_date(text, today):
    """Return (date|None, kind) where kind ∈ {'date','placeholder','blank'}."""
    s = norm(text)
    if not s:
        return None, "blank"
    if re.search(r"[YMDymd]{2}", s) or s.upper() in ("TBD", "TBC", "N/A", "-", "—", "待定"):
        return None, "placeholder"
    s2 = s.replace("/", "-").replace(".", "-")
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s2)
    if m:
        try:
            return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3))), "date"
        except ValueError:
            return None, "placeholder"
    m = re.match(r"^(\d{1,2})-(\d{1,2})$", s2)  # MM-DD → assume today's year
    if m:
        try:
            return dt.date(today.year, int(m.group(1)), int(m.group(2))), "date"
        except ValueError:
            return None, "placeholder"
    return None, "placeholder"


def is_header(row):
    rid = get(row, ID_KEY)
    item = get(row, *ITEM_KEYS)
    return (not item) or bool(HEADER_ID.match(rid))


def split_owners(owner):
    parts = [p.strip() for p in OWNER_SPLIT.split(owner) if p and p.strip()]
    return parts or (["(unassigned)"] if not owner else [owner])


def index_rows(rows):
    return {get(r, ID_KEY): r for r in rows if not is_header(r) and get(r, ID_KEY)}


def derive(rows, today, prev_rows=None):
    prev = index_rows(prev_rows) if prev_rows else {}
    out = []
    for r in rows:
        if is_header(r):
            continue
        rid = get(r, ID_KEY)
        item = get(r, *ITEM_KEYS)
        prio = get(r, PRIO_KEY).upper()
        owner = get(r, OWNER_KEY)
        status = get(r, STATUS_KEY)
        start_raw, end_raw, note = get(r, START_KEY), get(r, END_KEY), get(r, NOTE_KEY)
        start, start_kind = parse_date(start_raw, today)
        end, end_kind = parse_date(end_raw, today)
        states, evidence = [], []

        if end and status not in NO_SCHEDULE_STATUSES and 0 <= (end - today).days <= ENDS_SOON_DAYS:
            states.append("ENDS_SOON")
            evidence.append(f"結束 {end.isoformat()} in {(end - today).days}d")
        if status == "進行中" and end and end < today:
            states.append("OVERDUE")
            evidence.append(f"狀態 進行中 but 結束 {end.isoformat()} < today ({(today - end).days}d)")
        elif status == "未開始" and start and start < today:
            states.append("OVERDUE")
            evidence.append(f"狀態 未開始 but 開始 {start.isoformat()} < today ({(today - start).days}d)")
        if prio in ("P0", "P1") and status not in NO_SCHEDULE_STATUSES and (start is None or end is None):
            states.append("UNDATED")
            missing = []
            if start is None:
                missing.append(f"開始 {start_kind}" + (f" '{start_raw}'" if start_raw else ""))
            if end is None:
                missing.append(f"結束 {end_kind}" + (f" '{end_raw}'" if end_raw else ""))
            evidence.append(f"{prio} without dates: " + "; ".join(missing))
        if prev:
            p = prev.get(rid)
            if p is None:
                states.append("CHANGED")
                evidence.append("not in prev snapshot (new row)")
            else:
                diffs = []
                for f in CHANGE_FIELDS:
                    b, a = get(p, f), get(r, f)
                    if b != a:
                        diffs.append(f"{f}: {b or '∅'} → {a or '∅'}")
                if diffs:
                    states.append("CHANGED")
                    evidence.extend(diffs)
        if status == "進行中" and note and DONE_WORDS.search(note):
            states.append("PROPOSE_DONE")
            evidence.append(f"備註 matches done-word: {DONE_WORDS.search(note).group(0)!r} (status still 進行中)")
        if status == STATUS_DONE:
            states.append("DONE")
            evidence.append(f"狀態 {STATUS_DONE} — terminal; dropped from owner load and from deadline/date flags")
        if status == STATUS_PAUSED:
            states.append("PAUSED")
            evidence.append(f"狀態 {STATUS_PAUSED} — no live schedule; confirm against the weekly log before trusting it")
        if status and status not in KNOWN_STATUSES:
            states.append("UNKNOWN_STATUS")
            evidence.append(f"狀態 {status!r} is outside the vocabulary {sorted(KNOWN_STATUSES)} — not mapped")

        out.append({
            "id": rid, "item": item, "priority": prio, "owner": owner, "helper": get(r, "協助者"),
            "status": status, "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
            "start_raw": start_raw, "end_raw": end_raw, "note": note,
            "states": states, "evidence": evidence,
        })
    return out


def summarise(derived, prev_given):
    by_ps, by_state = {}, {}
    lists = {"p0_undated": [], "p1_undated": [], "p0_overdue": [], "overdue": [], "ends_soon": [],
             "propose_done": [], "changed": [], "dropped": [], "done": [], "paused": [],
             "unknown_status": []}
    by_owner = {}
    for d in derived:
        by_ps.setdefault(d["priority"] or "?", {}).setdefault(d["status"] or "?", 0)
        by_ps[d["priority"] or "?"][d["status"] or "?"] += 1
        for s in d["states"]:
            by_state[s] = by_state.get(s, 0) + 1
        if d["status"] == STATUS_DROPPED:
            lists["dropped"].append(d["id"])
        if d["status"] == STATUS_DONE:
            lists["done"].append(d["id"])
        if d["status"] == STATUS_PAUSED:
            lists["paused"].append(d["id"])
        if "UNKNOWN_STATUS" in d["states"]:
            lists["unknown_status"].append(d["id"])
        if "UNDATED" in d["states"]:
            lists["p0_undated" if d["priority"] == "P0" else "p1_undated"].append(d["id"])
        if "OVERDUE" in d["states"]:
            lists["overdue"].append(d["id"])
            if d["priority"] == "P0":
                lists["p0_overdue"].append(d["id"])
        if "ENDS_SOON" in d["states"]:
            lists["ends_soon"].append(d["id"])
        if "PROPOSE_DONE" in d["states"]:
            lists["propose_done"].append(d["id"])
        if "CHANGED" in d["states"]:
            lists["changed"].append(d["id"])
        if d["status"] in TERMINAL_STATUSES:
            continue
        for o in split_owners(d["owner"]):
            slot = by_owner.setdefault(o, {"p0": [], "p1": [], "undated": [], "overdue": [], "ends_soon": []})
            if d["priority"] == "P0":
                slot["p0"].append(d["id"])
            elif d["priority"] == "P1":
                slot["p1"].append(d["id"])
            if "UNDATED" in d["states"]:
                slot["undated"].append(d["id"])
            if "OVERDUE" in d["states"]:
                slot["overdue"].append(d["id"])
            if "ENDS_SOON" in d["states"]:
                slot["ends_soon"].append(d["id"])
    summary = {"rows": len(derived), "counts_by_priority_status": by_ps, "counts_by_state": by_state,
               "prev_snapshot_given": prev_given, **lists}
    return summary, by_owner


def render_text(result):
    s = result["summary"]
    lines = [f"today={result['today']}  rows={s['rows']}  prev={'yes' if s['prev_snapshot_given'] else 'no'}",
             "counts by priority×status: " + json.dumps(s["counts_by_priority_status"], ensure_ascii=False),
             "counts by state: " + json.dumps(s["counts_by_state"], ensure_ascii=False)]
    for k in ("p0_undated", "p1_undated", "p0_overdue", "overdue", "ends_soon", "propose_done", "changed",
              "dropped", "done", "paused", "unknown_status"):
        lines.append(f"{k}: {', '.join(s[k]) or '-'}")
    lines.append("")
    for d in result["rows"]:
        if not d["states"]:
            continue
        lines.append(f"{d['id']} [{d['priority']}] {d['item']} · {d['owner']} · {d['status']} · {','.join(d['states'])}")
        for e in d["evidence"]:
            lines.append(f"    - {e}")
    lines.append("")
    lines.append("by owner:")
    for o, v in result["by_owner"].items():
        lines.append(f"  {o}: p0={v['p0']} p1={v['p1']} undated={v['undated']} overdue={v['overdue']} ends_soon={v['ends_soon']}")
    return "\n".join(lines)


def run(rows, today, prev_rows=None):
    derived = derive(rows, today, prev_rows)
    summary, by_owner = summarise(derived, prev_rows is not None)
    return {"today": today.isoformat(), "rows": derived, "summary": summary, "by_owner": by_owner}


def _row(i, cat, item, prio, owner, start, end, status, note=""):
    return {"#": i, "主類別": cat, "子類別": "", "項目（正規化）": item, "重要": "", "緊急": "", "Priority": prio,
            "負責人": owner, "協助者": "", "開始": start, "結束": end, "狀態": status, "備註": note}


SAMPLE_TODAY = dt.date(2026, 8, 17)
SAMPLE_ROWS = [
    _row("1.0", "1.0 Marketing", "", "", "", "", "", "", ""),                                   # header → skipped
    _row("1.03", "1.0", "SEO 文章", "P1", "Peter", "2026-07-01", "YYYY-MM-DD", "未開始"),           # OVERDUE (start<today) + UNDATED
    _row("1.08", "1.0", "電子報 Drip", "P0", "Mark", "2026-08-01", "2026-09-30", "進行中", "drip 已上線"),  # PROPOSE_DONE
    _row("2.01", "2.0", "業務流程結構化", "P0", "Peter", "2026-09-01", "2026-10-31", "未開始"),           # nothing
    _row("2.03", "2.0", "業務分潤系統", "P0", "Mark", "YYYY-MM-DD", "YYYY-MM-DD", "未開始"),           # UNDATED
    _row("3.05", "3.0", "Metrics 儀表", "P2", "Jane", "", "", "放棄"),                                # dropped
    _row("4.01", "4.0", "企業 AI 診斷", "P0", "Peter", "2026-08-03", "2026-08-28", "進行中"),           # ENDS_SOON (11d)
    _row("4.05", "4.0", "陪跑課", "P0", "Peter+Peggy", "2026-07-15", "2026-08-10", "進行中"),          # OVERDUE (end<today)
    _row("6.01", "6.0", "公司 KPI 制度", "P0", "Peter/Jane", "2026-08-31", "2026-08-31", "未開始"),      # ENDS_SOON (14d), two owners
    # --- vocab added 2026-08-24: 完成 / 暫停, plus a P0 放棄 (the P2 放棄 above never caught the leak) ---
    _row("4.02", "4.0", "企業 AI 導入", "P0", "Peter", "2026-08-03", "2026-08-28", "完成"),              # DONE: no ENDS_SOON, no load
    _row("4.07", "4.0", "Vibe Coding", "P0", "Peggy", "YYYY-MM-DD", "YYYY-MM-DD", "暫停"),             # PAUSED: no UNDATED ask
    _row("3.02", "3.0", "增加講師 — 內部", "P0", "Peggy", "YYYY-MM-DD", "YYYY-MM-DD", "放棄"),           # P0 放棄: must NOT leak into p0_undated
    _row("9.99", "9.0", "未知狀態列", "P2", "Mark", "", "", "審核中"),                                   # UNKNOWN_STATUS
]
SAMPLE_PREV = [dict(r) for r in SAMPLE_ROWS]
SAMPLE_PREV[2]["狀態"] = "未開始"          # 1.08 status changed
SAMPLE_PREV[7]["負責人"] = "Peter"          # 4.05 owner changed
SAMPLE_PREV = [r for r in SAMPLE_PREV if r["#"] != "6.01"]  # 6.01 is new


def selftest():
    res = run(SAMPLE_ROWS, SAMPLE_TODAY, SAMPLE_PREV)
    by_id = {r["id"]: r for r in res["rows"]}
    assert "1.0" not in by_id and len(by_id) == 12, list(by_id)
    assert set(by_id["1.03"]["states"]) == {"OVERDUE", "UNDATED"}, by_id["1.03"]
    assert by_id["1.08"]["states"] == ["CHANGED", "PROPOSE_DONE"], by_id["1.08"]
    assert by_id["2.01"]["states"] == [], by_id["2.01"]
    assert by_id["2.03"]["states"] == ["UNDATED"], by_id["2.03"]
    assert by_id["3.05"]["states"] == [], by_id["3.05"]
    assert by_id["4.01"]["states"] == ["ENDS_SOON"] and "in 11d" in by_id["4.01"]["evidence"][0], by_id["4.01"]
    assert set(by_id["4.05"]["states"]) == {"OVERDUE", "CHANGED"}, by_id["4.05"]
    assert set(by_id["6.01"]["states"]) == {"ENDS_SOON", "CHANGED"}, by_id["6.01"]
    s = res["summary"]
    assert s["p0_undated"] == ["2.03"] and s["p1_undated"] == ["1.03"], s
    assert s["overdue"] == ["1.03", "4.05"] and s["p0_overdue"] == ["4.05"], s
    assert s["ends_soon"] == ["4.01", "6.01"] and s["propose_done"] == ["1.08"], s
    assert s["changed"] == ["1.08", "4.05", "6.01"] and s["dropped"] == ["3.05", "3.02"], s
    assert s["counts_by_priority_status"]["P0"] == {"進行中": 3, "未開始": 3, "完成": 1, "暫停": 1, "放棄": 1}, \
        s["counts_by_priority_status"]
    # --- vocab 2026-08-24: 完成 is terminal, 暫停 has no schedule, 放棄 leaks nothing ---
    assert by_id["4.02"]["states"] == ["DONE"], by_id["4.02"]              # NOT ENDS_SOON despite 結束 in 11d
    assert by_id["4.07"]["states"] == ["PAUSED"], by_id["4.07"]            # NOT UNDATED
    assert by_id["3.02"]["states"] == [], by_id["3.02"]                    # P0 放棄 → no flags at all
    assert by_id["9.99"]["states"] == ["UNKNOWN_STATUS"], by_id["9.99"]
    assert s["done"] == ["4.02"] and s["paused"] == ["4.07"] and s["unknown_status"] == ["9.99"], s
    assert "4.02" not in s["ends_soon"] and "3.02" not in s["p0_undated"], s
    bo = res["by_owner"]
    assert "Jane" in bo and bo["Jane"]["p0"] == ["6.01"], bo   # split on '/', 放棄 row excluded
    assert bo["Peggy"]["overdue"] == ["4.05"], bo
    assert bo["Peggy"]["p0"] == ["4.05", "4.07"], bo["Peggy"]   # 暫停 still owned; 放棄 3.02 excluded
    assert "4.02" not in bo["Peter"]["p0"], bo["Peter"]          # 完成 drops out of GM load
    assert bo["Peter"]["p0"] == ["2.01", "4.01", "4.05", "6.01"], bo["Peter"]
    assert bo["Mark"]["undated"] == ["2.03"], bo["Mark"]
    # without prev → no CHANGED anywhere
    res2 = run(SAMPLE_ROWS, SAMPLE_TODAY)
    assert not any("CHANGED" in r["states"] for r in res2["rows"])
    # date parsing edge cases
    assert parse_date("YYYY-MM-DD", SAMPLE_TODAY) == (None, "placeholder")
    assert parse_date("2026/8/5", SAMPLE_TODAY)[0] == dt.date(2026, 8, 5)
    assert parse_date("08-28", SAMPLE_TODAY)[0] == dt.date(2026, 8, 28)
    assert parse_date("", SAMPLE_TODAY) == (None, "blank")
    render_text(res)
    print("derive_state selftest OK")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("rows", nargs="?", help="rows.json — JSON array of tracker row dicts (current snapshot)")
    ap.add_argument("--today", help="YYYY-MM-DD (default: system date)")
    ap.add_argument("--prev", help="prev_rows.json — earlier snapshot for CHANGED detection")
    ap.add_argument("--json", action="store_true", help="emit full JSON")
    ap.add_argument("--selftest", action="store_true", help="run embedded sample and exit 0/1")
    args = ap.parse_args(argv)
    if args.selftest:
        try:
            return selftest()
        except AssertionError as e:
            print(f"SELFTEST FAILED: {e!r}", file=sys.stderr)
            return 1
    if not args.rows:
        ap.error("rows.json is required (or use --selftest)")
    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    with open(args.rows, encoding="utf-8") as fh:
        rows = json.load(fh)
    prev = None
    if args.prev:
        with open(args.prev, encoding="utf-8") as fh:
            prev = json.load(fh)
    if not isinstance(rows, list):
        print("rows.json must be a JSON array of objects", file=sys.stderr)
        return 1
    res = run(rows, today, prev)
    if args.json:
        json.dump(res, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        print(render_text(res))
    return 0


if __name__ == "__main__":
    sys.exit(main())
