#!/usr/bin/env python3
"""Render the marked 〔自動彙整〕 block for each department heading.

    render_block.py --reports reports.json --routing routing.json \
                    [--carryover carryover.json] --week 2026-W35 --stamp "08-24 12:00"

Emits one block per routed heading, plus the diagnostics the run report must surface:
reporters whose owner email matches no heading, and headings with no report this week.

The block is the ONLY place auto-content is allowed to live, and its stamp doubles as the
idempotency key -- before writing, the caller searches the section for `〔自動彙整 W<week>`.
Nothing here ever rewrites a human's line.
"""
import argparse
import json
import re
import sys

STAMP = "〔自動彙整 {week} · {stamp}〕"
STATUS_LABEL = {"DONE": "Done", "WIP": "WIP", "BLOCKED": "Blocked",
                "NOT_STARTED": "Not started", "ABANDONED": "放棄", "UNSET": "狀態未填"}


def norm_key(text):
    text = re.sub(r"↻\s*\d+\s*週", "", text)
    text = re.sub(r"\b(done|wip|blocked|not\s*started|in\s*progress)\b", "", text, flags=re.I)
    text = re.sub(r"[*_`~〔〕（）()\[\]:：,，。.\-—–·、/／%]", "", text)
    text = re.sub(r"\d+", "", text)
    return re.sub(r"\s+", "", text).strip().lower()


def carry_lookup(carryover):
    if not carryover:
        return {}
    return {norm_key(i["text"]): i["weeks"] for i in carryover.get("items", []) if i["weeks"] > 1}


def render(record, carries):
    lines = []

    if record["last_week"]:
        parts = []
        for item in record["last_week"]:
            label = STATUS_LABEL.get(item["status"], item["status"])
            weeks = carries.get(norm_key(item["text"]))
            tag = f" ↻{weeks}週" if weeks and item["status"] != "DONE" else ""
            parts.append(f"{item['text']} {label}{tag}")
        lines.append("· 上週 — " + " ／ ".join(parts))

    if record["this_week"]:
        lines.append("· 本週 — " + " ／ ".join(i["text"] for i in record["this_week"]))

    nums = record["numbers"]
    if nums["parsed"]:
        lines.append("· 數字 — " + " ／ ".join(f"{k} {v}" for k, v in nums["parsed"].items()))
    elif nums["raw"] and not nums.get("empty"):
        lines.append("· 數字 — " + nums["raw"])

    if record["blocker"]:
        lines.append("· 卡關 — " + record["blocker"])

    if record["missing_lines"]:
        zh = {"last_week": "上週", "this_week": "本週", "numbers": "數字", "blocker": "卡關"}
        lines.append("· 未填 — " + "／".join(zh[k] for k in record["missing_lines"]))

    return lines


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--reports", required=True)
    ap.add_argument("--routing", required=True)
    ap.add_argument("--carryover")
    ap.add_argument("--week", required=True, help="ISO week key, e.g. 2026-W35")
    ap.add_argument("--stamp", required=True, help='timestamp shown in the block, e.g. "08-24 12:00"')
    args = ap.parse_args()

    reports = json.load(open(args.reports, encoding="utf-8"))
    routing = json.load(open(args.routing, encoding="utf-8"))
    carryover = json.load(open(args.carryover, encoding="utf-8")) if args.carryover else None
    carries = carry_lookup(carryover)

    by_email = {r["email"]: r for r in reports["records"]}
    header = STAMP.format(week=args.week, stamp=args.stamp)

    blocks, no_report = [], []
    for heading in routing["headings"]:
        # A grouped sub-heading is covered by its parent's block; don't write it twice.
        if heading.get("grouped_with_previous"):
            continue
        email = heading["owner_email"]
        record = by_email.get(email)
        if not record:
            no_report.append({"heading": heading["heading"], "owner_email": email})
            continue
        if not heading.get("primary", True):
            continue  # one owner, several headings -> block goes under the primary one
        body = render(record, carries)
        if not body:
            no_report.append({"heading": heading["heading"], "owner_email": email,
                              "reason": "posted but empty"})
            continue
        blocks.append({
            "heading": heading["heading"],
            "owner_email": email,
            "owner_name": heading.get("owner_name"),
            "text": "\n".join([header] + body),
            "lines": len(body) + 1,
        })

    routed_emails = {h["owner_email"] for h in routing["headings"]}
    unroutable = [e for e in by_email if e not in routed_emails]

    json.dump({
        "week": args.week,
        "stamp": header,
        "idempotency_key": f"〔自動彙整 {args.week}",
        "blocks": blocks,
        "headings_without_report": no_report,
        "reporters_without_heading": unroutable,
        "unrouted_headings": [u["heading"] for u in routing.get("unrouted", [])],
        "counts": {"blocks": len(blocks), "no_report": len(no_report),
                   "unroutable_reporters": len(unroutable)},
    }, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")

    if unroutable:
        print(f"render_block: {len(unroutable)} reporter(s) have no heading chip: "
              f"{', '.join(unroutable)}", file=sys.stderr)


if __name__ == "__main__":
    main()
