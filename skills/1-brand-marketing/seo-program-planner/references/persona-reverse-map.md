# Persona Reverse-Map Rubric (capability-first)

Stage 0 / Program-level. This rubric belongs to **seo-program-planner**, not to single-article work. It governs §3 *Audience & funnel* of the plan Doc and the **Personas** tab of the keyword Sheet. It is the program-scale sibling of `seo-persona-builder`'s `persona-rubric.md`: that one profiles readers for one article; this one **reverse-derives the whole persona set from a product's shipped capabilities** and decides which persona the program enters through first.

Worked examples to copy the shape from: the Zynkr CRM product SEO plan (Doc `1Zbw3zpnA_ev5M2Kt0fLCW-cj-_sOQhYQtB9mB6krzro`, Sheet `11W4L-iZZ0Z9pqIhPp4x6iCGCJoI4-N_zwZrWcXPR5XY`) and the Zynkr AI 技能市集 SEO plan (Doc `1X-yWQ6OXhkBS-n1MgUnNHntZrGmvcuU0HrHeLPumKPY`, Sheet `17f4wSRTyHsBHjsjH4-TK1geWZab_dvMCVlhLhQIzROs`).

---

## Core principle — capabilities first, never aspirations

Start from **what the product can already do today**, never from who you wish the buyer were. Every persona must be traceable back to one or more shipped features. If a persona can only be served by a roadmap item, it does **not** get a persona row — it goes to a "deferred until shipped" note.

This is the house guardrail made operational: we only market shipped capabilities. A persona whose entry pillar leans on an unshipped feature is a fabricated persona. Cut it.

Inputs you reverse-map from (in priority order):
1. The live product surface — the actual money pages / app screens / shipped feature list (verify against the running product, not the pitch deck).
2. Brand material + positioning POV (the named category frames).
3. Existing proof — case stories, usage signals, real testimonials. Signals only; never invent search volume or fabricate a stat. Unproven claims carry a (待驗證) tag.

---

## The reverse-map procedure

For each distinct shipped capability cluster, ask: **"Who has a painful job-to-be-done that THIS already solves?"** Then build the persona backwards from that answer. One capability cluster can yield more than one persona (different JTBDs); one persona can be served by more than one capability. Resolve to a MECE persona set of 3–6.

Each persona row = the product of four columns, all four mandatory:

| Column | What goes in it | Reverse-map rule |
|---|---|---|
| **Sharpest JTBD** | The single most painful job this person is trying to get done — phrased in their words, as a decision they are stuck on (not a feature wish). | Must be a job the product **already** resolves. If today's product only half-solves it, say which half. |
| **Shipped feature hit** | The named, live feature(s) that land on that JTBD. | Must point at something currently in production. Roadmap-only ⇒ disqualifies the persona. |
| **Entry pillar** | Which content pillar this persona walks in through (hub-and-spoke; ties to §4 of the Doc). | One pillar per persona as the primary door; note secondary pillars in parentheses. |
| **Conversion message** | The one line that moves them from reading to acting — the bridge from JTBD to the money page. | House style enforced (see below). Names the shipped capability, makes one promise, no hype. |

Also carry, for funnel work: **search language** (colloquial query they'd type / ask an AI engine), **funnel stage** (TOFU / MOFU / BOFU), and **current alternative** (what they do today without us).

---

## Conversion-message house style (enforce on every row)

The conversion message is the load-bearing output of this rubric — it is reused verbatim in the CTA ladder (§8) and the money-page recon (§5). Write each one to these rules:

- zh-TW · no 句號 — headlines, taglines and conversion lines do **not** end with a full stop (。). End clean, no terminal punctuation.
- Series / parallel items inside a line are separated with **·**, never 。 and never a comma-as-separator where · reads cleaner.
- Lists of messages use 1️⃣ 2️⃣ 3️⃣, never ①②③.
- No hype · no banned words. Forbidden: 賦能 · 生產力工具 · AI-powered · 無縫 · supercharge · cutting-edge · game-changing. For the AI angle say **powered by Claude** as the generic, nothing grander.
- One promise per message, and that promise must be a **shipped** capability. Aspirational promises are cut, not softened.
- Lead with the buyer's JTBD in their words · resolve to what the product does · then the action. Not "我們很強"; rather "你卡在 X · 這裡可以 Y".

A conversion message that needs a 句號, leans on an unshipped feature, or uses a banned word is **not done** — rewrite it before the persona row ships.

---

## Picking the best starting wedge

A program cannot enter through every persona at once. Exactly **one** persona is the starting wedge; the rest are sequenced behind it. Score each candidate persona on four factors, then pick the highest combined — and write the reasoning into §3 of the Doc so the choice is auditable.

| Factor | Question | Favours a persona when… |
|---|---|---|
| **Acquisition cost** | How cheaply can we reach and rank for this persona's queries? | Low-competition, specific, intent-rich queries they already type · existing surfaces (/free-resource, existing category) can host the content with no new sub-site |
| **Capability fit** | How completely does the shipped product solve their sharpest JTBD? | The feature hit is whole, live, and demo-able today — not a partial or roadmap solve |
| **Competition** | How crowded is the SERP / AI-answer space for their queries? | Few strong incumbents · a real citation-gap we can fill (ties to the AEO Citation-Gap tab) |
| **Conversion speed** | How short is the path from this persona's read to a money-page action? | BOFU-leaning intent · a clear shipped money page to send them to · short CTA ladder |

Decision rubric: prefer the persona that maximises **capability fit × conversion speed** while keeping **acquisition cost** low — i.e. the persona the product *most completely already serves* and that *converts fastest*, reachable *cheaply*. A persona that scores high on reach but where the product only half-solves the JTBD is a trap: it pulls traffic we can't convert. Note the runner-up wedge as "next to open".

---

## Mapping personas onto the funnel

Every persona is placed on the funnel so the topic backlog (§12) and month-by-month calendar (§13) can be sequenced by intent:

- **TOFU** — they feel the JTBD but haven't named the category. Entry pillar content educates · conversion message plants the named frame, soft action.
- **MOFU** — they're comparing approaches / tools. Comparison + use-case content · conversion message contrasts on the shipped capability, mid CTA.
- **BOFU** — they're choosing. Money-page-adjacent content (glossary, proof, tools) · conversion message is the direct action line to the shipped money page.

For each persona, mark its **dominant** stage and the **adjacent** stage it can be nudged toward, so the calendar can ladder a single persona from awareness to decision rather than scattering across unrelated personas. The starting-wedge persona should have a complete TOFU→BOFU path mapped before any second persona is opened.

---

## IA default (must hold while mapping)

When you name an entry pillar, assume the real Zynkr stack, do not propose a sub-site: educational content rides **CMS articles + the existing /free-resource + a new category → /blog/<slug> SSR**. If a persona seems to *need* a separate site to be served, that's a signal the persona or the pillar is wrong — re-map, don't spin up a sub-site.

---

## Quality check (gate before the Personas tab ships)

1️⃣ Is every persona traceable to a **shipped** feature, with the feature named — and zero personas resting on roadmap items?
2️⃣ Is each sharpest JTBD a real decision in the buyer's words, not a feature wish or a job title?
3️⃣ Are the 3–6 personas MECE — no two competing for the same JTBD + same feature + same pillar?
4️⃣ Does every conversion message obey house style (no 句號 · · separators · 1️⃣2️⃣3️⃣ · no banned words · powered by Claude · one shipped promise)?
5️⃣ Is exactly one starting wedge chosen, with the four-factor reasoning written into §3 and a named runner-up?
6️⃣ Is each persona placed on the funnel with a dominant + adjacent stage, and does the wedge have a full TOFU→BOFU path?
7️⃣ Do all entry pillars resolve to /blog/<slug> + existing surfaces — no sub-site implied?

If any check fails, fix the persona set before handing the backlog to seo-article-pipeline. A weak persona reverse-map poisons every downstream stage.

---

## Drive-first / local-fallback

This rubric is both a local fallback (`./references/persona-reverse-map.md`) and, once Peter creates it, an editable Drive master in the "00 SEO Strategy & Plans" bucket. At runtime, seo-program-planner tries the Drive master first (google-workspace MCP, searched by name) and falls back to this local copy. Keep the two in sync; the Drive copy wins when both exist.
