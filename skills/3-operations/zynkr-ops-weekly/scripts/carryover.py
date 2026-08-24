#!/usr/bin/env python3
"""Count how many consecutive weeks an item has been carried without finishing.

The Doc's failure mode is that a section gets copied forward near-verbatim and nobody
notices an item has been "90% done" for a month. This turns that into a number.

    get_doc_as_markdown | carryover.py [--section "Aug 27, 2026"] [--threshold 3]

An item at or above the threshold is agenda material by default: it has survived enough
meetings to prove that reporting it again will not move it.
"""
import argparse
import difflib
import json
import re
import sys

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
BULLET_RE = re.compile(r"^\s*(?:[-*・‧•]|\d+[.)])\s*(.+?)\s*$")
DATE_HEADING_RE = re.compile(
    r"^[A-Z][a-z]{2}\.?\s+\d{1,2}(?:,\s*\d{4})?$|^\d{4}[-/]\d{1,2}[-/]\d{1,2}$"
)
STATUS_RE = re.compile(r"\b(done|wip|blocked|not\s*started|in\s*progress)\b", re.I)
STAMP_RE = re.compile(r"〔自動彙整")
# Deliberately strict. At 0.82 the walk-back CHAINS: each week it matches a slightly
# different item, and the streak drifts across unrelated work. On the real Doc that
# produced "CPM, CPC, Conversion rate, ROAS ↻35週" for an item present in 5% of sections.
# At 0.95 the result is identical to exact-key matching while still tolerating a typo.
# Digits are stripped before comparison, so "90%" -> "92%" still matches as one item.
SIMILARITY = 0.95
# An "item" that appears in most sections is part of the copied-forward TEMPLATE
# (a metric label, a column header), not a task anyone is carrying. Verified against the
# real Doc: without this, 46 of 76 items flagged as stuck, and the top of the list was
# "Website", "Funnel", "TOF" -- skeleton labels present since 2025.
TEMPLATE_RATIO = 0.6
MIN_ITEM_CHARS = 4
# The ratio test needs a corpus to be meaningful. In a short document "appears in every
# section" is precisely what a STUCK item looks like, so applying it there would hide the
# one thing this script exists to surface. A template label also never carries a status,
# whereas a carried task usually does -- both conditions must hold.
MIN_SECTIONS_FOR_RATIO = 8


def normalise(text):
    """Compare on meaning-ish: drop markup, digits, spaces and our own annotations."""
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"↻\s*\d+\s*週", "", text)
    text = STATUS_RE.sub("", text)
    text = re.sub(r"[*_`~〔〕（）()\[\]:：,，。.\-—–·、/／%]", "", text)
    text = re.sub(r"\d+", "", text)
    return re.sub(r"\s+", "", text).strip().lower()


def sections(md):
    """Ordered list of dated sections, newest first as the Doc stores them."""
    out, current = [], None
    for line in md.splitlines():
        m = HEADING_RE.match(line)
        if m:
            visible = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", m.group(2))
            visible = re.sub(r"[*_`~]", "", visible).strip()
            if DATE_HEADING_RE.match(visible):
                current = {"date": visible, "items": []}
                out.append(current)
                continue
        if current is None:
            continue
        if STAMP_RE.search(line):
            continue  # our own block, not a human's item
        bm = BULLET_RE.match(line)
        if bm:
            raw = bm.group(1)
            sm = STATUS_RE.search(raw)
            current["items"].append({
                "raw": raw,
                "key": normalise(raw),
                "status": sm.group(1).upper() if sm else "UNSET",
            })
    return out


def matches(key, items):
    if not key:
        return None
    for it in items:
        if it["key"] and it["key"] == key:
            return it
    for it in items:
        if it["key"] and difflib.SequenceMatcher(None, key, it["key"]).ratio() >= SIMILARITY:
            return it
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--section", help="target section; default = first dated section in the Doc")
    ap.add_argument("--threshold", type=int, default=3)
    ap.add_argument("--input", help="markdown file (default: stdin)")
    args = ap.parse_args()

    md = open(args.input, encoding="utf-8").read() if args.input else sys.stdin.read()
    secs = sections(md)
    if not secs:
        print("carryover: no dated sections found", file=sys.stderr)
        sys.exit(2)

    if args.section:
        idx = next((i for i, s in enumerate(secs)
                    if s["date"].lower().startswith(args.section.lower())), None)
        if idx is None:
            print(f"carryover: section {args.section!r} not found", file=sys.stderr)
            sys.exit(2)
    else:
        idx = 0

    target = secs[idx]
    older = secs[idx + 1:]

    # How ubiquitous is each key across the whole document?
    appearances = {}
    for sec in secs:
        for key in {i["key"] for i in sec["items"] if i["key"]}:
            appearances[key] = appearances.get(key, 0) + 1
    total_sections = len(secs) or 1

    results = []
    for item in target["items"]:
        weeks, first_seen = 1, target["date"]
        for prev in older:
            hit = matches(item["key"], prev["items"])
            if not hit:
                break  # consecutive only: a gap resets the streak
            weeks += 1
            first_seen = prev["date"]
            if hit["status"] == "DONE":
                break
        ratio = appearances.get(item["key"], 0) / total_sections
        is_template = len(item["key"]) < MIN_ITEM_CHARS or (
            total_sections >= MIN_SECTIONS_FOR_RATIO
            and ratio >= TEMPLATE_RATIO
            and item["status"] == "UNSET"
        )
        results.append({
            "text": item["raw"],
            "status": item["status"],
            "weeks": weeks,
            "first_seen": first_seen,
            "carried": weeks > 1,
            "is_template": is_template,
            "template_ratio": round(ratio, 2),
        })

    candidates = [r for r in results
                  if r["weeks"] >= args.threshold
                  and r["status"] not in ("DONE", "ABANDONED")
                  and not r["is_template"]]
    candidates.sort(key=lambda r: -r["weeks"])

    json.dump({
        "section": target["date"],
        "sections_compared": len(older),
        "threshold": args.threshold,
        "items": results,
        "agenda_candidates": candidates,
        "counts": {
            "items": len(results),
            "template_lines": sum(1 for r in results if r["is_template"]),
            "real_items": sum(1 for r in results if not r["is_template"]),
            "carried": sum(1 for r in results if r["carried"] and not r["is_template"]),
            "at_or_over_threshold": len(candidates),
        },
    }, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
