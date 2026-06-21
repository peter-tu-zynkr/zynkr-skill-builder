# SEO Program Planner — Config

Single source of truth for the IDs and accounts the **`seo-program-planner`** orchestrator depends on. This skill works at *program scale* (whole product / whole site): it reuses the existing `seo-*` strategy skills (`seo-persona-builder` … `seo-demand-validator`) and adds program-level synthesis (pillar groups · IA decisions · money pages · calendar · governance · multi-tab Sheet · 14-section Doc), then produces a plan Doc + keyword Sheet and hands the resulting topic backlog to `seo-article-pipeline`.

Resolve every placeholder here. When something moves, update this file — don't edit the SKILL.md.

> **Relationship to `seo-pipeline-config.md`:** that config governs the per-article pipeline; this one governs the upstream program planner. They deliberately **share** the SEO Knowledge Base (`seo_kb_folder_id`) and its `rubrics_folder_id` so brand context and strategy rubrics stay single-sourced. The only IDs unique to this skill are the **two output buckets** (plan Doc → `00 SEO Strategy & Plans`; keyword Sheet → `01 Keyword Maps`) and this skill's own reference rubrics.

---

## Google account

```
user_google_email: peter_tu@zynkr.ai
```

All Google Workspace MCP calls (Drive search/read, Doc create, Sheet import) use this account.

---

## Output buckets (where program artifacts land)

This skill produces exactly two durable artifacts per run and writes each to its own Drive bucket. These are the IDs unique to `seo-program-planner`.

```
plan_doc_folder_id:      1sOSDf-5qWdJSwJDwGjT1baFO-HagfS2l   # 「00 SEO Strategy & Plans」— the 14-section plan Doc lands HERE
plan_doc_folder_url:     https://drive.google.com/drive/folders/1sOSDf-5qWdJSwJDwGjT1baFO-HagfS2l

keyword_map_folder_id:   1O2ccAOpXgXC1ti-fKqG6SCYUanVT4Jr4   # 「01 Keyword Maps」— the 9-tab keyword Sheet lands HERE
keyword_map_folder_url:  https://drive.google.com/drive/folders/1O2ccAOpXgXC1ti-fKqG6SCYUanVT4Jr4
```

### Build & land procedure

- **Plan Doc** — assemble the 14-section plan as markdown, then `import_to_google_doc` into `plan_doc_folder_id`. Name: `<產品/網站> SEO 計畫`.
- **Keyword Sheet** — build the 9 tabs as a single `.xlsx` with `openpyxl` (one worksheet per tab), then `import_to_google_sheets` into `keyword_map_folder_id`. Name: `<產品/網站> 關鍵字地圖`.
- **Append-into-folder rule** (when a create-API lands at Drive root instead of the target folder): `update_drive_file(add_parents=<folder>, remove_parents='root')`.

### 14-section plan Doc structure

`Phase0 基礎建設` · `0 TL;DR` · `1 Why now` · `2 Positioning`(類別 POV + named frames + voice/誠實 + 軌道分流)· `3 Audience & funnel`(persona 反推 + 楔子 + intent map)· `4 內容架構`(pillar hub & spoke)· `5 轉換層`(IA 決策 + money pages + tools/proof 引擎 + glossary)· `6 關鍵字與 intent 策略` · `7 工具/證明引擎 build priority` · `8 CTA ladder` · `9 KPIs` · `10 Governance` · `11 Operating model` · `12 Backlog` · `13 Month-by-month` · `14 90 天標準` · `Appendix`(sheet tabs).

### 9-tab keyword Sheet structure

`Keyword Pool` · `Topic List` · `Comparison/Use-Case`(或 `Skill↔Use-Case`)· `Free Tools/Templates`(或視產品調整)· `Glossary` · `AEO Citation-Gap` · `Money-Page/Tech-SEO Recon` · `Personas` · `Pillar Legend`.

---

## SEO Knowledge Base (shared with seo-pipeline-config)

Brand context + seed knowledge + strategy rubric masters live in the same SEO-KB as the per-article pipeline. This skill **reads** brand context here (it does not create per-article working folders here — its outputs go to the two buckets above).

```
seo_kb_folder_id:  1ujQJSPjRcqkNd-BMGq68DmVldyr3lsJ2
seo_kb_folder_url: https://drive.google.com/drive/folders/1ujQJSPjRcqkNd-BMGq68DmVldyr3lsJ2
```

Key brand-context file: `00 Brand Context (SEO source of truth)` = `1XF5VbcDtAcktE8wptTF7ejqPi21DFbtEMm3bHsF9ssE` — the program planner reads this first to ground positioning (§2) and persona reverse-engineering (§3).

---

## Knowledge resolution rule (Drive-first, local fallback)

Every rubric this skill depends on — both the **reused** strategy-skill rubrics and this skill's **own program-level rubrics** — is hosted as an editable Google Doc master in the SEO-KB subfolder `01 Rubrics & Templates`, AND kept as a local `./references/*.md` fallback inside this skill.

**At runtime, the skill must:**
1. Try Drive first — `search_drive_files` in `rubrics_folder_id` by the doc name, then `get_drive_file_content`. This is the master copy Peter edits.
2. If Drive is unavailable / not found / no MCP access → fall back to the bundled `./references/<file>.md`.
3. If the two ever diverge, the Drive version wins; sync the local copy on next edit.

```
rubrics_folder_id:  1YUUrX0e5JDKy6C0QcWeWD9NfKQpKqXWW   # 01 Rubrics & Templates (shared SEO-KB subfolder)
rubrics_folder_url: https://drive.google.com/drive/folders/1YUUrX0e5JDKy6C0QcWeWD9NfKQpKqXWW
```

### Reused strategy-skill rubrics (already mastered in Drive)

The program planner dispatches these strategy stages via the Skill tool; each resolves its own rubric through `seo-pipeline-config.md`. Listed here only so this skill knows what the dispatched stages will pull — **do not duplicate or re-host them.**

| Dispatched skill | Drive doc (name) | Resolved by |
|---|---|---|
| seo-persona-builder | persona-rubric | seo-pipeline-config.md |
| seo-question-miner | question-frames | seo-pipeline-config.md |
| seo-angle-finder | seo-angle-rubric | seo-pipeline-config.md |
| seo-keyword-mapper | keyword-checklist | seo-pipeline-config.md |
| seo-keyword-classifier | keyword-sop · intent-taxonomy | seo-pipeline-config.md |
| seo-demand-validator | competitor-review-table | seo-pipeline-config.md |

### This skill's own program-level rubrics (Drive master ↔ local fallback)

These cover the program-synthesis steps no existing `seo-*` skill performs. **References ship LOCAL first; Drive masters are TBD — Peter creates them later in `01 Rubrics & Templates`, then fill the Drive doc ID column.** Until then, runtime resolution falls straight through to the local fallback.

| Program-synthesis step | Drive doc (name) | Drive doc ID | Local fallback |
|---|---|---|---|
| Pillar-group definition (hub & spoke) | pillar-rubric | _TBD_ | ./references/pillar-rubric.md |
| IA decision rubric (CMS articles vs /free-resource vs new category vs sub-site) | ia-decision-rubric | _TBD_ | ./references/ia-decision-rubric.md |
| Money-page & tech-SEO recon (noindex/SSR/meta/canonical/schema/sitemap) | money-page-recon | _TBD_ | ./references/money-page-recon.md |
| AEO citation-gap & answer-engine coverage | aeo-citation-gap | _TBD_ | ./references/aeo-citation-gap.md |
| CTA ladder (TOFU→BOFU) | cta-ladder-rubric | _TBD_ | ./references/cta-ladder-rubric.md |
| KPIs & governance gates | kpi-governance-rubric | _TBD_ | ./references/kpi-governance-rubric.md |
| Topic-backlog & month-by-month calendar | backlog-calendar-rubric | _TBD_ | ./references/backlog-calendar-rubric.md |
| 14-section plan Doc template | plan-doc-template | _TBD_ | ./references/plan-doc-template.md |
| 9-tab keyword Sheet template | keyword-sheet-template | _TBD_ | ./references/keyword-sheet-template.md |

---

## Worked examples (reference plans the skill can pattern-match against)

Two real program plans this team produced; use as shape references for the Doc + Sheet output, not as content to copy.

| Program | Plan Doc | Keyword Sheet (9 tabs) |
|---|---|---|
| Zynkr CRM 產品 SEO 計畫 | 1Zbw3zpnA_ev5M2Kt0fLCW-cj-_sOQhYQtB9mB6krzro | 11W4L-iZZ0Z9pqIhPp4x6iCGCJoI4-N_zwZrWcXPR5XY |
| Zynkr AI 技能市集 SEO 計畫 | 1X-yWQ6OXhkBS-n1MgUnNHntZrGmvcuU0HrHeLPumKPY | 17f4wSRTyHsBHjsjH4-TK1geWZab_dvMCVlhLhQIzROs |

---

## House guardrails (apply to every plan this skill produces)

- **Honesty:** market only **shipped** features/capabilities; every demand claim carries signal + 依據; never invent search volumes; mark unverified figures `(待驗證)`.
- **House style:** zh-TW 標題/標語 do not end with 句號 (。); series separator is ·; lists use 1️⃣2️⃣3️⃣ (never ①②③).
- **Voice (no hype):** banned words — 賦能 · 生產力工具 · AI-powered · 無縫/seamless · supercharge · cutting-edge · game-changing. External AI attribution uses the generic **powered by Claude**.
- **IA default (real stack):** educational content runs through CMS `articles` + the existing `/free-resource` + a new category → `/blog/<slug>` SSR; **do not** spin up a sub-site. Tech-SEO step first checks whether each money page is indexable (noindex / SSR / meta / canonical / schema / sitemap).

---

## Conventions

- Output Doc name: `<產品/網站> SEO 計畫`; output Sheet name: `<產品/網站> 關鍵字地圖`.
- Languages: zh-TW primary; English flagship terms where AEO reach in English-dominant engines matters.
- Handoff: on completion, the `Topic List` tab + §12 Backlog are the entry point for `seo-article-pipeline` (it picks one topic and writes it through to publish).
