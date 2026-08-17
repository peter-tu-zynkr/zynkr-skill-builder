#!/usr/bin/env python3
"""extract_newest_block.py — pull the newest N weekly blocks out of the 營運每週彙報 markdown dump.

Input: a markdown file produced by `get_doc_as_markdown` on the weekly ops log
(newest week on TOP). Weekly blocks start with a level-2 date heading such as
`## Aug 13, 2026`. A block ends at the next date heading OR at any level-1
heading (`# ...`, i.e. the next tab of the doc). Non-date `##` lines inside a
block (e.g. `## **Claude Code 課程**`) are treated as sections, not boundaries.

Default output: the newest N blocks verbatim (nothing stripped).
--json: [{date_iso, heading, line_start, line_end, body, sections:[{heading, level, text, owners}]}]
"Metrics" pseudo-heading lines (a line that is just `Metrics` / `Metrics:`) become level-5 sections.

Python 3 stdlib only.
"""
import argparse
import json
import re
import sys

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}
# `## Aug 13, 2026`   `## Thu Aug 13, 2026`   `## Thu, Aug 13, 2026`   `## August 13, 2026`
DATE_HEADING = re.compile(
    r"^##\s+(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+)?([A-Z][a-z]{2,8})\.?\s+(\d{1,2}),\s*(\d{4})\s*$"
)
H1 = re.compile(r"^#\s+\S")
ANY_HEADING = re.compile(r"^(#{2,6})\s+(.*\S)\s*$")
METRICS_LINE = re.compile(r"^\s*\**Metrics\**:?\s*$")
MD_LINK = re.compile(r"\[([^\]]*)\]\(([^)]*)\)")
MAILTO_LINK = re.compile(r"\[([^\]]+)\]\(mailto:[^)]*\)")


def parse_date_heading(line):
    m = DATE_HEADING.match(line)
    if not m:
        return None
    mon = MONTHS.get(m.group(1).lower()[:4]) or MONTHS.get(m.group(1).lower()[:3])
    if not mon:
        return None
    day, year = int(m.group(2)), int(m.group(3))
    if not (1 <= day <= 31):
        return None
    return f"{year:04d}-{mon:02d}-{day:02d}"


def clean_heading(text):
    """Strip markdown links (keep link text), bold markers and stray whitespace."""
    text = MD_LINK.sub(lambda m: m.group(1), text)
    text = text.replace("**", "").replace("~~", "")
    return re.sub(r"\s+", " ", text).strip()


def owners_in(text):
    return [m.group(1).strip() for m in MAILTO_LINK.finditer(text)]


def split_blocks(lines):
    """Return list of (date_iso, heading_line, start_idx, end_idx_exclusive) in file order."""
    starts = []
    for i, line in enumerate(lines):
        d = parse_date_heading(line)
        if d:
            starts.append((i, d))
    blocks = []
    for n, (start, d) in enumerate(starts):
        end = starts[n + 1][0] if n + 1 < len(starts) else len(lines)
        # a level-1 heading (next tab) also terminates the block
        for j in range(start + 1, end):
            if H1.match(lines[j]):
                end = j
                break
        blocks.append((d, lines[start].rstrip("\n"), start, end))
    return blocks


def sectionise(body_lines):
    sections = []
    cur = None

    def flush():
        if cur is not None:
            cur["text"] = "\n".join(cur["_lines"]).strip("\n")
            del cur["_lines"]
            sections.append(cur)

    for line in body_lines:
        h = ANY_HEADING.match(line)
        if h:
            flush()
            cur = {"heading": clean_heading(h.group(2)), "level": len(h.group(1)),
                   "owners": owners_in(h.group(2)), "_lines": []}
            continue
        if METRICS_LINE.match(line):
            flush()
            cur = {"heading": "Metrics", "level": 5, "owners": [], "_lines": []}
            continue
        if cur is None:
            if not line.strip():
                continue
            cur = {"heading": "", "level": 0, "owners": [], "_lines": []}
        cur["_lines"].append(line.rstrip("\n"))
    flush()
    return sections


def extract(text, n=1):
    # split on "\n" only (not str.splitlines) so line numbers match grep/sed/awk
    lines = [ln.rstrip("\r") for ln in text.split("\n")]
    blocks = split_blocks(lines)
    out = []
    for d, heading, start, end in blocks[:max(n, 0)]:
        body_lines = lines[start + 1:end]
        out.append({
            "date_iso": d,
            "heading": heading,
            "line_start": start + 1,
            "line_end": end,
            "body": "\n".join(body_lines).strip("\n"),
            "sections": sectionise(body_lines),
        })
    return out, len(blocks)


SAMPLE = """# 每週事項 2026

# Meeting Note

## Aug 13, 2026

### #Team update

- Start of week update, what is the focus of the week

### #Demand Marketing ([Website](https://example.com/))([Brand guide](https://example.com/bg)) [Mark T](mailto:mark@example.com)

#### ##Branding [Mark T](mailto:mark@example.com)

- Zynkr website newsletter drip

#### ##Establish SOP

- Run data report
Metrics

- Monthly Impression #
- CPM, CPC, CTR, Conversion rate, ROAS

### #Operation [Jane L](mailto:jane@example.com)

#### ##Operation BAU & event

- 8/19(三) Vibe coding   報名人數25人
Metrics

- Sign up #

### # [Knowledge product (Course design＋Deliver)](https://example.com/kp) [Peggy L](mailto:peggy@example.com)

## **Claude Code 課程**

Current progress

- [ ] 課程剪輯
Metrics

- Course preparation %

## Aug 6, 2026

### #Team update

- older item

### #Operation [Jane L](mailto:jane@example.com)

- 8/15(六) 直播 報名人數72人
Metrics

- Sign up #

## Jul 30, 2026

### #Team update

- oldest

# 每週事項 2025

# Notes

## Dec 25, 2025

### #Overall

- should not leak into Jul 30 block
"""


def selftest():
    blocks, total = extract(SAMPLE, n=10)
    assert total == 4, total
    assert [b["date_iso"] for b in blocks] == ["2026-08-13", "2026-08-06", "2026-07-30", "2025-12-25"], blocks
    newest = blocks[0]
    assert newest["heading"] == "## Aug 13, 2026"
    heads = [(s["level"], s["heading"]) for s in newest["sections"]]
    assert (3, "#Team update") in heads, heads
    assert (2, "Claude Code 課程") in heads, heads  # non-date ## is a section, not a boundary
    assert sum(1 for l, h in heads if h == "Metrics" and l == 5) == 3, heads
    dm = next(s for s in newest["sections"] if s["heading"].startswith("#Demand Marketing"))
    assert dm["heading"] == "#Demand Marketing (Website)(Brand guide) Mark T", dm["heading"]
    assert dm["owners"] == ["Mark T"], dm
    ops = next(s for s in newest["sections"] if s["heading"].startswith("##Operation BAU"))
    assert ops["level"] == 4 and "報名人數25人" in ops["text"], ops
    # Jul 30 block must stop at the `# 每週事項 2025` H1, not swallow Dec 25
    jul30 = blocks[2]
    assert "should not leak" not in jul30["body"] and jul30["body"].strip().endswith("- oldest"), jul30["body"]
    # default N=1 verbatim
    one, _ = extract(SAMPLE, n=1)
    assert len(one) == 1 and one[0]["date_iso"] == "2026-08-13"
    assert one[0]["line_start"] == 5
    # heading variants
    assert parse_date_heading("## Thu Aug 13, 2026") == "2026-08-13"
    assert parse_date_heading("## Thu, Aug 13, 2026") == "2026-08-13"
    assert parse_date_heading("## August 13, 2026") == "2026-08-13"
    assert parse_date_heading("## Sept 5, 2026") == "2026-09-05"
    assert parse_date_heading("## **Claude Code 課程**") is None
    assert parse_date_heading("### Aug 13, 2026") is None
    print("extract_newest_block selftest OK")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", nargs="?", help="markdown dump of the weekly ops log (newest week on top)")
    ap.add_argument("--blocks", type=int, default=1, help="how many newest blocks to emit (default 1)")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of verbatim markdown")
    ap.add_argument("--selftest", action="store_true", help="run embedded sample and exit 0/1")
    args = ap.parse_args(argv)
    if args.selftest:
        try:
            return selftest()
        except AssertionError as e:
            print(f"SELFTEST FAILED: {e!r}", file=sys.stderr)
            return 1
    if not args.path:
        ap.error("path is required (or use --selftest)")
    with open(args.path, encoding="utf-8") as fh:
        text = fh.read()
    blocks, total = extract(text, n=args.blocks)
    if not blocks:
        print("no `## <Mon DD, YYYY>` date heading found", file=sys.stderr)
        return 1
    if args.json:
        json.dump(blocks, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        for b in blocks:
            print(b["heading"])
            print()
            print(b["body"])
            print()
    print(f"[extract_newest_block] {len(blocks)}/{total} blocks emitted; newest={blocks[0]['date_iso']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
