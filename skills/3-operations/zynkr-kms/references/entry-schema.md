# Card Schema — Zynkr platform 知識庫 (Support KB)

The KB holds **two kinds of cards**, and keeping them distinct is the whole point:

1. **`fact` cards** — canonical, reusable truths that many answers depend on: the pricing
   table, refund policy, standard durations. **The numbers live here, once.** Each fact card
   carries a stable kebab-case `fact_id` (unique per workspace).
2. **`qa` cards** — one per resolved ticket. They map an inquiry to the facts and **cite**
   them via the `cites` array instead of restating the numbers.

Why split them: a price or policy that's copied into ten answers drifts the moment it
changes. Put it in one fact card, have qa cards cite it, and a single `update_kb_article`
updates every answer. `mcp__zynkr__get_kb_article` on a qa card **resolves its cited facts
inline**, so the drafter always sees current numbers at draft time — *provided the fact card
actually exists*. Always write/UPDATE the fact before the citing qa card.

> **Rule of thumb:** if a fact could appear in more than one answer, or is the kind of thing
> that changes over time (price, rate, policy, lead time) — it belongs in a **fact card**, and
> qa cards **cite** it. Don't restate cited numbers inside a qa card's body.

---

## Card type 1 — `fact` (via `mcp__zynkr__create_kb_article`)

```jsonc
{
  "type": "fact",
  "fact_id": "pricing-rates",          // stable, kebab-case, unique — qa cards cite it verbatim
  "title": "授課費率表",                 // short human title
  "body_md": "<the canonical fact — a short markdown table and/or bullets; the actual numbers/terms>",
  "section_id": "<uuid of core-facts (or tone-style for style rules) from list_kb_sections>",
  "keywords": ["報價", "費用", "鐘點", "pricing", "rate", "per hour"],
  "source_url": "<gmail thread permalink>",
  "source_note": "<YYYY-MM-DD> · <provenance>",
  "source_type": "core_fact",
  "status": "published",
  "mark_verified": true
}
```

- **`fact_id`** — don't rename casually; qa cards reference it verbatim in `cites`. A create
  that collides with an existing `fact_id` fails — that's your sign to UPDATE instead.
- Put the **authoritative numbers/terms in `body_md` and nowhere else.** Include a worked
  example if it helps (e.g. "一天 6 小時 → …").
- Note any **undefined scope** explicitly ("實體是否含交通費 — 尚未定義") so it isn't silently
  assumed.
- Fact cards normally live in the **`core-facts`** section. The two style cards
  (`tone-voice-rules`, `term-mapping-table`) live in **`tone-style`**.

## Card type 2 — `qa` (via `mcp__zynkr__create_kb_article`)

```jsonc
{
  "type": "qa",
  "title": "一天 N 小時的 AI 課程怎麼報價？人數會影響價格嗎？",  // canonical, normalized question
  "body_md": "依 FACT:pricing-rates 報價 — 依實際時數計價、線上／實體費率不同、人數不加價；用客戶需要的時數 × 對應費率即為報價。",
  "section_id": "<uuid of the intent's section from list_kb_sections>",
  "cites": ["pricing-rates"],          // bare fact_ids — no "FACT:" prefix in the array
  "keywords": ["報價", "費用", "一天幾小時", "人數", "quote", "day rate", "headcount"],
  "source_url": "<gmail thread permalink>",
  "source_note": "<YYYY-MM-DD> · inbound 詢價",
  "source_type": "peter_answer",
  "status": "published",
  "mark_verified": true
}
```

## Field rules

- **`title`** (qa) — Normalize to how a *future* inquirer would ask, not this one's exact
  words. Strip names, pleasantries, one-off specifics. Good: `一天 N 小時的 AI 課程如何報價？`.
  Bad: `回覆<某某>：你問的報價`.
- **`section_id`** — resolve the intent tag → section uuid via `mcp__zynkr__list_kb_sections`
  (the taxonomy is in `intent-taxonomy.md`). Exactly one section per card.
- **`cites`** — zero or more bare fact ids. If the answer leans on a canonical fact
  (pricing, policy…), **cite it instead of restating the numbers.** If the needed fact doesn't
  exist yet, propose creating it (a new fact card) in the same approval round. In `body_md`
  prose, keep the human-readable `依 FACT:<id>` convention — the drafter reads it naturally.
- **`keywords`** — bilingual (zh-TW + EN), the retrieval surface for `search_kb` — spend
  effort here.
- **`body_md`** (qa) — the *mapping/logic*: how this inquiry resolves against the cited facts
  ("依 FACT:pricing-rates，依時數計價、人數不加價"). Only inline a hard number when it is
  **specific to this ticket and not in any fact** (then preserve it verbatim — never round or
  extrapolate). If Peter answered only part of the question, cover only that part and flag
  the gap.
- **`source_url` / `source_note`** — thread permalink + `"<date> · <provenance>"`. **No
  customer PII beyond a first name + company; prefer a generic tag like "inbound 詢價" when
  the identity adds nothing.**
- **`mark_verified: true`** — stamps the card verified today; the platform's re-verification
  cadence (default 180 days) keys off it. On UPDATEs, always re-stamp.
- **`flags`** — optional; use `["NEEDS_PETER"]` or `["HELD"]` when a card is written but a
  detail awaits Peter's confirmation (mirrors the HELD price-facts convention).

## Updating (supersede, don't duplicate)

`mcp__zynkr__update_kb_article` with the card's uuid + only the changed fields. `version`
auto-bumps, so history is preserved server-side. `type` and `fact_id` are immutable via MCP —
a fact that needs a different id is a new card (rare; think twice, cites reference the old id).

## Worked example — a fact + a qa that cites it

A rate change arrives in a resolved thread:

1. `get_kb_article("pricing-rates")` → exists → `update_kb_article` with the new rate row in
   `body_md`, `mark_verified: true`. Every citing qa card is now current.
2. The thread also asked a new question ("可以拆成兩個半天嗎？") → new `qa` card in
   `scheduling-logistics`, `cites: ["pricing-rates", "standard-durations"]`, body carries the
   logic only.
