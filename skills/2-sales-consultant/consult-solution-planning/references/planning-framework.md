# Solution-Planning Framework（產品企劃力 · consult edition）

> Framework and methodology **產品企劃力** by
> [MrPM-Stanley](https://github.com/MrPM-Stanley/product-planning-skill) —
> design thinking + product positioning, operationalized here for Zynkr
> consulting engagements. The faithful mirror of the original lives in this
> repo as `product-planning` (5.02); the full theory is MrPM-Stanley's
> 產品企劃力 course on PPA.

This file is the working contract for `consult-solution-planning`: field
definitions, the scoring rubric, and the shapes every plan section must take.
The skill fills these; it never redefines them.

---

## 1. Persona canvas（operator persona）

One primary persona — the person whose hands are on the painful process. Fill
every field from discovery evidence; mark anything inferred as `（假設）`.

| 欄位 | 要回答的問題 | 例（宏宇精密） |
|------|--------------|----------------|
| 角色 | 職稱＋在流程裡的位置；一句話 | 業務助理 王小明 — 所有報價單的實際製作者 |
| 目標 | 這個人每天想「做完什麼」？ | 當天詢價當天回覆，報價不出錯 |
| 日常工作流 | 一天的主要動作序列（3–6 步） | 收詢價信 → 查 Excel 價目 → 手 key 報價單 → 主管簽核 → 回信 |
| 工具 | 實際碰到的系統／檔案（含影子工具） | Outlook · Excel 價目表 · Word 報價模板 · LINE 追主管 |
| 痛點觸點 | 工作流中哪幾步最常出事？ | 手 key 轉抄（錯價）· 追簽核（等待）· 版本混亂（舊價目表） |

## 2. Operator-journey template（as-is）

The journey documents **today's** flow — one row per 階段, in execution order.
The 機會 column is a hypothesis only; nothing in it is committed until it
survives the ranking rubric and the MVP scope tests.

| 階段 | 動作 | 工具 | 痛點 | 機會 |
|------|------|------|------|------|
| 接單 | 收詢價信、判斷品項 | Outlook | 信件格式不一，漏看規格 | 詢價信結構化擷取 |
| 報價 | 查價、手 key 報價單 | Excel + Word | 轉抄錯價、舊版價目 | 單一價目來源＋自動帶入 |
| 簽核 | 印出送主管、LINE 催 | 紙本 + LINE | 等待 0.5–2 天 | 線上簽核＋提醒 |

## 3. Ranking rubric — score = 影響範圍 × 強度 × 頻率

Every pain in the ledger gets all three scores, each on a defined 1–5 scale.
No half points, no ad-hoc criteria — comparability across engagements is the
whole point of fixed definitions.

### 影響範圍（size）— 這個痛波及多少人

| 分數 | 定義 |
|------|------|
| 1 | 個人 — 只影響一位操作者 |
| 2 | 小組 — 同一職能的 2–5 人 |
| 3 | 部門 — 一整個部門的日常工作 |
| 4 | 跨部門 — 多個部門或一整條流程 |
| 5 | 全公司＋客戶 — 全公司營運受影響，且外溢到客戶體驗 |

### 強度（intensity）— 痛起來多嚴重

| 分數 | 定義 |
|------|------|
| 1 | 小煩躁 — 不影響結果，只是不順手 |
| 2 | 拖慢 — 每次多花幾分鐘的 workaround |
| 3 | 重工 — 明顯的重複勞動或返工 |
| 4 | 出錯 — 會產生需要善後的錯誤（改單、道歉、補救） |
| 5 | 流程中斷／損失金錢 — 流程停擺、賠錢、掉單或違約風險 |

### 頻率（frequency）— 多常發生

| 分數 | 定義 |
|------|------|
| 1 | 每年 — 一年幾次（結算、盤點級） |
| 2 | 每季 — 季節性或每季固定發生 |
| 3 | 每月 — 每月固定撞到 |
| 4 | 每週 — 每週都來一次以上 |
| 5 | 每天多次 — 日常工作的一部分 |

### Score bands（range 1–125）

| Score | 判定 | 意義 |
|-------|------|------|
| ≥ 48 | **MVP 候選** | 進入 scope tests；通過才進 MVP |
| 20–47 | **roadmap** | 值得做，排後續階段 |
| < 20 | **觀察** | 記錄在案，不排資源 |

Boundary rules: a pain scoring exactly 48 is a candidate; ties inside a band
sort by 強度 desc, then 頻率 desc. A re-score by Peter overrides the table —
log the old → new score next to the pain so the change is auditable.

## 4. MVP scope tests

Every MVP 候選 must pass **all three**; failing any one demotes it to roadmap
or forces a smaller cut of the same pain:

1. **最小可驗證？** — is there a smaller slice that still proves the value
   hypothesis? If yes, that slice is the MVP, not this.
2. **兩週可交付？** — deliverable in ~2 weeks of build effort? Bigger ⇒ split
   or demote.
3. **依賴最少？** — no waiting on third-party access, data cleanup, or another
   team's schedule before value shows up.

The 不做什麼 list (explicit out-of-scope) is part of the MVP definition, not
an afterthought.

## 5. Success-metric shape

Every metric is a four-part chain — a number without all four parts is a wish,
not a metric:

```
baseline → target → 量測方式 → 量測時點
```

| 指標 | baseline | target | 量測方式 | 量測時點 |
|------|----------|--------|----------|----------|
| 報價前置時間 | 2 天 | 4 小時 | 詢價信進線 → 報價寄出的時間差（抽 20 單） | 上線後第 4 週 |
| 報價錯誤率 | 每月 3–5 件 | ≤ 1 件 | 事後改單／折讓單計數 | 上線後第 8 週 |

Baselines come from discovery evidence; if none exists, write `baseline：待量測`
and add capturing it to the MVP scope — never invent a number.
