---
name: planning-prework-pack
sheetId: "0.03"
description: >-
  Build the BEFORE-THE-ROOM pack for a Zynkr planning session (H1 / H2 / YE):
  copy the session-workbook template Sheet and re-fill its five tabs for the
  new cycle (Read Me · Agenda 8 blocks · Pre-work by LOB 8 rows · Laundry
  List + Eisenhower seeds · Eisenhower Matrix) from the Main Tracker, the OKR
  tracker, the per-LOB plan Docs and the 1:1 Docs; write per-owner one-pager
  text blocks into a 「Pre-work — <cycle>」 Doc; hand a 16-slide template-fill
  request to /zynkr-slide (or print the slide text if it is not installed);
  and print a logistics checklist + calendar-invite text. Trigger on
  /planning-prework-pack or when Peter says "準備 planning session 的會前資料",
  "做 H2/YE 規劃會的 workbook 跟 deck", "會前 pre-work", "出規劃會 agenda 跟
  pre-work", "prep the offsite", "build the planning pre-work pack". Shows the
  tab-by-tab plan first, writes only on confirmation, marks every number's
  source, never creates the calendar event or sends anything without an explicit
  yes. Distinct from planning-evidence-pack (numeric Scoreboard tab — consumed
  here), planning-1on1-annual-digest (one person's 年度計畫 Doc — only Top-3
  lines lifted), planning-session-synth (AFTER the room), zynkr-slide (RENDERS
  the deck; this skill only writes the request) and project-status-update (the
  course-project weekly — bare 「週報」 stays there).
category: strategy
project: planning-prework-pack
platform: claude
status: Done
author: Peter Tu
input: "Cycle label (H1/H2/YE) + session date; optional start time, 1:1 look-back weeks (default 8), pasted runway/shipped numbers, ID overrides (tracker, plan Docs, 1:1 Docs, hub)"
process: "Resolve cycle + sources → gather evidence (tracker by owner/status, OKR tracker, plan-Doc addenda, 1:1 WB entries) → print tab-by-tab plan → on confirm copy template Sheet + fill 5 tabs → Pre-work Doc → deck request → logistics + invite → report"
output: "Filled session workbook (5 tabs) + 「Pre-work — <cycle>」 Doc in the hub folder, a 16-slide deck request (or slide text), logistics checklist + invite text, and a not-done list"
synergy:
  - "zynkr-slide"
  - "planning-1on1-annual-digest"
  - "planning-evidence-pack"
  - "planning-session-synth"
---

# Planning Prework Pack

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill planning-prework-pack
```

Before a Zynkr planning session the facilitator needs four things: the session workbook
(agenda · per-LOB pre-work · laundry-list seeds · the 2×2), a one-pager per owner, the
deck, and the logistics — in July 2026 all four were prompted from scratch. This skill
re-runs that preparation for a new cycle: it reads the Main Tracker, the OKR tracker, the
per-LOB plan Docs and the 1:1 Docs, prints a tab-by-tab plan, and on confirmation copies
the template workbook (sources §A), fills it, writes the per-owner Doc, hands the deck to
`/zynkr-slide` and prints the invite text. Every number carries its source or is written
`（待補）`; nothing is sent, and no calendar event exists until Peter says yes.

---

## How this differs from its neighbours

- **planning-evidence-pack** (0.05) — builds the numeric `Scoreboard` tab; this skill
  CONSUMES it when it exists (slide-4 tiles, C1 line) and never counts events itself.
- **planning-1on1-annual-digest** (0.04) — one person's full 「年度計畫」 Doc; this skill
  only lifts Top-3 delivered / goals lines for the owner one-pagers and links the digest.
- **planning-session-synth** (0.06) — AFTER the room (transcript + whiteboard → tracker
  tabs + recap mail); this skill stops when the invite text is printed.
- **zynkr-slide** (1.24) — RENDERS the deck (template-fill branch, Step 4-T); this skill
  writes the per-slide field map and calls it via the Skill tool, never edits shapes.
- **project-status-update** (3.09) — the course-project weekly; every bare 「週報」 /
  "weekly report" trigger stays there.

## Fixed facts (read the references first)

- `./references/planning-knowledge-pack.md` — cycle vocabulary (§1), the eight L1
  functions (§2), priority rule + status strings (§3), C1–C4 frame + ground rules +
  pass/fail bar (§4), the 8-block runbook (§5), the family's never-do list (§9).
- `./references/planning-sources.md` — every live ID: hub folder, Main Tracker (SOR tab
  gid), the **session workbook template** and the **designed deck** (§A), 1:1 Docs +
  Fireflies + calendar rhythm (§B), venue/logistics conventions (§C). IDs are never
  hard-coded in this body; a new cycle edits the sources file, not the skill.
- `./references/session-workbook-template.md` — the exact tab names, banner rows,
  column headers, cell vocab (`Do now`/`Schedule`/`Delegate`/`Drop`), the 16-slide field
  map, the one-pager Doc shape and the invite text — the layouts this skill reproduces.
- Google account for all `google-workspace` MCP calls: `peter_tu@zynkr.ai`; calendar via
  the `claude_ai_Google_Calendar` connector (sources header).
- Roster and owners come ONLY from the tracker's 負責人 column (or the user); the
  template workbook's attendee list (sources §A) is history, not a default. Departed
  names and `All` are handled per Step 0.3 (confirm line · 「掛 All：n 項待認領」).

## Hard rules

1. **Plan before write.** Print the tab-by-tab plan (Step 2) and stop for a confirm
   before any `copy_drive_file` / `modify_sheet_values` / `create_doc` call or the
   `zynkr-slide` hand-off; that one yes covers Steps 3–5 (workbook copy · Pre-work Doc ·
   deck request). The calendar event (Step 6) always needs its own yes.
2. **Copy, never fill the template in place.** The template workbook and the designed
   deck (sources §A) are templates: `copy_drive_file` into the hub folder, rename, then
   fill the copy. If the copy fails, stop — never write into the source IDs.
3. **Every number names its source** — `tracker #N.NN (L1 x.0) 完成` (the `#` is
   verbatim; the L1 comes from 主類別, Step 1.1) · `WB YYYY/M/D` · `OKR row N` · `plan
   Doc addendum YYYY-MM-DD` · `pasted by user` · Scoreboard tab. An OKR target that is a
   status word (`built` / `live`) with a blank Actual is a valid target — write
   `target: <status word> (OKR row N)`. No number AND no status word ⇒ `（待補：需要
   <source>）`. Never estimate, never round up (pack §9).
4. **No calendar event, no mail, no share** without an explicit yes on that exact
   action. Default deliverable for logistics is text in the chat.
5. **L1 numbers 1.0–8.0 are fixed**; L2 rows may be added per cycle. Never renumber.
6. **Empty LOBs are reported, not padded.** 5.0 / 6.0 / 8.0 with nothing to show get a
   `（待補）` row and a coverage-gap line quoting what their plan Doc says (pack §2).
7. **Reads the tracker, 1:1 Docs, plan Docs and OKR tracker; never writes them.** Its
   only writes: the new workbook copy, the new Pre-work Doc, the deck copy that
   `zynkr-slide` makes on this skill's behalf (Step 5), and (on yes) one event.

---

## Workflow

### Step 0 — Resolve cycle + sources

1. Read `./references/planning-sources.md`. Take from the user: `cycle` (`H1` / `H2` /
   `YE`), the session date (or `TBD`), optional start time, the 1:1 look-back window
   `N` weeks, and any ID overrides (tracker, workbook template, deck template, plan
   Docs, 1:1 Docs, hub folder). When not given, use THIS SKILL's defaults (not family
   rules — say so in the Step 0 block): start `09:00` · look-back 8 weeks (`YE` = 26)
   · pre-work due 5 WORKING days before the session (count back skipping Sat/Sun; a
   weekend session ⇒ the preceding Monday; print the resolved date in the block).
   `YE` look-back spans the whole year: prev cycle = `H2`, and Step 1 also reads the
   tracker's `H1 回顧總結` tab + the OKR tracker (H1 retro + H2 tracker = full-year).
2. Resolve the 6.0 plan Doc through its hub shortcut (sources §A): ONE
   `get_drive_file_permissions` call on the shortcut ID already returns the TARGET's
   metadata — take the `ID:` line as the plan-Doc ID and do not re-resolve. Never move a
   shortcut (`update_drive_file` follows it to the target).
3. Roster = the tracker's 負責人 column. When a name is flagged as departed (template
   Read Me `Roster reality`, or by the user), print one confirm line (`<name> 已離職？
   仍列入 pre-work / 移到 Roster reality`) BEFORE listing them as an owner or invitee.
   Owner = `All` is never an owner: for that L1 list its named owners and append
   「掛 All：n 項待認領」 (n = tracker rows with 負責人 = `All`); the Step 2 lint repeats n.
4. Print one block and continue only if it is right:

```
Cycle: <H1|H2|YE> <year> · Session: <YYYY-MM-DD|TBD> <HH:MM> · Prev cycle: <label> · Pre-work due: <YYYY-MM-DD>
Template workbook: <id> · Template deck: <id> · Hub folder: <id>
Tracker: <id> (SOR tab gid <gid>) · OKR tracker: <id> · Plan Docs: 1.0…8.0 <ids>
1:1 Docs: <n> found (window <N> weeks) · Missing: <list or none>
```

### Step 1 — Gather evidence (read-only)

Read in this order, keeping a running `evidence` list where each fact = `text · L1 ·
owner · source tag`:

1. **Main Tracker SOR tab** (`read_sheet_values`, the `<prev cycle> 專案項目` tab): every
   row's `# · 主類別 · 項目 · Priority · 負責人 · 開始 · 結束 · 狀態`. `read_sheet_values`
   returns at most 50 rows per call — page the tab (`A1:M50`, `A51:M100`, … until a
   short page) and count rows before bucketing. The `#` prefix is POSITIONAL, not the L1
   number: the L1 lives in the 主類別 text (live tracker: `#5.0x` rows are `6.0 Tech`,
   `#6.0x` rows are `7.0 People`) — bucket by 主類別, and quote `#` verbatim with the L1
   beside it (`tracker #5.02 (L1 6.0)`). Normalise 狀態 to the
   exact strings `完成` / `進行中` / `未開始` / `放棄` (trim; anything else ⇒ keep raw and
   flag `狀態未知`). Bucket by L1 and by 負責人: 完成 ⇒ "delivered" candidates; 進行中 +
   未開始 ⇒ "forward" + laundry-list candidates. Also read `專案項目小記` for the counts.
   `YE` ⇒ also read the `H1 回顧總結` tab (sources §A gid) so H1 retro + H2 tracker both
   feed "delivered". If the SOR tab has 0 rows with 狀態 = `完成`, do NOT leave every
   Looking-back cell `（待補）` — fill from these fallbacks, in order, each with its own
   tag: `H1 回顧總結` · the owners' 年度計畫 digest Docs (`planning-1on1-annual-digest`) ·
   CHANGELOG-style shipped lists · numbers pasted by the user.
2. **OKR & KPI Tracker** (`OKRs` · `KPI Dashboard` · `Initiatives Q3-Q4` tabs, names
   per sources §A): the numeric
   targets per objective/owner — the only allowed source for "target: <number>" lines
   besides the plan Docs. Many OKR rows carry a status word (`built`, `live`, `shipped`)
   as the target with a blank Actual — that is a valid target: write
   `target: <status word> (OKR row N)`; reserve `（待補）` for rows with no number AND no
   status word.
3. **Per-LOB plan Docs** (`get_doc_as_markdown` ×8): the newest dated addendum (pack §8
   shape) — mandate line, what changed, P0 list, open decisions, the risk line.
4. **1:1 Docs** (sources §B; `get_doc_as_markdown`): WB entries inside the window;
   heading formats VARY per person (`### WB（YYYY/M/D）` vs `# WB 0803` / `# WB 7/7` with
   no year — see sources §B). When a heading has no year, filter the window by document
   order (newest first) and infer the year from neighbours; if two years collide, ask.
   Lift dated delivered/next lines per person, always with the WB date. An in-window
   entry that is an empty shell (score + asks only) yields 0 evidence lines — say
   `WB M/D: 0 lines`, never invent. A person on the tracker with no 1:1 Doc in sources ⇒
   ask for the ID or mark `（待補）`.
5. **Optional pasted inputs**: runway/cash/burn (C1), founder hours (C2), shipped lists,
   marketplace/platform numbers — tag `pasted by user`. If a `Scoreboard` tab exists in
   an earlier workbook copy (from `planning-evidence-pack`), read it for slide-4 tiles.
6. **Calendar** (optional, `claude_ai_Google_Calendar` `search_events` by keyword —
   `Planning & Team Building` — is enough; no `list_events` sweep): only to confirm the
   offsite hold exists and read its real window (the July event ran 09:30–18:30 with the
   day agenda in the description — quote that, not the 09:00 default) — never to count
   events (the evidence pack's job).

End with a coverage line: items per L1 for delivered / forward / laundry, and the LOBs
that came up empty (pack §2 coverage check).

### Step 2 — Draft the workbook plan tab-by-tab (print it)

Using `./references/session-workbook-template.md` §1, print the plan as five sections
in tab order — the values you WILL write, not a description of them:

- **Read Me** — the key/value rows: session goal + 3 PASS/FAIL lines (pack §4 bar,
  adapted), date, duration, attendees (roles from the tracker), the 3-part method, the
  Eisenhower legend, the PRE-WORK rows (one per owner: what to bring, from their L1's
  plan-Doc addendum + open tracker items), C1–C4 (numbers or `（待補：需要 <source>）`),
  Roster reality, Sequencing rule, Tabs, Links.
- **Agenda** — 8 rows with the timeboxes from §1.2 shifted to the start time; the
  facilitation column quotes this cycle's targets/constraints from evidence. The
  `How to run (facilitation)` cells may be printed abbreviated in the chat (first line +
  `…`) with the note "full text at write time" — the full runbook text is still written
  in Step 3.
- **Pre-work by LOB** — the 8 rows; every bullet ends with its source tag; empty cells
  are `（待補）`; Owner = `All` rows follow the Step 0.3 form.
- **Laundry List + Eisenhower** — the full row list (`#` … `Owner`, `Live decision →`
  blank) with the seed verdict per row and the seed sanity count (Do-now n / total).
  `Qtr` uses the cycle's vocabulary (template §1.4; `YE` ⇒ `<year+1> Q1` · `Q2` · `H2` ·
  `ongoing`). U × I seeds lifted from the tracker's 重要 × 緊急 columns are labelled
  「(<prev cycle> verdict)」 (e.g. 「(H2 verdict)」) so the room knows they are last
  cycle's call; on a `YE` seed the Do-now cap lint is EXPECTED to fire (a year of P0s
  carried in) — print it as a note, do not silently demote.
- **Eisenhower Matrix** — the four quadrant cell texts + the founder-time line + the
  parking-lot line, re-derived from the laundry list.

Close the plan with a summary: rows per tab · `（待補）` count · coverage gaps · lint
notes (Do-now cap, owners `掛 All`, L1 with no owner), plus one line each for what
Steps 4–5 will do (Pre-work Doc: owners + sections · deck: template-fill via
`zynkr-slide` or text blocks). Then ask: **「照這個計畫寫入 workbook、建立 Pre-work Doc
並把 deck 交給 zynkr-slide 嗎？（yes = 一次做完 Step 3–5 / 改 <tab> …）」** — hard rule 1;
one yes covers Steps 3–5, the calendar event still gets its own question in Step 6.

### Step 3 — On confirmation: copy the template and fill the tabs

1. `copy_drive_file(file_id=<workbook template id>, new_name="Zynkr <cycle> Planning
   Session — Agenda & Pre-work", parent_folder_id=<hub folder id>)`; note the new ID and
   confirm the five tabs with `get_spreadsheet_info` (the copy keeps the seed colours).
   Read the copy's row count per tab (`get_spreadsheet_info` grid size, or
   `read_sheet_values` on col A) — the template's extent is what you clear, never a
   remembered number.
2. Fill tab by tab with `modify_sheet_values` (`USER_ENTERED`), in two passes per tab.
   Clear pass: `clear_values=true` on the tab's BODY range as read in 3.1, so no old
   cell survives; banner + header rows stay as the template has them. Body ranges (top
   row fixed, bottom = the copy's last row `R`): `Read Me` A1:B<R> (A1 IS the title
   banner — Read Me is rewritten whole because its title block is cycle content) ·
   `Agenda` A4:I<R> · `Pre-work by LOB` A3:G<R> · `Laundry List + Eisenhower` A3:K<R> ·
   `Eisenhower Matrix` A3:C<R>. Write pass: the Step 2 values verbatim, ranges sized to
   the NEW row counts (e.g. laundry list `A3:K<n+2>` for `n` rows; Agenda 8 body rows +
   TOTAL) — seed strings `Do now` / `Schedule` / `Delegate` / `Drop` exactly. If `n+2`
   exceeds the seed-colour range noted in `session-workbook-template.md` §1.4, extend it
   on the copy or say so in the report.
3. Read each tab back once (`read_sheet_values`) and print a 5-line checksum: tab ·
   rows written · `（待補）` cells. Any mismatch ⇒ fix that range, do not re-copy.
4. Add the workbook URL to the Read Me `LINKS` block.

### Step 4 — Per-owner one-pager Doc

`create_doc(title="Pre-work — <cycle>")` lands in My Drive; move it into the hub folder
with `update_drive_file(file_id=<the NEW Doc's id>, add_parents=<hub folder id>,
remove_parents="root")` — never on a template or shortcut ID. Body per
`./references/session-workbook-template.md` §3: header (cycle · session date · pre-work
due date — the date resolved in Step 0.1 (5 working days before; weekend session ⇒
preceding Monday) unless the user set one · the two self-rating definitions from pack §3),
then one H2 per owner in tracker 負責人 order with the three sections — Top-3 delivered
(proof number + source or `（待補）`), Top-3 goals (target + source), and that owner's
laundry-list rows from the workbook with empty U / I / Qtr cells for self-rating. When
an owner's `planning-1on1-annual-digest` Doc exists, quote its 12-line summary + link.
Print the Doc ID and the per-owner `（待補）` counts.

### Step 5 — Deck request

Read `./references/session-workbook-template.md` §2 and assemble the 16-slide field map
from the workbook values (slides 7–14 = the 8 Pre-work rows + laundry seeds; slide 15 =
the matrix cells; slide 4 tiles from the Scoreboard / pasted numbers, `（待補）` tiles
allowed and labelled).

- If `zynkr-slide` is installed (the Step 2 yes already covers this hand-off): call it
  via the **Skill tool** with a template-fill request — template = the designed deck ID
  (sources §A), `視覺處理 (visual-treatment)` =
  `keep` (already Zynkr brand), working subfolder = the hub folder, and the full
  `欄位對映 (field-map)` (slide # → text blocks) pasted in the args. `zynkr-slide` copies,
  fills and QA's the deck; you only relay the deck ID/URL into the Read Me `LINKS` block.
- If it is not installed: say so, print the 16 slide text blocks in the chat in the §2
  order, and put "install zynkr-slide (swap this skill's install snippet `--skill` value
  to `zynkr-slide`) and re-run Step 5" on the not-done list.

### Step 6 — Logistics checklist + invite text

Print the checklist from `./references/session-workbook-template.md` §4 with what is
already true (offsite hold found in Step 1.6 · venue named by the user · links from
Steps 3–5) ticked, the rest open with the owning role (Ops per sources §C). Then print
the zh-TW invite text with the real URLs and the pre-work due date. Ask **「要我建立日曆
事件嗎？（yes = 建立 / no = 只留文字）」** — only an explicit yes triggers
`claude_ai_Google_Calendar` `create_event` (all-day `[Place Holder] Zynkr <cycle> Planning &
Team Building` when the date is set; nothing when `TBD`). Never invite attendees or send
mail from this skill.

### Step 7 — Report

Print, in this order: workbook ID + URL · Pre-work Doc ID + URL · deck ID/URL (or "slide
text printed, zynkr-slide not installed") · calendar event ID (or "not created") ·
`（待補）` totals per artefact with the source each needs · coverage gaps · lint notes ·
**what this run did NOT do** (no tracker/plan-Doc/1:1 edits · nothing sent · anything
skipped for missing IDs). Point at the next skill: `planning-evidence-pack` (missing
numbers) · `planning-1on1-annual-digest` (owners without a digest) ·
`planning-session-synth` (after the room).

---

## Outputs

| Artefact | Where | Notes |
|---|---|---|
| 「Zynkr <cycle> Planning Session — Agenda & Pre-work」 Sheet | hub folder (sources §A) | copy of the template; 5 tabs re-filled; every number sourced or `（待補）` |
| 「Pre-work — <cycle>」 Doc | hub folder | one H2 per owner, three sections each; owners from the tracker |
| Deck | via `/zynkr-slide` template-fill (or 16 text blocks in chat) | designed deck as template, `keep` colours |
| Logistics checklist + invite text | chat | calendar event only on explicit yes |
| Run report | chat | IDs/URLs · `（待補）` map · coverage gaps · not-done list |

## Reference files

- `./references/planning-knowledge-pack.md` — shared family pack (byte-identical across
  `planning-*`; do not edit here).
- `./references/planning-sources.md` — live IDs + conventions (byte-identical; edit
  everywhere or nowhere).
- `./references/session-workbook-template.md` — this skill's tab/column layouts, 16-slide
  field map, one-pager Doc shape, logistics checklist + invite text.

## Limitations

- Evidence-bound: a cycle with a thin tracker and stale plan Docs yields a workbook full of
  `（待補）` — that is the correct output, and Step 7 says which source would fill each.
- Rendering the deck depends on `zynkr-slide` (+ its `slide-pptx` dependency); without it
  the skill delivers text blocks, not slides.
- The 6.0 plan Doc lives behind a shortcut in the hub; if the shortcut cannot be
  resolved, LOB 6.0 rows are `（待補）` and the report says so.
- One workbook per run. Re-running for the same cycle creates a second copy — say so
  and offer to fill the existing copy instead (only its body ranges, never the template).
- Timeboxes follow the template workbook's design (sources §A; 175 min); a different
  session length is the user's edit to the Agenda rows. Google Chat / workspace-mcp Calendar are unavailable (sources
  header) — the skill says so rather than pretending to have read them.
