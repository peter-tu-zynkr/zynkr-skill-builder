# Intent Taxonomy — Zynkr Support KB

Each resolved Q&A is classified into exactly one intent. The intent decides which `##`
section of the KB Doc the entry lands in, and is stored on the entry's `Intent:` line.

Keep this list small and stable. When a question genuinely doesn't fit, **propose a new
category to Peter** (don't silently overload `other`). Once Peter approves a new category,
add a row here so it becomes first-class.

| Intent tag | KB Doc section title | Covers | zh-TW / EN aliases (seed keywords) |
|---|---|---|---|
| `pricing-quoting` | Pricing & Quoting | Rates, quotes, how a session/course is priced, day-rates, per-hour, per-head | 費用, 報價, 價格, 收費, 鐘點, 一小時多少, quote, price, pricing, cost, rate, how much |
| `course-content` | Course Content & Curriculum | What a course covers, syllabus, level, prerequisites, which course to pick | 課程內容, 課綱, 大綱, 程度, 適合誰, 先修, 哪一門課, curriculum, syllabus, topics, prerequisite |
| `scheduling-logistics` | Scheduling & Logistics | Dates, times, duration, headcount, location, online vs in-person, booking | 時間, 日期, 時數, 人數, 地點, 線上, 實體, 預約, 安排, schedule, time, duration, headcount, location, online, in-person, booking |
| `team-training-enterprise` | Team Training & Enterprise | Group/corporate training, in-house workshops, custom programs, B2B | 團隊訓練, 企業內訓, 包班, 客製, 公司, 內訓, team training, corporate, enterprise, in-house, custom |
| `technical-howto` | Technical How-To | Product/tooling setup & usage: MCP, Claude Code, skills, accounts/tools | MCP, Claude Code, 設定, 安裝, 怎麼用, 操作, setup, install, configure, how to, integration |
| `access-account` | Access & Account | Login, access to materials/recordings, account issues, links not working | 帳號, 登入, 存取, 錄影, 教材連結, 拿不到, account, login, access, recording, materials, link |
| `refund-policy` | Refunds & Policy | Refunds, cancellations, rescheduling policy, terms, invoices/receipts | 退費, 退款, 取消, 改期, 政策, 發票, 收據, refund, cancel, reschedule, policy, invoice, receipt |
| `other` | Other | Genuinely doesn't fit above **and** isn't worth a new category yet | — |

## Classification notes
- Prefer the **most specific** fit. A "how much for in-house team training?" is
  `pricing-quoting` if the answer is the rate, or `team-training-enterprise` if the answer is
  about program scope — judge by *what Peter actually answered*, not what was asked.
- A single thread can yield **multiple entries** under different intents (e.g. a pricing
  answer + a scheduling answer). Split them.
- `other` is a holding pen, not a destination. If two or more `other` entries start looking
  alike, that's the signal to propose a new category.
