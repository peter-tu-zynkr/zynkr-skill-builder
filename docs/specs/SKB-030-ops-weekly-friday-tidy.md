# SKB-030 — the Friday `tidy`: trim the stacked auto blocks instead of moving whole weeks

- **Status:** Built 2026-09-15. **Install owed** — the launchd heartbeat already fires on Fridays,
  so `tidy` becomes live the moment `doc.archive_tab_id` is set in the private config. First real
  run: **Fri 2026-09-18 09:00 Asia/Taipei**
- **Size / DoD:** M / D2 *(no schema, no secret, no auth, no money, single repo; but it deletes
  content from a live shared Doc, so it carries a mutation-proved test suite and a copy→assert→delete
  order)*
- **Created:** 2026-09-15 · **Repo(s):** `zynkr-skill-builder`
- **Links:** `SKB-029` (**read this first** — the archive design that was built and reverted the same
  day) · `references/doc-write-rules.md` (delete rules, index arithmetic) · `references/wording.md`
  (the `· 還沒收掉的 —` line) · `references/config.README.md` (why the archive tab is a sibling)

## Context

`SKB-029` tried to stop the Doc growing by moving whole **week sections** to an archive tab. It was
rolled back the same day: it had to move human-written content, it risked the owner person chips
that drive routing, and 4,465 elements took 4m08s against a 6-minute Apps Script cap.

The owner then proposed a different cut, and it is a much better one:

> only process the latest week … you will get a copy of Sep.24 on Thur night … read the Sep.24
> content, process the auto add part … Keep the latest week auto add and move the completed one to
> the archive tab + compact the remaining open items, one item one line

That reframes the target from **sections** to **blocks**. The growth engine was never the sections —
it is that the Thursday scaffold copies the newest section *verbatim* and `rollup` only ever
prepends, so the auto blocks stack forever. Measured on the live `Sep 17, 2026` section:
**22 blocks in 7 groups**, four deep under some departments, spanning W35–W38.

## Why this one is safe where SKB-029 was not

Three properties, none of which the section-move had:

1. **It only touches `〔自動彙整〕` blocks — this skill's own output.** In the live Doc the auto `·`
   lines sit directly under the department heading and the owner's `-` bullets sit below them, so
   the block extent is bounded by construction. The "never edit a human's line" guardrail holds.
2. **No person chip is ever in range.** Chips live on the department headings, which do not move.
   The chips-can-be-copied-but-never-created problem simply does not apply.
3. **The delete is non-destructive.** Every block `tidy` removes is a *copy* the Thursday scaffold
   made of a block that still sits in the previous week's section, which is frozen. Even total
   failure loses nothing. **If the scaffold ever stops copying forward, this argument dies** — it is
   recorded in `SKILL.md` §4.6 and in the script docstring for exactly that reason.

And it is small: ~5k characters in one section via the Docs API, not 4,465 elements via Apps Script.
Neither the 6-minute cap nor `Can't remove the last paragraph in a document section.` is in play —
every one of the 7 groups is followed by a heading, which was checked rather than assumed.

## What shipped

### 1. `scripts/tidy_blocks.py` — the judgement half, writes nothing

Reads the Doc markdown, finds contiguous runs of auto blocks, and per group returns the block to
`keep`, the blocks to `archive`, and the still-open items to `carry`. Decisions worth recording:

- **Keep the newest block that exists, not the current week's.** Two departments (Demand Marketing,
  Tech product) last reported in W37. Blanking them would remove the visible signal that they are
  behind. Ruled by the owner: *"it's the newest block"*.
- **Do not trust write order.** `rollup` prepends so newest is normally first, but a hand-edit or a
  re-run reverses it, and keeping `blocks[0]` blindly would archive the current week. Blocks are
  sorted by parsed week, handling **both** `2026-W38` and `WB 9/14` shapes, which coexist during the
  changeover.
- **An item still visible in the kept block is not carried.** The carried list exists to rescue what
  archiving would *erase*; repeating something still printed two lines above is noise.
- **Idempotent by construction.** Once a group holds one block there is nothing to archive, so a
  second run is a no-op and retries are safe. No marker string needed.

### 2. The Friday beat

`run_ops_weekly.sh` gains `("tidy", 5, "09:00", "20:00", None)` and a Doc-only tool allowlist — it
is the one beat that touches neither Chat nor mail. Friday because it is the first morning **after**
the Thursday 23:00 scaffold: the duplicates exist and nobody has read them yet. Tuesday would leave
the section fat across the whole weekend and the Monday nudge.

**Bonus, not designed for:** `tidy` asserts the target Thursday is ≥ today. On a Friday that is only
true if the scaffold fired, so a failed scaffold now surfaces on **Friday** instead of Monday —
three days before `rollup` needs the section.

### 3. Archive tab as a sibling, and only a sibling

`doc.archive_tab_id` must be a tab in the *same* Doc. `carryover.py` reads all tabs as one stream to
compute `↻N週`; a separate file resets every streak and blinds the Wednesday agenda. Verified by
simulating 3 live + 31 archived sections: 46 compared, **0 streaks changed**. This is the one design
constraint carried forward intact from `SKB-029`.

## Proof

Rehearsed against the live `Sep 17, 2026` section (cached markdown, read-only):

| | |
|---|---|
| auto blocks | **22 → 7** (15 archived) |
| block text | 4,896 → 2,805 chars (**43% smaller**) |
| still-open items carried | **28**, one line each |
| human lines touched | **0** |

`test_tidy_blocks.py`: **34 assertions, zero dependencies.** Two real bugs were caught by writing
them, both silent-data-loss class:

- a `len < 4` floor that would have dropped short Chinese items (`發文`, `對帳`)
- an item splitter that tore `https://example.com/a/b/c` into four items and left `https:` looking
  like a status word

### The mutation check — the part SKB-029 did not have

`SKB-029` shipped with 28 green assertions and still threw on its first live run, because its mock
`Body` let `removeChild` take any element: **a mock that cannot fail proves nothing.** So
`python3 test_tidy_blocks.py --mutate` breaks five real lines of `tidy_blocks.py` in turn and
requires the suite to go red for each. All five are caught. A test that survives its mutation is
decorative and must be rewritten, and the list is runnable rather than a comment.

## Prove it fired

1. Receipt line `mode=tidy … status=ok delivered=<n>-archived;<n>-kept;<n>-carried` — the runner
   stamps the week done only on `status=ok`.
2. The section re-read after writing: exactly one stamp per group, human lines below each block
   unchanged, archived text present in the 封存 tab.
3. Scaffold assertion: on a Friday the target Thursday must be ≥ today, else `status=failed
   delivered=none;scaffold-did-not-fire`.

## Install — owed

1. Add `doc.archive_tab_id` / `doc.archive_tab_name` to `~/.config/zynkr/ops-weekly.json` (private,
   never committed) and the `tidy` trigger row. Unset → `tidy` fails loud rather than deleting
   blocks it cannot archive.
2. No launchd change: the heartbeat already fires every hour, and the runner resolves the beat.
3. First run Fri 2026-09-18. Watch it once, then leave it.

## Deliberately not done

- **The 46 historical sections are not touched.** They are frozen, so they no longer grow, but
  nothing shrinks them. Trimming that backlog is a human cut-and-paste — one gesture, perfect
  fidelity, no code — and `SKB-029` is the record of why automating it is not worth it.
- **No promotion of carried items into human lines.** Promotion stays a human act at Thursday's
  meeting, unchanged.
- **No status-vocabulary enforcement.** The team writes `完成`/`Done`/`WIP`/`進行中`/`卡住`/
  `沒寫狀態`/`狀態未填`. `tidy` reads the first two as closed and everything else as open, so an
  item finished but never marked stays on the list. Dropping it would be silent data loss; tightening
  the vocabulary belongs in `post-format.md`, not here.
