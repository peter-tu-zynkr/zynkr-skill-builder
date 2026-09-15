# The Apps Script half

`scripts/scaffold.gs` runs **Thu 23:00**, after `decisions` (22:00) has closed the week out.
Its entry point is `weeklyMaintenance()`, which does two things in this order:

1. **`scaffoldNextWeek()`** — duplicates the newest week section and re-stamps it with the next
   Thursday, **dropping the previous weeks' `〔自動彙整〕` blocks as it copies**.
2. **`archiveOldWeeks()`** — moves every dated section past the newest `KEEP_SECTIONS` (3) out
   of the live tab and into `每週事項 封存`.

## One trigger, two steps — why they are chained and not scheduled apart

Apps Script fires within an **hour window**, not on the minute. Two triggers an hour apart can
run out of order or overlap, and the failure would be silent and destructive. Chaining the calls
inside one function makes the order a fact instead of a hope.

The order itself is load-bearing: archiving *first* would count the sections before next
Thursday exists and prune one week too many. And if the scaffold throws its post-condition, the
throw propagates and the archive never runs — never prune a document whose last write is in
doubt.

## Why the Doc was growing, and why it takes both steps to stop it

Audited 2026-09-15. Two independent leaks, and capping either alone fixes nothing:

| Leak | Symptom | Fixed by |
|---|---|---|
| Sections are never retired | The live tab grew by a whole section every week — 34 sections, 5,325 lines | `archiveOldWeeks()` |
| Each section is a copy of a copy | The newest section inherited **every** auto-block ever written: Aug 27 held 1 week's, Sep 3 held 2, Sep 10 held 3, Sep 17 held 4 (22 blocks, only 4 of them its own). Fixing the section count alone would leave this growing forever | `scaffoldNextWeek()` dropping `〔自動彙整〕` blocks |

Sections had grown 130 → 292 lines in the four weeks after the skill went live, with no ceiling.
A week's summary belongs to the week it summarised; Tuesday's `rollup` writes the new one from
scratch, and the scaffold carries forward only the human skeleton and the owner chips.

## Where the archive lives — and why that is not a free choice

**A sibling tab in the same document, directly after the live tab.** Not a separate file.

`carryover.py` produces the `↻N週` streaks by walking back through every dated section in
document order, and it reads the Doc via `get_doc_as_markdown`, which returns all tabs
concatenated in tab order. A sibling tab leaves that walk-back exactly as it was — it already
spans the 2026 and 2025 tabs today, comparing 46 sections. Move the sections to another document
and every streak silently resets to ≤3, destroying the one signal Wednesday's agenda is built
on. If you ever move the archive, check `sections_compared` in `carryover.py`'s output before
and after.

Tab **order** matters for the same reason: the walk-back assumes newest-first, so the archive
sits immediately after the live tab and its sections stay newest-first. `archiveOldWeeks()`
prepends as one contiguous block to preserve that.

## Why this is not the skill's job

The split is by **whether judgement is needed**, not by preference.

- Duplicating a section and retiring an old one are purely mechanical and must never fail. Apps
  Script authorisation does not expire, so in the week the skill breaks entirely, the skeleton
  still opens, Thursday still has a page to meet from, and the Doc still stops growing.
- Deciding which department a chat message belongs under **is** judgement. Doing it in Apps
  Script would mean calling an LLM from `UrlFetchApp` and maintaining prompt logic in two places,
  plus wiring the Chat advanced service. The skill already reads Chat and already writes the
  Doc — that step stays in the skill.

## Why it must copy, not rebuild

Each department heading carries its owner's **person chip**, and that chip is the routing table.

> **Neither Apps Script nor the Docs REST API can create a person chip.** They can only copy an
> existing one.

So "generate a clean skeleton from a template" is not an available option — it silently
downgrades every chip to plain text and destroys routing. Copying the previous section is the
only method that preserves them, and copying happens to be the thing Apps Script does most
reliably.

## Why Thursday, not Wednesday

Tuesday's roll-up needs a section to write into. If the skeleton is created on Wednesday,
Tuesday has nowhere to go. Creating it Thursday evening closes this week and opens next week in
one move, so **exactly one future section is ever open**, and nobody has to remember to copy
anything.

## Install

**Step 0 — create the archive tab, by hand, once.** In the Doc, add a top-level tab titled
exactly `每週事項 封存` and drag it to sit **directly after** `每週事項 2026`. Neither
DocumentApp nor the Docs REST API can create a tab, so the script never auto-creates one: a
missing archive tab is a setup error, and `archiveOldWeeks()` stops rather than inventing
somewhere to put a year of work. The title must match `ARCHIVE_TAB_TITLE`; it is resolved by
title, not id, because the id is not knowable until the tab exists.

1. Open the Doc → Extensions → Apps Script. Paste `scripts/scaffold.gs`.
2. **Point `DOC_ID` at a duplicate of the Doc first.** Leave `DRY_RUN = true`. (Duplicating the
   Doc copies the archive tab too, so the duplicate is a faithful rehearsal.)
3. Run `weeklyMaintenance()` once and read the log. It reports what it would scaffold, how many
   `〔自動彙整〕` lines it would drop, and which sections it would archive.
4. Set `DRY_RUN = false`, run again on the duplicate, then open the duplicate and check:
   - the person chips survived — if they came through as plain text, use the `mailto` fallback
     documented at the bottom of the script (visually plainer, still machine-readable);
   - the new section carries the headings and human lines but **no** `〔自動彙整〕` block;
   - the live tab holds exactly 3 dated sections, and the archived ones arrived **newest-first**
     at the top of the archive tab, intact.
5. Only then change `DOC_ID` to the real Doc.
6. **Run `installTriggers()` by hand, once.**

> Pasting the file schedules nothing. The trigger exists only after `installTriggers()` has
> actually executed. This is the step most likely to be skipped, and skipping it looks exactly
> like success until the following Tuesday.

> **Upgrading an existing install:** `installTriggers()` deletes triggers on **both**
> `weeklyMaintenance` and `scaffoldNextWeek` before creating the new one. An install made before
> the archive existed is scheduled on `scaffoldNextWeek` directly; leaving that trigger in place
> would open next week twice over, once with archiving and once without. Re-running
> `installTriggers()` is the whole upgrade, and it is idempotent.

## The first run is the big one

On the real Doc the first `archiveOldWeeks()` moves **32 sections** in a single pass: 34 dated
sections live today, the scaffold adds next Thursday first (35), and 3 stay. That is by far the
largest edit this script will ever make, and it is the run most worth rehearsing on a duplicate.
Every later run moves exactly one.

The first run does **not** retro-clean the blocks already stacked inside the three surviving
sections — the scaffold only drops blocks from what it copies *forward*. Those clear naturally:
the newest section is rebuilt clean next Thursday, and the two behind it are archived within
three weeks. Wanting them gone sooner is a manual edit at a Thursday meeting, which is where
deleting auto-content has always belonged.

## Verify it fired

Monday's `nudge` runs three checks and posts a failure notice to the space if any fails. That is
the "prove it fired" check for this half — the script's own success is otherwise invisible until
someone opens the Doc and finds nowhere to write.

| Check | Fails when | Why it is separate |
|---|---|---|
| A section for the upcoming Thursday exists | the scaffold did not run | Tuesday's `rollup` has nowhere to write |
| The live tab holds exactly 3 dated sections | the archive did not run, or threw | More than 3 and the Doc is growing again; **fewer** than 3 means something removed a section the scaffold needs to infer a section's range, which breaks it next week |
| That section holds **no** `〔自動彙整〕` block | the trigger is running an old copy of `scaffold.gs` | This one is the quiet killer: everything still *works*, the Doc just silently regrows. Nothing else would catch it |

The check deliberately does **not** live in Thursday's `decisions`: Apps Script fires within an
hour *window*, and the scaffold runs later in the evening than `decisions` does, so checking
then would fail every week for the wrong reason. Monday clears the window and still precedes
`rollup`, the first mode that needs the section.

Schedule lives in three constants at the top of the script — `TRIGGER_DAY`, `TRIGGER_HOUR`,
`TZ`. Change one and re-run `installTriggers()`; it deletes its own prior trigger first, so that
is idempotent. **If you ever move the scaffold earlier than `decisions`, move the assertion back.**

## Known traps

| Trap | What happens | Handled by |
|---|---|---|
| Tabbed document | `doc.getBody()` returns the main body, not the tab — edits go nowhere visible | `getTabBody_()` walks `getTabs()` for `t.0`, then `asDocumentTab().getBody()` |
| Date parsing | Section headings are `Aug 27, 2026`; a locale-dependent parse silently misreads them | Explicit `DATE_RE` + month table, no `new Date(string)` |
| Double-run | Two sections for the same Thursday | Idempotency guard: bail if next Thursday's heading already exists |
| Element types | A blind `copy()` loses list bullets and tables | Explicit branch on `PARAGRAPH` / `LIST_ITEM` / `TABLE` |
| macOS TCC | Scripts under `~/Desktop` can trip permission prompts | Keep the canonical copy in the repo, paste into the Apps Script editor |
| Panel shows the wrong time | The Triggers panel renders times in the **project** timezone, not the trigger's — a project set to another zone displays a different clock than `TZ` actually uses | Set the project timezone to `TZ` in Project Settings; the trigger itself is already correct |
| Hour window, not a minute | `atHour(23)` fires anywhere in 23:00–24:00 | Anything that must run after the scaffold must clear the whole window |
| Index shift on copy | Reading and writing in one loop re-reads the same element and duplicates it — seen live as ~100 copies of the date heading | Snapshot all source elements first; post-condition asserts dated sections rise by exactly 1 |
| Archive tab missing or ambiguous | Sections deleted with nowhere to land, or moved into the wrong tab | `getTabBodyByTitle_()` throws on zero, on more than one, and on resolving to the live tab. It never auto-creates |
| Copy-then-delete ordering | A failure mid-move loses a week permanently | Copy **first**, assert the archive's section count rose by exactly N, and only then remove. A crash in between duplicates content, which is recoverable by hand |
| Removal index shift | Removing forwards skips every other element | Remove **backwards**, from the last index down to the cut |
| Pruning below 2 sections | `scaffoldNextWeek()` infers a section's range from the gap between the two newest headings, so at 1 it can never run again | `weeklyMaintenance()` throws if `KEEP_SECTIONS < 2`; `nudge` reports a live tab under 3 as the louder failure |
| Archive in a separate document | `↻N週` streaks silently reset to ≤3 and Wednesday's agenda loses its only signal | Sibling **tab**, same Doc, directly after the live tab — `carryover.py` reads all tabs as one stream |
| Human text starting with `·` | Swept up as part of an auto block | The skip state only continues through blank or `·` **paragraphs**; a list item, table or any other paragraph ends it. The team's bullets are real Docs list items |
| Standing notes at the bottom of the tab | Archived along with the oldest section | The cut is "everything from the fourth dated heading down". Keep standing notes **above** the newest dated heading |
