# Derived-state rules (mirrors `scripts/derive_state.py`)

The Main Tracker 「H2 專案項目」 knows only three statuses — **未開始 / 進行中 / 放棄**. There is no 完成 or 延遲, most `開始`/`結束` cells still hold the literal placeholder `YYYY-MM-DD`, and [3.1] Metrics are mostly bare `#`. Everything below is therefore **inferred** and reported as flags with evidence. The skill never edits the tracker (owners push schedules); it proposes.

## Inputs

- `today` (config `timezone`), tracker rows (`#`, `項目`, `Priority`, `負責人`, `開始`, `結束`, `狀態`, `備註`), previous tracker snapshot(s) with dates (optional), newest **two** [3.1] weekly blocks, activity signals from function SOTs (CRM deals/tasks for 2.x/4.01; ops heal 修復清單 for 3.x; course tracker for 4.05/4.07; CMS `articles` for 1.03), plan-doc Refresh blocks (labels + expected date ranges).
- Date parsing: ISO `YYYY-MM-DD` → date. Literal `YYYY-MM-DD`, empty, or unparseable → **undated**. `MM-DD` / `M/D` → current year, `date_inferred=true` (say so in evidence). Never guess a year silently.
- Rows with 狀態 = 放棄 are excluded from all states (surface only in the tracker delta when newly 放棄). Unknown 狀態 value → `UNKNOWN_STATUS`, surface it, do not map it.

## Constants

`ENDS_SOON_DAYS = 14` · `STALLED_MIN_AGE_DAYS = 14` · `UNDATED_ESCALATE_DAYS = 14` · `PEOPLE_ONLY_CAP = 3` (max "only Peter can unblock" items per brief).

## States (a row may carry several flags; list all, order as below)

| Flag | Rule | Applies to | Evidence to print |
|---|---|---|---|
| `ENDS_SOON` | 狀態 ∈ {進行中, 未開始} AND `結束` ∈ [today, today+14d] | P0/P1 → deadline strip of the brief; P2 → status table only | `結束` date, days left, owner |
| `OVERDUE` | (狀態 = 進行中 AND `結束` < today) OR (狀態 = 未開始 AND `開始` < today) | all priorities; P0/P1 → status table + owner rollup; P2 → status table only | which date, days late (e.g. 1.03 SEO: 開始 07-01, still 未開始) |
| `UNDATED` | Priority ∈ {P0, P1} AND (`開始` or `結束` undated) | P0/P1 only (P2/P3 undated is normal — status table only, no ask) | which cell(s); age = days since first observed undated |
| `STALLED` | **Needs ≥2 snapshots ≥14 days apart — not available in first runs** (emit `STALLED: n/a`). Row 狀態 = 進行中, Priority ∈ {P0, P1}, AND all of: (a) no change in 狀態/開始/結束/負責人/備註 vs a snapshot ≥14 days old; (b) no mention in the newest two [3.1] blocks — match tracker `#` (e.g. `4.01`) or ≥2 keyword tokens of `項目`, searching the owner's function section first; (c) no activity in the row's mapped SOT within 14 days (CRM deal/task touched, heal-list row changed, course-tracker row changed, article published). Rows with **no** mapped SOT satisfy (c) by silence but the flag is downgraded to `STALLED?` (low confidence). | P0/P1 only | last tracker change date, last [3.1] mention (block date), last SOT activity |
| `PROPOSE_DONE` | 狀態 = 進行中 AND (備註 or newest [3.1] block says shipped / 上線 / 完成 / 已交付 / done, or the mapped SOT is terminal — course tracker 完成, heal-list 已完成, deal won) | all | the quote + source + date; brief says "propose 完成 — owner to set" |
| `DIRECTION_UNLABELLED` | Priority = P0 AND neither tracker `備註` nor the plan-doc Refresh block for that `#` carries 已定案 or 還在摸索 | P0 (also any row whose direction change is described in the newest [3.1] block) | where the label was looked for |

Also emitted (not states): `TRACKER_DELTA` — rows new / changed / newly 放棄 vs the last snapshot (field, old → new, who/when if the sheet exposes it).

## Priority weighting

| Situation | Where it lands |
|---|---|
| P0 `UNDATED` with age ≥ 14 days | escalate → "only Peter can unblock" list (cap 3, ranked by priority then age); the ask is "owner pushes dates", not the skill filling them |
| P0 `UNDATED` age < 14 days, or P1 `UNDATED` | owner rollup / 1-on-1 packet as "ask owner for dates" |
| P0/P1 `OVERDUE` or `ENDS_SOON` | deadline strip + owner rollup |
| P0 `STALLED` | "only Peter can unblock" candidate; P1 `STALLED` → owner rollup |
| P2 anything | status table only; never generates an ask |
| P3 | not reported unless status changed |

Age of `UNDATED` with no earlier snapshot: seed `first_seen_undated` from the date printed on the plan doc's Refresh block (the day owners were asked for schedules); if that block also lacks a date, age = 0 (ask owner, do not escalate).

## Hard rules

- Tracker vocab is 未開始 / 進行中 / 放棄 — the skill never invents 完成 / 延遲 in the sheet; those words appear only in the brief as **proposals** (`PROPOSE_DONE`, `OVERDUE`).
- The skill **never edits the tracker** (status, dates, owners, 備註). All changes are asks to owners; owners push.
- Every flag prints its evidence and source date. A flag without evidence is dropped.
- Unknown ≠ silence: missing instrumentation is stated ("no signal source"), never read as inactivity.
