# Keyword Pool & Companion Sheet Schema

Rubric for the multi-tab companion **Sheet** that `seo-program-planner` produces alongside the 14-section plan Doc. The Doc holds the strategy narrative; this Sheet is the **machine-readable backlog** — the keyword pool, topic list, and recon tables that `seo-article-pipeline` later reads from when it picks a topic to write.

This is a **Drive-first / local-fallback** rubric: the canonical editable master lives on Drive once Peter creates it; this file (`./references/keyword-pool-and-sheet-schema.md`) is the runtime fallback. At runtime, try the Drive master first, then fall back to this local copy.

Worked examples to model the output on:
- Zynkr CRM product SEO plan — Sheet `11W4L-iZZ0Z9pqIhPp4x6iCGCJoI4-N_zwZrWcXPR5XY`.
- Zynkr AI skills marketplace SEO plan — Sheet `17f4wSRTyHsBHjsjH4-TK1geWZab_dvMCVlhLhQIzROs`.

---

## House requirement discipline (applies to every row of every tab)

Bake these into the data, not just the prose. A row that violates them does not ship.

- **Signal + basis, never invented volume.** There is no "search volume" column. Demand is recorded as a **signal** (e.g. forum-thread-count, AI-engine-asks-it, sales-ticket-recurs, competitor-ranks) plus its **basis** (where the signal came from). Never fabricate a numeric search volume; if a tool genuinely returned one, cite the tool in the basis and still treat it as a signal, not truth.
- **待驗證 (to be validated) flag.** Any keyword/topic whose demand is inferred rather than observed carries `待驗證` in its demand column. `seo-demand-validator` clears the flag later; the planner never silently asserts confirmed demand.
- **Only shipped capability.** Every keyword/topic must trace to a capability the product has **already shipped** (`maps-to-shipped-capability`). If it maps to roadmap-only or imagined functionality, it does not enter the pool — drop it or move it to a clearly-labelled "future, do not write yet" holding area.
- **No hype, no句號, emoji numerals.** Cell copy obeys house style: zh-TW headings/labels take no 句號 (。), series separators use ·, lists use 1️⃣2️⃣3️⃣ (never ①②③). Tone stays no-hype; banned words 賦能 / 生產力工具 / AI-powered / 無縫 / supercharge / cutting-edge / game-changing must not appear in any cell. External-facing capability phrasing uses "powered by Claude".

---

## The 9 tabs

Tab order is fixed so the two worked examples and every future plan line up. Tabs 1–2 are the spine `seo-article-pipeline` consumes; 3–9 are the supporting research that justifies the spine.

### Tab 1 — Keyword Pool

The atomic unit. One row per keyword. This is the tab the pipeline reads to pick what to rank for.

| Column | Meaning |
|---|---|
| `pillar` | Which pillar/hub this keyword belongs under (must exist in Tab 9 Pillar Legend) |
| `intent cluster` | The intent grouping inside the pillar (e.g. 比較類 · 教學類 · 場景類 · 決策類) |
| `funnel` | TOFU · MOFU · BOFU |
| `keyword` | The query itself, as a buyer would type it |
| `lang` | zh-TW · EN (zh-TW is primary; EN rows are flagship/AEO reach candidates) |
| `form` | short-head · long-tail · question · comparison · entity |
| `BOFU?` | ✅ if this is a bottom-of-funnel decision query (consultant · ROI · 比較 · 推薦 · 報價); blank otherwise — used to guarantee the funnel actually reaches a decision |
| `AEO?` | ✅ if this is a full-sentence question an AI engine would be asked (drives Tab 6 citation-gap work) |
| `demand 信號` | The demand **signal + basis** (e.g. "PTT 多串討論｜basis: 3 threads"; "ChatGPT 常被問｜basis: prompt-mined"); append `待驗證` if inferred |
| `maps-to-shipped-capability` | The already-shipped product capability this keyword sells; blank is disallowed |
| `money page` | The destination money page / conversion target this keyword should route toward (must exist in Tab 7) |
| `layer` | IA layer this lives in: blog-article · /free-resource · 新 category · glossary · in-product tool · comparison-page |

### Tab 2 — Topic List

One row per **publishable article** (the backlog `seo-article-pipeline` selects from). Several keywords from Tab 1 cluster into one topic.

| Column | Meaning |
|---|---|
| `topic title (工作標題)` | Working title; obeys house style (no 句號, · separators) |
| `pillar` | From Tab 9 |
| `primary keyword` | The head keyword from Tab 1 this topic targets |
| `supporting keywords` | Secondary keywords it should also capture |
| `funnel` | TOFU · MOFU · BOFU |
| `format` | how-to · comparison · listicle · 場景 deep-dive · glossary-expansion · FAQ-hub |
| `maps-to-shipped-capability` | Same discipline as Tab 1 |
| `target URL` | Intended `/blog/<slug>` (SSR) or existing `/free-resource` slot |
| `internal links to` | Which pillar hub / money page it should link into |
| `priority` | P0 · P1 · P2 (P0 = first wave) |
| `demand 信號` | Signal + basis; `待驗證` if inferred |
| `status` | backlog · briefed · drafting · published (planner seeds everything as `backlog`) |

### Tab 3 — Use-Case / Comparison

Bottom-funnel intercept rows. For a product like CRM this is 比較頁 (vs HubSpot · vs Attio · 場景用法); for the skills marketplace it is **Skill ↔ Use-Case** mapping. Name the tab to match the product but keep the slot.

| Column | Meaning |
|---|---|
| `row type` | comparison · use-case · skill↔use-case |
| `entity / rival` | The competitor or named use-case / skill |
| `our shipped angle` | The honest, shipped-only differentiator (no hype, no fabricated wins) |
| `target keyword` | The comparison/use-case query from Tab 1 |
| `money page` | Where it converts |
| `proof source` | The evidence backing any claim made (basis); `待驗證` if unproven |

### Tab 4 — Free Tools / Templates

The proof/lead-magnet engine inventory (rename per product if needed).

| Column | Meaning |
|---|---|
| `asset` | The free tool / template / checklist |
| `intent it serves` | The query/cluster it answers |
| `build state` | shipped · proposed (planner never markets a proposed asset as live) |
| `IA layer` | in-product tool · /free-resource · downloadable |
| `CTA target` | The money page it hands off to |
| `priority` | P0 · P1 · P2 |

### Tab 5 — Glossary

Entity/definition rows that feed AEO and internal-link density.

| Column | Meaning |
|---|---|
| `term (zh-TW)` | The term |
| `term (EN)` | English equivalent for flagship/AEO |
| `one-line definition` | House-style, no 句號 |
| `pillar` | From Tab 9 |
| `target URL` | glossary slot / anchor |
| `links to` | Pillars / money pages it should cross-link |

### Tab 6 — AEO Citation-Gap

Where AI engines answer the buyer's question but do **not** cite us yet — the AEO backlog.

| Column | Meaning |
|---|---|
| `AI question` | The full-sentence question (from Tab 1 `AEO?` rows) |
| `engine(s)` | Which engines were checked (basis for the gap) |
| `current citation` | Who gets cited today (or "none") |
| `gap type` | not-cited · cited-competitor · no-good-answer |
| `our shipped answer` | The shipped-only answer we can author |
| `fix asset` | The Tab 2 topic / Tab 4 asset that closes the gap |
| `待驗證?` | ✅ if the gap is inferred rather than observed |

### Tab 7 — Money-Page / Tech-SEO Recon

Indexability audit of every conversion destination — checked **before** routing keywords to it.

| Column | Meaning |
|---|---|
| `money page` | The URL (e.g. zynkr.ai/crm) |
| `indexable?` | ✅ / ❌ (is it `noindex`? SSR vs client-only?) |
| `render` | SSR · CSR (CSR pages need flagging for fix) |
| `meta/title` | present · missing · weak |
| `canonical` | present · missing · wrong |
| `schema` | present types · none |
| `in sitemap?` | ✅ / ❌ |
| `action` | The remediation needed before it can rank |

### Tab 8 — Personas

The reverse-engineered audience the whole plan is aimed at (output of `seo-persona-builder`).

| Column | Meaning |
|---|---|
| `persona` | Short label (e.g. 單兵業務 · SMB 老闆) |
| `楔子 / trigger` | The moment that sends them searching |
| `top intents` | Their dominant query clusters |
| `funnel entry` | Where they enter (TOFU question · BOFU comparison) |
| `maps-to-shipped-capability` | The shipped capability that serves them |
| `money page` | Their conversion destination |

### Tab 9 — Pillar Legend

The controlled vocabulary every other tab references. Build this tab **first**; all `pillar` values elsewhere must resolve here.

| Column | Meaning |
|---|---|
| `pillar id` | Short code used in other tabs |
| `pillar name (zh-TW)` | Display name, house-style |
| `hub URL` | The pillar hub page (hub-and-spoke center) |
| `owns query theme` | The cluster of intent this pillar owns |
| `maps-to-shipped-capability` | The shipped capability the pillar markets |
| `colour/legend note` | Optional legend note for the Doc's Pillar section |

---

## Build steps — openpyxl → import_to_google_sheets

The planner assembles the workbook locally with **openpyxl**, then imports it into the **「01 Keyword Maps」** Drive bucket (folder id resolved via the skill's Configuration). The plan Doc goes separately to **「00 SEO Strategy & Plans」** via `import_to_google_doc`.

1. **Resolve the output folder.** Read the `01 Keyword Maps` folder id from Configuration (Drive-first; fallback to the local config). The Sheet lands here, not in Drive root.
2. **Create one worksheet per tab, in the fixed order above.** `ws = wb.active; ws.title = "Keyword Pool"` for the first, then `wb.create_sheet(...)` for tabs 2–9. Use the exact tab names (rename Tabs 3/4 to the product-appropriate variant, e.g. "Skill↔Use-Case").
3. **Write the header row per the column lists above.** Header text is English column keys (stable for the pipeline to parse); cell **values** are zh-TW and obey house style.
4. **Style the header row** so the Sheet is scannable:
   - Bold white font: `Font(bold=True, color="FFFFFF")`.
   - Sage-deep fill to match brand: `PatternFill("solid", fgColor="3F5F5B")` (or the current sage-deep token from website-fe `styles.css`; don't invent a hex).
   - `freeze_panes = "A2"` so headers stay pinned while scrolling.
   - Sensible `column_dimensions[...].width` (wider for `keyword`, `demand 信號`, `our shipped angle`).
   - Wrap long cells: `Alignment(wrap_text=True, vertical="top")`.
5. **Seed Tab 9 (Pillar Legend) and Tab 8 (Personas) first** in the data pass, since other tabs' `pillar` / persona references must resolve against them. Then fill Tab 1 → Tab 2 → the recon/supporting tabs.
6. **Enforce the discipline columns on write:** if a row lacks `maps-to-shipped-capability`, do not write it; if `demand 信號` is inferred, append `待驗證`; never emit a numeric search-volume column.
7. **Save** to a temp `.xlsx`, then **`import_to_google_sheets`** into the `01 Keyword Maps` folder. Capture the returned Sheet id and write it into the plan Doc's Appendix (sheet-tabs section) so Doc and Sheet are cross-linked.
8. **HITL gate:** surface the Sheet link and a one-screen tab summary, and stop for Peter's confirmation before the planner treats the backlog as final / hands it to `seo-article-pipeline`.

---

## Out of scope for this tab

This Sheet records strategy and backlog. It does **not** rank keywords with invented metrics, does not write briefs or outlines (that is `seo-brief-writer` / `seo-outline-designer`), and does not publish (that is `seo-publish-article`). The Topic List (Tab 2) is the single handoff surface to `seo-article-pipeline`.
