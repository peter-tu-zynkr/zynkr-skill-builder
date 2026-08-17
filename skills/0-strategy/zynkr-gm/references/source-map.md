# Source map — the SOR read set (roles, not IDs)

Every source is addressed by its **role key** in the private config (`config.example.json`); the real Drive ID is resolved at runtime from `sources.<key>.id`. Never hard-code IDs in this repo. Read only the authoritative slice named below — the rest of each doc is downstream copy and loses on conflict.

| Role key | What it is | Authoritative slice (read ONLY this) | Rank | Read policy | Cloud (Drive connector) | Local (workspace-mcp) |
|---|---|---|---|---|---|---|
| `sources.vms_v2` | Vision-Mission-Strategy v2 (Doc) | TOP section "H2 2026 alignment" only. Body = May snapshot; alignment section wins on conflict. Thesis, two levers, cuts, guardrails. | 1 | on `modifiedTime` change; force monthly | read | read |
| `sources.integrated_refresh` | H2 2026 Plan — Integrated Refresh (Doc) | "2026-07-28 Refresh (v2)" addendum only: 減法 thesis, P0 list (14), management fixes, open decisions, four constraints C1–C4. §1–§13 lose. | 1 | on `modifiedTime` change; force monthly | read | read |
| `sources.main_tracker` | H2 Planning Main Tracker (Sheet) | tab 「H2 專案項目」 — cols `#` · `項目` · `Priority` · `負責人` · `開始` · `結束` · `狀態` · `備註` (also 主類別/子類別/重要/緊急/協助者; keep). **THE status source** for scope · priority · owner · status. Vocab: 未開始 / 進行中 / 放棄 only. Other tabs (H1 回顧總結, 專案項目小記, ②③④) = reference only. | 2 | every run | read (export; filter to tab) | read (`read_sheet_values` on the tab, resolve columns by header text) |
| `sources.ops_weekly` | [3.1] 營運每週彙報 Operation weekly (Doc, tab 「每週事項 2026」) | Newest `## <Mon DD, YYYY>` block only (newest first; blocks are Thursday-dated). STALLED needs the newest **two** blocks. Fixed skeleton: `#Team update` · `#Demand Marketing` · `#AI consulting & Sales` · `#Operation` · `#Knowledge product` · `#AI assistant development team` (+ Tech product · People · Finance), each with `Metrics:` bullets (mostly bare `#`). | 3 | every run | read (large → extract) | read (large → extract; see below) |
| `sources.okr_kpi_tracker` | H2 2026 — OKR & KPI Tracker (Sheet) | tabs `OKRs` (O1–O5, Q3/Q4 targets, Status) + `KPI Dashboard` (19 metric rows; `Actual` column). Tab `Initiatives Q3-Q4` is a **stale mirror** of the tracker — never read for status. May also host the skill's state tabs (see SKILL.md). | 4 | KPI Dashboard every run; OKRs at month / quarter | read | read + cell write (`modify_sheet_values`, P1 only) |
| `sources.ops_heal_tracker` | Ops H2 gap-audit 行動追蹤表 (Sheet) | tabs `修復清單` (heal list, progress SOT for 3.x) + `待決事項` (open decisions → brief ④). | 5 | every run | read | read |
| `sources.course_tracker` | Course project tracker (Sheet) | tab `專案管理總表` — task status/dates for 4.05 / 4.07 (Claude Code course line). project-status-update owns the email; zynkr-gm reads status only. | 5 | every run | read | read |
| `sources.knowledge_directory` | GM Knowledge Directory (Doc) | SOR precedence table + `核心文件` entries + `Maintenance` rules. Governance input for `learn`. | gov | monthly (`learn`) + on `modifiedTime` change | read | read; append-only write via `learn --apply` |
| `sources.org_taxonomy` | Org Taxonomy (Doc) | live tab "Org Taxonomy v2" — LOB 0–9 + DRIs. Owner resolution. | gov | monthly | read | read |
| `sources.plan_docs.<lob>` | 7 function plans: `1.0` `2.0` `3.0` `4.0` `6.0` `7.0` `8.0` (Docs, single tab) | TOP "2026-08-06 Refresh — aligned to the H2 Planning Main Tracker" block only (P0/P1 tracker IDs + owner + optional date range; retired KPIs; 已定案/還在摸索 labels). Where a later "2026-08-10 Addendum" exists it wins over both. **No status lives here.** Body §1–§9 = May cut, superseded. Note: tracker numbers 6.0→`5.x`, 7.0→`6.x`; 8.0 has no tracker rows. | 6 | on `modifiedTime` change only (key doc-watch on target IDs, not H2-folder shortcuts) | read | read |
| `sources.eae_readme` | [5.0] Enterprise AI Enablement — README (Doc) | 1-page pointer (五階段交付, consult-* chain, offering SOR link). Not a plan; no tracker rows of its own (EAE lives under 4.01). | 6 | on `modifiedTime` change | read | read |
| `sources.livestream_notes_folder` | 直播筆記 output folder (Drive folder) | Newest file `modifiedTime` only — health check that curate-livestream-transcripts ran this week. Never run it. | health | every run | list | list |
| `sources.move_log` | GM knowledge move log (Sheet) | append one row per `learn --apply` change (before → after). | gov | write on `learn --apply` | — | append |
| `sources.core_folder` / `sources.h2_planning_folder` | Drive folders holding the 0-level originals / the H2 suite | folder listings for `learn` drift (name · type · modifiedTime · shortcut target). | gov | monthly | list | list |
| `sources.onboarding_master` | Onboarding 母本 (shared facts) | read for ⛔ deprecated paths only. `never_write: true` — shared-fact changes are proposed, never applied. | gov | monthly | read | read |

Non-Drive reads (tools, not `sources.*` keys): CRM via `mcp__zynkr` (`list_deals`, `list_tasks`) for 2.x / 4.01; CMS Supabase `articles` for 1.03; accounting Supabase for runway / burn; Calendar for the calendar clock (cloud connector only — the workspace-mcp Calendar API is disabled locally). See `kpi-map.md`.

## Precedence

- Strategy: `vms_v2` "H2 2026 alignment" > VMS body. `integrated_refresh` addendum > its §1–§13. When the two alignments differ, the newer dated block wins and the brief cites both dates.
- Plans: Refresh block (and any later dated addendum) > plan body.
- Status / scope / owner: **Main Tracker** > OKR & KPI Tracker (OKRs; Initiatives tab is stale) > plan docs > narrative docs. Function SOTs (`ops_heal_tracker`, `course_tracker`, CRM, accounting) are evidence for progress, never for scope.
- Never restate a number from a narrative doc; every number cites SOR + as-of date.

## ⛔ Deprecated paths (from the 母本; respect, never resurrect)

- Knowledge-Management product line **paused for H2** (both B/C routes 放棄).
- Career Development line = **harvest-only** (no new build).
- No retired pricing tiers (Skool / Marketplace pricing, old B2C tiers) — pricing SOR is the offering sheet, not plan docs.
- No Custom GPTs.

## How to read a big doc

`get_doc_as_markdown(document_id, include_comments=false)` has no range/tab parameter; `ops_weekly` (~266k chars), `vms_v2` and the plan docs will overflow context. Procedure: (1) call with `include_comments=false`; (2) when the harness saves the oversize result to a file, do NOT read it whole — run `python3 scripts/extract_newest_block.py <dump-file> --blocks 1|2` (weekly log: newest `## <Mon DD, YYYY>` block(s)) or `--heading "H2 2026 alignment"` / `--heading "Refresh"` (VMS / plan docs: first top-level dated block); (3) read only the extract. Gate every plan-doc / VMS read on `modifiedTime` from the doc-watch state so steady-state runs read no plan doc at all. Cloud (Drive connector `read_file_content`) returns the same full text — apply the same extract before reasoning.
