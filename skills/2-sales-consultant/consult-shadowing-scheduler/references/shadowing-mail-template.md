# Shadowing Logistics Mail Template

Used by `consult-shadowing-scheduler` step 5c. Fill every `{{PLACEHOLDER}}`, then
create a Gmail **draft** with `mcp__google-workspace__draft_gmail_message`.
This mail is **never auto-sent** — Peter reviews it in his drafts folder and
sends it himself.

## Placeholders

| Placeholder | Meaning | Example (illustrative only) |
|---|---|---|
| `{{CONTACT_NAME}}` | Client contact's name | 王小明 |
| `{{CONTACT_EMAIL}}` | The draft's To: address | jane@example.com |
| `{{COMPANY}}` | Client company | 範例科技 |
| `{{SESSION_DATE}}` | Confirmed date + weekday | 2026-08-12（週三） |
| `{{SESSION_TIME}}` | Start–end, Asia/Taipei | 10:00–12:00 |
| `{{DURATION}}` | Expected duration | 2 小時 |
| `{{MODE}}` | 現場 or 遠端（視訊） | 現場 |
| `{{LOCATION_OR_LINK}}` | Client office address, or the meeting link for remote | 貴公司辦公室（再請回覆地址） |
| `{{FOCUS}}` | What the session will observe | 報價與出貨流程 |
| `{{SENDER_NAME}}` | Operator name | Peter Tu |
| `{{SENDER_EMAIL}}` | Operator email | peter_tu@zynkr.ai |

---

## zh-TW（主要版本）

主旨：【Zynkr 顧問】{{COMPANY}} 現場跟拍（Shadowing）安排 — {{SESSION_DATE}}

{{CONTACT_NAME}} 您好，

謝謝您安排時間讓我們實地了解團隊的日常作業。以下是這次跟拍（shadowing）的
時間與準備事項，再請您確認：

**時間與形式**

- 日期：{{SESSION_DATE}}
- 時間：{{SESSION_TIME}}（台北時間，預計 {{DURATION}}）
- 形式：{{MODE}}（{{LOCATION_OR_LINK}}）

**當天流程**

我們會在旁觀察同仁實際操作 {{FOCUS}} 的完整過程。過程中盡量不打斷作業，
只在段落之間提問確認細節。

**請協助準備**

1. **系統帳號** — 當天會用到的系統請先確認帳號可正常登入（我們不需要、也請不要提供帳號密碼）。
2. **平常操作的工作畫面** — 請同仁用平常實際的做法操作即可，不需要特別整理成「示範版」流程；真實的做法對我們最有價值。
3. **代表性案例** — 準備 1–2 個最近的實際案例（例如一張進行中的訂單或專案），讓我們能看到一次完整的處理過程。

**錄影／錄音同意**

為了會後整理流程紀錄，我們希望對操作過程錄影（或錄音）。錄製內容僅供本次
顧問專案內部分析使用，不會對外提供；若有不便入鏡的畫面或資料，當天請隨時
告知，我們會暫停錄製或事後剪除。再麻煩您回信確認是否同意。

若這個時段需要調整，直接回信告訴我您方便的時間即可。

{{SENDER_NAME}}
Zynkr 顧問服務
{{SENDER_EMAIL}}

---

## EN variant

Subject: [Zynkr Consulting] Shadowing session with {{COMPANY}} — {{SESSION_DATE}}

Hi {{CONTACT_NAME}},

Thank you for making time for us to observe your team's day-to-day work. Here
are the proposed logistics for the shadowing session — please confirm:

**Time & format**

- Date: {{SESSION_DATE}}
- Time: {{SESSION_TIME}} (Taipei time, expected duration {{DURATION}})
- Format: {{MODE}} ({{LOCATION_OR_LINK}})

**What we'll do**

We will sit alongside your team and watch a full end-to-end pass of {{FOCUS}}.
We stay out of the way while people work and save questions for the breaks.

**What to prepare**

1. **System accounts** — please make sure the accounts used that day can log in normally (we never need, and should not be given, any credentials).
2. **The real working screens** — have the team operate exactly the way they normally do; no cleaned-up "demo" flow. The real thing is what we need to see.
3. **1–2 representative live cases** — e.g. an order or project currently in flight, so we can watch one complete handling cycle.

**Recording consent**

We would like to record the session (video or audio) purely for internal
process analysis on this engagement; nothing is shared externally. If anything
should not be captured, just tell us on the day and we will pause or cut it.
Please confirm in your reply that this is OK.

If the time doesn't work, reply with a window that suits you better.

Best regards,
{{SENDER_NAME}}
Zynkr Consulting
{{SENDER_EMAIL}}

---

## Filling notes

- **Language pick** — default is zh-TW. Use the EN variant only when the deal's
  correspondence has been in English. Send one version, never both in one mail.
- The example values above (王小明 / jane@example.com / 範例科技) are
  placeholders for illustration — always fill from the actual CRM deal contact.
- `{{LOCATION_OR_LINK}}`: for 現場 sessions where the address is unknown, keep
  the "再請回覆地址" ask; for remote, paste the Google Meet link from the
  calendar hold created in step 5a.
