---
name: meeting-prep
description: "排程自動執行的會議準備助手：每天早上 9 點掃描 7 天內的會議並發送 action 提醒，每天下午 3 點發送隔天會議的完整 briefing。通知透過 Google Chat 傳給自己。不需要手動觸發，不處理會後追蹤。"
category: operations
project: meeting-prep
platform: claude
status: WIP
author: Jane Liao
input: "無（排程自動觸發，讀取 Google Calendar 與 Gmail）"
process: "9am cron：掃描 7 天日曆 → 發 action 提醒到 Google Chat｜3pm cron：掃 Gmail 找與會者背景 → 發 briefing 到 Google Chat"
output: "Google Chat 自我訊息：早上為 action checklist，下午為結構化 briefing"
synergy: []
---

# Meeting Prep

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill meeting-prep
```

每天自動執行兩次的會議準備助手：早上 9 點告訴你未來一週有哪些會議需要提前準備，下午 3 點針對隔天的會議送出完整 briefing，包含與會者背景、近期往來 email 摘要與建議準備事項。通知直接打進 Google Chat，不需要手動觸發。

---

## 兩個排程模式

| 排程 | 時間 | 功能 |
|------|------|------|
| **Morning Scan** | 每天 09:00 | 掃未來 7 天的會議 → 發 action 提醒 |
| **Afternoon Briefing** | 每天 15:00 | 掃隔天的會議 → 發完整 briefing |

---

## Mode A — Morning Scan（09:00 觸發）

### Step A1 — 掃描 Google Calendar

讀取未來 7 天內的所有日曆事件。

使用 `mcp__google_workspace__get_events`：
- `user_google_email`: 使用者 email
- `time_min`: 今天 00:00
- `time_max`: 今天 + 7 天 23:59

篩選條件：
- 只保留有其他與會者的事件（非個人 block time）
- 排除全天事件（All-day events）
- 排除已取消的事件

### Step A2 — 發 Action 提醒到 Google Chat

對每場符合條件的會議，列出需要採取的行動。

判斷邏輯：
- 距今 1 天以內 → `🔴 明天！請確認是否有準備`
- 距今 2–3 天 → `🟡 本週內，建議開始準備`
- 距今 4–7 天 → `🟢 本週末前留意`

發送格式（Google Chat self-message）：

```
📅 本週會議 Action 清單｜[日期]

🔴 明天
• [會議名稱] [時間] — 與會者：[人名]
  → 動作：確認議程 / 回顧相關 email

🟡 2–3 天內
• [會議名稱] [時間] — 與會者：[人名]
  → 動作：預先準備資料

🟢 4–7 天內
• [會議名稱] [時間]
  → 動作：備查

如無特定會議 → 發送「📅 本週無多人會議，保持待命。」
```

使用 `mcp__google_workspace__google_chat_send_self_message`（需 Peter 端接入 Google Chat API）。

---

## Mode B — Afternoon Briefing（15:00 觸發）

### Step B1 — 取得隔天的會議

使用 `mcp__google_workspace__get_events`：
- `time_min`: 明天 00:00
- `time_max`: 明天 23:59

篩選同 Mode A，取得 `TOMORROW_MEETINGS[]`。

若無會議 → 發送「✅ 明天沒有多人會議，無需準備。」即結束。

### Step B2 — 蒐集 Gmail 背景資料

對每場會議的每位與會者，搜尋近期往來 email。

使用 `mcp__google_workspace__search_gmail_messages`：
- query：`from:[attendee_email] OR to:[attendee_email]`
- 時間範圍：過去 30 天

整理每位與會者：
- 近 3–5 封 email 的主旨 + 一句話摘要
- 是否有未回覆的待辦（偵測「請確認」「麻煩回覆」「waiting for」等關鍵字）

### Step B3 — 生成並發送 Briefing

對每場會議生成一則 Google Chat 訊息：

```
📋 明日會議 Briefing｜[會議名稱]
時間：[start_time]
與會者：[人名清單]

🎯 會議目的
[從 description 或 title 推斷；無法判斷則標「未知，建議確認」]

👥 與會者背景
• [名字]：[近期互動摘要 / 職稱（若已知）]

📧 近期相關 Email（最多 5 筆）
• [日期] [主旨] — [一句話摘要]

⚠️ 待確認事項
• [未回覆 / 懸而未決的項目]

✅ 建議進場前確認
1. [問題或資料]
2. [問題或資料]
```

每場會議發送一則獨立訊息。

---

## Inputs

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `SCAN_DAYS` | 7 | Morning scan 掃描未來幾天 |
| `EMAIL_LOOKBACK_DAYS` | 30 | 往回搜尋幾天的 Gmail |

---

## Outputs

| 排程 | 輸出 |
|------|------|
| 09:00 | Google Chat self-message：7 天 action checklist |
| 15:00 | Google Chat self-message：隔天每場會議各一則 briefing |

---

## Limitations

- **Google Chat MCP 尚未接入**：目前 google_workspace MCP 支援 Gmail / Drive / Calendar，Google Chat 需 Peter 端另行串接 Chat API
- 不支援 LINE / Slack 等其他聊天工具
- 與會者若無 Gmail 往來紀錄，背景欄顯示「無歷史記錄」
- 排程觸發需搭配 cron job 或 Claude Code schedule skill 實作
