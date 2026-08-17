# Tracker tab schemas — what `planning-session-synth` writes, cell by cell

> Skill-specific reference (not part of the byte-identical shared pair). It pins the exact
> tab names, header rows and row shapes this skill writes into the Main Tracker, plus the
> retro 領域 vocabulary and one worked example row per tab. Layout facts come from the
> live 2026 H2 tracker (`planning-sources.md` §A); vocabulary and rulings come from
> `planning-knowledge-pack.md` §2 · §6 · §7 — cite those, do not restate them.
>
> Example rows are the July 2026 rulings re-quoted from the tracker. They carry **no
> personal names**; owners always come from the tracker's 負責人 column or the user.

---

## 0 · Tab order and ownership

| # | Tab | Written by | Notes |
|---|---|---|---|
| 1 | `README` | **this skill** | key · value pairs; rewritten last (Step 6) |
| 2 | `<cycle> 回顧總結` | **this skill** | 5 重點結論 block on top, then the retro table |
| 3 | `<cycle> 專案項目` (SOR) | `planning-tracker-builder` | this skill only writes here when the user says so — and even then via a printed row plan |
| 4 | `專案項目小記` | `planning-tracker-builder` | pivot; leave empty on a new tracker |
| 5 | `② 白板原文` | **this skill** (Pass A) | verbatim, one row per handwritten line |
| 6 | `③ 去重與歸類決策` | **this skill** (Pass B) | one row per ruling |
| 7 | `④ MECE 檢查` | **this skill** (Pass B) | two stacked tables |
| 8 | `⑤ 正規化清單` (optional extra — not in pack §6) | **this skill** (Step 7) | the §5 handoff list, only when the user asks for a tab; default persistence is chat + a hub-folder `.md` |

Cycle prefix: `H1` / `H2` / `YE` exactly as resolved in Step 0. Pack §6 default is
`<cycle> 回顧總結` + `<cycle> 專案項目`; the July tracker labelled the retro tab by the half it
looks back on (`H1 回顧總結` inside the H2 tracker) — take the user's label, print which
convention you used, and never mix the two on one tracker.

Re-runs never overwrite: if a tab already has content (= at least one data row below
the header; a missing or header-only tab is empty and is written in place), `create_sheet`
a new tab `<tab> — YYYY-MM-DD` first, then write into it and leave the old one. This is
the day-suffixed form of pack §8's `<name> — YYYY-MM 現行版` (two digest runs can land in
one month) — note it in the README.

A tracker created by this skill (Step 5, no-tracker branch) leaves `<cycle> 專案項目` and
`專案項目小記` completely empty — no header row — so `planning-tracker-builder` detects its
`fill` mode and writes into the same file.

---

## 1 · `② 白板原文` — Pass A, verbatim

Header row (row 1), exactly:

`# · 白板欄位 · 手寫原文 · 筆色 · 判讀信心 · 備註`

(The pack §6 short form `欄 · 行 · 原文 · 筆色 · 判讀信心` maps onto this: 白板欄位 = 欄,
`#` = 行 numbering per photo, plus a 備註 column for the reading rationale.)

Rules per row:

- One row per handwritten line, in reading order **top→bottom within a column,
  columns left→right**. If more than one board photo, prefix 白板欄位 with the board name
  (`to-be · Sales`, `as-is · 第 3 欄`).
- 手寫原文 is what is written, character for character — including layout labels, arrows,
  crossed-out words (write `～刪除～`), and abbreviations. **No normalising in this tab.**
- 筆色 ∈ {黑 · 紅 · 藍 · 灰 · 綠 · …} as seen; unknown → `？`.
- 判讀信心 ∈ {高 · 中 · 低}. Anything 中/低 gets a 備註 with the candidate readings and
  is echoed into the README `請與會者確認` list.
- Layout labels (欄位左緣標註, arrows, headers) stay in this tab with 備註 `非工作項` —
  they are excluded in Pass B by ruling type 排除 (pack §7 #17).

Worked example rows (July to-be board, Brand & MKT column):

| # | 白板欄位 | 手寫原文 | 筆色 | 判讀信心 | 備註 |
|---|---|---|---|---|---|
| 2 | Brand & MKT | 名單開發＋投標 | 紅 | 中 | 末二字判讀待確認（投標／提標） |
| 7 | Brand & MKT | 找字分析 | 黑 | 中 | 應為關鍵字分析 |
| 11 | Brand & MKT | →（箭頭） | 紅 | 高 | 指向下方紅字群，非工作項 |

---

## 2 · `③ 去重與歸類決策` — Pass B, every ruling

Header row, exactly:

`# · 決策 · 項目 · 白板出處 · 歸到哪裡 · 判準／理由`

- 決策 ∈ {合併 · 拆分 · 移欄 · 不合併 · 排除} — the five verbs of pack §6/§7. Nothing else.
- 白板出處 quotes the ② rows it touches: `<欄>「<原文>」`, several joined by `・`.
- 歸到哪裡 is an L2 code + name from pack §2 (`1.3 名單獲取與經營`); a 拆分 lists both
  targets joined by `＋`; 排除 writes `—（僅留在②）`.
- 判準／理由 is one sentence that a room member could dispute. Reuse the pack §7 wording
  when the case matches; write a fresh one when it does not, and number it after the
  17 precedents.

Worked example rows:

| # | 決策 | 項目 | 白板出處 | 歸到哪裡 | 判準／理由 |
|---|---|---|---|---|---|
| 1 | 合併 | 名單開發 | Brand & MKT「名單開發＋投標」・Sales「名單開發」 | 1.3 名單獲取與經營 | 同一件事寫在兩欄。產生名單是行銷職能，Sales 欄只保留把名單變成成交的動作 |
| 5 | 拆分 | 內容經營／會員經營 | Product (KM)「會員經營／內容經營」 | 1.1 內容與 SEO ＋ 4.6 會員經營 | 獲客內容與既有客留存是兩種職能，不能同格 |
| 17 | 排除 | 業務・外部・向外・→ | Brand & MKT / Sales 欄緣標註 | —（僅留在②） | 版面標註與箭頭，不是工作項 |

---

## 3 · `④ MECE 檢查` — Pass B, two stacked tables

Layout (row numbers are the July shape; keep the two titles and the blank spacer rows):

```
Row 1   窮盡性檢查 — 白板 vs <cycle> 八大職能
Row 3   <cycle> 職能 · 項目數 · 涵蓋程度 · 說明
Row 4–11  one row per L1 1.0 … 8.0 (always all eight, even when 0)
Row 13  互斥性檢查 — 白板欄位不互斥的 N 處
Row 15  重疊處 · 白板寫在哪 · 切法 · 判準
Row 16+ one row per overlap resolved in ③
```

- 涵蓋程度 ∈ {已涵蓋 · 偏薄 · 未涵蓋}: `0` items → 未涵蓋; `≤2` (or clearly thin against
  the LOB plan Doc) → 偏薄; else 已涵蓋. 說明 for 偏薄/未涵蓋 must quote what the LOB's
  plan Doc (sources §A) says should have been there — that is the coverage-gap evidence.
- 切法 vocabulary: `歸 <L2>` · `1 拆 2` · `全歸 <L2>` · `不合併`.

Worked example rows:

| <cycle> 職能 | 項目數 | 涵蓋程度 | 說明 |
|---|---|---|---|
| 8.0 Finance & Admin | 0 | 未涵蓋 | 白板 0 項 — 現金模型與 runway 儀表板是本期 Do-now star，未被提及 |

| 重疊處 | 白板寫在哪 | 切法 | 判準 |
|---|---|---|---|
| 講師 | 兩處 | 1 拆 2 | 產出是「課」歸 3.2 講師供給；產出是「案子」歸 2.5 外部業務講師 |

(The July tab's L2 numbers differ from the pack §2 default in several rows — 講師 3.1 vs
3.2, dogfood 3.4 vs 3.5, Metrics 3.3 vs 3.4; the pack wins for new cycles.)

---

## 4 · `<cycle> 回顧總結` — transcript pass

Layout, exactly as the July tab:

```
Row 1      重點結論
Row 2–6    1 … 5  · one conclusion each (two columns: # · text)
Row 7      (blank)
Row 8      # · 領域 · 類型 · 項目 · 逐字稿重點 · 建議下一步
Row 9+     the retro rows, grouped by 領域, 做得好 before 可加強 within a 領域
```

- 領域 vocabulary (pack §6, add per cycle and say so in the README):
  `課程製作 · 品牌設計 · 行銷內容 · 活動營運 · 產品平台 · 團隊管理 · 策略方向`
- 類型 ∈ {做得好 · 可加強} — exact strings.
- 逐字稿重點 is a tight paraphrase or short quote of what was said, with the fact kept
  (numbers only if the speaker said them; otherwise none).
- 建議下一步 is one clause or `—`; it may sharpen what the room itself proposed but must
  never add an owner, a date, or a number nobody said.
- Under the table, one summary line: `做得好 N · 可加強 M · 領域數 K` (also goes into README).

Worked example rows:

| # | 領域 | 類型 | 項目 | 逐字稿重點 | 建議下一步 |
|---|---|---|---|---|---|
| 1 | 課程製作 | 做得好 | 一年內從零打造課程生產線 | 三檔課推進完成：寫作課 → 職涯課 → Claude Code 課 | 維持產線，不再歸零重建 |
| — | 團隊管理 | 可加強 | 專案排程異動缺少主動提示 | 排程一改，其他人要自己去看表才知道 | 排程異動由負責人主動推進並通知 |

Worked 重點結論 example: `最急的兩個管理缺口：專案排程要由負責人主動推進 · 方向切換時要講清楚「還在摸索」或「已定案」`.

---

## 5 · Normalized item list — the handoff to `planning-tracker-builder`

Chat/markdown table — default persistence is the chat handoff plus a `.md` in the hub
folder (`<year>-<cycle>-normalized-items-YYYY-MM-DD.md`, written only after confirmation);
a `⑤ 正規化清單` tab (this header, row plan first) is an optional extra outside pack §6,
only when the user asks; `③`/`④` do not carry every item. Columns:

`主類別 · 子類別 · 項目（正規化）· 出處 · 信心`

- 主類別 = L1 code + name; 子類別 = L2 code + name (pack §2, per-cycle L2 set).
- 出處 = the ② rows (`Brand & MKT #3`) and/or the ③ ruling number (`③#1`).
- 信心 = the lowest 判讀信心 among the ② rows the item came from.
- Grouped by L1 in 1.0 → 8.0 order; **no** owner · 重要 · 緊急 · dates — those are
  decisions the room or the user makes and `planning-tracker-builder` records.

Worked example row: `1.0 Marketing & Brand · 1.1 內容與 SEO · SEO 文章 · Brand & MKT #3 · 高`

When the user says "write it straight into `<cycle> 專案項目`": use the SOR header
`# · 主類別 · 子類別 · 項目（正規化）· 重要 · 緊急 · Priority · 負責人 · 協助者 · 開始 · 結束 · 狀態 · 備註`,
L1 header rows `1.0`, `2.0` … with items `1.01`, `1.02` …, leave 重要/緊急/Priority/負責人
blank, dates as the literal `YYYY-MM-DD`, 狀態 `未開始` — and print the row plan first.

---

## 6 · `README` — key · value pairs

Row 1 title: `<cycle> <year> Offsite — 白板盤點（MECE・已去重）`; row 2 source line
(`來源：<date> offsite 白板照片 <file names> · N 欄 · K 種筆色 · 逐字稿 <Doc title>`).
Then two-column key · value rows in this order (blank rows between groups are fine):

| Key | Value shape |
|---|---|
| 這份表是什麼 | one sentence: transcribe verbatim → MECE re-cut → merge/split |
| 分類軸怎麼選 | L1 = the eight functions (pack §2), L2 = per-cycle sub-categories |
| 為什麼要重切 | the concrete overlaps seen on this board |
| 互斥怎麼判 | "one item, one cell; the rule is in ③" + one example |
| 原文行數 | `N 行（其中 K 行是版面標註／箭頭，不計為工作項）` |
| 正規化後項目 | `N 項 · a 組合併 · b 組拆分 · c 組跨欄移位 · d 組刻意不合併` |
| 判讀信心 | counts of 高/中/低 + "中/低 列於下方 請與會者確認" |
| 請與會者確認 | one line per 中/低 reading: `②#<n> 「<原文>」→ 候選：A／B` |
| ⚠ 覆蓋缺口 | each L1 with 0 items, with the plan-Doc quote |
| ⚠ <L1> 偏薄 | each thin L1 |
| 回顧總結 | `做得好 N · 可加強 M · 領域 K · 重點結論 5` + 逐字稿 segmentation note (speakers 未標示 unless a map was given) |
| 分頁導覽 | `README｜<cycle> 回顧總結｜<cycle> 專案項目｜專案項目小記｜② 白板原文｜③ 去重與歸類決策｜④ MECE 檢查`（＋`⑤ 正規化清單` when written）; add one line naming which tracker path was taken (created here with empty SOR · existing · builder-fresh) |

---

## 7 · Recap-mail skeleton (pack §5 shape, zh-TW, Gmail DRAFT only)

Subject (house default — pack §5 gives the body shape only; take the user's wording if
given): `[<cycle> planning] 回顧＋專案盤點 recap（YYYY-MM-DD）`. `to` is one comma-separated
string.

```
TL;DR（3 行）
一、回顧支柱 — N 項，其中 做得好 a · 可加強 b（領域列表）
二、結構性問題 — 可加強 的群集（2–4 條）
三、策略主軸 — 2–3 條（每條標注「還在摸索」或「已定案」）
四、Nice-to-have — 1–3 條
五、專案盤點 — 共 N 項 · L1 分佈 · 重要／緊急 → P0/P1/P2/P3 數量（未評則寫「尚未評」）· 負責人表（來自 tracker 負責人欄；未認領則寫「待認領」）
六、下一步：三件事 — 補日期 · 認領掛 All 的項目 · 負責人主動推進 slips
附：請與會者確認（中／低 判讀清單）· Tracker 連結
```

Only sections the run actually produced are filled; a section with no material is written
as one line `（本次未涵蓋）`, never padded.
