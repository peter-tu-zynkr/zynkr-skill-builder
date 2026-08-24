> **Provenance:** copied verbatim from `zynkr-gm/references/derived-state-rules.md` (SKB-006, sheetId 0.02); re-copied 2026-08-24 when the tracker vocab gained 完成 / 暫停. `zynkr-gm` is the OWNER of these rules; `planning-tracker-sync` only consumes them. If zynkr-gm changes its thresholds or state names, re-copy this file — never edit it here.

# Derived-state rules (mirrors `scripts/derive_state.py`)

> **This file has a second consumer.** `planning-tracker-sync` (0.09) holds a verbatim copy at
> `skills/0-strategy/planning-tracker-sync/references/derived-state-rules.md`, and calls
> `zynkr-gm/scripts/derive_state.py` directly when zynkr-gm is installed. zynkr-gm **owns** these
> rules; that skill only consumes them. **If you change a threshold or a state name here, re-copy
> this file there in the same commit** — otherwise the founder brief and the team weekly silently
> disagree about which items are OVERDUE or STALLED. Verify the rule bodies still match — each
> file carries its own banner, so strip banner (`>`) and blank lines from both and diff. Use
> `grep`, not `sed`: BSD/macOS sed rejects `/^$/{1d}` and both sides then compare empty-to-empty,
> which reports a false pass.
>
> ```bash
> cd skills/0-strategy
> strip() { grep -v '^>' "$1" | grep -v '^[[:space:]]*$'; }
> diff <(strip zynkr-gm/references/derived-state-rules.md) \
>      <(strip planning-tracker-sync/references/derived-state-rules.md) && echo "no drift"
> ```
>
> Expect 33 body lines each side and no output. Any output means the two have drifted and the copy
> must be refreshed. (Checked 2026-08-17: identical, and verified the check does fail on a seeded
> one-word change — a drift check that cannot fail is worse than none.)

The Main Tracker 「H2 專案項目」 uses five statuses — **未開始 / 進行中 / 放棄 / 完成 / 暫停**. 完成 and 暫停 were added by the GM on **2026-08-24** (4.01 企業 AI 診斷 → 完成, 4.07 Vibe Coding → 暫停); before that the vocab was three values and this file said so. There is still no 延遲 — that stays inferred (OVERDUE). Most `開始`/`結束` cells hold the literal placeholder `YYYY-MM-DD`, and [3.1] Metrics are mostly bare `#`. Everything below is therefore **inferred** and reported as flags with evidence. The skill never edits the tracker (owners push schedules); it proposes.

**Status classes** — every rule below keys off these, not off single values:

| Class | Statuses | Meaning |
|---|---|---|
| TERMINAL | 放棄 · 完成 | no live schedule, **no owner load**, no date asks — excluded from every flag |
| PAUSED | 暫停 | no live schedule → no deadline/date flags, but still owned and still surfaced (`PAUSED`) |
| LIVE | 未開始 · 進行中 | the only rows that can be ENDS_SOON / OVERDUE / UNDATED |

⚠️ **Denominator rule.** "N 個 P0" in a brief means **live** P0s (LIVE + PAUSED), never the raw row count. Reporting a finished or abandoned P0 as outstanding work is the exact failure this table exists to prevent — it happened in the 2026-08-24 (W35) brief, which counted 14 P0s and flagged the just-completed 4.01 as ENDS_SOON.

## Inputs

- `today` (config `timezone`), tracker rows (`#`, `項目`, `Priority`, `負責人`, `開始`, `結束`, `狀態`, `備註`), previous tracker snapshot(s) with dates (optional), newest **two** [3.1] weekly blocks, activity signals from function SOTs (CRM deals/tasks for 2.x/4.01; ops heal 修復清單 for 3.x; course tracker for 4.05/4.07; CMS `articles` for 1.03), plan-doc Refresh blocks (labels + expected date ranges).
- Date parsing: ISO `YYYY-MM-DD` → date. Literal `YYYY-MM-DD`, empty, or unparseable → **undated**. `MM-DD` / `M/D` → current year, `date_inferred=true` (say so in evidence). Never guess a year silently.
- Rows with a TERMINAL 狀態 (放棄 · 完成) are excluded from all states and from the per-owner rollup (surface only in the tracker delta when newly set, plus the `done` / `dropped` id lists). Rows with 狀態 = 暫停 keep their owner but take no schedule flag. Unknown 狀態 value → `UNKNOWN_STATUS`, surface it, do not map it.

## Constants

`ENDS_SOON_DAYS = 14` · `STALLED_MIN_AGE_DAYS = 14` · `UNDATED_ESCALATE_DAYS = 14` · `PEOPLE_ONLY_CAP = 3` (max "only Peter can unblock" items per brief).

## States (a row may carry several flags; list all, order as below)

| Flag | Rule | Applies to | Evidence to print |
|---|---|---|---|
| `ENDS_SOON` | 狀態 is LIVE (進行中 · 未開始) AND `結束` ∈ [today, today+14d] | P0/P1 → deadline strip of the brief; P2 → status table only | `結束` date, days left, owner |
| `OVERDUE` | (狀態 = 進行中 AND `結束` < today) OR (狀態 = 未開始 AND `開始` < today) | all priorities; P0/P1 → status table + owner rollup; P2 → status table only | which date, days late (e.g. 1.03 SEO: 開始 07-01, still 未開始) |
| `UNDATED` | Priority ∈ {P0, P1} AND 狀態 is LIVE AND (`開始` or `結束` undated) | P0/P1 only (P2/P3 undated is normal — status table only, no ask) | which cell(s); age = days since first observed undated |
| `STALLED` | **Needs ≥2 snapshots ≥14 days apart — not available in first runs** (emit `STALLED: n/a`). Row 狀態 = 進行中, Priority ∈ {P0, P1}, AND all of: (a) no change in 狀態/開始/結束/負責人/備註 vs a snapshot ≥14 days old; (b) no mention in the newest two [3.1] blocks — match tracker `#` (e.g. `4.01`) or ≥2 keyword tokens of `項目`, searching the owner's function section first; (c) no activity in the row's mapped SOT within 14 days (CRM deal/task touched, heal-list row changed, course-tracker row changed, article published). Rows with **no** mapped SOT satisfy (c) by silence but the flag is downgraded to `STALLED?` (low confidence). | P0/P1 only | last tracker change date, last [3.1] mention (block date), last SOT activity |
| `PROPOSE_DONE` | 狀態 = 進行中 AND (備註 or newest [3.1] block says shipped / 上線 / 完成 / 已交付 / done, or the mapped SOT is terminal — course tracker 完成, heal-list 已完成, deal won) | all | the quote + source + date; brief says "propose 完成 — owner to set" |
| `DONE` | 狀態 = 完成 (terminal). Drops out of owner load and every deadline/date flag; appears in `summary.done` | all | the 完成 value + the row's `結束` (a future `結束` on a 完成 row is normal — it was the plan, not a deadline) |
| `PAUSED` | 狀態 = 暫停. No schedule flags, but **always cross-check the newest [3.1] block**: a row marked 暫停 that is visibly running is an SOR divergence and belongs in the brief | all | the 暫停 value + any weekly-log evidence of activity |
| `UNKNOWN_STATUS` | 狀態 outside {未開始, 進行中, 放棄, 完成, 暫停} | all | the raw value; never mapped to a known state |
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

- Tracker vocab is 未開始 / 進行中 / 放棄 / 完成 / 暫停 — the skill never *writes* any of them; 延遲 does not exist and appears only in the brief as the derived `OVERDUE`. When the skill believes a row is finished it emits `PROPOSE_DONE` and the owner sets 完成.
- When a new status value shows up in the sheet, it arrives as `UNKNOWN_STATUS` — that is the signal to update this file, `derive_state.py` (`KNOWN_STATUSES`), `source-map.md`, `routine-prompt.tmpl` and the private config's `status_vocab` **together**, then re-render the routine prompt. Vocab drift in one place silently re-opens completed work in the brief.
- The skill **never edits the tracker** (status, dates, owners, 備註). All changes are asks to owners; owners push.
- Every flag prints its evidence and source date. A flag without evidence is dropped.
- Unknown ≠ silence: missing instrumentation is stated ("no signal source"), never read as inactivity.
