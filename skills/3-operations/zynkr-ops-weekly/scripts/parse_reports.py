#!/usr/bin/env python3
"""Turn a week's Google Chat posts into structured weekly-report records.

The skill normalises whatever `get_messages` returned into this shape and pipes it in:

    [{"sender": "users/1234...", "create_time": "2026-08-24T09:12:00Z", "text": "#週報\\n上週:\\n- ..."}]

    parse_reports.py --config ~/.config/zynkr/ops-weekly.json < messages.json > reports.json

Chat exposes senders as users/<id> with no email field, so `chat_ids` in the config is the
only bridge to the Doc's email-keyed owner chips. An unmapped sender is REPORTED, never
dropped silently -- a swallowed report is indistinguishable from someone not reporting.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime

TAG = "#週報"
LABELS = [
    ("last_week", re.compile(r"^\s*(上週|上周)\s*[:：]\s*(.*)$")),
    ("this_week", re.compile(r"^\s*(本週|本周)\s*[:：]\s*(.*)$")),
    ("numbers", re.compile(r"^\s*(數字|数字)\s*[:：]\s*(.*)$")),
    ("blocker", re.compile(r"^\s*(卡關|卡关)\s*[:：]\s*(.*)$")),
]

# Shapes the team actually used before the tagged format was pinned. Enabled by
# --accept-untagged so the first roll-up has real data to work with; the Monday nudge
# is what migrates everyone onto the tagged format. Colon optional -- these were
# written as bare headings with the items on following lines.
# Legacy (pre-`#週報`) shapes. Two properties are load-bearing and were both learned
# the hard way against the real space:
#
#   1. CASE-INSENSITIVE. The team writes 本週Focus, 本週 focus and 本週focus
#      interchangeably. Without re.I the capital-F spellings match nothing, so
#      `legacy_hit` stays False and the whole post is discarded as non-report — which
#      then makes `chase` publicly name people who did in fact post. Confirmed live
#      2026-09-03 on W36: Peggy, Bicky and Jane were all silently dropped, and the
#      run only looked correct because the model re-read the raw chat by hand.
#   2. FOCUS ALTERNATIVES COME FIRST. Alternation is ordered, so a bare 這週 placed
#      ahead of 這週focus would match first and leave the literal word "focus" to be
#      parsed as this week's first work item.
#
# The 我的 infix is optional throughout: 本週我的 focus / 這個禮拜我的 focus both occur.
_FOCUS_THIS = r"(?:這個禮拜|這禮拜|這週|本週|本周)(?:我的)?\s*focus"
_FOCUS_LAST = r"(?:上個禮拜|上禮拜|上週|上周)(?:我的)?\s*focus"

LEGACY_LABELS = [
    ("last_week", re.compile(
        r"^\s*(" + _FOCUS_LAST + r"|上禮拜進度|上週進度|上周進度|上星期|上禮拜)"
        r"\s*[:：]?\s*(.*)$", re.I)),
    ("this_week", re.compile(
        r"^\s*(" + _FOCUS_THIS + r"|這禮拜待辦|這週待辦|本週待辦|本周待辦|這禮拜|這週)"
        r"\s*[:：]?\s*(.*)$", re.I)),
]
# 、 and ． are the enumerators the team actually types on a zh-TW keyboard ("1、事項").
# Without them the number stays glued to the item text and every rendered block needs
# hand-cleaning before it goes into the Doc.
BULLET_RE = re.compile(r"^\s*(?:[-*・‧•]|\d+[.)、．])\s*(.+?)\s*$")
# The nudge template teaches 完成 / 進行中 / 卡住, so those must parse on the way back in.
# English stays accepted -- older posts use it and there is no reason to reject them.
# Longer alternatives come first: 還沒開始 must be tried before 開始 can match anything else.
# NOTE: bare 卡關 is deliberately NOT a status word -- it is the name of the fourth field,
# so matching it here would tag every blocker line as BLOCKED.
STATUS_RE = re.compile(
    r"(?:\b(done|wip|blocked|not\s*started|in\s*progress)\b"
    r"|(還沒開始|未開始|已完成|完成|進行中|卡關中|卡住|放棄))", re.I)
STATUS_CANON = {
    "done": "DONE", "已完成": "DONE", "完成": "DONE",
    "wip": "WIP", "in progress": "WIP", "進行中": "WIP",
    "blocked": "BLOCKED", "卡關中": "BLOCKED", "卡住": "BLOCKED",
    "not started": "NOT_STARTED", "未開始": "NOT_STARTED", "還沒開始": "NOT_STARTED",
    "放棄": "ABANDONED",   # matches the H2 tracker's status vocab (未開始/進行中/放棄)
}
EMPTY = {"", "-", "—", "–", "無", "无", "沒有", "没有", "n/a", "na", "none"}


def is_empty(value):
    return value.strip().lower() in EMPTY


def split_sections(text, labels=None):
    """Split the post body on the four labels, keeping everything under each."""
    labels = labels or LABELS
    sections, current = {}, None
    for line in text.splitlines():
        matched = False
        for key, rx in labels:
            m = rx.match(line)
            if m:
                current = key
                sections.setdefault(current, [])
                if m.group(2).strip():
                    sections[current].append(m.group(2).strip())
                matched = True
                break
        if matched:
            continue
        if current is not None and line.strip():
            sections[current].append(line.rstrip())
    return sections


def parse_items(lines):
    """Bullets become items; so does each bare line.

    The pre-tag format used bare lines rather than bullets, one task per line. Joining
    them would fuse five distinct tasks into one blob and destroy per-item status and
    carry-over tracking, so a line is an item whether or not it carries a bullet.
    """
    items, prose = [], []
    for line in lines:
        m = BULLET_RE.match(line)
        if m:
            items.append(m.group(1))
        elif line.strip():
            prose.append(line.strip())
    items.extend(prose)
    out = []
    for raw in items:
        status_m = STATUS_RE.search(raw)
        status = "UNSET"
        if status_m:
            token = (status_m.group(1) or status_m.group(2) or "").strip().lower()
            status = STATUS_CANON.get(re.sub(r"\s+", " ", token), token.upper())
        body = raw
        if status_m:
            body = raw[: status_m.start()].rstrip(" —–-·:：").strip() or raw
        out.append({"text": body, "status": status, "raw": raw})
    return out


def parse_numbers(lines):
    raw = " ".join(l.strip() for l in lines).strip()
    if not raw or is_empty(raw):
        # "—" / "無" means "I have no numbers this week" -- keep the raw for fidelity,
        # but mark it so nothing downstream renders a line that says nothing.
        return {"raw": raw, "parsed": {}, "empty": True}
    parsed = {}
    # Split on slashes; a comma only separates when it is NOT a thousands separator.
    for chunk in re.split(r"[/／]|(?<!\d)[,、](?!\d)", raw):
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(r"^(.*?)[\s:：]+([+-]?[\d,]+(?:\.\d+)?%?)$", chunk)
        if m and m.group(1).strip():
            parsed[m.group(1).strip()] = m.group(2)
    return {"raw": raw, "parsed": parsed, "empty": not parsed}


def iso_week(dt):
    y, w, _ = dt.isocalendar()
    return f"{y}-W{w:02d}"


def to_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def normalise(msg):
    """Accept the raw Chat shape as well as the flat one, so callers need not reshape twice."""
    sender = msg.get("sender") or msg.get("from") or ""
    if isinstance(sender, dict):
        sender = sender.get("name") or sender.get("id") or ""
    text = msg.get("text") or msg.get("formattedText") or msg.get("argumentText") or ""
    created = msg.get("create_time") or msg.get("createTime") or msg.get("time") or ""
    return str(sender), str(text), str(created)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--config", default=os.environ.get("ZYNKR_OPS_WEEKLY_CONFIG",
                                                       os.path.expanduser("~/.config/zynkr/ops-weekly.json")))
    ap.add_argument("--input", help="messages JSON file (default: stdin)")
    ap.add_argument("--week", help="ISO week key to stamp; default derived from newest message")
    ap.add_argument("--accept-untagged", action="store_true",
                    help="also parse pre-tag shapes (上禮拜進度 / 本週待辦 / 這個禮拜我的 focus). "
                         "Transitional: use until the tagged format is pinned and adopted.")
    args = ap.parse_args()

    try:
        cfg = json.load(open(args.config, encoding="utf-8"))
    except FileNotFoundError:
        print(f"config: {args.config} not found -- copy references/config.example.json", file=sys.stderr)
        sys.exit(2)

    chat_ids = {k: v for k, v in cfg.get("chat_ids", {}).items() if not k.startswith("$")}
    reporters = [r for r in cfg.get("reporters", []) if "<" not in r]
    if not chat_ids or any("<" in k for k in chat_ids):
        print("config: chat_ids unset or still placeholders", file=sys.stderr)
        sys.exit(2)

    raw = json.load(open(args.input, encoding="utf-8")) if args.input else json.load(sys.stdin)
    messages = raw.get("messages", raw) if isinstance(raw, dict) else raw

    by_email, unmapped, duplicates, untagged = {}, [], [], 0
    active_labels = LABELS + (LEGACY_LABELS if args.accept_untagged else [])
    for msg in messages:
        sender, text, created = normalise(msg)
        tagged = TAG in text
        legacy_hit = args.accept_untagged and any(
            rx.match(line) for line in text.splitlines() for _, rx in LEGACY_LABELS
        )
        if not tagged and not legacy_hit:
            untagged += 1
            continue
        email = chat_ids.get(sender)
        if not email:
            unmapped.append({"sender": sender, "create_time": created,
                             "preview": text.strip().splitlines()[0][:60] if text.strip() else ""})
            continue

        sections = split_sections(text, active_labels)
        record = {
            "email": email,
            "sender": sender,
            "format": "tagged" if tagged else "legacy",
            "create_time": created,
            "last_week": parse_items(sections.get("last_week", [])),
            "this_week": parse_items(sections.get("this_week", [])),
            "numbers": parse_numbers(sections.get("numbers", [])),
            "blocker": None,
            "missing_lines": [k for k, _ in LABELS if k not in sections],
            "raw": text,
        }
        blocker = " ".join(sections.get("blocker", [])).strip()
        if blocker and not is_empty(blocker):
            record["blocker"] = blocker

        prior = by_email.get(email)
        if prior:
            # Re-posting is how people edit. Latest wins, and the report says so.
            duplicates.append({"email": email, "kept": None, "count": 2})
            keep_new = (to_dt(created) or datetime.min) >= (to_dt(prior["create_time"]) or datetime.min)
            if not keep_new:
                continue
        by_email[email] = record

    for d in duplicates:
        d["kept"] = by_email[d["email"]]["create_time"]

    newest = max((to_dt(r["create_time"]) for r in by_email.values() if to_dt(r["create_time"])),
                 default=None)
    week = args.week or (iso_week(newest) if newest else None)

    posters = sorted(by_email)
    out = {
        "week": week,
        "records": [by_email[e] for e in posters],
        "posters": posters,
        "missing": sorted(set(reporters) - set(posters)),
        "unmapped_senders": unmapped,
        "duplicates": duplicates,
        "skipped_untagged": untagged,
        "legacy_format_posts": sorted(e for e in posters if by_email[e]["format"] == "legacy"),
        "counts": {"reporters": len(reporters), "posted": len(posters),
                   "missing": len(set(reporters) - set(posters)),
                   "legacy": sum(1 for e in posters if by_email[e]["format"] == "legacy")},
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")

    if unmapped:
        print(f"parse_reports: {len(unmapped)} unmapped sender(s) -- add them to chat_ids",
              file=sys.stderr)


if __name__ == "__main__":
    main()
