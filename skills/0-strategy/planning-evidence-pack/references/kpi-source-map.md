# KPI → source routing map (planning-evidence-pack)

> Skill-specific reference. The shared files (`./planning-knowledge-pack.md`,
> `./planning-sources.md`) hold the vocabulary and the live IDs — this file only says,
> for each KPI family, **where the number comes from, how to read it, and what counts**.
> Nothing here is a number. Any KPI that maps to a source this run cannot reach is
> written as `（待補）` + the exact source needed (see §4).

## 1 · The two KPI kinds (decides what goes in `<cycle>-start` / `<cycle>-end`)

| Kind | Meaning | `<cycle>-start` | `<cycle>-end` | Δ |
|---|---|---|---|---|
| **stock** | a level at a date (subscribers, members, cash, agents on the marketplace, open P0 count) | the level on the cycle's first day (or the nearest reading before it) | the level on the cycle's last day, or on the as-of date for a mid-cycle run | end − start (absolute; add % in `note` when start > 0) |
| **flow** | a count inside a window (demos held, 直播 run, recaps received, items 完成) | **defined as** the same count over the **previous** cycle window of equal length (H2 → the H1 window; H1 → the previous year's H2; YE → the previous year) — only when the same source can be re-queried for that window; otherwise `—` | the count inside this cycle (start day → end day / as-of date) | end − start when start is a number; `—` otherwise |

Rules: a stock reading that has no source for the start date stays `（待補）` in `<cycle>-start`
even when the end value is known — never back-fill from memory or interpolate. `Δ` is a
formula-free literal so the tab is copy-paste safe into a deck. Because the column header
`<cycle>-start` means two things, a flow row's `note` opens with `baseline = 上一週期
<window>`, and its slide tile is labelled `Δ … vs 上一週期` (stock tiles: `vs <cycle>-start`)
— see `./scoreboard-layout.md` §3.

## 2 · Source families and how to read them

| # | Source | Reach it with | What counts | Kind |
|---|---|---|---|---|
| S1 | **Main Tracker — SOR tab** (`<cycle> 專案項目`, ID + gid in `./planning-sources.md` §A) | `read_sheet_values` on the SOR tab; columns per pack §6 | 狀態 exactly `完成` (pack §3 vocabulary; trim + exact match, no fuzzy mapping) grouped by 主類別 L1 · P0 完成 / P0 total · 放棄 count | flow (完成 counts) / stock (open P0) |
| S2 | **OKR & KPI Tracker — `tracker-snapshots` tab** (ID in `./planning-sources.md` §A), written by `planning-tracker-sync snapshot` — never the Main Tracker: 15 columns = the 13 tracker columns exactly as read (`# · 主類別 · 子類別 · 項目（正規化） · 重要 · 緊急 · Priority · 負責人 · 協助者 · 開始 · 結束 · 狀態 · 備註`) + `snapshot_date` + `iso_week`, one row per data row, `N.0` header rows skipped | `read_sheet_values` on that tab; a snapshot = all rows sharing one `snapshot_date`; derive counts by 狀態 × Priority (and per-owner P0) by grouping | earliest and latest `snapshot_date` inside the window → `<cycle>-start` / `<cycle>-end` for stock-type tracker KPIs (open P0, 進行中 count). No snapshot in the window ⇒ the start cell is `（待補）` with note 「需要：OKR & KPI Tracker tracker-snapshots @ <window start>（跑 planning-tracker-sync snapshot）」. `tracker-latest` (same shape, current rows only) is not a baseline | stock |
| S3 | **OKR & KPI Tracker** (`OKRs` tab: Objective · KR · Owner · Tracker # · Q3 · Q4 · Status · Notes; `KPI Dashboard` tab: 19 metric rows, matched by Tracker # / metric name — never by position) | `read_sheet_values` per tab | every KR row becomes one KPI row (source = `OKR tracker`); the KR's Status + Q3/Q4 cells are copied verbatim into `note`; a numeric target in the KR text goes into `note` as `目標 …` — the actual value still needs its own source (S4–S6, or §2a via zynkr-gm) or `（待補）`. Exception: a `KPI Dashboard` row with `Actual` + `As of` + `Source` all filled (zynkr-gm's write rule) is a dated read value → `<cycle>-end`, `note` = `kpi-map <Tracker #> · as of <date> · <Source cell>` | mixed |
| S4 | **Google Calendar** — the `claude_ai_Google_Calendar` connector only (the workspace-mcp Calendar API is disabled — sources file header) | `list_events` over the window, month by month (12 calls for YE) so pagination never truncates; expand recurring instances if the connector offers a single-instance mode | count events whose **title** matches one pattern in §3; exclude cancelled events and events the account declined; an event matching two patterns is counted once, under the first pattern in §3 order | flow |
| S5 | **Gmail — Fireflies recaps** | `search_gmail_messages` `from:fireflies.ai subject:"Fireflies recap" after:YYYY/MM/DD before:YYYY/MM/DD`; page through until the result set is exhausted; titles from the subject line after `Fireflies recap – ` | one recap = one held meeting; total count + counts per title pattern (§3 rows Team Weekly / 合夥人 / 1:1 / other) + the list of distinct titles for `note` | flow |
| S6 | **User-pasted numbers** — Kit subscribers · LINE OA members · marketplace agents/skills · platform metrics (workspaces, paid seats, AI usage) · accounting (cash · monthly burn · runway months) | the user pastes `KPI = value @ date` lines, or names a read-only connector + query the run may execute (recorded verbatim in `note`) | exactly what was pasted, with its date; a value without a date is asked back once, then recorded as `（待補）` | stock (mostly) |
| S7 | **Course-project tracker** (`project-status-update` owns it — sources §B) | do **not** re-read; ask the user for the latest 專案週報 numbers if a course KPI is on the list | — |

Not readable this run, always say so instead of pretending: Google Chat (API disabled) ·
Kit / LINE / Portaly / Supabase without a connector the user explicitly points at.

## 2a · When `zynkr-gm` is installed — cite its `kpi-map.md`, do not re-derive

`zynkr-gm` (sheetId 0.02) installs at `~/.claude/skills/zynkr-gm` or
`~/.agents/skills/zynkr-gm`. Its `references/kpi-map.md` maps every `KPI Dashboard` row
(Tracker # → metric → owner seed → class **AUTO / SEMI / HUMAN** → 「Actual comes from」 →
local tool sketch). For any KPI that is a `KPI Dashboard` row:

| kpi-map class | What this skill does |
|---|---|
| **AUTO** / **SEMI** | route = the tool the map names (`execute_sql`, `list_deals`, `read_sheet_values`, `WebFetch` …); execute it **read-only and only if the user names that connector this run** (S6 rule); otherwise `（待補）— 需要：<map's "Actual comes from"> @ <date>（kpi-map <Tracker #>）` |
| **HUMAN** | `（待補）` with the owner from the map (batch the asks; the map's "permanently HUMAN" list is not re-asked per row) |

`source` stays the S-family label; `note` starts with `kpi-map <Tracker #>` so the row is
auditable back to zynkr-gm. Never write zynkr-gm's `Actual` / `As of` / `Source` cells —
that is its P1 write rule, not this skill's. Not installed ⇒ §2 alone applies.

## 3 · Calendar + recap title patterns (S4 / S5)

Match case-insensitively on the event or recap title; the pattern list is ordered — first
match wins. Latin patterns are **word-bounded** (a whole word or space-separated phrase —
`demo` matches 「Zynkr demo」 not 「demography」; there is deliberately no bare `live`
token, which would hit 「Delivery」 / 「Deliverables」); CJK patterns match as substrings
(no word boundaries in CJK).

| KPI row | Title contains any of | Notes |
|---|---|---|
| Demo 場次 | `demo` · `示範` · `產品展示` | sales demos incl. AI 平台 demos; a 1:1 titled 「demo review」 is a false positive → check the description before counting, note the exclusion |
| 線下講座 | `講座` · `線下` · `workshop` · `工作坊` · `企業內訓` | physical or client-site sessions |
| 直播 | `直播` · `livestream` · `live stream` · `webinar` | exclude 「直播筆記」 working blocks (title has 筆記) |
| Team Weekly | `team weekly` | Thu evening rhythm (sources §B) |
| Weekly 合夥人 | `合夥人` | Tue morning rhythm |
| 1:1 | `1:1` · `1on1` · `one on one` | per-person split is optional; only when the user asks |
| Offsite | `planning & team building` · `planning session` | 1 per cycle is normal |

New patterns the user adds are appended to this table in the run's `note` column, not
silently applied.

## 4 · The `（待補）` contract

When a KPI cannot be read this run, the cell is literally `（待補）` and `note` states the
exact source, in this shape:

`（待補）— 需要：<system> <object> @ <date>（<who/how>）`

Examples of the shape (illustrative, not data):
`（待補）— 需要：Kit 訂閱者總數 @ 2026-07-01（Kit dashboard，請貼上）` ·
`（待補）— 需要：OKR & KPI Tracker tracker-snapshots @ 2026-07-01（跑 planning-tracker-sync snapshot）` ·
`（待補）— 需要：帳務 app 現金餘額 @ 2026-06-30（accounting export）`.

Never: an estimate, a "roughly", a range guessed from memory, or a value copied from a
previous deck without a dated source.
