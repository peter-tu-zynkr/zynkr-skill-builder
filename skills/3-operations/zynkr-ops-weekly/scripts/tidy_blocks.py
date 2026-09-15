"""Decide which 〔自動彙整〕 blocks to keep, archive and compact — for the Friday `tidy` beat.

WHY THIS EXISTS
    The Apps Script scaffold copies the newest week section forward **verbatim** every Thursday
    at 23:00. The auto blocks travel with it, and `rollup` only ever prepends — so by the time
    anyone looks, one department heading carries four stacked blocks reporting four different
    weeks. On 2026-09-15 the live `Sep 17, 2026` section held **22 blocks in 7 groups**.

    That is the growth engine of the whole Doc, and the thing the owner's 08-27 comment was about.
    This script is the judgement half of the fix: it reads the section and says what should
    happen. It writes nothing. The skill does the Doc writes (SKILL.md Step 4.6).

WHAT IT IS SAFE TO DELETE, AND WHY
    Every block this script marks for archiving is a **copy** the Thursday scaffold made of a
    block that still sits in the previous week's section — which is frozen and never edited
    again. So removing it from the live section destroys nothing. That property is what makes
    this operation fundamentally different from moving whole week sections around, which was
    built and reverted the same day (SKB-029). Do not lose it: if the scaffold ever stops
    copying forward, re-derive the safety argument before trusting this script.

    It also never looks at a line outside a stamped block. The department heading above and the
    human bullets below are out of range by construction, so the person chips that drive routing
    are never touched.

Usage:
    python3 tidy_blocks.py --input doc.md            # JSON for the skill
    python3 tidy_blocks.py --input doc.md --report   # human-readable rehearsal
"""
import argparse
import json
import re
import sys
from datetime import date

# A week section heading: "Sep 17, 2026". Matched at any heading level ON PURPOSE — only 23 of
# the 34 headings in the live Doc are real HEADING2; the older ones are styled otherwise and a
# level-locked regex silently skips eleven weeks of history.
SECTION_RE = re.compile(r"^#{1,6}\s*([A-Z][a-z]{2}\s+\d{1,2},\s*\d{4})\s*$")
HEADING_RE = re.compile(r"^#{1,6}\s+\S")

# The stamp is a frozen string (references/wording.md). Both shapes must be accepted until no
# live section predates 2026-09-15: `2026-W38` (legacy ISO) and `WB 9/14` (week beginning).
STAMP_RE = re.compile(r"〔自動彙整\s*(.+?)\s*·\s*([^〕]*)〕")
ISO_WEEK_RE = re.compile(r"^(\d{4})-W(\d{1,2})$")
WB_RE = re.compile(r"^WB\s*(\d{1,2})/(\d{1,2})$")

# Status words the team actually writes, harvested from the live Doc rather than invented.
# `Done` is here because an earlier pass that only looked for 完成 over-counted open items by 8.
DONE_RE = re.compile(r"(完成|已完成|\bDone\b|✅|結案)", re.IGNORECASE)
STATUS_RE = re.compile(
    r"\s*(完成|已完成|\bDone\b|WIP|進行中|卡住|沒寫狀態|狀態未填|還沒開始|"
    r"\bNot started\b|\bstarted\b|放棄|\babandoned\b)\s*$",
    re.IGNORECASE,
)

# Items that carry no work. Same class as the template rows carryover.py filters (`Funnel`,
# `CTR`): promoting them would let boilerplate dominate the carried list.
NOISE = {"例行性", "例行", "其他", "n/a", "-", "—", "無"}

# The team separates items with a fullwidth `／`. An ASCII `/` only counts when it is spaced,
# because the unspaced kind is almost always inside a URL: an earlier `／|/` split tore
# `https://example.com/a/b/c` into four items and left `https:` looking like a status word.
ITEM_SPLIT_RE = re.compile(r"／|(?<=\s)/(?=\s)")

# Shortest item worth carrying. Two, not four: `發文` and `對帳` are real work items, and a
# Latin-tuned floor silently drops every short Chinese one. Junk is handled by NOISE instead.
MIN_ITEM_LEN = 2


def week_key(label, stamp, today=None):
    """Sortable key for either week shape, so a group can be ordered without trusting write order.

    `WB 9/14` carries no year. It is resolved against the stamp's `MM-DD` when that is present,
    otherwise today — which is correct for every live section and only ever wrong for a section
    written more than a year ago, by which time it is long archived.
    """
    m = ISO_WEEK_RE.match(label)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    m = WB_RE.match(label)
    if m:
        today = today or date.today()
        month, day = int(m.group(1)), int(m.group(2))
        year = today.year
        # A December label read in January belongs to the year before.
        if month == 12 and today.month == 1:
            year -= 1
        try:
            iso = date(year, month, day).isocalendar()
            return (iso[0], iso[1])
        except ValueError:
            return (0, 0)
    return (0, 0)


def strip_status(item):
    """`每週發文 完成` → `每週發文`. Without this, the same item reads as two different ones."""
    return STATUS_RE.sub("", item).strip()


def normalise(text):
    """Comparison key. Digits go so `90%` → `92%` stays one item, matching carryover.py."""
    text = re.sub(r"\(https?://[^)]*\)", "", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    return re.sub(r"[\s\d%（）()【】\[\]·・、，,.。]+", "", text).lower()


def split_items(line):
    """`· 本週 — a ／ b ／ c` → ['a', 'b', 'c']."""
    if "—" not in line:
        return []
    return [x.strip() for x in ITEM_SPLIT_RE.split(line.split("—", 1)[1]) if x.strip()]


def sections(lines):
    """[(start_index, label)] for every dated week heading, in document order."""
    return [(i, m.group(1)) for i, line in enumerate(lines)
            if (m := SECTION_RE.match(line.strip()))]


def find_groups(sec):
    """Contiguous runs of auto blocks. A heading between two blocks starts a new group."""
    starts = [i for i, line in enumerate(sec) if "〔自動彙整" in line]
    if not starts:
        return []
    groups, current = [], [starts[0]]
    for a, b in zip(starts, starts[1:]):
        if any(HEADING_RE.match(sec[k].strip()) for k in range(a + 1, b)):
            groups.append(current)
            current = [b]
        else:
            current.append(b)
    groups.append(current)
    return groups


def block_extent(sec, start):
    """A block runs from its stamp to the last `·` line before the next block, heading or human line.

    The `·` test is what keeps human content out of range: in the live Doc the auto lines all
    begin `·` and a human's bullets begin `-`, so the first `-` ends the block.
    """
    end = start
    k = start + 1
    while k < len(sec):
        s = sec[k].strip()
        if "〔自動彙整" in s or HEADING_RE.match(s):
            break
        if s.startswith("·"):
            end = k
        elif s:
            break
        k += 1
    return end


def owner_of(sec, index):
    """Nearest heading above the group — the department the blocks belong to."""
    for k in range(index, -1, -1):
        s = sec[k].strip()
        if HEADING_RE.match(s):
            return re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s.lstrip("#").strip())
    return "(section top)"


def analyse(lines, target=None, today=None):
    marks = sections(lines)
    if not marks:
        raise SystemExit("tidy: no dated week section found — is this the right tab?")
    if target:
        hit = [(i, lab) for i, lab in marks if lab == target]
        if not hit:
            raise SystemExit(f"tidy: section {target!r} not in the Doc")
        start, label = hit[0]
    else:
        start, label = marks[0]
    nxt = next((i for i, _ in marks if i > start), len(lines))
    sec = lines[start:nxt]

    out = []
    for group in find_groups(sec):
        blocks = []
        for s in group:
            stamp = STAMP_RE.search(sec[s])
            wk = stamp.group(1) if stamp else "?"
            blocks.append({
                "week": wk,
                "stamp": stamp.group(2) if stamp else "",
                "first": s,
                "last": block_extent(sec, s),
                "key": (week_key(wk, stamp.group(2) if stamp else "", today),
                        stamp.group(2) if stamp else ""),
            })
        # Do not trust write order. `rollup` prepends, so newest is normally first — but a
        # hand-edit or a re-run can break that, and picking the wrong block to keep would
        # archive the current week and leave a stale one in its place.
        blocks.sort(key=lambda b: b["key"], reverse=True)
        keep, archive = blocks[0], blocks[1:]

        closed, live = set(), set()
        for b in blocks:
            for k in range(b["first"], b["last"] + 1):
                s = sec[k].strip()
                if s.startswith("· 上週") or s.startswith("·上週"):
                    for item in split_items(s):
                        if DONE_RE.search(item):
                            closed.add(normalise(strip_status(item)))
        for k in range(keep["first"], keep["last"] + 1):
            for item in split_items(sec[k].strip()):
                live.add(normalise(strip_status(item)))

        carried, seen = [], set()
        for b in archive:
            for k in range(b["first"], b["last"] + 1):
                s = sec[k].strip()
                if not (s.startswith("· 本週") or s.startswith("·本週")):
                    continue
                for item in split_items(s):
                    text = strip_status(item)
                    key = normalise(text)
                    # `live` covers the WHOLE kept block, 上週 included. An item still printed
                    # there has not disappeared, so repeating it in the carried list is noise —
                    # the list exists to rescue what archiving would otherwise erase.
                    if (not key or len(key) < MIN_ITEM_LEN or key in closed or key in live
                            or key in seen or text in NOISE):
                        continue
                    seen.add(key)
                    carried.append({"text": text, "since": b["week"]})

        out.append({
            "owner": owner_of(sec, group[0]),
            "keep": {"week": keep["week"], "stamp": keep["stamp"],
                     "lines": sec[keep["first"]:keep["last"] + 1]},
            "archive": [{"week": b["week"], "stamp": b["stamp"],
                         "lines": sec[b["first"]:b["last"] + 1]} for b in archive],
            "carry": carried,
        })
    return {"section": label, "groups": out,
            "totals": {
                "blocks": sum(1 + len(g["archive"]) for g in out),
                "keep": len(out),
                "archive": sum(len(g["archive"]) for g in out),
                "carry": sum(len(g["carry"]) for g in out),
            }}


def report(res):
    t = res["totals"]
    print(f"SECTION {res['section']}\n")
    for g in res["groups"]:
        weeks = [b["week"] for b in g["archive"]] or ["—"]
        print(f"{g['owner'][:56]:<56} keep {g['keep']['week']}  archive {', '.join(weeks)}")
        for c in g["carry"]:
            print(f"      · {c['text'][:60]}  〔{c['since']} 起〕")
    print("\n" + "=" * 74)
    print(f"blocks {t['blocks']} → {t['keep']} kept, {t['archive']} archived"
          f" | open items carried: {t['carry']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input", help="markdown file (default: stdin)")
    ap.add_argument("--section", help="target section label; default = newest dated section")
    ap.add_argument("--report", action="store_true", help="human-readable instead of JSON")
    args = ap.parse_args()

    raw = open(args.input, encoding="utf-8").read() if args.input else sys.stdin.read()
    res = analyse(raw.split("\n"), args.section)
    if args.report:
        report(res)
    else:
        json.dump(res, sys.stdout, ensure_ascii=False, indent=2)
        print()


if __name__ == "__main__":
    main()
