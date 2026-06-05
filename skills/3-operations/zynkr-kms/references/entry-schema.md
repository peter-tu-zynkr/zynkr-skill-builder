# Entry Schema — Zynkr Support KB

Every learned Q&A is rendered as one block in this exact shape. Consistency is what makes the
KB both human-skimmable and reliably retrievable by `support-reply-drafter`'s `fullText`
search.

## The block

```
### Q: <canonical, normalized question>
- Intent: <intent-tag from intent-taxonomy.md>
- Keywords: <zh-TW term, EN term, synonym, synonym…>
- Answer: <Peter's answer as a clean statement; exact facts preserved verbatim>
- Source: <Gmail thread link> · <YYYY-MM-DD> · <first name / company>
- Last verified: <YYYY-MM-DD>
```

## Field rules

- **Q (the heading)** — Normalize to how a *future* inquirer would ask, not the exact words of
  this one. Strip names, pleasantries, and one-off specifics. Good: `一天六小時的 AI 課程如何
  報價？`. Bad: `回覆<某某>：你問的報價`. The `### Q:` prefix makes each entry a unique,
  find-and-replaceable anchor.
- **Intent** — exactly one tag from `intent-taxonomy.md`.
- **Keywords** — bilingual, comma-separated. Include the words an inquirer would actually type
  in either language. This line is the retrieval surface; spend effort here.
- **Answer** — Paraphrase into a clean, reusable statement, but **preserve hard facts
  verbatim**: prices (`線上 NT$<rate>/hr、實體 NT$<rate>/hr`), durations, named steps, policy
  terms. Never round, soften, or extrapolate. If Peter only answered part of the question, the
  Answer covers only that part (and the proposal flags the gap).
- **Source** — thread permalink + the date Peter answered + first name / company only. **No
  email, no phone, no full names of individuals beyond a first name.**
- **Last verified** — the date this entry was written or last confirmed current. The future
  staleness job (per the Build Plan) keys off this.

## Mapping to the future `kb_articles` table

When the KB graduates to Supabase pgvector (per `Zynkr KMS — Build Plan`), each block ports
1:1 — so keep the shape stable:

| Doc field | `kb_articles` column |
|---|---|
| `Q:` heading | `title` |
| `Answer:` | `body_md` |
| `Intent:` + `Keywords:` | `tags[]` |
| `Source:` link | `source_url` |
| Source date / origin | `source_type = peter_answer`, `created_at` |
| `Last verified:` | `last_verified_at` |

## Worked example

```
### Q: 一天 <N> 小時的 AI 課程怎麼報價？人數會影響價格嗎？
- Intent: pricing-quoting
- Keywords: 報價, 費用, 鐘點, 人數, 線上, 實體, pricing, quote, day rate, per hour, headcount, online, in-person
- Answer: 授課依時數計價：線上每小時 NT$<rate_online>、實體每小時 NT$<rate_onsite>。一天 <N> 小時即線上 NT$<subtotal_online>、實體 NT$<subtotal_onsite>。<min>–<max> 人皆適用同一費率，不另依人數加價。（實體是否含交通／場地／教材費，依實際回覆而定。）
- Source: <gmail-thread-link> · <YYYY-MM-DD> · <first-name / company>
- Last verified: <YYYY-MM-DD>
```

> The placeholders above (`<rate_online>`, `<first-name / company>`, …) are illustrative —
> a real entry fills them with the exact facts Peter wrote, with PII reduced to first name +
> company per the guardrails.
