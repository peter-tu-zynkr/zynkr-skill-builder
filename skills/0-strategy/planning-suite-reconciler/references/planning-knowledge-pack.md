# Planning knowledge pack — shared by every `planning-*` skill

> **Identity:** this file is byte-identical in every `planning-*` skill's `references/`
> folder (SKB-007). The ONE canonical seed lives outside the skill tree at
> `docs/planning-shared/planning-knowledge-pack.md`; edit it there, then run
> `scripts/check-planning-refs.sh --sync` to re-copy and `scripts/check-planning-refs.sh`
> to prove the eight copies are md5-identical. Never edit a copy in place.
>
> It encodes how Zynkr runs a half-year / year-end planning cycle: the structure the
> tracker uses, the priority rule, the constraint frame, the facilitation runbook, the
> MECE judgement rules learned on 2026-07-26, and the doc-versioning convention. Skills
> READ this; they do not restate it in their bodies.

---

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| **Cycle** | One planning horizon: `H1` (Jan–Jun), `H2` (Jul–Dec), or `YE` (year-end: full-year retro + next-year plan). Skills take the cycle label as an input and never assume one. |
| **Session** | The in-room offsite (~3 h) where the team looks back, looks forward, and converges on a project list. |
| **Main Tracker** | The Google Sheet that is the **system of record (SOR)** for scope · priority · owner · dates · status of the cycle's projects. Tabs listed in §6. |
| **Suite** | The satellite planning docs that must reconcile TO the tracker: the integrated plan Doc, the per-LOB plan Docs, the OKR & KPI Tracker Sheet, and the strategy Docs (VMS, product line, value ladder, taxonomy). |
| **LOB** | Line of business = one of the eight functions in §2. Also called 職能. |
| **Owner / 協助者** | 負責人 (single accountable person) and helpers, as columns in the tracker. |
| **P0–P3** | Priority derived from 重要 × 緊急 (§3). `P3` = 放棄 (dropped this cycle). |

---

## 2 · The eight functions (L1) and their sub-categories (L2)

L1 numbering is fixed and shared with the H2 plan Docs and the `[N]` Drive folders. L2 sub-categories are **per-cycle** — the 2026-07 set is listed as the default; a new cycle may add or rename L2 rows, but must keep the L1 numbers.

| L1 | Function | 2026-07 L2 sub-categories (default) |
|---|---|---|
| **1.0** | Marketing & Brand | 1.1 內容與 SEO · 1.2 付費流量 · 1.3 名單獲取與經營 · 1.4 口碑與背書 · 1.6 社群觸點營運 (LINE@ etc.) |
| **2.0** | Sales & Consulting | 2.1 業務體系與流程 · 2.2 業務招募／誘因與 on-board · 2.3 陌生開發與 outreach · 2.4 機構・B2B 通路 · 2.5 外部業務講師 |
| **3.0** | Operations | 3.1 基礎營運 · 3.2 講師供給 · 3.3 場次與排課 · 3.4 營運衡量 (Metrics) · 3.5 內部工具與知識資產 |
| **4.0** | Knowledge Products & Training | 4.1 顧問與導入服務 · 4.2 培訓型服務 · 4.3 課程主題（內容 IP）· 4.4 內容型商品 · 4.5 商品階梯與定價 · 4.6 會員經營 |
| **5.0** | Development Ops & Productization *(the July H2-plan label; the 2026-08 Org-Taxonomy v2 relabels 5 as 企業 AI 賦能與深度診斷 and moves platform work to 6.0)* | 5.1 流程 · 5.2 建置 · 5.3 GTM — often 0 items on a whiteboard; **flag emptiness, don't invent**. **Which taxonomy?** Default = the July L1 labels (they match the plan Docs and the tracker). If a cycle adopts v2, say so in the tracker README and remap 企業 AI 診斷／導入／流程設計 from 4.1 → 5.0 — never mix the two in one file. |
| **6.0** | Tech & Platform | 6.1 對外平台 · 6.2 內部平台／自動化 |
| **7.0** | People & Talent | 7.1 目標與績效 (KPI) · 7.2 人才發展 (Onboarding · Training) |
| **8.0** | Finance & Admin | 8.1 現金與 runway · 8.2 定價與護欄 · 8.3 法務與合約 — **also usually 0 items on a whiteboard; flag it** |

Rules for classifying an item into L1/L2:

- Classify by **what is produced**, not by who does it or which tool is used. Examples: 名單開發 → 1.3 (marketing produces the list; sales converts it) · a 講師 whose output is a 課 → 3.2, whose output is a 案子 → 2.5 · a 分潤系統 → 2.2 (purpose is sales incentive; the platform build is the means) · PM Skills → 4.3 (a course topic, not tech).
- Two look-alike items stay separate when they are different stages of one funnel (企業 AI 診斷 vs 導入), different targets (KPI = people · Metrics = business), or different directions (用 Zynkr internal dogfood = 3.5 · Expand Zynkr outward = 6.1).
- Whiteboard columns are **not** MECE; the tracker is. Every re-cut is written down as a ruling (§5) so the room can dispute it.

Coverage check (窮盡性): after classifying, count items per L1. Zero or ≤2 items in 5.0 / 6.0 / 8.0 is the normal failure mode of a brainstorm — report it as a **coverage gap**, and quote what that LOB's plan Doc says should have been there.

---

## 3 · Priority rule (重要 × 緊急 → P0–P3) and status vocabulary

| 重要 | 緊急 | Priority | Meaning |
|---|---|---|---|
| 重要 | 緊急 | **P0** | Do now — start this cycle, named owner, dated |
| 不重要 | 緊急 | **P1** | Do soon / delegate — urgent because it gates or expires |
| 重要 | 不緊急 | **P2** | Schedule — owner + quarter, revisit at the mid-cycle gate |
| 不重要 | 不緊急 | **P3** | 放棄 this cycle — parked; reopen only at the mid-cycle gate |

- 重要 = directly moves a top-3 company target (name it). 緊急 = gates another initiative OR expires (warm-lead decay, a recording window, a booked venue).
- Status vocabulary (exact strings): `未開始` · `進行中` · `完成` · `放棄`. Dates are `YYYY-MM-DD`; an unfilled date is literally the placeholder `YYYY-MM-DD` and counts as **missing**.
- **Do-now cap (design intent):** the June design asked for ≤6 owned Do-now items and a founder-time gate; the July session landed 14 P0 (25% of 55). Skills **lint** the cap (warn when P0 > 6 or > 25% of items, and when one owner holds > 3 P0) — they never block on it. State which rule the room chose.
- Owner rules: exactly one 負責人 per item; `All` is a smell → lint "掛 All 的項目需要認領". `N/A` is only valid on P3.

---

## 4 · Binding-constraint frame (C1–C4) — the decision lens

Fill this in for every cycle before prioritising; every P0 must name which constraint it relieves.

| # | Constraint | Fill-in |
|---|---|---|
| C1 | Cash / runway | cash on hand · monthly burn · months of runway · floor rule (Zynkr 2026: keep ≥ 4 months; break-even target) |
| C2 | Founder single-point-of-failure | founder hours/week available · which delivery still routes only through the founder |
| C3 | Product / value-ladder gap | the missing price rungs · flagship not yet produced |
| C4 | Instrumentation | which of CAC / LTV / ROAS / runway / usage are not computable today |

Sequencing rule (2026): the first half of a cycle is cheap compounding work (instrument · capture · produce · document · bench-recruit); the second half is capital-heavier convert/scale, **gated** on first-half traction or a closed raise. Any hire/ad spend is checked against C1 before it enters P0.

Ground rules posted at the start of a session (keep all four): (1) honour the 3-part flow — no solutioning during looking-back; (2) every forward goal quotes a number; (3) disagree on the matrix, not in side-chats; (4) binding constraints are non-negotiable.

Pass/fail bar for a session (the June design; adapt the numbers): a converged Do-now set each with owner + next step + start-date, dependency-sequenced · the plan pressure-tested against the C1 floor · any founder-time blocks (recording, delivery) put on the calendar before leaving the room.

---

## 5 · Facilitation runbook (what worked on 2026-07-26 and what the design intended)

Three parts, ~3 hours, one facilitator (the founder), 5–7 people, a whiteboard with 6–8 columns.

| Block | Designed | What the room actually did (keep) | Skill that prepares / digests |
|---|---|---|---|
| Open (15′) | goal · pass/fail bar · ground rules · constraint frame | goal + round-robin framing | `planning-prework-pack` (deck slide 1–3) |
| Part 1 · Looking back (25–40′) | 5 owners × 3′ on pre-filled function slides; a silent tagger marks durable-asset vs founder-dependent | **person-by-person round-robin** on an *as-is* board (one column per person: 做得好 · 可加強), peers give feedback | `planning-1on1-annual-digest` + `planning-evidence-pack` feed the slides · `planning-session-synth` digests the transcript |
| Part 2 · Looking forward (30′) | founder presents numeric targets + finance frame + 5 cross-cutting themes | **function-column brainstorm** on a *to-be* board (Brand&MKT · Sales · OPS · Product KM · Product tech · People), 3 pen colours = 3 contributors | `planning-prework-pack` pre-places one target line per LOB + the C1–C4 frame on the board |
| Part 3a · Generate (30′) | silent write 8′ → round-robin, cluster into themes, park constraint-violating items in a visible 「NOT in H2」 zone | done implicitly on the to-be board | `planning-session-synth` (whiteboard → ② 原文 → ③ 去重 → ④ MECE) |
| Part 3b · Converge (40′) | Eisenhower live → founder-time gate → ≤6 Do-now → owner + quarter + next step + start-date → dependency arrows | **重要 × 緊急 applied afterwards in the Sheet** → P0–P3, owners, dates | `planning-tracker-builder` (lints the cap; never blocks) |
| Cash pre-mortem (10′) | lay Do-now against burn and the floor; assign raise go/no-go | not recorded | `planning-tracker-builder` prints the C1 check as a section |
| Close (15′) | RACI · decision/gate log · calendar the founder blocks · each names #1 commitment | recap mail next evening with 3 asks | `planning-session-synth` drafts the recap mail |

Recap-mail shape (canonical, sent 2026-07-27 20:00 to the whole team): TL;DR → 回顧支柱 (N items, how many 做得好) → 結構性問題 (the 可加強 clusters) → 策略主軸 (2–3) → nice-to-have → 專案盤點 (count · L1 split · 重要/緊急 → P0/P1/P2/P3 counts · owner table) → 下一步：三件事 (fill dates · claim items 掛 All · owners push slips; state 「還在摸索」/「已定案」 on every direction change).

Post-session cadence that stuck: next-day 1:1s with each owner (Fireflies-recapped) · weekly Team Weekly agenda block off the tracker · from 2026-08-13: 「每週一貼 1–3 件當週 focus、週四 review」.

---

## 6 · Main Tracker layout (the SOR template)

Tabs, in order, as built 2026-07-26 → 07-28 (`planning-tracker-builder` reproduces this exactly):

| Tab | Purpose | Columns |
|---|---|---|
| `README` | how the tracker was made: source (photo/transcript), method (transcribe → MECE re-cut → merge/split), counts, confidence, ⚠ coverage gaps, tab guide | two-column key · value |
| `H1 回顧總結` (or `<cycle> 回顧總結`) | the retro table + 5 重點結論 on top | `# · 領域 · 類型 (做得好／可加強) · 項目 · 逐字稿重點 · 建議下一步` |
| `H2 專案項目` (or `<cycle> 專案項目`) | the project list — **the SOR tab** | `# · 主類別 · 子類別 · 項目（正規化）· 重要 · 緊急 · Priority · 負責人 · 協助者 · 開始 · 結束 · 狀態 · 備註`; L1 header rows (`1.0`, `2.0`, …) with items numbered `1.01`, `1.02` … **The `#` prefix is positional (sequential by presence), the L1 number lives in the 主類別 text** — in the July tracker `#5.0x` rows are 主類別 `6.0 Tech & Platform` and `#6.0x` are `7.0 People & Talent`. Group by 主類別, quote `#` verbatim. `read_sheet_values` returns ≤50 rows per call — page the rest. |
| `專案項目小記` | pivot: count + % per priority; per-owner P0/P1/P2/total | small grid, formulas allowed |
| `② 白板原文` | verbatim whiteboard transcription, column by column, pen colour noted | `# · 白板欄位 · 手寫原文 · 筆色 · 判讀信心 · 備註` (the live July header; `#` = running row number) |
| `③ 去重與歸類決策` | every ruling that changed an item | `# · 決策 (合併／拆分／移欄／不合併／排除) · 項目 · 白板出處 · 歸到哪裡 · 判準／理由` |
| `④ MECE 檢查` | 窮盡性 (items per L1 + 涵蓋程度 + 說明) and 互斥性 (each overlap: 白板寫在哪 · 切法 · 判準) | two small tables |

Retro classification schema for `回顧總結`: 領域 ∈ {課程製作 · 品牌設計 · 行銷內容 · 活動營運 · 產品平台 · 團隊管理 · 策略方向 · <add per cycle>}; 類型 ∈ {做得好 · 可加強}; 建議下一步 is one clause or `—`.

Retro filter for a person's year (`planning-1on1-annual-digest`): sort every past-year output into **放大** (a durable asset that removes founder dependency or fills a ladder gap → keep investing) · **收割** (done — maintain and monetise, no new build) · **停止／改造** (rework the strategy says to eliminate). Tie every 放大 to a constraint in §4.

---

## 7 · MECE rulings — the worked examples from 2026-07-27 (reuse as precedent)

| # | 決策 | 項目 | 判準 |
|---|---|---|---|
| 1 | 合併 | 名單開發 (Brand&MKT + Sales) | one job written twice; producing the list is marketing (1.3), sales keeps only the convert step |
| 2 | 合併 | 投標／標案 (Brand&MKT + Sales) | same government/enterprise tender path → 2.4 |
| 3 | 合併 | 電子報 + 「Drip＋分流＋Capture pop-up」 | the red-pen line is the expansion of the black-pen item, not a new one |
| 4 | 合併 | 業務流程 + Operation | two people, two words, one thing → 2.1 |
| 5 | 拆分 | 會員經營／內容經營 | acquisition content (1.1) vs retention of existing customers (4.6) |
| 6 | 拆分 | 新創總會・政府課程・工會訓練 | three channels, three counterparts, three cycles |
| 7 | 拆分 | 企業補助・標案 | 補助 = apply, 標案 = bid |
| 8 | 不合併 | 增加講師（外部） vs 開發外部業務講師 | output is a 課 → 3.2 · output is a 案子 → 2.5 |
| 9 | 不合併 | 企業 AI 診斷 vs 企業 AI 導入 | front (paid diagnostic) vs back (delivery) of one funnel |
| 10 | 不合併 | KPI vs Metrics | people targets (7.1) vs business dashboard (3.4) |
| 11 | 不合併 | 用 Zynkr vs Expand Zynkr | internal dogfood (3.5) vs outward product (6.1) |
| 12 | 移欄 | 高 LTV 高單價課／低單價結緣商品／團購（中價位） | one price ladder → 4.5 (「賣什麼」, not 「怎麼賣」) |
| 13 | 移欄 | LINE@ 營運 | outward touchpoint operation is marketing (1.6) |
| 14 | 移欄 | 業務 On-board 分潤系統 | purpose is sales incentive (2.2); the system is the means |
| 15 | 移欄 | PM Skills | a course topic (4.3), not tech |
| 16 | 移欄 | 新陌生開發 | 1-to-1 outreach is a sales motion (2.3), not exposure |
| 17 | 排除 | 業務・外部・向外・→ arrows | layout labels, not work items — keep in ② 原文 only |

Handwriting confidence: mark each transcribed line 高 / 中 / 低; anything 中 or 低 goes into a 「請與會者確認」 list in the README, never silently normalised.

---

## 8 · Doc-versioning convention for the suite

- The **tracker is the SOR**; every other Doc/Sheet reconciles to it, never the reverse.
- **Docs:** never rewrite a body. Add a dated addendum section at the top: `## YYYY-MM-DD Refresh (vN) — aligned to the <cycle> Planning Main Tracker`, opening with the sentence "Where this section conflicts with the sections below, this section wins; the Tracker is the system of record for scope, priority and owners." Then: what changed vs the previous plan · open decisions · the P0 list with owners · management fixes carried from the retro.
- **Sheets:** version by **new tab** (`<name> — YYYY-MM 現行版`); old tabs stay as archive, optionally prefixed `(Archive)`. Never overwrite a historic tab.
- **Superseded snapshots:** rename to `[SUPERSEDED YYYY-MM] <name>` and add a one-line banner pointing at the live doc.
- Cloud (Google Drive) is the source of truth for planning artefacts — a local file is a mirror at best.
- Inline annotations left for the founder: one short line, never a paragraph.

---

## 9 · What a skill in this family never does

- Never invents numbers: proof numbers come from a source (tracker cell, Sheet, ledger, calendar count) or are written as `（待補）`.
- Never sends mail — drafts only. Never edits the tracker's SOR tab without showing the diff first. Never renumbers L1.
- Never silently resolves handwriting or ambiguity — surfaces it.
- Never assumes the roster: owners come from the tracker's 負責人 column or the user.
