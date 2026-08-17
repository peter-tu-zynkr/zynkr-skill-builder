# Sync formats — `planning-tracker-sync`

> Skill-specific reference (not part of the byte-identical family pack). It pins the
> *how* of the weekly heartbeat: the SOR column map the skill reads, the normalisation
> table, how zynkr-gm's states land in the block, and the exact shapes of the four things
> it prints or writes (agenda block · nudge block · snapshot tabs · retro draft) plus the
> `/schedule` string. State names and thresholds are NOT defined here — they are
> `derived-state-rules.md` (zynkr-gm's, copied verbatim). Cite `planning-knowledge-pack.md`
> for *why* (§3 status vocabulary + priority rule · §5 cadence · §6 tab layout · §8
> versioning · §9 never-do list). IDs live in `planning-sources.md`; none here.

## 1 · SOR tab column map (as built 2026-07; pack §6 wording)

Read range: `'<cycle> 專案項目'!A1:M500` via `read_sheet_values`. Row 1 = header. All 13
columns are kept **raw** for the snapshot and for `derive_state.py` (keys = header cells);
the columns below are the ones the printed block uses.

| Col | Header | Used for |
|---|---|---|
| A | `#` | `N.0` = L1 header row (skip in counts) · `N.NN` = item id quoted in every line |
| B | `主類別` | L1 label — retro 「完成 by LOB」 grouping |
| C | `子類別` | shown in the retro only |
| D | `項目（正規化）` | the item text printed in every line |
| G | `Priority` | `P0`–`P3` (formula result; blank ⇒ 未評 — listed, not guessed) |
| H | `負責人` | owner grouping · `All` lint · nudge addressee name |
| I | `協助者` | printed in the nudge only |
| J | `開始` | OVERDUE (未開始 branch) |
| K | `結束` | OVERDUE (進行中 branch) · ENDS_SOON |
| L | `狀態` | normalised per §2 |
| M | `備註` | PROPOSE_DONE / DIRECTION_UNLABELLED test; quoted (≤ 60 chars, then `…`) |

## 2 · Normalisation (printed view only — the snapshot stores raw cells)

| Field | Rule |
|---|---|
| 狀態 | trim; full-width → half-width; map `完成` / `done` / `✓` / `✅` → **完成** · `進行中` / `wip` / `in progress` / `doing` → **進行中** · blank / `未開始` / `todo` / `not started` → **未開始** · `放棄` / `dropped` / `取消` → **放棄**. Anything else ⇒ keep the raw value, print `（狀態未知：<原值>）待確認` (zynkr-gm's `UNKNOWN_STATUS`: surfaced, never mapped). Note: the July tracker uses only 未開始 / 進行中 / 放棄 (`derived-state-rules.md`); 完成 is the pack §3 fourth string — honoured when a cell carries it, otherwise 完成 is only ever *proposed* (PROPOSE_DONE). |
| 開始 / 結束 | trim; the literal `YYYY-MM-DD` (any case), blank, `TBD` or unparseable ⇒ **undated** (`（日期待確認：<原值>）` when non-blank); `2026/8/1` and `2026-8-1` ⇒ ISO; `MM-DD` / `M/D` ⇒ current year with `（年份推定）` printed — the same parse `derive_state.py` applies, so both paths agree; never a silent year. |
| Priority | trim + uppercase; must be `P0`–`P3`; blank ⇒ `未評`. |
| 負責人 | trim; `All` (any case) ⇒ the 掛 All lint; blank / `未定` / `N/A` on P0–P2 ⇒ 缺負責人 line. |

## 3 · State → section map (states = zynkr-gm's, verbatim; lints = pack §3)

States and thresholds come from `derived-state-rules.md` (`ENDS_SOON_DAYS = 14` etc.). This
table only says where each lands in the block. Computed against **as-of** = run date.

| Source | Name | Lands in | Evidence printed |
|---|---|---|---|
| zynkr-gm | `OVERDUE` | §4 sec 2 · nudge | which date, days late |
| zynkr-gm | `ENDS_SOON` | §4 sec 2 (P0/P1) · sec 4 tag (P2) | 結束, days left |
| zynkr-gm | `UNDATED` (P0/P1 only) | §4 sec 3 · nudge | which cell(s), raw value |
| zynkr-gm | `STALLED` / `STALLED?` | §4 sec 4 tag; `n/a` unless zynkr-gm supplied it | last change date |
| zynkr-gm | `PROPOSE_DONE` | §4 sec 5 · nudge (「若已完成請改狀態」) | the 備註 quote |
| zynkr-gm | `DIRECTION_UNLABELLED` (P0) | §4 sec 6 | where the label was looked for |
| zynkr-gm | `CHANGED` / `TRACKER_DELTA` | the `Δ` on the item's line in sec 4 | field: old → new (`derive_state.py --prev` CHANGE_FIELDS = 狀態/開始/結束/負責人; `tracker_diff.py` FIELDS = 狀態·開始·結束·負責人·Priority; 備註 is never diffed) |
| pack §3 lint | 掛 All (`負責人 = All`, any priority) | §4 sec 3 | — |
| pack §3 lint | LOAD (one owner > 3 P0) | one line at the end of sec 4 | count |
| tag | 會議提到 (Fireflies action item names the `#` / 項目) | suffix on the item's line | one sentence |
| count | 完成 recent (狀態 = 完成 AND transition since baseline; no baseline ⇒ 結束 ≥ as-of − 14 d) | §4 sec 5 | 結束 date |

An item can carry several states; print it once per section it belongs to. Order inside a
section: P0 → P1 → P2, then by `#`. P3 rows are not reported unless 狀態 changed.

## 4 · Team Weekly agenda block — fixed shape (zh-TW, chat)

```
【<cycle> Tracker 同步】<YYYY-MM-DD>（Team Weekly 議程區塊）
tracker：<Sheet 名稱> · 讀取 <n> 項（不含 L1 標題列）· 狀態來源：<zynkr-gm scripts / zynkr-gm progress / fallback rules> · 基準：<tracker-snapshots YYYY-MM-DD / 貼上區塊 / Gmail 草稿 / 首次，無 Δ>

1. 本週 focus 提醒
   每週一貼 1–3 件當週 focus、週四 review。本週 focus：<--focus 文字，否則「（待填）」；公司層級 focus 見 zynkr-gm 週報>

2. OVERDUE／ENDS_SOON（<n> 項）
   - OVERDUE #2.02 <項目>（王小明 · P0 · 進行中 · 結束 2026-08-10 已過 5 天）備註：<…>
   - OVERDUE #1.05 <項目>（李小華 · P1 · 未開始 · 開始 2026-08-01 已過 12 天）會議提到：<action item 摘句>
   - ENDS_SOON #3.04 <項目>（王小明 · P0 · 進行中 · 結束 2026-08-20，還有 7 天）

3. UNDATED／掛 All（<n> 項）
   - UNDATED #4.03 <項目>（王小明 · P0 · 結束 YYYY-MM-DD）
   - 掛 All #3.04 <項目>（P1）— 需要認領

4. 各 owner P0/P1
   王小明：P0 #1.01 <項目> 進行中（Δ 狀態 未開始→進行中）· P0 #2.02 <項目> 進行中 OVERDUE · P1 #1.05 <項目> 未開始
   李小華：P0 #3.01 <項目> 完成 ✓ · P1 #3.02 <項目> 進行中 STALLED?（自 07-30 snapshot 無變動）
   （LOAD）王小明 持有 4 個 P0 — 建議轉 P2 或換 owner
   缺負責人：#4.05 <項目>（P2）
   STALLED：n/a（需 zynkr-gm 讀 [3.1] 週報與 SOT）

5. PROPOSE_DONE／上週完成（<n> 項）
   - PROPOSE_DONE #2.07 <項目>（李小華 · 進行中 · 備註「已上線 8/12」）— 請 owner 確認並改狀態
   - 完成 #3.01 <項目>（李小華 · 2026-08-12）<無基準時加：（近兩週結束日已到且狀態完成）>

6. 方向若變請明講：還在摸索／已定案
   DIRECTION_UNLABELLED：#1.01（僅查 備註；plan Doc 未讀）
```

Rules: no invented items; an empty section prints `—`; `Δ` only when a baseline exists; state
names appear exactly as above; owners appear in the order they first occur in the SOR tab.
When the block is also requested as a Gmail DRAFT the subject is `【Tracker 同步】<cycle>
<YYYY-MM-DD>` and the body is this block verbatim.

## 5 · Nudge block — one per owner with any OVERDUE / UNDATED / PROPOSE_DONE item (zh-TW, chat)

```
── 給 王小明 ──
Hi 王小明，週四 Team Weekly 前幫忙看一下 tracker 上你的這幾項：
- #2.02 <項目>：結束日 2026-08-10 已過、狀態還是進行中 → 更新狀態或改結束日
- #1.05 <項目>：開始日 2026-08-01 已過、尚未開始 → 是否啟動？若不做請標 放棄
- #4.03 <項目>：結束日還是 YYYY-MM-DD → 填一個日期
- #2.07 <項目>：備註寫「已上線」但狀態仍進行中 → 若已完成請改狀態
更新在 tracker 上就好，不用回信。方向若有變請直接寫「還在摸索」或「已定案」。
```

Gmail DRAFT only when the user says so; recipient addresses come from the user (the
tracker holds names, not addresses) — never guessed; sample addresses in this skill are
always `<name>@example.com`. Never sent.

## 6 · Snapshot tabs in the OKR & KPI Tracker (the only write; never the Main Tracker)

Target Sheet: the OKR & KPI Tracker (`planning-sources.md` §A, override `--okr`). Two tabs:

| Tab | Content | Write |
|---|---|---|
| `tracker-latest` | the current SOR rows (one snapshot) — the `rows.json` shape `derive_state.py` reads | clear + rewrite every run (RAW) |
| `tracker-snapshots` | history — every run's rows appended | append (RAW) |

Both tabs share one header (row 1), 15 columns A..O: the 13 tracker columns **exactly as
read** (`# · 主類別 · 子類別 · 項目（正規化） · 重要 · 緊急 · Priority · 負責人 · 協助者 · 開始 ·
結束 · 狀態 · 備註` — raw cell text, no normalisation, formulas as their displayed values) +
`snapshot_date` (`YYYY-MM-DD`, the as-of date) + `iso_week` (`YYYY-Www`). One row per data
row; `N.0` header rows skipped. Values only — no formulas, no formatting — and **every write
on both tabs is `modify_sheet_values(..., value_input_option="RAW")`**: `#` `1.10` / `2.0`,
`YYYY-MM-DD` placeholders and `2026-08-01` strings must be stored exactly as read
(`USER_ENTERED` would coerce `1.10` → 1.1 and dates → serials, breaking `derive_state.py`
keys and the `^\d\.0$` header match).

Procedure: `get_spreadsheet_info(<okr>)` → **plan printed first**: `tracker-latest ← <n>
rows (clear A1:Z, write A1:O<n+1>) · tracker-snapshots ← append <n> rows at A<r>:O<r+n-1> ·
snapshot_date <date> · iso_week <week>` + header + first two + last data rows (with `--force`:
also the existing rows to be deleted) → **first run** (interactive only; either tab
missing): the plan ends with ONE confirmation line — 「`Initiatives Q3-Q4`（stale P0+P1
mirror）改名 `tracker-latest`（減法，內容覆寫）· `tracker-snapshots` 新建 · OK?」 — and nothing
in the shared Sheet is created, renamed or written before the go. On go: `Initiatives Q3-Q4`
is renamed `tracker-latest` (the workspace MCP has no rename-sheet call, so the user renames
it in the Sheet UI as part of the go; `get_spreadsheet_info` again and continue only once a
tab named `tracker-latest` exists — its old rows are then overwritten by the header + rows,
`A1:O<n+1>`); if the user declines the rename, `create_sheet(sheet_name="tracker-latest")`
and leave the old tab untouched (pack §8: they may rename it `[SUPERSEDED YYYY-MM] …`
themselves); `create_sheet(sheet_name="tracker-snapshots")` when missing, then its header
→ idempotency: `read_sheet_values('tracker-snapshots'!N:N)`; rows with `snapshot_date` =
today already present ⇒ print their range and stop; `--force` ⇒ `resize_sheet_dimensions
(delete_row_range)` on exactly those rows, then append → `modify_sheet_values` ×2, both with
`value_input_option="RAW"` (`tracker-latest`: `clear_values` on the WHOLE used grid
`A1:Z1000` — the repurposed tab may hold an old header and columns beyond O — then write
header + rows at `A1:O<n+1>`; `tracker-snapshots`: `A<r>:O<r+n-1>` where `r` = last non-empty
row + 1) → read both back and print the counts. **Every** `snapshot` run (not only the
first) waits for a one-word go after the printed plan — the shared Sheet is never written on
the invocation word alone; `--force` row deletes always sit behind that same go. The `/schedule` routine (§9) never reaches this section —
snapshots are local runs; a non-interactive `snapshot` with a tab missing fails loud (hard
rule 9). Any other tab (`OKRs`, `KPI Dashboard`) and every Main Tracker tab are out of
bounds.

Reading it back: a snapshot = all rows sharing one `snapshot_date`; counts by priority × 狀態,
per-owner P0 and 掛 All / UNDATED / OVERDUE totals are derived by grouping — that is what
`planning-evidence-pack` S2 and `--retro` compute. To feed `derive_state.py --prev`, export
one snapshot's rows as JSON (the two extra keys are ignored by the script).

## 7 · Retro draft (`--retro`, zh-TW, chat) — the hand-off to `planning-prework-pack`

```
【<cycle> 回顧草稿 — tracker 視角】<YYYY-MM-DD>（給 planning-prework-pack 的 Pre-work by LOB / Laundry List 種子）
完成／PROPOSE_DONE by LOB：1.0 <n>/<m>（#… ）· 2.0 … · 5.0 0/0 ⚠ 無項目 · …
P0 結案率：<done>/<total>（<pct>%）· 放棄：<n>（#…）
Slipped（OVERDUE at cycle end）：#…（負責人 · 哪個日期 · 逾期天數）
Dropped（放棄）：#… — 備註原文
Owner load（P0/P1/P2/total）：王小明 4/2/3/9 · 李小華 …
Snapshot 走勢（tracker-snapshots）：<first snapshot_date> P0 open <a> → <last snapshot_date> P0 open <b>（無 snapshot 則「（待補）— 需要 snapshot」）
可交 prework-pack 的欄位：delivered ← 完成／PROPOSE_DONE by LOB · forward 候選 ← 未開始／進行中 · top risk ← slipped
未讀取：<sources not read this run — [3.1] 週報、SOT、plan Docs …>
```

Every number is a count over the SOR tab or `tracker-snapshots`; nothing else is consulted
unless the user pastes it (then it is marked `（使用者提供）`).

## 8 · Baseline for Δ (first hit wins)

1. The newest `tracker-snapshots` snapshot with `snapshot_date` < as-of — per-row, per-field
   (`derive_state.py --prev` → `CHANGED` on 狀態/開始/結束/負責人; `tracker_diff.py` → changed on
   狀態·開始·結束·負責人·Priority, plus added / removed rows; 備註 is not diffed); the only
   baseline that also gives STALLED its "≥14 days unchanged" evidence.
2. A block the user pastes with the invocation (status-level Δ per `#`).
3. Newest Gmail draft or sent mail with subject prefix `【Tracker 同步】` (this skill's own
   draft): `search_gmail_messages` `in:drafts` then `in:sent`, `subject:"【Tracker 同步】"`
   (status-level Δ).
4. Nothing ⇒ `基準：首次，無 Δ`.

## 9 · `/schedule` invocation (documented, not shipped) — READ-ONLY

Cron `0 9 * * 4` `Asia/Taipei` (Thursday 09:00 — the Team Weekly is Thursday evening,
sources §B). A claude.ai cloud routine has **no workspace-mcp Sheets write access**, so the
routine runs the agenda block only: no `snapshot`, no tab creation, no Gmail draft. The
snapshot is taken in a local interactive session (Step 6) — before or after the routine, by
hand — and the routine reads whatever `tracker-snapshots` rows exist as its Δ baseline (§8;
none ⇒ `基準：首次，無 Δ`). Routine prompt, verbatim:

```
Run /planning-tracker-sync --cycle H2 (unattended, read-only): read the Main Tracker SOR
tab from ./references/planning-sources.md, derive states with zynkr-gm's rules (fallback
rules if zynkr-gm is not installed here — say so in the header), use the newest
tracker-snapshots rows in the OKR & KPI Tracker as the Δ baseline if any, and print the
Team Weekly agenda block and the per-owner nudge blocks in the chat. Do NOT run snapshot,
do not create or rename any tab, do not create Gmail drafts, do not send anything, do not
write a single cell anywhere. If the SOR tab cannot be read, stop and print
「Tracker 同步失敗：<reason>」.
```

Wiring proof (SDD "prove it fired"): the first scheduled run is observed once — the run
date and the printed block header (狀態來源 + 基準) are recorded in the SKB-007 record before
the routine is left unattended. A local `snapshot` run the same week supplies the read-back
row counts.
