# SKB-029 — the ops-weekly Doc stops growing: archive to three weeks, and label weeks by their Monday

- **Status:** Code shipped 2026-09-15, **install owed** — the Apps Script half must be re-pasted and
  `installTriggers()` re-run by hand, and the `每週事項 封存` tab created. Nothing changes in the Doc
  until then
- **Size / DoD:** M / D2 *(no schema, no secret, no auth, no money, single repo; but it is the first
  code in this system that REMOVES content from a live shared Doc, so it carries a mock-harness proof
  and a three-part "prove it fired" assertion)*
- **Created:** 2026-09-15 · **Repo(s):** `zynkr-skill-builder`
- **Links:** `references/scaffold.md` (install + traps) · `references/doc-write-rules.md` (why the
  archive is a sibling tab) · `references/wording.md` (the two week vocabularies, the changeover) ·
  `SKB-018` (the ops loop picture, now Atlas `ops-weekly-flow`)

## Context

The owner opened the weekly operations Doc, found content from historical weeks under a current
heading, and asked whether anything cleans it up. Nothing did, and nothing was meant to: every writer
in the system is insert-only by explicit design — `scaffold.gs` says *"Insert-only: never deletes or
rewrites existing content"*, `doc-write-rules.md` says *"Never modify, reflow, or delete a line
outside a stamped block"*, and the guardrails assign deletion to *"a human act, at Thursday's
meeting"*. A grep of the whole skill for delete / prune / archive / retention returns nothing but
`deleteTrigger`. Cleanup was assigned to humans, and humans were not doing it.

Audit of the live Doc, 2026-09-15:

| | |
|---|---|
| `每週事項 2026` tab | 34 dated sections · 5,325 lines · 4,852 paragraphs · 94k chars |
| Newest section (Sep 17) | 292 lines, 22 `〔自動彙整〕` blocks — **only 4 of them that week's** |
| Section growth | 130 lines (Aug 20, last pre-skill week) → 159 → 210 → 262 → 292. ~+40/week, no ceiling |
| One week's blocks (W35) | written once, present **16 times** across the tab |
| `carryover.py` on the newest section | 74 items, 59 real, **58 at ↻3週+** — the "stuck item" signal fully saturated |

**Two independent leaks.** This is the part that decided the design: capping either one alone fixes
nothing.

1. **Sections are never retired** — the tab gains a whole section every week.
2. **Each section is a copy of a copy** — `scaffoldNextWeek()` duplicated the newest section
   *verbatim*, so every section inherited every auto-block ever written. Proven by walking the chain:
   Aug 27 held W35, Sep 3 held W35+36, Sep 10 held W35+36+37, Sep 17 held W35+36+37+38. Fixing only
   the section count would have left the surviving three sections growing forever.

Separately, the owner asked for the week label to stop being an ordinal: `W38` is a number the reader
has to stop and count, in a Doc where everything else is a date.

## What shipped

### 1. `archiveOldWeeks()` — the live tab holds three sections

Moves every dated section past the newest `KEEP_SECTIONS` (3) into the `每週事項 封存` tab. After
Thursday's run the live tab is: next Thursday (the empty skeleton Tuesday writes into), the week that
just closed, and the one before. Monday's `nudge` reads last week's decisions out of the second, so 3
is the floor.

**The archive is a sibling tab in the same Doc, and that is not a free choice.** `carryover.py`
computes `↻N週` by walking back through every dated section in document order, reading the Doc via
`get_doc_as_markdown`, which returns all tabs concatenated — it already spans the 2026 and 2025 tabs
today, comparing 46 sections. A sibling tab leaves the walk-back untouched. A separate *file* would
silently reset every streak to ≤3 and destroy the only signal Wednesday's agenda is built on. Tab
order is load-bearing for the same reason, so the archive sits directly after the live tab and
`archiveOldWeeks()` prepends as one contiguous block to keep it newest-first.

Safety, in order: copy into the archive → **assert the archive's section count rose by exactly N** →
only then remove the originals, backwards. A crash between those steps duplicates content, which is
recoverable by hand; the reverse order loses a week permanently. Post-conditions assert the live tab
holds exactly `KEEP_SECTIONS` and that the total across both tabs is unchanged.

### 2. `scaffoldNextWeek()` drops `〔自動彙整〕` blocks when it copies

A week's summary belongs to the week it summarised. The scaffold now carries forward only the human
skeleton and the owner person chips; Tuesday's `rollup` writes that week's blocks from scratch. The
skip is a small state machine — a `〔自動彙整` paragraph opens it, blank and `·` **paragraphs**
continue it, anything else (including any list item or table) ends it. Matched by prefix, never by
week, so it survived the label change in the same commit. The team's own bullets are real Docs list
items, so a human paragraph that merely starts with `·` is not swept.

### 3. One trigger, two steps

`weeklyMaintenance()` is the new entry point and calls the two in order. Apps Script fires within an
**hour window**, so two triggers an hour apart could run out of order — chaining makes the order a
fact rather than a hope. Archiving first would count sections before next Thursday exists and prune a
week too many. A throw from the scaffold propagates and skips the archive: never prune a document
whose last write is in doubt. `installTriggers()` now deletes triggers on **both** handler names, so
re-running it is the entire upgrade for an existing install.

### 4. `W38` → `WB 9/14`

The week-beginning label — the Monday that opens the week, which is also the day the team posts.
Applied to the block stamp, the Chat footer and the recap subject.

**Two vocabularies, deliberately.** The ISO key `2026-W38` stays in exactly two machine-only places:
the launchd state files (`<week>.<mode>.done`) and the receipt line's `week=` field. Both need to be
year-qualified and sortable, neither is read by a person, and `run_ops_weekly.sh` greps the receipt
for `status=ok` and nothing else — it derives its own key independently, so the label was safe to
change. `parse_reports.py` emits both, as `week` and `week_iso`.

**The changeover window.** `wording.md` froze these two strings as idempotency keys precisely because
changing them makes the loop write duplicates. So until no live section predates 2026-09-15 — three
weeks, given the archive — every idempotency search must accept **both** shapes. Matching only the new
one makes `rollup` write a second block into a section that already has one, and makes `decisions`
conclude the loop never ran and refuse to send the recap. Documented in `SKILL.md` Step 1,
`doc-write-rules.md` and `wording.md`, with a drop date.

## Proof

Apps Script cannot run locally, and this is the first code here that deletes from a live shared Doc,
so the logic was proven against a mock `DocumentApp` harness before any install: **28 assertions,
all passing** — ordering across five simulated weeks, idempotency, the missing-archive-tab throw
leaving the live tab untouched, human content surviving the block-skip, and the strict-descent
property the carry-over walk-back depends on. The harness is scratch, not committed: this repo has no
test infra and a bespoke mock runner would be the only one in it.

Verified by hand in the same pass: `node --check` on `scaffold.gs`, `py_compile` on all scripts,
`bash -n` on `run_ops_weekly.sh`, `json.load` on `config.example.json`, and `week_beginning()` across
the Monday and year boundaries (`2026-01-04` Sun → `WB 12/29`; `2026-09-20` Sun → `WB 9/14`;
`2026-09-21` Mon → `WB 9/21`).

## Install — owed, and deliberately not done from here

Nothing in the Doc changes until a human does these, in this order:

1. Create a top-level tab titled exactly `每週事項 封存`, **directly after** `每週事項 2026`. No API
   can create a Docs tab from Apps Script, so the script fails loud rather than inventing somewhere
   to put a year of work.
2. Paste the new `scripts/scaffold.gs`, point `DOC_ID` at a **duplicate**, leave `DRY_RUN = true`,
   run `weeklyMaintenance()`, read the log.
3. `DRY_RUN = false` on the duplicate. Check the chips survived, the new section carries **no**
   `〔自動彙整〕` block, the live tab holds 3, and the archived sections arrived newest-first.
4. Point `DOC_ID` at the real Doc and run `installTriggers()` once.

**The first real run moves 32 sections** — 34 live today, the scaffold adds next Thursday (35), 3
stay. By far the largest edit this script will ever make, and the one most worth rehearsing. Every
later run moves exactly one.

It does **not** retro-clean the blocks already stacked inside the three surviving sections; the
scaffold only drops blocks from what it copies forward. Those clear naturally — the newest section is
rebuilt clean next Thursday, the two behind it are archived within three weeks. Wanting them gone
sooner is a manual edit at a Thursday meeting, which is where deleting auto-content has always
belonged.

## Prove it fired

Monday's `nudge` gains a three-part assertion, replacing the single scaffold check:

| Check | Fails when | Why separate |
|---|---|---|
| A section for the upcoming Thursday exists | the scaffold did not run | `rollup` has nowhere to write |
| The live tab holds exactly 3 dated sections | the archive did not run, or threw | >3 means the Doc is growing again; **<3** is louder — the scaffold needs two sections to infer a section's range, so it breaks next week |
| That section holds **no** `〔自動彙整〕` block | the trigger is running an old `scaffold.gs` | The quiet killer: everything still works, the Doc just silently regrows. Nothing else catches it |

## Deliberately not done

- **No retention inside the skill half.** Archiving stays with Apps Script for the same reason
  scaffolding does: mechanical, must not fail, authorisation that does not expire. A new guardrail
  says the skill never writes to the archive tab and reports an over-long live tab as a finding
  rather than fixing it in-run.
- **No auto-promotion or deletion of human lines.** The 58 items at ↻3週+ are a meeting decision,
  not a mechanism. Wednesday's agenda already surfaces the top five.
- **No committed test harness.** See Proof.
