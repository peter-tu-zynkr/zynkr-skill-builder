# Program-Planning Method — End-to-End SOP

The operating manual for `seo-program-planner`. This is the **Stage 0, program-scale** method: it takes a whole product/website (not a single article) and produces a strategy + execution plan — a 14-section plan Doc in 「00 SEO Strategy & Plans」 plus a multi-tab keyword/plan Sheet in 「01 Keyword Maps」 — then hands the topic backlog down to `seo-article-pipeline`, which writes the articles one at a time.

This rubric is a **Drive-first / local-fallback master**: the runtime reads this file from its Drive master if one exists, otherwise falls back to this local `./references/program-planning-method.md`. The local copy is canonical until Peter creates the Drive master.

It tells you, for each of 10 stages: what to do, **which existing `seo-*` skill to reuse vs. which part is program-level synthesis you do yourself**, and what each stage emits.

---

## 0. Orientation — what is and isn't this method

- **Scope = the whole program.** One run plans the SEO posture for an entire product or site: positioning, personas, pillar set, IA decisions, keyword pool, topic backlog, money pages, AEO posture, CTA ladder, KPIs, governance, calendar. The output is a *plan*, not an article.
- **Reuse, don't rewrite.** The early strategy stages (persona, questions, angles, keyword map, intent classification, demand validation) already exist as single-article `seo-*` skills. Run each at **program scale** (3 personas / many pillars / a full pool — not one topic's worth), and keep its native `SEO_PACKET ▸ X` handoff block intact.
- **Synthesis is the new work.** What no existing skill does: grouping pillars into a hub-and-spoke map, making the IA decision against the real stack, selecting money pages and recon'ing whether they're even indexable, building the CTA ladder / KPIs / governance / operating model, sequencing the calendar, and assembling the 14-section Doc + multi-tab Sheet. **You** do these.
- **Boundary.** This is not `seo-article-pipeline` (single article, drafts→publishes). This is not `seo-keyword-mapper` (expands keywords for one topic). When the backlog is approved, this method's job is done — `seo-article-pipeline` picks one topic from the backlog and writes it.

---

## 1. House guardrails (apply to every stage's output)

Bake these into every artifact the program produces — they are not optional polish.

- **Market only shipped capabilities.** Only position around features/abilities the product has actually shipped. Never imply roadmap as reality. Frame any forward statement as a capability that exists today.
- **Demand is signal + basis, never invention.** Do not fabricate search volumes. Every demand claim cites its signal source (forum threads, autocomplete, SERP, support tickets). Anything unverified is tagged `(待驗證)`.
- **House style (zh-TW).** Headings/taglines take **no 句號 (。)**; series separator is **·** not 。. Lists use **1️⃣2️⃣3️⃣**, never ①②③.
- **Voice = no hype.** Banned words: 賦能 · 生產力工具 · AI-powered · 無縫 · supercharge · cutting-edge · game-changing. Refer to the AI generically as **powered by Claude** in any outward copy.
- **IA defaults to the real stack.** Educational content goes through **CMS articles + the existing `/free-resource` + a new content category → `/blog/<slug>` SSR pages**. Do **not** spin up a sub-site or a `/learn` mini-app. Technical SEO starts by checking whether each money page can even be indexed (noindex / SSR vs. client-only / meta / canonical / schema / sitemap).

---

## 2. Intake (before Stage 1)

Collect and confirm three things; stop and ask if any are missing.

1️⃣ **Shipped capability inventory** — what the product can actually do today (features, surfaces, proof assets, existing public pages/tools). This is the only honest raw material for positioning and for "market only shipped" enforcement.
2️⃣ **Reference material** — brand guide, existing copy, competitor URLs, forum/community sources, support KB, any prior keyword work. Also point at the two **worked examples** below as structural templates.
3️⃣ **Goals & funnel** — what this program is for (which audience, TOFU/MOFU/BOFU mix, the one category POV to own), and any constraints (locale, geos, the single money page that matters most).

Also resolve the two **output buckets**: the folder id of 「00 SEO Strategy & Plans」 (Doc target) and 「01 Keyword Maps」 (Sheet target). IDs/account come from `seo-pipeline-config.md`.

**Worked examples (use as templates, do not copy figures):**
- Zynkr CRM product SEO plan — Doc `1Zbw3zpnA_ev5M2Kt0fLCW-cj-_sOQhYQtB9mB6krzro` + 9-tab Sheet `11W4L-iZZ0Z9pqIhPp4x6iCGCJoI4-N_zwZrWcXPR5XY`.
- Zynkr AI skills marketplace SEO plan — Doc `1X-yWQ6OXhkBS-n1MgUnNHntZrGmvcuU0HrHeLPumKPY` + 9-tab Sheet `17f4wSRTyHsBHjsjH4-TK1geWZab_dvMCVlhLhQIzROs`.

---

## 3. The ten stages

Legend: **[REUSE]** = dispatch an existing `seo-*` skill at program scale, keep its handoff block. **[SYNTH]** = program-level synthesis you perform yourself.

### Stage 1 — Persona reverse-engineering & positioning  [REUSE + SYNTH]
- **Reuse:** `seo-persona-builder` — but produce **3 MECE personas** for the whole program (not one article's reader). Each carries decision-state, search language, funnel stage, the real trade-off.
- **Synth (program-only):** the **positioning layer** — the category POV to own (e.g. CRM owns "AI-first sales platform for TW solo/SMB sales"), named frames, voice/honesty stance, and **track-splitting** (e.g. product-led SEO track vs. consulting track must not bleed into each other). Plus the **wedge**: the single first-use moment each persona is reverse-engineered back from.
- **Emits:** `▸ Personas`, `▸ Positioning`.

### Stage 2 — Question mining (seed demand)  [REUSE]
- **Reuse:** `seo-question-miner` across **all** personas and the whole topic space, not one angle. Pull the real questions each persona would type into Google / an AI engine.
- **Synth:** light — cluster the questions by persona × funnel stage so they feed pillar formation.
- **Emits:** `▸ Questions` (program-wide, clustered).

### Stage 3 — Angle finding  [REUSE]
- **Reuse:** `seo-angle-finder` to convert clustered questions into defensible content angles — the ones the product can honestly win on (ties back to shipped capabilities).
- **Emits:** `▸ Angles`.

### Stage 4 — Keyword pool + map  [REUSE]
- **Reuse:** `seo-keyword-mapper` at **pool scale**: build the full program keyword pool (head/body/long-tail, comparison, use-case, tool/template, glossary terms), each tagged to a persona and a draft pillar.
- **Synth:** organize the pool into a shape that will become the **Keyword Pool** + **Pillar Legend** tabs.
- **Emits:** `▸ KeywordPool`.

### Stage 5 — Intent classification  [REUSE]
- **Reuse:** `seo-keyword-classifier` to label every pooled keyword with intent (informational / commercial-investigation / transactional / navigational) and funnel stage.
- **Emits:** `▸ Classified`.

### Stage 6 — Demand validation  [REUSE]
- **Reuse:** `seo-demand-validator` to validate demand + difficulty with **signal + basis** (never invented volume); anything unproven gets `(待驗證)`. This is where the "no fabricated volume" guardrail is enforced as a stage, not just a note.
- **Emits:** `▸ Validated` (the de-risked keyword set that survives into the backlog).

### Stage 7 — Pillar set & content architecture  [SYNTH]
- **Synth (no existing skill does this):** group validated keywords/angles into a **hub-and-spoke pillar map** — a handful of pillar hubs, each with its spoke topics. Assign each pillar an owning persona and funnel role. This is the spine of both the Doc §4 and the **Pillar Legend** tab.
- **Emits:** `▸ Pillars` (hub-and-spoke map).

### Stage 8 — IA decision, money pages & conversion layer  [SYNTH]
- **Synth:**
  - **IA decision** against the real stack — confirm content lands as CMS articles via `/free-resource` + a new category → `/blog/<slug>` SSR; **no sub-site**.
  - **Money-page selection + recon** — pick the pages that must convert, then recon each for indexability (noindex? SSR or client-only? meta/canonical/schema/sitemap present?). Gaps become the **Money-Page / Tech-SEO Recon** tab.
  - **Conversion engines** — glossary, tools/templates, proof/social-proof surfaces; decide which already exist in-product vs. which are net-new (and whether net-new is even in scope, given "market only shipped").
- **Emits:** `▸ IA`, `▸ MoneyPages`, `▸ Engines`.

### Stage 9 — AEO & technical-SEO posture  [SYNTH]
- **Synth:** the answer-engine posture — citation-gap analysis (where AI engines currently answer without the product, and which shipped capability could earn the citation), FAQ/schema strategy, an English-flagship reach decision for English-dominant engines, and the robots/crawler posture (allow AI answer crawlers; block training scrapers). Feeds the **AEO Citation-Gap** tab.
- **Emits:** `▸ AEO`, `▸ TechSEO`.

### Stage 10 — CTA ladder · KPIs · governance · calendar · backlog  [SYNTH]
- **Synth:**
  - **CTA ladder** — the per-funnel-stage call to action (TOFU subscribe → MOFU tool/demo → BOFU signup), max **1 hard CTA per page**.
  - **KPIs** — leading + lagging, plus the 90-day standard.
  - **Governance + operating model** — who owns what, cadence, the rule that every published piece re-checks the guardrails.
  - **Month-by-month calendar** — sequence the backlog into a release drip.
  - **Backlog** — the ordered topic list that `seo-article-pipeline` will consume. This is the **handoff payload**.
- **Emits:** `▸ CTA`, `▸ KPIs`, `▸ Governance`, `▸ Calendar`, `▸ Backlog`.

---

## 4. Assembling the deliverables  [SYNTH]

After the 10 stages, synthesize everything into the two artifacts.

### The 14-section plan Doc → 「00 SEO Strategy & Plans」
Build as markdown, then `import_to_google_doc` into the 00 bucket. Section order:

- **Phase 0 — 基礎建設** (foundational pre-reqs)
- **0 — TL;DR**
- **1 — Why now**
- **2 — Positioning** (category POV + named frames + voice/誠實 + 軌道分流)
- **3 — Audience & funnel** (persona 反推 + 楔子 + intent map)
- **4 — 內容架構** (pillar hub & spoke)
- **5 — 轉換層** (IA 決策 + money pages + tools/proof 引擎 + glossary)
- **6 — 關鍵字與 intent 策略**
- **7 — 工具/證明引擎 build priority**
- **8 — CTA ladder**
- **9 — KPIs**
- **10 — Governance**
- **11 — Operating model**
- **12 — Backlog**
- **13 — Month-by-month**
- **14 — 90 天標準**
- **Appendix** — sheet tabs index

### The 9-tab plan Sheet → 「01 Keyword Maps」
Build a multi-sheet `.xlsx` with **openpyxl**, then `import_to_google_sheets` into the 01 bucket. Tabs:

1️⃣ **Keyword Pool** · 2️⃣ **Topic List** (the backlog; `Status` column for `seo-article-pipeline`) · 3️⃣ **Comparison / Use-Case** (or Skill↔Use-Case, per product) · 4️⃣ **Free Tools / Templates** (or product-appropriate) · 5️⃣ **Glossary** · 6️⃣ **AEO Citation-Gap** · 7️⃣ **Money-Page / Tech-SEO Recon** · 8️⃣ **Personas** · 9️⃣ **Pillar Legend**.

Doc and Sheet cross-reference each other (Doc Appendix lists the tabs; Sheet rows tag their pillar from the Pillar Legend).

---

## 5. HITL gates

Stop after **each** stage and after **each** deliverable; show a refreshed progress board and the next step, and wait for confirmation before advancing. Never auto-jump stages. If a stage is missing input (no competitor URLs, no shipped-capability list, no money-page access), stop and ask.

---

## 6. Handoff format — program `SEO_PACKET`

When the program plan is approved, hand the backlog down to `seo-article-pipeline`. Emit one block:

```
SEO_PACKET ▸ Program
program: <product / site name>
plan_doc: <00 bucket Doc URL>
plan_sheet: <01 bucket Sheet URL>
positioning: <category POV to own — one line>
personas: [<p1>, <p2>, <p3>]   # MECE, decision-state
pillars:                        # hub-and-spoke
  - hub: <pillar name>
    persona: <which persona>
    funnel: TOFU|MOFU|BOFU
    spokes: [<topic>, <topic>, ...]
ia_decision: "/free-resource + 新 category → /blog/<slug> SSR (no sub-site)"
money_pages:
  - url: <page>
    indexable: yes|no|<gap>      # from Tech-SEO recon
cta_ladder: { TOFU: <…>, MOFU: <…>, BOFU: <…> }   # max 1 hard CTA / page
aeo: { citation_gaps: [...], en_flagship: yes|no, crawler_posture: "allow answer / block training" }
guardrails: "shipped-only · signal+basis · no 句號 · 1️⃣2️⃣3️⃣ · no-hype · powered by Claude"
backlog:                        # ← what seo-article-pipeline consumes
  - topic: <title>
    primary_keyword: <kw>       # validated; (待驗證) if unproven
    pillar: <hub>
    intent: <informational|commercial|transactional>
    funnel: TOFU|MOFU|BOFU
    month: <release month from calendar>
    status: backlog
notes: "<anything seo-article-pipeline must know before picking a topic>"
```

`seo-article-pipeline` reads this block, picks one `backlog` topic, and runs its own 13-stage single-article flow from the Brief stage onward. On publish it flips that topic's `status` to `done` in the Topic List tab — closing the loop between program plan and article execution.
