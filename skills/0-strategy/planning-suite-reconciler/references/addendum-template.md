# Addendum template — the dated Refresh block `planning-suite-reconciler` inserts

> Skeleton only. The heading and the "Where this section conflicts…" sentence are fixed
> by `planning-knowledge-pack.md` §8 and are reproduced here verbatim — the sentence
> OPENS the paragraph under the heading (§8 "opening with"; the "reconciles…" lead and
> the Links line follow it — the pack's order, no per-skill exception); everything in
> `<angle brackets>` is filled from the tracker (SOR tab) and the Doc being reconciled.
> Two forms exist: **Form A** for the integrated plan Doc (the July 2026 "Refresh (v2)"
> shape), **Form B** for a per-LOB plan Doc (the 2026-08-06 shape). Both are inserted at
> the TOP of the body — after the title (and any one-line preamble) and ABOVE any earlier
> Refresh addendum, so the newest addendum is always the first `## ` heading. Language is
> zh-TW/EN mixed exactly like the July originals: EN sentences, zh-TW item names, owners
> as they appear in the tracker's 負責人 column.

---

## Version number (`vN`)

- The Doc body itself is v1. The first addendum is `(v2)`, the next `(v3)`, and so on.
- Detect N by reading the Doc: take the highest `Refresh (vK)` already present and use
  K+1; if earlier addenda carry no version (the 2026-08-06 per-LOB pattern), count them
  and use (count + 2) — so a per-LOB Doc with the unversioned 2026-08-06 Refresh gets
  `(v3)`. State the N you chose and how you counted in the batch plan; on the first run
  of a cycle ask the user to confirm this counting rule before writing.

## Insertion rules (why the block is shaped this way)

- Heading is a real HEADING_2; sub-heads HEADING_3; body NORMAL_TEXT; lists are real
  bullets. When inserting above an existing heading the new text inherits that
  paragraph's style, so re-style the inserted range afterwards (see SKILL.md Step 6).
- No markdown tables — the addendum goes in as one `insert_text`, so a markdown table
  would land as literal `|` characters. Use bullet lines and `·` separators, as below.
- The skeletons below use `## ` / `### ` / `- ` only for readability here: strip every
  markdown marker before `insert_text`; paragraph styles and `create_bullet_list` carry
  the levels (SKILL.md Step 6).
- Links are plain URLs built from IDs in `planning-sources.md` (Tracker gid = the SOR
  tab), never remembered ones.

---

## Form A — integrated plan Doc (full form)

```
## <YYYY-MM-DD> Refresh (v<N>) — aligned to the <cycle> Planning Main Tracker

Where this section conflicts with the sections below, this section wins; the Tracker is
the system of record for scope, priority and owners. This addendum reconciles the
<previous plan label, e.g. "May plan"> below to the final <cycle> planning session (the
<prior-cycle> retro + the finalized project list in the 「<cycle> Planning Main Tracker」
Sheet). Links: Tracker <tracker URL with SOR gid> · <retro tab name, e.g. H1 回顧總結 for
the H2 cycle> <URL with that tab's gid> · <optional: recap mail date / deck URL>

### The <cycle> thesis, sharpened — <one-line label, e.g. from addition to subtraction (減法)>

<2–4 sentences: what the retro concluded, what the cycle is therefore about. Every
claim traces to a 回顧總結 row or a 重點結論 line; no new numbers.>

### The levers we double down on

- <lever 1 — zh-TW name> — <why, in one clause>. <cycle>: <the P0/P1 items that serve
  it, as `#N.NN 項目 (Priority, 負責人)`>.
- <lever 2 …>

### What changed vs the <previous plan label> below

- <Dropped> — <line / theme> dropped for <cycle>. <items 放棄 in the Tracker, by
  `#N.NN 項目`>; this supersedes §<n> of the body. Also dropped: <…>.
- <Added / elevated> — <workstream> elevated to <P0 / the biggest new build of the
  half>. <items with owners, `#N.NN 項目 (負責人)`> — all P0.
- <Re-scoped> — <what the body promised that the Tracker deferred (P2) or does not
  carry>; state 「P2 pending <open decision>」 or 「not in the Tracker — background work,
  no <cycle> KPI」.
- <one bullet per L1 that moved; skip L1s with no change>

### Open decisions (resolve during <cycle>)

- <decision 1 — the two options and the trigger that decides it, e.g. "decide on this
  cohort's ROAS">
- <decision 2 …>

### The <cycle> P0 list (<count> items, owners per the Tracker)

- <#1.NN 項目 — 負責人>
- <#2.NN 項目 — 負責人 · #2.NN 項目 — 負責人 · …>   ← group by L1, one line per L1
- …
- <items still 掛 All or without a 負責人 are listed as `— 待認領`, never guessed>

### Management fixes carried from the retro

<3–5 sentences, each a management rule THIS cycle's retro named (the 回顧總結 可加強
rows / 重點結論 lines read in Step 1). Cycle-specific findings — compose them from that
retro, never carry the previous cycle's sentences forward. For a standing guardrail
(e.g. runway) quote the body's §, do not restate the number unless the tracker/retro
states it. Illustration only — the H2 2026 retro named: schedules move only when owners
push · every direction change labeled 「還在摸索」 or 「已定案」 · fixed 1-on-1s restored.>
```

## Form B — per-LOB plan Doc (compact form)

```
## <YYYY-MM-DD> Refresh (v<N>) — aligned to the <cycle> Planning Main Tracker

Where this section conflicts with the sections below, this section wins; the Tracker is
the system of record for scope, priority and owners. Reconciles this plan to the
finalized <session dates> <cycle> planning outcome. Links: Tracker <SOR-tab URL> ·
Integrated Refresh (<date> v<N> addendum) <URL>

- <L1 name> P0s now: <#N.NN 項目 (負責人, 狀態 開始→結束)> — <one clause on why it leads
  the function>; <#N.NN …>. <Which were absent from this Doc.>
- <L1 name> P1s: <#N.NN 項目 (負責人, dates)> — <new workstream / what it supersedes in
  §§ of the body>.
- 放棄: <#N.NN 項目> — cancels the §<n> objective/initiative/KPI; <#N.NN> also dropped.
  <#N.NN> deferred to P2.
- De-scoped from <cycle> commitments: <body commitments with no Tracker item> — keep as
  background work with no <cycle> KPI; <hiring/spend asks> unconfirmed against C1.
- Open decisions affecting this LOB (resolve during <cycle>): <decision — the options
  and the trigger, from the integrated Refresh's open-decisions list plus this L1's
  「P2 pending …」 items> · <decision 2> — or `none`.
- <Cross-LOB dependency line, e.g. the B2B wedge lives in 4.x; this LOB's §<n> folds
  into it.>
- Management cadence (retro; applies to §<n>): <the management fixes THIS cycle's retro
  named, as short clauses separated by `;` — the same set as the integrated Refresh's
  "Management fixes carried from the retro", never a previous cycle's text>.
```

Rules for Form B: only this LOB's tracker rows (L1 match) plus explicitly cross-LOB
items that change this Doc's commitments; every `#N.NN` quotes the Tracker; a body
commitment that the Tracker neither carries nor 放棄s is written as "not in the Tracker",
not silently dropped; the open-decisions bullet is always present (`none` is a valid
value) so every per-LOB addendum carries the four §8 components — what changed · open
decisions · P0 list with owners · management fixes.

---

## Worked mini-example (Form B, placeholders — owners come from the 負責人 column)

```
## 2027-01-20 Refresh (v3) — aligned to the YE Planning Main Tracker

Where this section conflicts with the sections below, this section wins; the Tracker is
the system of record for scope, priority and owners. Reconciles this plan to the
finalized 2027-01-16/17 YE planning outcome. Links: Tracker <URL> · Integrated Refresh
(2027-01-20 v3 addendum) <URL>

- Operations P0s now: 3.02 加開線下場次 (王小明, 未開始 2027-02-01→2027-06-30) — the
  main revenue source of the year; 3.05 講師 bench 擴編 (李小華). 3.05 was absent from
  this Doc.
- Operations P1s: 3.01 LINE@ 營運 (李小華, 進行中) — supersedes the §4 community line.
- 放棄: 3.07 內容數據庫 — cancels the §3 objective 4.
- De-scoped from YE commitments: the automation backbone (§3 obj 2) is not in the
  Tracker — background work, no YE KPI.
- Open decisions affecting this LOB (resolve during YE): 3.02 venue count — 2 vs 4
  cities, decided by the Q1 fill rate (P2 pending); otherwise none.
- Management cadence (retro): <the fixes the YE retro named — cycle-specific; e.g. the
  H2 2026 retro named: schedules move only when owners push; 「還在摸索」/「已定案」 on
  every direction change; fixed 1-on-1s restored>.
```

---

## OKR & KPI Tracker — the two new tabs (column contract)

Tab names (short, zh-TW/EN mixed like the July tabs):
`OKRs — YYYY-MM 現行版` · `Initiatives — YYYY-MM 現行版`

`OKRs — YYYY-MM 現行版` (one row per KR; Objective repeated on each of its rows):

```
Objective · KR · Owner · Tracker # · <period-1> target · <period-2> target · Status · Notes
```

- The two target columns are cycle-aware: **H1** → `Q1 target · Q2 target`; **H2** →
  `Q3 target · Q4 target` (the July `OKRs` header in `planning-sources.md` §A —
  `Objective · KR · Owner · Tracker # · Q3 · Q4 · Status · Notes` — is the H2 example);
  **YE** → `H1 target · H2 target`; or the columns the user names, verbatim.
- Objective = one 策略主軸 from the tracker's 回顧總結 重點結論 / README (or the recap
  mail's 策略主軸 lines the user pastes) — never invented.
- KR = one P0 item, verbatim 項目（正規化）; Owner = 負責人 (helpers in Notes); Tracker #
  = `N.NN`; period targets = from the item's 開始/結束 + 備註 when they state a number,
  else `待定`; Status = the tracker's 狀態 string; Notes = 協助者 · constraint relieved
  (C1–C4) if the tracker/retro names it.
- A P0 that maps to no 策略主軸 goes under `O<last> — 其他 P0（待歸軸）`, flagged in the
  leftovers.

`Initiatives — YYYY-MM 現行版` (P0 + P1 mirror of the SOR tab, tracker order):

```
# · 主類別 · 項目（正規化） · Priority · 負責人 · 協助者 · 開始 · 結束 · 狀態 · 備註
```

Row 1 of each tab is a one-line provenance banner: `Rebased YYYY-MM-DD from
「<tracker name>」 tab 「<cycle> 專案項目」 (gid <n>) — Tracker is SOR; edit there, not
here.` The historic `OKRs` / `Initiatives …` / `KPI Dashboard` tabs are never cleared or
written, and neither are `planning-tracker-sync`'s `tracker-latest` / `tracker-snapshots`
tabs in the same Sheet (`Initiatives Q3-Q4` may already have been repurposed to
`tracker-latest` — leave it); the `overwrite` flag may only re-fill a same-named
`— YYYY-MM 現行版` tab from an earlier run in the same cycle.
