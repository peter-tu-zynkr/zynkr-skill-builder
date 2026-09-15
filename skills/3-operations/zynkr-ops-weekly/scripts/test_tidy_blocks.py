"""Tests for tidy_blocks.py. Run: python3 test_tidy_blocks.py

WHY THESE ARE ADVERSARIAL
    SKB-029 shipped with 28 green assertions and still threw on its first live run, because the
    mock `Body` let `removeChild` take any element — it tested the happy path instead of the
    constraint that actually existed. A mock that cannot fail proves nothing.

    So every test here is written against the thing that would go WRONG, not the thing that
    should go right: a human line pulled into a block, a heading that fails to split a group,
    blocks arriving out of order, a done item resurrected, an item carried twice. Each one is
    checked to fail when the relevant line of tidy_blocks.py is broken — see MUTATIONS at the
    bottom, which is a runnable proof, not a comment.
"""
import re
import subprocess
import sys
from pathlib import Path

import tidy_blocks as T

HERE = Path(__file__).resolve().parent
FAILURES = []


def check(name, got, want):
    if got != want:
        FAILURES.append(f"{name}\n      got:  {got!r}\n      want: {want!r}")


def analyse(md, today=None):
    return T.analyse(md.split("\n"), today=today)


# ── 1. a human's lines must never be pulled into a block ─────────────────────
# The live Doc puts auto `·` lines directly under the heading and the owner's own `-` bullets
# below them. Over-reaching by one line here means the tidy deletes someone's work.
HUMAN = """\
## Sep 24, 2026

### #Content [Sam Rivera](mailto:owner-a@example.com)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲 ／ 乙

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 丙

- Update content matrix
- SEO planning
"""
r = analyse(HUMAN)
g = r["groups"][0]
check("human bullets stay out of the kept block",
      [l for l in g["keep"]["lines"] if l.strip().startswith("-")], [])
check("human bullets stay out of archived blocks",
      [l for b in g["archive"] for l in b["lines"] if l.strip().startswith("-")], [])
check("archived block stops before the human bullets",
      [l.strip() for l in g["archive"][0]["lines"] if l.strip()],
      ["〔自動彙整 WB 9/14 · 09-15 09:00〕", "· 本週 — 丙"])

# ── 2. a heading between two blocks must split the group ─────────────────────
# Without the split, two departments' blocks merge and one department's current block gets
# archived as if it were an older copy of the other's.
TWO_DEPTS = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲

### #B [b](mailto:b@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 乙
"""
r = analyse(TWO_DEPTS)
check("a heading splits groups", len(r["groups"]), 2)
check("group 1 owner", r["groups"][0]["owner"], "#A a")
check("group 2 owner", r["groups"][1]["owner"], "#B b")
check("neither group archives anything", r["totals"]["archive"], 0)

# ── 3. write order must not be trusted ───────────────────────────────────────
# `rollup` prepends, so newest is normally first. A hand-edit or a re-run can reverse that, and
# keeping blocks[0] blindly would archive the CURRENT week and leave a stale block in its place.
OUT_OF_ORDER = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/7 · 09-08 09:00〕

· 本週 — 舊

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 新
"""
r = analyse(OUT_OF_ORDER, today=T.date(2026, 9, 25))
check("keeps the newest even when written last", r["groups"][0]["keep"]["week"], "WB 9/21")
check("archives the older one", [b["week"] for b in r["groups"][0]["archive"]], ["WB 9/7"])

# ── 4. both week shapes must order correctly during the changeover ───────────
# Sections written before 2026-09-15 carry `2026-W38`; after, `WB 9/14`. Both are live at once,
# and an ordering that mishandles either picks the wrong block to keep.
check("ISO week key", T.week_key("2026-W38", "09-15"), (2026, 38))
check("WB key equals the ISO week of that Monday",
      T.week_key("WB 9/14", "09-15", today=T.date(2026, 9, 15)), (2026, 38))
check("WB and ISO for the same week compare equal",
      T.week_key("WB 9/14", "09-15", today=T.date(2026, 9, 15)) == T.week_key("2026-W38", ""),
      True)
check("a later WB sorts above an earlier ISO",
      T.week_key("WB 9/21", "09-22", today=T.date(2026, 9, 22)) > T.week_key("2026-W38", ""),
      True)

MIXED = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 2026-W38 · 09-15 09:00〕

· 本週 — 舊

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 新
"""
r = analyse(MIXED, today=T.date(2026, 9, 25))
check("mixed shapes keep the newer WB block", r["groups"][0]["keep"]["week"], "WB 9/21")

# ── 5. a done item must never be carried ─────────────────────────────────────
# An earlier pass matched only 完成 and missed the English `Done`, over-counting open items by 8.
DONE = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 上週 — 甲乙 完成 ／ 丙丁 Done

· 本週 — 戊己

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 甲乙 ／ 丙丁 ／ 庚辛
"""
r = analyse(DONE, today=T.date(2026, 9, 25))
carried = [c["text"] for c in r["groups"][0]["carry"]]
check("完成 item not carried", "甲乙" in carried, False)
check("English Done item not carried", "丙丁" in carried, False)
check("an item nobody closed IS carried", carried, ["庚辛"])
check("the carried item records where it came from",
      r["groups"][0]["carry"][0]["since"], "WB 9/14")

# ── 6. an item already visible in the kept block is not carried twice ────────
# The carried list exists to rescue items that would DISAPPEAR when their block is archived.
# An item still printed in the kept block has not disappeared, so repeating it is just noise.
ALREADY = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 上週 — 甲甲 進行中

· 本週 — 乙乙

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 甲甲 ／ 丙丙
"""
r = analyse(ALREADY, today=T.date(2026, 9, 25))
check("item visible in the kept block's 上週 is not carried",
      [c["text"] for c in r["groups"][0]["carry"]], ["丙丙"])

# A two-character Chinese item is real work and must survive the length floor.
SHORT = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲甲

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 發文 ／ 對帳
"""
r = analyse(SHORT, today=T.date(2026, 9, 25))
check("short Chinese items are not dropped by the length floor",
      [c["text"] for c in r["groups"][0]["carry"]], ["發文", "對帳"])

# ── 7. the trailing status word must not make one item look like two ─────────
check("status stripped from the tail", T.strip_status("每週發文 完成"), "每週發文")
check("status stripped, English", T.strip_status("outreach Done"), "outreach")
check("a bare item is untouched", T.strip_status("每週發文"), "每週發文")
check("status word inside the text is kept",
      T.strip_status("完成 PM skills"), "完成 PM skills")

# ── 8. boilerplate must not dominate the carried list ────────────────────────
NOISY = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 例行性 ／ 無 ／ — ／ 真的要做的事
"""
r = analyse(NOISY, today=T.date(2026, 9, 25))
check("noise filtered, real item kept",
      [c["text"] for c in r["groups"][0]["carry"]], ["真的要做的事"])

# ── 9. a URL's slashes must not split one item into several ──────────────────
URL = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 看 [板子](https://example.com/a/b/c) 這件事
"""
r = analyse(URL, today=T.date(2026, 9, 25))
check("a URL is not an item separator", len(r["groups"][0]["carry"]), 1)

# ── 10. degenerate inputs must not crash or invent work ──────────────────────
ONE_BLOCK = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 甲
"""
r = analyse(ONE_BLOCK, today=T.date(2026, 9, 25))
check("a lone block archives nothing", r["totals"]["archive"], 0)
check("a lone block carries nothing", r["totals"]["carry"], 0)

NO_BLOCKS = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

- just a human bullet
"""
r = analyse(NO_BLOCKS)
check("a section with no blocks yields no groups", r["groups"], [])
check("a section with no blocks is a no-op", r["totals"]["blocks"], 0)

# ── 11. the newest section is the target, not the first one that parses ──────
TWO_SECTIONS = """\
## Sep 24, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/21 · 09-22 09:00〕

· 本週 — 新

## Sep 17, 2026

### #A [a](mailto:a@z.ai)

〔自動彙整 WB 9/14 · 09-15 09:00〕

· 本週 — 舊
"""
r = analyse(TWO_SECTIONS, today=T.date(2026, 9, 25))
check("targets the newest section", r["section"], "Sep 24, 2026")
check("does not reach into the previous section", r["totals"]["blocks"], 1)

# ── 12. headings that are not real HEADING2 still count as week sections ─────
# Only 23 of the live Doc's 34 week headings are real HEADING2; a level-locked regex skips 11.
check("h3 week heading is still a section",
      bool(T.SECTION_RE.match("### Sep 17, 2026")), True)
check("h4 week heading is still a section",
      bool(T.SECTION_RE.match("#### Apr 9, 2026")), True)


# ── MUTATIONS: prove the tests above can actually go red ─────────────────────
# This is the part SKB-029 did not have. Each mutation breaks one real line of tidy_blocks.py;
# if the suite still passes, the corresponding test is decorative and must be rewritten.
MUTATIONS = [
    ("block extent ignores the human-line boundary",
     'elif s:\n            break', 'elif s:\n            pass'),
    ("groups never split on a heading",
     'if any(HEADING_RE.match(sec[k].strip()) for k in range(a + 1, b)):',
     'if False:'),
    ("keep blindly trusts write order",
     'blocks.sort(key=lambda b: b["key"], reverse=True)', 'pass'),
    ("done-detection loses the English Done",
     r'(完成|已完成|\bDone\b|✅|結案)', r'(完成|已完成|✅|結案)'),
    ("noise is not filtered", 'or text in NOISE', 'or False'),
]


def run_mutations():
    src = (HERE / "tidy_blocks.py").read_text(encoding="utf-8")
    print("\nMUTATION CHECK — each line below must make the suite FAIL")
    all_caught = True
    for name, find, repl in MUTATIONS:
        if find not in src:
            print(f"  ?? {name}: anchor not found — mutation list is stale")
            all_caught = False
            continue
        tmp = HERE / "_mutant_tidy_blocks.py"
        broken = HERE / "_mutant_test.py"
        tmp.write_text(src.replace(find, repl, 1), encoding="utf-8")
        broken.write_text(
            (HERE / "test_tidy_blocks.py").read_text(encoding="utf-8")
            .replace("import tidy_blocks as T", "import _mutant_tidy_blocks as T")
            .replace("run_mutations()", "pass"), encoding="utf-8")
        p = subprocess.run([sys.executable, str(broken)], capture_output=True, text=True, cwd=HERE)
        caught = p.returncode != 0
        print(f"  {'OK' if caught else 'LEAK'} {name}"
              f"{'' if caught else '  <-- tests did NOT catch this'}")
        all_caught &= caught
        tmp.unlink(missing_ok=True)
        broken.unlink(missing_ok=True)
    return all_caught


if __name__ == "__main__":
    n = len([l for l in Path(__file__).read_text(encoding="utf-8").splitlines()
             if l.startswith("check(")])
    if FAILURES:
        print(f"FAILED {len(FAILURES)} assertion(s):\n")
        for f in FAILURES:
            print("  - " + f)
        sys.exit(1)
    print(f"all assertions passed ({n} checks)")
    if "--mutate" in sys.argv:
        sys.exit(0 if run_mutations() else 1)
