# KPI map — `KPI Dashboard` tab of `sources.okr_kpi_tracker`

19 metric rows (rebased 2026-08-06 to the Main Tracker; `Actual` empty for every row at seed time). Some rows carry a combined Tracker # (e.g. `1.01/1.02/1.10/1.11`); the runway/burn row has no `#`. **Never address rows by position** — `scripts/kpi_locate.py` reads the whole tab, resolves the `Actual` / `As of` / `Source` columns by header text and matches rows by Tracker # (normalised) with metric-name fallback. Owner below is the tracker `負責人` seed — re-read from the tracker each run; resolve emails via `people{}` in the private config.

Class: **AUTO** = the skill can compute it from a system of record · **SEMI** = partly readable, human confirms/attributes · **HUMAN** = no machine source; the skill asks, never invents.

| Tracker # | Metric | Owner (seed) | Class | Actual comes from | Fetch LOCALLY (tool + sketch) | Cloud routine? |
|---|---|---|---|---|---|---|
| 1.08 | 電子報 stack (Drip + 分流 + Pop-up) status | Mark | HUMAN (SEMI via repo log) | Kit account config + website-fe repo commits | `gh` / git log on the website repo for pop-up + Kit form commits; Kit account has no MCP (Kit MCP here is docs-only) | unfilled · ask owner |
| 1.03 | SEO 文章 cadence (1/wk) | Mark | AUTO | CMS Supabase `articles` | `mcp__supabase__execute_sql`: `select date_trunc('week', published_at) wk, count(*) from articles where status='published' and published_at >= now() - interval '8 weeks' group by 1 order by 1` (filter SEO category if the column exists) | no (Supabase not reachable) → unfilled · ask owner |
| 1.09 | 活化舊名單 progress | Mark | HUMAN | Kit / CSRC broadcasts | none (no Kit account MCP) | unfilled · ask owner |
| 1.01/1.02/1.10/1.11 | About / 敘事線 / 見證 / 合作廠商 shipped (n of 4) | Mark | SEMI | live site + tracker 狀態 | `WebFetch` the public pages + `read_sheet_values` on 「H2 專案項目」 rows 1.01/1.02/1.10/1.11 → count 進行中/PROPOSE_DONE | yes (tracker readable) — value is a proposal until owner confirms |
| 2.01 · 2.02 · 2.03 | Sales-ops P0 builds live (業務流程結構化 · On-board · 分潤系統) | Peter · Peter · Mark | SEMI | tracker 狀態 (human-set) | `read_sheet_values` on the three rows | yes (mirror tracker status; no invention) |
| 2.04 | 企業戶陌生開發 qualified accounts | Ernie | AUTO (if logged in CRM) | Zynkr CRM `crm_deals` | `mcp__zynkr__list_deals` (filter stage ≥ qualified, created ≥ H2 start; owner = 2.04 owner) or `execute_sql` on `crm_deals` | no (CRM not reachable) → unfilled · ask owner |
| 2.06 | 高 LTV 課程 revenue attributed | Jane | SEMI (revenue) / HUMAN (attribution) | accounting Supabase / Portaly / Accupass | `execute_sql` on the accounting project's revenue lines for the course SKUs; attribution tag does not exist → ask | unfilled · ask owner |
| 3.04 | 線下場次 + funnel | Jane | SEMI | [3.1] `#Operation` event list (Accupass link + 報名人數) + Calendar | parse newest [3.1] block Operation section (`extract_newest_block.py`); count events + 報名人數; Calendar via cloud connector only | yes (weekly log readable) — funnel conversion stays HUMAN |
| 3.01 | LINE 群 rhythm + conversion | Jane | HUMAN | LINE OA (connector beta only) | none | unfilled · ask owner |
| 3.02 | 內部講師 developed | Peggy | HUMAN | — | none | unfilled · ask owner |
| 4.01 | 企業 AI 診斷 engagements | Peter | SEMI | CRM consult deals + Notion Kanban | `mcp__zynkr__list_deals` (consult pipeline stages) + `notion-search` on the consultancy Kanban | no → unfilled · ask owner |
| 4.05 | 陪跑課 | Peter + Peggy | SEMI → HUMAN | course tracker 專案管理總表 | `read_sheet_values` on `sources.course_tracker` tab; % complete from task status | yes (sheet readable) |
| 4.07 | Vibe Coding | Peggy | SEMI → HUMAN | course tracker 專案管理總表 | same as 4.05 | yes (sheet readable) |
| 5.02 | 內部導入 Zynkr adoption | All | AUTO | Zynkr Supabase `crm_*` activity + AI usage metering | `execute_sql`: distinct active internal users / AI calls last 7d & 28d from the platform's usage tables | no → unfilled · ask owner |
| 5.03 | 分潤系統 build | Peter | SEMI | platform repo CHANGELOG / GitHub | `gh` on the platform repo: commits / spec IDs touching 分潤 | no (no gh) → unfilled · ask owner |
| 6.01 | 公司 KPI 制度 | Peter + Jane | HUMAN | — | none (this KPI *is* the KPI system; open P0) | unfilled · ask owner |
| — | Net monthly burn (NT$/mo) | Peter (Finance) | SEMI | zynkr-accounting Supabase | `execute_sql` on the accounting project: last closed month expenses − revenue; also `max(entry date)` = books-as-of | no → unfilled · RED if unknown |
| — | Runway (months) | Peter (Finance) | SEMI | zynkr-accounting Supabase | cash balance ÷ trailing-3-month net burn; books-as-of as above | no → unfilled · RED if unknown |

Permanently HUMAN (no MCP exists): 1.08 · 1.09 · 3.01 · 3.02 · 6.01. Say so in the brief instead of re-asking weekly; batch HUMAN asks monthly.

## Runway rule (C1 · O5)

- The **first line of every brief** is the runway line: `Runway ≈ N.N mo · burn NT$X/mo (cap NT$120k) · books as of YYYY-MM-DD (source)`.
- **RED** when runway < 4 months (guardrail: no spend that pushes runway below 4 months) **or** books-as-of is > 30 days old **or** the value cannot be fetched (unattended cloud runs: print `RED · unfilled — books not readable in this environment`). RED is never silent.
- Two clocks under the runway line: cash clock (months) and calendar clock (days to Q3 close 09-30 / H2 close 12-31).

## Write rule (P1 — local runs only)

1. Read the whole `KPI Dashboard` tab; `scripts/kpi_locate.py` returns `{tracker_no, row_index, actual_col, asof_col, source_col}` per row. Missing `As of` / `Source` columns → do **not** add columns (schema change to a canonical sheet needs a decision); write `Actual` only and put as-of + source in the brief.
2. Write single A1 cells with `modify_sheet_values` for AUTO and SEMI rows only: `Actual` = value, `As of` = `YYYY-MM-DD`, `Source` = tool/table.
3. Re-read the written cells and compare; mismatch → fail loud, do not retry blindly.
4. HUMAN rows: never write; list under "KPI asks" with owner. Never invent a value, never copy a target into `Actual`.
5. Cloud routines never write cells (no cell-level Sheets API via the Drive connector) — they report values in the brief for Peter to paste.
