# Intent Taxonomy — Zynkr platform 知識庫 (Support KB)

Each resolved Q&A is classified into exactly one intent. The intent decides **which KB
section** the card lands in (`section_id` on the card). The live source of truth is
**`mcp__zynkr__list_kb_sections`** — it returns each section's uuid, slug, titles, and
aliases; this file is the authoring reference. Keep the two in sync.

Keep this list small and stable. When a question genuinely doesn't fit, **propose a new
section to Peter** (don't silently overload `other`). Once Peter approves, create it via
`create_kb_section` (see `new-section-playbook.md`) and add a row here so it becomes
first-class.

| Intent tag / slug | nn | Section | Covers | zh-TW / EN aliases |
|---|---|---|---|---|
| `core-facts` | 01 | Core Facts 核心事實 | Canonical `fact` cards only — pricing tables, policies, durations. NOT a Q&A intent. | 核心事實, canonical, facts |
| `pricing-quoting` | 02 | Pricing & Quoting 報價與費用 | Rates, quotes, how a session/course is priced, day-rates, per-hour, per-head | 費用, 報價, 價格, 收費, 鐘點, 一小時多少, quote, price, pricing, cost, rate, how much |
| `course-content` | 03 | Course Content & Curriculum 課程內容與課綱 | What a course covers, syllabus, level, prerequisites, which course to pick, methodology frameworks | 課程內容, 課綱, 大綱, 程度, 適合誰, 先修, 哪一門課, GUIDE, IPO, curriculum, syllabus, topics, prerequisite |
| `scheduling-logistics` | 04 | Scheduling & Logistics 時間與場地 | Dates, times, duration, headcount, location, online vs in-person, booking | 時間, 日期, 時數, 人數, 地點, 線上, 實體, 預約, 場次, schedule, time, duration, headcount, location, online, in-person, booking |
| `team-training-enterprise` | 05 | Team Training & Enterprise 企業內訓 | Group/corporate training, in-house workshops, custom programs, B2B | 團隊訓練, 企業內訓, 包班, 客製, 公司, 內訓, team training, corporate, enterprise, in-house, custom |
| `technical-howto` | 06 | Technical How-To 技術操作 | Product/tooling setup & usage: MCP, Claude Code, skills, accounts/tools | MCP, Claude Code, skills, subagent, 設定, 安裝, 怎麼用, 操作, setup, install, configure, how to, integration |
| `access-account` | 07 | Access & Account 帳號與存取 | Login, access to materials/recordings, account issues, links not working | 帳號, 登入, 存取, 錄影, 回放, 教材連結, 拿不到, account, login, access, recording, materials, link |
| `refund-policy` | 08 | Refunds & Policy 退費與政策 | Refunds, cancellations, rescheduling policy, terms, invoices/receipts | 退費, 退款, 取消, 改期, 轉讓, 政策, 發票, 收據, refund, cancel, reschedule, policy, invoice, receipt |
| `other` | 09 | Other 其他 | Genuinely doesn't fit above **and** isn't worth a new section yet | — |
| `instructor-profile` | 10 | Instructor Profile 講師介紹 | Instructor background, experience, bio (Dennis / Peter) | 講師, 老師, 背景, 經歷, Dennis, Peter, 介紹, instructor, teacher, bio, background |
| `brand-product-vision` | 11 | Brand & Product Vision 品牌與願景 | Zynkr brand, vision, mission, product direction, "about us" | 品牌, 願景, 使命, 產品方向, 公司理念, Zynkr, brand, vision, mission, about |
| `ai-workflow-architecture` | 12 | AI Workflow Architecture AI 工作流架構 | AI workflow / automation architecture, memory & KB design, RAG | 架構, 流程設計, pipeline, 自動化架構, 知識庫架構, RAG, workflow, architecture, automation, memory, retrieval |
| `tone-style` | 13 | Tone of Voice & Style 語氣與風格 | ALWAYS-READ style rules as `fact` cards: `tone-voice-rules` + `term-mapping-table` (the anti-Chinglish 用語對照表). NOT a Q&A intent. | 語氣, 風格, 用語對照表, 晶晶體, tone, voice, style, wording, term mapping |

> **Core Facts** (`fact` cards with a `fact_id`) are NOT a Q&A intent — canonical numbers live
> in the `core-facts` section, and qa cards **cite** them (`cites: ["<fact_id>"]`).
> **Tone-style** likewise holds only the two style fact cards; a wording rule from Peter is an
> UPDATE to `term-mapping-table`, not a new qa card.

## Classification notes
- Prefer the **most specific** fit. "How much for in-house team training?" is `pricing-quoting`
  if the answer is the rate, or `team-training-enterprise` if the answer is program scope —
  judge by *what Peter actually answered*, not what was asked.
- A single thread can yield **multiple cards** under different intents (e.g. a pricing answer
  + a scheduling answer). Split them — each gets its own `section_id`.
- `other` is a holding pen, not a destination. If two or more `other` cards start looking
  alike, that's the signal to propose a new section → `new-section-playbook.md`.
- History: sections 10–12 grew in during the 2026-06-05 enrichment; section 13 (`tone-style`)
  was added at the 2026-07-15 platform cutover, carrying the old "13 Tone of Voice & Style"
  doc's content as fact cards.
