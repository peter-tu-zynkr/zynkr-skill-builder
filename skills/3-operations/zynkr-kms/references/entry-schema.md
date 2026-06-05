# Entry Schema — Zynkr Support KB

The KB holds **two kinds of blocks**, and keeping them distinct is the whole point:

1. **Core Facts** (`### FACT:<id>`) — canonical, reusable truths that many answers depend on:
   the pricing table, refund policy, standard durations. **The numbers live here, once.**
2. **Q&A entries** (`### Q:`) — one per resolved ticket. They map an inquiry to the facts and
   **cite** them via a `Cites:` line instead of restating the numbers.

Why split them: a price or policy that's copied into ten answers drifts the moment it
changes. Put it in one FACT, have entries cite it, and a single edit updates every answer.
The drafter reads the whole doc in one fetch, so a citing entry still resolves to the real
numbers at draft time.

> **Rule of thumb:** if a fact could appear in more than one answer, or is the kind of thing
> that changes over time (price, rate, policy, lead time) — it belongs in a **FACT**, and
> entries **cite** it. Don't restate cited numbers inside an entry's Answer.

---

## Block type 1 — Core Fact

```
### FACT:<id> · <human title>
<the canonical fact — a short table and/or bullet list; the actual numbers/terms>
- Keywords: <zh-TW + EN terms that should retrieve this fact>
- Last verified: <YYYY-MM-DD>
```

- **`FACT:<id>`** — stable, kebab-case, unique (e.g. `pricing-rates`, `refund-policy`,
  `standard-durations`). Entries reference it verbatim, so don't rename casually.
- Put the **authoritative numbers/terms here and nowhere else.** Include a worked example in
  the fact if it helps (e.g. "一天 6 小時 → …").
- Note any **undefined scope** explicitly ("實體是否含交通費 — 尚未定義") so it isn't silently
  assumed.
- Facts live in the **`## Core Facts`** section (anchor `<!-- ▼APPEND:core-facts▼ -->`).

## Block type 2 — Q&A entry

```
### Q: <canonical, normalized question>
- Intent: <intent-tag from intent-taxonomy.md>
- Cites: <FACT:id, FACT:id…  — omit the line entirely if the answer cites no fact>
- Keywords: <zh-TW term, EN term, synonym…>
- Answer: <how this inquiry maps to the cited fact(s); the logic, not the restated numbers>
- Source: <Gmail thread link> · <YYYY-MM-DD> · <provenance, e.g. "inbound 詢價">
- Last verified: <YYYY-MM-DD>
```

## Field rules

- **Q (the heading)** — Normalize to how a *future* inquirer would ask, not this one's exact
  words. Strip names, pleasantries, one-off specifics. Good: `一天 N 小時的 AI 課程如何報價？`.
  Bad: `回覆<某某>：你問的報價`. The `### Q:` / `### FACT:` prefix is the unique
  find-and-replace anchor.
- **Intent** — exactly one tag from `intent-taxonomy.md`.
- **Cites** — zero or more `FACT:<id>` references. If the answer leans on a canonical fact
  (pricing, policy…), **cite it instead of restating the numbers.** If the needed fact doesn't
  exist yet, propose creating it (a new FACT block) in the same approval round.
- **Keywords** — bilingual, comma-separated. The retrieval surface — spend effort here.
- **Answer** — the *mapping/logic*: how this inquiry resolves against the cited facts ("依
  FACT:pricing-rates，依時數計價、人數不加價"). Only inline a hard number when it is **specific
  to this ticket and not in any fact** (then preserve it verbatim — never round or extrapolate).
  If Peter answered only part of the question, cover only that part and flag the gap.
- **Source** — thread permalink + date + lightweight provenance. **No customer PII beyond a
  first name + company; prefer a generic tag like "inbound 詢價" when the identity adds nothing.**
- **Last verified** — date written or last confirmed current. The staleness job keys off this.

## Mapping to the future `kb_articles` table

When the KB graduates to Supabase pgvector (per `Zynkr KMS — Build Plan`), both block types
port cleanly — keep the shapes stable:

| Doc field | `kb_articles` column |
|---|---|
| `Q:` / `FACT:` heading | `title` |
| `Answer:` / fact body | `body_md` |
| `Intent:` + `Keywords:` | `tags[]` |
| `Cites:` | `tags[]` (or a future `kb_edges` cite-graph) |
| `Source:` link | `source_url` |
| Source date / origin | `source_type` (`peter_answer` / `core_fact`), `created_at` |
| `Last verified:` | `last_verified_at` |

A FACT is just an article with `source_type=core_fact`; the `Cites:` line is the seed of a
cite-graph the RAG layer can traverse.

## Worked example — a fact + an entry that cites it

```
### FACT:pricing-rates · 授課費率表
| 模式 | 每小時費率 |
| 線上 online | NT$<rate_online> |
| 實體 in-person | NT$<rate_onsite> |
- 計價方式：依實際授課時數計價（per hour）。
- 人數：單一費率，不依人數加價（headcount-independent）。
- 範例：一天 6 小時 → 線上 NT$<subtotal_online>、實體 NT$<subtotal_onsite>。
- 未定範圍：實體是否含交通／場地／教材費 — 尚未定義。
- Keywords: 報價, 費用, 價格, 鐘點, 費率, 線上, 實體, pricing, rate, per hour, online, in-person
- Last verified: <YYYY-MM-DD>
```

```
### Q: 一天 N 小時的 AI 課程怎麼報價？人數會影響價格嗎？
- Intent: pricing-quoting
- Cites: FACT:pricing-rates
- Keywords: 報價, 費用, 一天幾小時, 人數, 團隊訓練, quote, day rate, headcount
- Answer: 依 FACT:pricing-rates 報價 — 依實際時數計價、線上／實體費率不同、人數不加價；用客戶需要的時數 × 對應費率即為報價（一天 6 小時的範例見費率表）。
- Source: <gmail-thread-link> · <YYYY-MM-DD> · inbound 詢價
- Last verified: <YYYY-MM-DD>
```

> Placeholders (`<rate_online>`, …) are illustrative — a real fact fills them with the exact
> figures Peter stated. Note the entry carries **no NT$ numbers**: they live only in the fact.
