<!--
  adoption-report-template.md — the consult-adoption-reporter report skeleton.
  Usage: fill every {{PLACEHOLDER}}, delete ALL comment blocks (including this
  one), then create the Google Doc via the two-step (create_doc → move into the
  client's [N] folder).
  Principles: table-first, no charts. A metric the data cannot support is
  written as 無法衡量 with its reason under 資料覆蓋範圍 — never a made-up
  number, never a silently blank cell.
-->

# [Adoption] {{COMPANY}} — {{YYYY_MM}}

報告期間：{{WINDOW_START}} ～ {{WINDOW_END}}（近 {{WINDOW_WEEKS}} 週，對照前 {{WINDOW_WEEKS}} 週）
資料來源：platform.zynkr.ai 使用遙測（`crm_ai_usage`，唯讀）
上線日（go-live）：{{GO_LIVE_DATE}}
產出日期：{{TODAY}} · 產出：peter_tu@zynkr.ai

---

## 指標摘要

| 指標 | 本期 | 前期 | 變化 |
|------|------|------|------|
| WAU（每週活躍使用者，平均） | {{WAU_CURRENT}} | {{WAU_PRIOR}} | {{WAU_DELTA}} |
| 每人每週使用次數 | {{APUW_CURRENT}} | {{APUW_PRIOR}} | {{APUW_DELTA}} |
| 週趨勢（WoW） | {{WOW_TREND}} | — | — |
| 距上次使用天數（全 workspace） | {{DAYS_SINCE_LAST_USE}} | — | — |

一句話結論：{{HEADLINE}}

<!-- 任一格資料撐不起來就填「無法衡量」，並在下方「資料覆蓋範圍」寫明原因。 -->

## 週趨勢表

| ISO 週 | 週起始日 | 活躍使用者 | 使用次數 | Tokens（輸入＋輸出） |
|--------|----------|-----------|----------|----------------------|
| {{ISO_WEEK}} | {{WEEK_START}} | {{WEEK_ACTIVE_USERS}} | {{WEEK_REQUESTS}} | {{WEEK_TOKENS}} |

<!-- 每個 ISO 週一列，涵蓋前期＋本期共 {{TOTAL_WEEKS}} 週，由舊到新。
     沒有任何資料列的週要補 0，不能整週消失（缺列會讓趨勢被誤讀）。 -->

## 使用者明細

| 使用者 | 本期使用次數 | 前期使用次數 | 最近一次使用 | 距今天數 | 狀態 |
|--------|-------------|-------------|-------------|---------|------|
| {{USER_LABEL}} | {{USER_REQ_CURRENT}} | {{USER_REQ_PRIOR}} | {{USER_LAST_USED}} | {{USER_DAYS_SILENT}} | {{USER_STATUS}} |

<!-- 狀態三檔：活躍 · 降溫（本期 < 前期一半） · 流失風險（上線後 14+ 天未使用）。
     {{USER_LABEL}} 用 email 或姓名（來自 adoption-config.md 或 CRM 聯絡人）；
     對不回 email 的 user_id 以「未識別使用者 #n」呈現，並記入資料覆蓋範圍。 -->

## 主要功能 Top 3

| 排名 | 功能（feature） | 使用次數 | 佔比 |
|------|----------------|----------|------|
| 1 | {{FEATURE_1}} | {{FEATURE_1_REQ}} | {{FEATURE_1_SHARE}} |
| 2 | {{FEATURE_2}} | {{FEATURE_2_REQ}} | {{FEATURE_2_SHARE}} |
| 3 | {{FEATURE_3}} | {{FEATURE_3_REQ}} | {{FEATURE_3_SHARE}} |

<!-- 不足 3 個功能就列實際數量；佔比分母 = 本期全部使用次數。 -->

## 風險與建議

流失風險名單（上線後 14+ 天無使用）：

| 使用者 | 距上次使用 | 建議動作 |
|--------|-----------|----------|
| {{AT_RISK_USER}} | {{AT_RISK_DAYS}} 天 | {{NUDGE_SUGGESTION}} |

<!-- 沒有風險名單就寫「本期無流失風險使用者」，保留表頭。
     建議動作必須具體可執行、貼著該使用者的情境，例如：
     - 安排 30 分鐘一對一 refresher，直接操作對方最常見的工作情境
     - 請窗口把助理排進既有的週會節奏（例：週報產出前先跑一次）
     - 確認帳號／權限沒有卡住 — 登入問題常被誤讀成「不想用」
     - 給 2–3 個貼近該使用者日常任務的 prompt 範例
     禁用空話（「多多推廣」「加強宣導」不算建議）。 -->

整體建議：

1. {{RECOMMENDATION_1}}
2. {{RECOMMENDATION_2}}
3. {{RECOMMENDATION_3}}

## 資料覆蓋範圍

本報告「量得到」的：

- {{COVERED_1}}
- {{COVERED_2}}

本報告「量不到」的（含原因）：

- {{NOT_COVERED_1}}
- {{NOT_COVERED_2}}

縮小落差的做法：

- {{COVERAGE_FIX_1}}

<!-- 本節必填，逐客戶如實寫。常見情況：
     - 助理是以 Claude 技能交付（不是 platform.zynkr.ai 功能）→
       crm_ai_usage 完全沒有這個客戶的資料列 → 平台遙測整體無法衡量，
       只能靠客戶自述或工作成果旁證；解法 = 把客戶 onboard 到平台。
     - adoption-config.md 缺此客戶列（或整個檔案不存在）→ 使用者集合
       改用 CRM 交易聯絡人 email（fallback），可能少列或多列實際使用者；
       解法 = 補齊 config 的 workspace_id／user_emails 對照列。
     - user_id 對不回 email → 明細只能以匿名 id 呈現。
     - 遙測只有次數與 tokens，沒有對話內容 → 「用得深不深、問了什麼」
       一律無法衡量，不要推測。 -->

---

CRM 交易：{{DEAL_URL}}
