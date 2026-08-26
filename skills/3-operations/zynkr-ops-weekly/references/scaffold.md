# The Apps Script half

`scripts/scaffold.gs` duplicates the newest week section and re-stamps it with the next
Thursday. It runs **Thu 23:00**, after `decisions` (22:00) has closed the week out.

## Why this is not the skill's job

The split is by **whether judgement is needed**, not by preference.

- Duplicating a section is purely mechanical and must never fail. Apps Script authorisation does
  not expire, so in the week the skill breaks entirely, the skeleton still opens and Thursday
  still has a page to meet from.
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

1. Open the Doc → Extensions → Apps Script. Paste `scripts/scaffold.gs`.
2. **Point `DOC_ID` at a duplicate of the Doc first.** Leave `DRY_RUN = true`.
3. Run `scaffoldNextWeek()` once and read the log.
4. Set `DRY_RUN = false`, run again on the duplicate, then **open the duplicate and check the
   person chips survived**. If they came through as plain text, use the `mailto` fallback
   documented at the bottom of the script — visually plainer, still machine-readable.
5. Only then change `DOC_ID` to the real Doc.
6. **Run `installTriggers()` by hand, once.**

> Pasting the file schedules nothing. The trigger exists only after `installTriggers()` has
> actually executed. This is the step most likely to be skipped, and skipping it looks exactly
> like success until the following Tuesday.

## Verify it fired

Monday's `nudge` checks that a section for the upcoming Thursday exists and posts a failure
notice to the space if not. That is the "prove it fired" check for this half — the script's own
success is otherwise invisible until someone opens the Doc and finds nowhere to write.

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
