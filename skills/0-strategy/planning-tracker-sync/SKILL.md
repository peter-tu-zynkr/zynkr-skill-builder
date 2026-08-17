---
name: planning-tracker-sync
sheetId: "0.09"
description: >-
  Team-side weekly heartbeat on the COMPANY Planning Main Tracker (SOR tab of the H1 / H2
  / YE cycle) — zynkr-gm's record-side companion. Reads the `<cycle> 專案項目` tab, derives
  per-item state with zynkr-gm's rules VERBATIM (ENDS_SOON · OVERDUE · UNDATED · STALLED ·
  PROPOSE_DONE · DIRECTION_UNLABELLED — its scripts when installed, else the copied rules)
  and prints the zh-TW Team Weekly agenda block in one fixed six-section shape (cadence →
  OVERDUE／ENDS_SOON → UNDATED／掛 All → 各 owner P0/P1 + Δ → PROPOSE_DONE／上週完成 → 還在摸索／已定案)
  plus per-owner nudge blocks (Gmail DRAFT only on request; never sends). Writes only the
  OKR-tracker snapshot tabs: `snapshot` refreshes `tracker-latest` and appends to
  `tracker-snapshots` in the OKR & KPI Tracker — never a Main Tracker cell. `--retro`
  prints a looking-back draft for planning-prework-pack. Ships no cron; documents a
  read-only /schedule string. Trigger on /planning-tracker-sync or "H2 tracker 同步",
  "tracker 同步", "幫我出 Team Weekly 的 tracker 區塊", "tracker 上哪些項目缺日期要 nudge", "誰該被 nudge",
  "snapshot the tracker", "拍一張 tracker snapshot", "year-end retro draft", "從 tracker
  出回顧草稿". NOT the founder GM brief — zynkr-gm owns 「GM 週報 / 這週重點 / 本週 focus / 本月重點 / 哪些 P0
  delay 了 / H2 進度盤點 / KPI off-target」 and every company-level focus / roll-up / variance
  ask. NOT bare 「週報」/"weekly report"/"project weekly" or the Monday cron —
  project-status-update owns those.
category: strategy
project: planning-tracker-sync
platform: claude
status: Done
author: Peter Tu
input: "Cycle (H1/H2/YE) + as-of date (default today); optional: pasted last block, focus text, flags snapshot / --retro / --draft / --since / --force, --tracker / --okr ID overrides"
process: "Resolve cycle + sources → read SOR tab, normalise → derive states via zynkr-gm (scripts; else copied rules) against the last tracker-snapshots rows → Fireflies recaps → agenda block → nudges → RAW snapshot to OKR & KPI Tracker on request (local) → --retro"
output: "zh-TW Team Weekly agenda block + per-owner nudges in chat (Gmail DRAFT on request, never sent); tracker-latest + tracker-snapshots rows in the OKR & KPI Tracker on request; retro"
synergy:
  - "zynkr-gm"
  - "project-status-update"
  - "planning-tracker-builder"
  - "planning-evidence-pack"
  - "planning-prework-pack"
---

# Planning Tracker Sync

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill planning-tracker-sync
```

After the July offsite the Main Tracker became the company's system of record, and every
Thursday someone re-read all its rows by hand to build the Team Weekly agenda: who slipped,
what is still 掛 All, which dates are still the `YYYY-MM-DD` placeholder. This skill is that
weekly pass, packaged: read the SOR tab, derive each item's state with `zynkr-gm`'s rules
(never its own vocabulary), diff against the last snapshot, print the agenda block in one
fixed zh-TW shape plus a nudge block per owner. It writes exactly one thing, only when asked,
and never into the Main Tracker: a dated row-level snapshot into the OKR & KPI Tracker
(`tracker-latest` + `tracker-snapshots`) — the history `zynkr-gm`'s STALLED rule,
`planning-evidence-pack` and the year-end retro read back.

---

## How this differs from its neighbours

- **zynkr-gm** (0.02) — the FOUNDER-facing weekly GM brief; owns every GM-brief trigger
  (description) and every company-level week/month focus, progress roll-up or KPI-variance
  ask, plus the derived-state rules. This skill is its team-side / record-side companion:
  same states verbatim (delegating to its scripts or `zynkr-gm progress` when installed),
  producing only what zynkr-gm does not — the team-facing agenda block, per-owner nudges,
  the dated snapshot, the `--retro` draft. A GM-brief phrase ⇒ hand over to zynkr-gm.
- **project-status-update** (3.09) — the pattern source, but a different project: the COURSE
  tracker's weekly (styled HTML mail, Monday cron). It owns every bare 「週報」 / "weekly
  report" / "project weekly update" / "the weekly" trigger and ALL scheduled weekly runs not
  explicitly this skill's.
- **planning-tracker-builder** (0.07) — BUILDS the tracker. This skill never builds,
  renumbers or writes a single cell of it.
- **planning-evidence-pack** (0.05) — the whole-cycle scoreboard; reads `tracker-snapshots`
  as source S2. This skill counts one week's movement, not a cycle.
- **planning-suite-reconciler** (0.08) — writes dated addenda into the satellite Docs and
  rebases the OKR & KPI Tracker's `OKRs`; this skill touches no Doc and only its own two
  tabs there.
- **planning-prework-pack** (0.03) — CONSUMES the `--retro` draft (its `Pre-work by LOB`
  delivered / forward / top-risk seeds); not invoked from here.

## Fixed facts (read the references first)

- `./references/planning-knowledge-pack.md` — cycle vocabulary (§1), L1 numbering for the
  retro grouping (§2), status vocabulary + `YYYY-MM-DD`-is-missing + the P0-cap / owner-load
  / 掛 All lints (§3), the cadence this block serves (§5), tracker tabs (§6), never-do list (§9).
- `./references/planning-sources.md` — Main Tracker ID + SOR-tab gid and the OKR & KPI
  Tracker ID (§A), Fireflies query shape + calendar rhythm (Team Weekly = Thursday evening)
  (§B), owners read live from 負責人 (§C).
- `./references/derived-state-rules.md` — zynkr-gm's rules, copied verbatim (owner:
  zynkr-gm; re-copy, never edit): state names, `ENDS_SOON_DAYS = 14` and the other
  constants, evidence to print, priority weighting. `zynkr-gm` (0.02, in-tree at
  `skills/0-strategy/zynkr-gm/`) installs beside this skill — `~/.claude/skills/zynkr-gm` or
  `~/.agents/skills/zynkr-gm`, i.e. `../zynkr-gm/` from this folder — and ships stdlib Python:
  `scripts/derive_state.py rows.json --today YYYY-MM-DD [--prev prev_rows.json] [--json]`
  (ENDS_SOON · OVERDUE · UNDATED · CHANGED · PROPOSE_DONE; CHANGED compares 狀態/開始/結束/負責人
  against `--prev`) and `scripts/tracker_diff.py before.json after.json [--json]` (added /
  removed / changed on 狀態·開始·結束·負責人·Priority); every script takes `--help` / `--selftest`.
- `./references/sync-formats.md` — this skill's contract: SOR column map (§1), normalisation
  (§2), state → section map + lints (§3), agenda block (§4), nudge block (§5), snapshot tabs +
  procedure (§6), retro draft (§7), Δ baseline order (§8), `/schedule` string (§9).
- Google account for all `google-workspace` calls: `peter_tu@zynkr.ai` (sources header).
  Reads: `read_sheet_values`, `get_spreadsheet_info`, `search_gmail_messages`,
  `get_gmail_threads_content_batch`. Writes (snapshot mode, OKR & KPI Tracker only):
  `create_sheet` (first run, after the go), `modify_sheet_values` — always
  `value_input_option="RAW"` — and `resize_sheet_dimensions` (`--force` row delete). The MCP
  has no rename-sheet call (tab renames are the user's UI step). Optional draft:
  `draft_gmail_message`.

## Hard rules

1. **One write, on request, never into the Main Tracker.** `snapshot` mode writes only tabs
   `tracker-latest` / `tracker-snapshots` of the OKR & KPI Tracker (§6), every cell with
   `value_input_option="RAW"` so `#` ids like `1.10` and `YYYY-MM-DD` placeholders land exactly
   as read. Machine state stays out of the SOR sheet (zynkr-gm design D1): never a 狀態, date,
   owner or note on any Main Tracker tab — slips are reported to owners, not fixed for them.
2. **Never send.** Nudges and the agenda block are chat blocks; a Gmail DRAFT is created only
   on `--draft` (or when asked), addressed only to addresses the user supplies. This skill
   sends nothing under any confirmation — the user sends from Gmail (pack §9).
3. **Never claim another skill's trigger.** Bare 「週報」 / "weekly report" / "project weekly" /
   the Monday cron ⇒ project-status-update; any GM-brief phrase ⇒ zynkr-gm. When such a
   phrase arrives without the planning tracker being named, say so and stop.
4. **zynkr-gm's states, verbatim.** ENDS_SOON · OVERDUE · UNDATED · STALLED · PROPOSE_DONE ·
   DIRECTION_UNLABELLED with the thresholds in `./references/derived-state-rules.md`; no
   renamed or invented state. 掛 All and owner LOAD are pack §3 lints, printed as lints.
5. **No invented movement.** Δ prints only against a real baseline (§8); first run ⇒
   `基準：首次，無 Δ`. STALLED prints `n/a` unless zynkr-gm supplies it. 上週完成 without a
   baseline is 「近兩週結束日已到且狀態完成」 and the header says so.
6. **Missing means missing.** A `YYYY-MM-DD` placeholder or unparseable date is `undated`,
   excluded from date math, listed with the raw value — never back-filled (pack §3).
7. **Owners come from 負責人.** No roster is assumed; a name not in the tracker is never
   nudged; example names in this file are placeholders (王小明 / 李小華).
8. **No cron shipped; the routine is read-only.** Scheduling is the user's `/schedule`
   routine (§9). A claude.ai cloud routine has no workspace-mcp Sheets write access, so the
   scheduled prompt runs the agenda block (+ nudges in chat) only — never `snapshot`; snapshots
   are taken in a local session. The first scheduled run is observed once and recorded before
   it is left unattended.
9. **Fail loud in unattended mode.** SOR tab unreadable (auth, empty, wrong tab), or a
   `snapshot` outside an interactive session / with a tab missing and no go ⇒ print
   `Tracker 同步失敗：<reason>` and stop.

## Workflow

### Step 0 — Resolve cycle + sources

Read `./references/planning-sources.md`. Flags (the complete inventory): `--cycle H1|H2|YE`
(if absent, the cycle whose window contains today, said aloud; YE has no window ⇒ ask) ·
`--as-of YYYY-MM-DD` (default today) · `snapshot` · `--retro` · `--draft` · `--since
YYYY-MM-DD` (Fireflies lower bound) · `--force` (overwrite today's snapshot) · `--tracker
<ID>` / `--okr <ID>` (ID overrides; a renamed SOR tab is given as text) · `--focus "<text>"`;
a pasted last block is a baseline candidate (§8). Resolve the SOR tab as `<cycle> 專案項目`
(H2 2026 = sources §A). Print one line before touching anything: `Cycle: <label> <year> ·
as-of <date> · tracker <ID> · SOR tab <name> · okr <ID> · mode <agenda | agenda+snapshot |
retro> · draft <yes|no> · 狀態來源 <zynkr-gm scripts | zynkr-gm progress | fallback rules> ·
baseline <snapshots | pasted | gmail | none yet>`.

### Step 1 — Read the SOR tab and normalise

`read_sheet_values(spreadsheet_id=<tracker>, range_name="'<SOR tab>'!A1:M500",
user_google_email=…)`. Keep the 13 raw columns as read (the snapshot and zynkr-gm's scripts
want them raw); skip `N.0` header rows from every count (keep the L1 label for grouping).
Apply `./references/sync-formats.md` §1–§2 for the printed view: normalise 狀態 to the pack
§3 strings, dates to ISO or `undated`, Priority `P0`–`P3` (blank = 未評), trim 負責人; keep
every raw value that did not map so it can be quoted (`（狀態未知：<原值>）`). Print the
intake line: `<n> 項 · P0 <a> · P1 <b> · P2 <c> · P3 <d> · 未評 <e> · 狀態未知 <f>`. Zero rows
or an auth error ⇒ hard rule 9.

### Step 2 — Baseline and meeting evidence (read-only)

- **Baseline for Δ** — `./references/sync-formats.md` §8 order: newest `tracker-snapshots`
  rows with `snapshot_date` < as-of (`read_sheet_values` on the OKR & KPI Tracker; per-row,
  per-field — the only baseline that gives 狀態/開始/結束/負責人 transitions and STALLED age)
  → a pasted block → the newest `【Tracker 同步】` Gmail draft/sent (`search_gmail_messages`
  `in:drafts subject:"【Tracker 同步】"`, then `in:sent`) → none. Record the baseline date and
  kind in the header.
- **Fireflies recaps** — only when asked, or unattended with a known last run: `search_gmail_messages`
  `from:fireflies.ai after:<last run or --since>` (sources §B) → `get_gmail_threads_content_batch`;
  keep action-item lines that name a tracker item by `#` or an unambiguous 項目 substring and
  attach one sentence to that item as the 「會議提到」 tag. Ambiguous hits go to
  `會議提到（未對上）：…` at the end, never attached.

Neither source is written to; a missing baseline or zero recaps is stated, not padded.

### Step 3 — Derive state (zynkr-gm's rules, verbatim)

1. **zynkr-gm installed** (`~/.claude/skills/zynkr-gm` or `~/.agents/skills/zynkr-gm`): dump
   Step 1's raw rows to `rows.json` (keys = the 13 header cells) and, when a `tracker-snapshots`
   baseline exists, that snapshot's rows to `prev_rows.json`; run `python3
   <zynkr-gm>/scripts/derive_state.py rows.json --today <as-of> [--prev prev_rows.json] --json`
   and `python3 <zynkr-gm>/scripts/tracker_diff.py prev_rows.json rows.json --json`. Take the
   emitted states (ENDS_SOON · OVERDUE · UNDATED · CHANGED · PROPOSE_DONE), evidence strings and
   `by_owner` rollup as-is (CHANGED = 狀態/開始/結束/負責人 vs `--prev`; `tracker_diff` also
   reports Priority; neither compares 備註). If the user has run `/zynkr-gm progress` this week, its per-item
   states (incl. STALLED and DIRECTION_UNLABELLED, which need sources this skill never reads)
   may be pasted and win.
2. **Not installed** — apply `./references/derived-state-rules.md` verbatim (same names,
   `ENDS_SOON_DAYS = 14`, same evidence) and mark the header `狀態來源：fallback rules`.
   DIRECTION_UNLABELLED is tested on 備註 only (say `plan Doc 未讀`); STALLED prints `n/a`
   plus, as evidence lines, P0/P1 進行中 rows unchanged vs a snapshot ≥14 days old.

Then map states + lints to sections per `./references/sync-formats.md` §3 and build the
per-owner view: for each distinct 負責人 in first-seen order, their P0 and P1 items with
normalised 狀態, Δ (from `CHANGED` / `tracker_diff`), and the state tags; P0–P2 items with a
blank / 未定 / N/A owner go to `缺負責人`. Every line quotes the `#`, the owner and the
evidence (which date, days late / left) — a flag without evidence is dropped.

### Step 4 — Print the Team Weekly agenda block

Render `./references/sync-formats.md` §4 verbatim in the chat — six numbered sections, never
reordered or renamed: **1. 本週 focus 提醒** (the 「每週一貼 1–3 件、週四 review」 cadence
line + `--focus` text or `（待填）`; the company-level focus itself is zynkr-gm's) → **2.
OVERDUE／ENDS_SOON** → **3. UNDATED／掛 All** → **4. 各 owner P0/P1** (+ LOAD line + 缺負責人)
→ **5. PROPOSE_DONE／上週完成** (owner to confirm) → **6. 方向若變請明講：還在摸索／已定案** (+
DIRECTION_UNLABELLED P0s). The header carries the run date, Sheet name, item count, 狀態來源
and baseline (or 首次). Empty sections print `—`. With `--draft`, also create a Gmail DRAFT
(`draft_gmail_message`, subject `【Tracker 同步】<cycle> <date>`, body = the block, `to` = the
addresses the user gave, e.g. `team@example.com`) and print the Draft ID — never send.

### Step 5 — Nudge blocks per owner

For every 負責人 holding at least one OVERDUE / UNDATED / PROPOSE_DONE item, print the block
in `./references/sync-formats.md` §5: greeting by the tracker name, one line per item with
the concrete ask (更新狀態或改結束日 · 是否啟動？若不做請標 放棄 · 填一個日期 · 若已完成請改
狀態), and the closing 「更新在 tracker 上就好，不用回信」 + the 還在摸索／已定案 line. Owners
with nothing flagged get `無需 nudge：<names>`. Gmail DRAFTs only on request and only to
user-supplied addresses (`wang@example.com`); the tracker holds names, not addresses, and
this skill never looks one up or guesses.

### Step 6 — `snapshot` mode: refresh `tracker-latest`, append to `tracker-snapshots`

Only when the invocation says `snapshot`, in a local interactive session (hard rule 8).
Follow `./references/sync-formats.md` §6 exactly: `get_spreadsheet_info` on the OKR & KPI
Tracker → **print the plan** (tabs · ranges · row count · header + first two and last data
rows; with `--force`, the rows about to be deleted) BEFORE any write → wait for a one-word go
on EVERY snapshot run (the shared Sheet is never written on the invocation word alone) →
**first run** (either tab missing): the plan ends with ONE confirmation — 「`Initiatives Q3-Q4`（stale P0+P1
mirror）改名 `tracker-latest`（減法，內容覆寫）· `tracker-snapshots` 新建 · OK?」 — and nothing
in the shared Sheet is created, renamed or written before the go. On go: rename the stale
tab to `tracker-latest` (the MCP has no rename-sheet call — the user renames it in the Sheet UI
as part of the go; re-run `get_spreadsheet_info` and proceed only once `tracker-latest`
exists); if the user declines the rename, `create_sheet(sheet_name="tracker-latest")` and
leave the old tab alone; `create_sheet(sheet_name="tracker-snapshots")` when missing → refuse
a second `tracker-snapshots` batch for the same `snapshot_date` unless `--force` →
`modify_sheet_values` with **`value_input_option="RAW"`** on both tabs (clear + rewrite
`tracker-latest`; append to `tracker-snapshots`) — the 13 raw columns + `snapshot_date` +
`iso_week`, one row per data row, `N.0` rows skipped; RAW keeps `#` `1.10` and `YYYY-MM-DD`
exactly as read → read back and print the row counts. A `/schedule` routine never runs this
step. Any Main Tracker cell, `OKRs`, `KPI Dashboard` — out of bounds.

### Step 7 — `--retro` mode: the looking-back draft at cycle end

Only when the invocation says `--retro` (the last weeks of the cycle, before
`planning-prework-pack` runs). From the normalised rows plus `tracker-snapshots`, print
`./references/sync-formats.md` §7: 完成／PROPOSE_DONE by LOB (`n/m` per L1, `⚠ 無項目` where an
L1 has zero items — pack §2 coverage gap), P0 結案率, Slipped (OVERDUE at cycle end), Dropped
(放棄 with 備註 quoted), owner load, the snapshot trend (first → last `snapshot_date`, or
`（待補）— 需要 snapshot`), the fields prework-pack can take, and the sources not read. Chat
only — no Doc, no tab.

### Step 8 — Close: what was written, what was not

End every run with two lines: **wrote** — `tracker-latest` (n rows) + `tracker-snapshots`
rows `<r1>:<r2>` (snapshot mode) or `nothing` · Draft ID(s) if any; **did NOT do** — no Main
Tracker cell changed, no mail sent, no Doc touched, 狀態來源, baseline used (or none), recaps
read (or skipped), 「會議提到（未對上）」 items, and — on a manual run — the reminder that the
routine is a read-only `/schedule` the user sets (§9), not something this skill installs, and
that snapshots are taken locally.

## Outputs

- **Team Weekly agenda block** — zh-TW, fixed six-section shape (`./references/sync-formats.md`
  §4), states in zynkr-gm's names with evidence; optionally a Gmail DRAFT `【Tracker 同步】<cycle>
  <date>`.
- **Nudge blocks** — one per owner with OVERDUE / UNDATED / PROPOSE_DONE items (§5), chat;
  Gmail DRAFT only on request to user-supplied addresses; never sent.
- **Snapshot** (`snapshot` mode) — in the OKR & KPI Tracker: `tracker-latest` (current rows)
  and `tracker-snapshots` (history), written RAW, header = the 13 tracker columns exactly as
  read + `snapshot_date` + `iso_week` (§6) — the `rows.json` shape zynkr-gm's `derive_state.py --prev`
  consumes; counts by priority × 狀態 and per-owner P0 are derived by grouping on
  `snapshot_date` (planning-evidence-pack S2, `--retro`).
- **Retro draft** (`--retro`) — 「<cycle> 回顧草稿 — tracker 視角」 (§7), chat only, for
  `planning-prework-pack`.
- **Closing report** — wrote / did NOT do.

## Reference files

- `./references/planning-knowledge-pack.md` — shared family pack (byte-identical across the
  `planning-*` skills; do not edit here).
- `./references/planning-sources.md` — shared live IDs, gids, query shapes (byte-identical;
  do not edit here).
- `./references/derived-state-rules.md` — zynkr-gm's derived-state rules, copied verbatim
  (owner: zynkr-gm; re-copy when it changes, never edit here).
- `./references/sync-formats.md` — column map, normalisation, state → section map, the four
  output shapes, snapshot tabs, baseline order, `/schedule` string.

## Limitations

- **Cell-value logic only.** OVERDUE is a date comparison, not a judgment about whether the
  work is really late; a stale 狀態 cell produces a stale line — the nudge asks the owner to
  fix the cell, the skill never infers.
- **STALLED and DIRECTION_UNLABELLED are zynkr-gm's calls.** They need the ops weekly log,
  SOT activity and plan-Doc Refresh blocks this skill never reads; here they print `n/a` /
  備註-only unless zynkr-gm's output is supplied. This skill's contribution is the snapshot
  history the STALLED rule needs.
- **Δ needs a snapshot.** Per-field transitions exist only from `tracker-snapshots`; a pasted
  block or Gmail draft gives status-level Δ only; the first run has none.
- **Meeting evidence is opportunistic.** Only Fireflies recaps in Gmail are read; Google Chat
  is unreadable (sources header); un-recapped meetings leave no trace here.
- **No addresses.** Nudge drafts need addresses from the user; the skill never resolves a
  name to a mailbox.
- **No scheduling inside the skill, and the routine cannot snapshot.** The weekly run is a
  `/schedule` routine the user creates from `./references/sync-formats.md` §9 — read-only, as a
  cloud routine has no workspace-mcp Sheets write access; `snapshot` and the first-run tab
  rename / creation are local, interactive steps.
- **One tracker per run.** A new cycle = new IDs in `planning-sources.md` (or `--tracker` /
  `--okr`).
