# Pillar & IA Framework

Program-scale rubric for **seo-program-planner** Stage: turn a product's *shipped* capabilities into a content pillar map, decide where each piece of content lives against the real Zynkr stack, and verify every money page can actually be indexed. This is the program-level synthesis layer — the upstream seo-* strategy skills (persona → questions → angles → keyword map → classifier → demand) produce the raw inputs; this rubric decides the *architecture* they hang on.

**Drive-first / local-fallback**: this rubric is the canonical master on Drive (editable in the "00 SEO Strategy & Plans" bucket once Peter creates it) and ships as the local fallback at `./references/pillar-and-ia-framework.md`. At runtime, try the Drive master first; fall back to this local copy. Edits land on the Drive master and re-sync down.

**House guardrails that bind every output of this rubric:**
- Market only **shipped** capabilities. Never plan a pillar around a roadmap feature. If demand exists for something unshipped, log it as a signal — don't write it into the IA.
- Demand is always **signal + basis** — never a fabricated search volume. Unverified counts carry the 待驗證 tag.
- zh-TW titles/labels take no 句號 (。); series separators use ·, not 。. Lists use 1️⃣2️⃣3️⃣, never ①②③.
- No-hype voice. Banned: 賦能 · 生產力工具 · AI-powered · 無縫 · supercharge · cutting-edge · game-changing. External attribution is the generic **powered by Claude**.

---

## 1️⃣ Reverse-engineering content pillars from shipped capability

A pillar is a **hub & spoke** unit: one broad evergreen hub page owning a head term + a cluster of spoke articles each owning a long-tail/intent sub-term, all interlinked. Pillars are derived from the product, not invented from a keyword tool dump.

### Derivation order (capability → domain → pillar → spokes)

1️⃣ **List the shipped capabilities.** Walk the live product surface (not the roadmap) and write down what it actually does today — e.g. for Zynkr CRM: 業務管道管理, AI 寫信/會議摘要, 名片掃描, CSV 匯入, 去重合併, 報表. Each is a *capability*, not yet a pillar.

2️⃣ **Cluster capabilities into problem domains.** Group capabilities by the *buyer's job-to-be-done*, not by your internal module boundaries. Several capabilities usually roll up into one domain the buyer would search for (e.g. 寫信 + 會議摘要 + 摘要回顧 → "AI 業務生產流程"). The cluster name should be a phrase a buyer would say, surfaced from the persona/question-mining outputs — not your feature name.

3️⃣ **Promote each domain to a pillar with a head term.** The pillar owns one head term from the keyword pool (TOFU/MOFU, broad, evergreen). Validate the head term against the keyword-classifier intent + demand-validator basis before locking it. A pillar with no defensible head term is not a pillar — fold it into a sibling.

4️⃣ **Map spokes = the intent variations under the head term.** Each spoke owns one classified keyword cluster (a comparison, a use-case, a how-to, a BOFU decision term). Spokes come straight from the keyword-mapper × classifier output; this rubric only decides *which pillar each spoke belongs under* and *that every spoke has a home*.

5️⃣ **Tag each pillar with its funnel role and named POV.** A pillar should ladder from TOFU hub → MOFU spokes → BOFU money page. If a pillar has only TOFU spokes it can't convert — flag the gap for the keyword stage to fill BOFU decision terms.

### Pillar legitimacy tests (drop a "pillar" that fails any)

- **Shipped-backed** — there is a real capability behind the head term. No vapor pillars.
- **Distinct head term** — its head term is not already owned by a sibling pillar (no cannibalization between two of your own pillars).
- **Has BOFU exit** — at least one spoke or the hub links to a money page; the pillar can convert, not just inform.
- **Enough spoke depth** — a head term with only one viable spoke is a spoke, not a pillar.

### Internal-linking — the zero-orphan rule

Every page in the program must satisfy all three or it doesn't ship:

1️⃣ **Every spoke links up to its hub** (contextual, descriptive anchor — not "click here"; the anchor carries the spoke's own keyword).
2️⃣ **Every hub links down to all its spokes** (the hub is the cluster's table of contents).
3️⃣ **Every page has ≥1 inbound internal link from another page in the program** — a page reachable only from the sitemap is an **orphan** and is treated as a defect. Run an orphan sweep across the full backlog before sign-off: list every planned URL, list every planned internal link, and flag any URL with zero inbound links.

Cross-pillar links are allowed and encouraged where the buyer's path is real (a comparison spoke under Pillar A linking to a use-case spoke under Pillar B), but they never *replace* the up/down hub links — they're additive.

---

## 2️⃣ IA decision framework — where does each piece of content live

Decide content home **against the real stack**, not against an idealized site map. The default is to *reuse the existing surfaces*; building a new surface is the exception that must be justified.

### Default placement (the no-new-subsite rule)

For Zynkr products the educational/SEO layer is already wired:

- **Pillar hubs + spoke articles → CMS `articles` → SSR at `/blog/<slug>`.** This is the default home for nearly all content. Articles are server-rendered and individually indexable. Publish via the CMS Supabase path (per seo-publish-article); the CMS dashboard is auth-gated and is **not** a write API.
- **Existing `/free-resource`** holds gated/free tools, templates, downloadables. Route tool/template/lead-magnet content here — don't reinvent a resources surface.
- **New product category** = a new *taxonomy category* on the existing blog (e.g. a 「平台」 category for product-led SEO), **not** a new sub-app or sub-domain. A category is a label + an index page on the surface you already have.

**Do NOT** stand up a `/learn`, `/academy`, `/guides` micro-site or a separate domain for SEO content. Splitting authority across hosts dilutes ranking, fragments analytics, and doubles the tech-SEO surface to maintain. If someone proposes a sub-site, the burden of proof is on them.

### Placement decision tree

For each planned piece, walk in order and stop at the first match:

1️⃣ **Is it an evergreen pillar hub or spoke article?** → CMS article, SSR at `/blog/<slug>`, tagged to the right (possibly new) category. *(the overwhelming default)*
2️⃣ **Is it a free tool / template / downloadable lead magnet?** → `/free-resource` (existing surface). Backend already exists; no new tool backend.
3️⃣ **Is it a conversion target the buyer lands on with intent to act (pricing, product page, signup, a comparison "Zynkr vs X" decision page)?** → a **money page**. Decide static vs SSR per below. Only here do you consider a non-`/blog` route.
4️⃣ **Is it a glossary / definition term?** → a glossary entry, rendered as an indexable article or a `/blog` definitions hub — still on the existing surface.
5️⃣ **Anything else** → default back to (1). Manufacturing a new surface requires an explicit, written justification in the plan Doc (§5 轉換層) — name the surface, why an existing one can't hold it, and who maintains its tech-SEO.

### When a static / SSR money page IS warranted

A dedicated money page (outside `/blog`) is justified only when **all** hold:
- It's a **conversion destination**, not an educational read (pricing, signup, a named comparison/use-case landing).
- It needs **layout/interactivity** the article renderer can't express (interactive comparison table, embedded calculator, pricing matrix).
- It will carry **structured data an article can't** (e.g. `SoftwareApplication` with offers, `Product`).

Even then it must be **SSR or static-generated** (never client-only) and must pass §3 in full before it counts as a money page in the plan. A money page that can't be indexed is not a money page — it's a leak.

---

## 3️⃣ Technical-SEO indexability checklist — per money page

Before any money page (or any non-`/blog` route) is counted in the plan, **recon it live** and confirm every line. The "Money-Page / Tech-SEO Recon" Sheet tab carries one row per page with these columns. A page failing any hard-block item is **invisible to search** regardless of how good the copy is — mark it 🔴 and route the fix into the backlog before it earns a row in the content plan.

### Hard blocks — page is invisible if any fails

- **`noindex` / `X-Robots-Tag`** — confirm the page is NOT excluded. Check the page-level `<meta name="robots">` AND the HTTP `X-Robots-Tag` response header AND any host-level config (`vercel.json` headers, middleware) that could blanket-`noindex` a path. A header-level noindex is invisible in the HTML — you must check the response headers, not just view-source.
- **`robots.txt` not disallowing the path** — confirm the route isn't blocked from crawl. (Note: AI answer crawlers are allowed per current website policy; training scrapers stay blocked — don't conflate the two.)
- **SSR / static vs client-render** — fetch the page **with JS disabled** (or read the raw HTML response). The full content + meta + structured data must be present in the server HTML. If the page is a client-rendered SPA shell that hydrates the real content in the browser, search + AI crawlers may see an empty shell → effectively invisible.
- **In the sitemap** — confirm the URL is actually emitted in `sitemap.xml` (or a referenced child sitemap). A page absent from the sitemap on an SPA-heavy site often never gets discovered at all.

### Per-page metadata — must be page-specific, not inherited

- **Per-page `<title>`** — unique, primary keyword up front, no 句號 ending, · as separator.
- **Per-page `meta description`** — unique, hook + payoff, contains the keyword once.
- **`canonical`** — self-referential and correct host (Zynkr canonical host is non-www `zynkr.ai`); no money page silently canonicalizing to another URL.
- **Open Graph / Twitter** — per-page `og:title` / `og:description` / `og:image`, not a global default.

### Structured data — match the schema to the page type

- **Product / pricing money page** → `SoftwareApplication` (with `offers` where applicable).
- **How-to / step content** → `HowTo`.
- **FAQ block present** → `FAQPage`.
- **Comparison / "best X" / multi-item listing** → `ItemList`.
- Validate the JSON-LD renders in the **server HTML** (a client-injected schema fails the SSR test above).

### Worked counter-example — the triple-invisible marketplace skill page

The AI 技能市集 individual skill pages were a real triple-block where each layer alone would have been fatal and they stacked:

1️⃣ **`vercel.json` `noindex`** — a host-level header blanket-applied `X-Robots-Tag: noindex` to the skill routes. Invisible in view-source; only the response headers revealed it.
2️⃣ **SPA shell** — the skill detail content hydrated client-side, so the server HTML crawlers/AI engines received was an empty shell with no skill name, description, or schema.
3️⃣ **Missing from sitemap** — the per-skill URLs were never emitted in `sitemap.xml`, so even an allowed crawler had no path to discover them.

Any one of these makes the page un-rankable; all three together meant the pages were completely uncitable by search AND by AI answer engines. **Lesson baked into this rubric:** for every money page, check headers (not just HTML), check the JS-disabled render, and check the sitemap — independently. Passing one does not imply passing the others. A page only earns a content-plan row once all three are 🟢.

---

## Output hooks (where this rubric feeds the plan)

- Pillars + hub/spoke map + zero-orphan link plan → Doc §4 內容架構 + Sheet tabs **Topic List** and **Pillar Legend**.
- IA placement decisions (and any justified new surface) → Doc §5 轉換層.
- Per-page indexability recon → Sheet tab **Money-Page / Tech-SEO Recon**; unresolved 🔴 fixes → Doc §12 Backlog with an owner.
