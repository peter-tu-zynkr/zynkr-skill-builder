---
name: sales-outbound
description: >-
  Turn ONE person's interest signal into a tracked CRM lead AND a ready-to-send
  reply. The signal can be a copied DM / chat thread (Threads, IG, LINE, FB
  Messenger, WhatsApp, email), a single row from an event feedback or
  registration form, a website enquiry, or the text off a business card —
  anything where one named person showed interest and left an email address.
  Optionally hand it their profile link too. It does two things in one pass:
  (1) collects who they are — parsing the signal and enriching from any
  social/profile URL — and writes the client context into the Zynkr platform CRM
  (find-or-create company + contact, a new deal, a verbatim source note, and a
  follow-up task for the next step); (2) drafts the outbound reply as a Gmail
  DRAFT in Peter's inbox (never sends), in the signal's language and Peter's
  voice, and — whenever the ask is a meeting — reads Peter's calendar FIRST and
  offers three real slots in 台北時間. Trigger on /sales-outbound or when Peter
  pastes a DM, a feedback-form row, or an enquiry and says "draft a reply",
  "draft an outbound mail", "回這個", "幫我擬回覆", "把這個 lead 建進 CRM 並擬信",
  "log this lead and draft the email", "turn this DM into a draft", "這個回饋幫我
  建客戶並擬信", or otherwise hands over one person's interest signal and wants
  both the CRM record and the reply prepared. Distinct from
  sales-client-sourcing (BATCH-enriches a WHOLE survey Sheet into new columns —
  no CRM records, no email), consult-intake (a weekly BATCH sweep of inbound
  website consult EMAILS) and consult-project-specialist (documents ONE
  sales/consulting MEETING transcript into a project + Drive folder + deal): this
  one takes ONE person's signal and produces a lead record + a drafted reply, no
  Drive folder, no meeting parsing.
category: sales-consultant
project: sales-outbound
platform: claude
status: Done
author: Peter Tu
sheetId: "2.09"
input: "ONE person's interest signal carrying an email — a pasted DM/chat thread, an event feedback or form row, a website enquiry, or business-card text; optionally their profile URL."
process: "Parse the signal → enrich from any profile link → write the CRM lead (find-or-create company + contact, new deal, source note, follow-up task) → if a meeting is the ask, read the calendar for three 台北時間 slots → draft the Gmail reply → report."
output: "A CRM lead (company + contact + deal + note + task) on the Zynkr platform, plus a Gmail draft in Peter's inbox — with three calendar-checked 台北時間 slots when a meeting is the ask."
synergy: []
---

# Sales Outbound

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill sales-outbound
```

Interest reaches Peter from everywhere — a Threads/IG/LINE/FB DM, an event feedback
form, a website enquiry, a card handed over after a talk. Whenever one of those names
a person, carries an email, and shows what they want, Peter wants two things to happen
at once: the person should become a **tracked lead in the CRM**, and a **reply should
be sitting in his inbox as a draft**, ready to tweak and send.

This skill does both from a single paste. He drops the signal in (and, if handy,
the person's profile link), and it:

1. **Collects the client context** — parses the signal for name, the email they
   gave, what they want, and who initiated; enriches role / company /
   industry from any profile URL.
2. **Writes it into the CRM** — find-or-create company + contact, a **new deal**, a
   **verbatim source note**, and a **follow-up task** for the next step.
3. **Drafts the reply** — a Gmail **draft** (never sent), in the signal's
   language and Peter's voice, that moves the next step forward — with three
   calendar-checked slots when that next step is a meeting.

**What counts as a signal** — any ONE of these, for ONE named person:
a copied DM / chat thread · a row from an event feedback or registration form ·
a website enquiry · the text off a business card · a forwarded email. What matters
is that it names a person, carries an email, and shows what they want. It is NOT a
whole spreadsheet of people (that is `sales-client-sourcing`) and NOT a meeting
transcript (that is `sales-follow-up` or `consult-project-specialist`).

It runs **autonomously**: parse → enrich → write CRM → check calendar → draft email
→ report. No mid-run confirmation — the email lands as a *draft* (safe, Peter reviews
before sending) and the CRM write is one atomic statement.

## How this differs from its neighbours

- **sales-client-sourcing** — takes a WHOLE event/workshop survey **Sheet** and
  batch-enriches it into new columns (官網 · 公司背景 · 陌生開發策略 · Hot Lead).
  It writes back to the Sheet only — no CRM records, no email. Natural pairing:
  run it to triage the sheet, then run THIS skill on each hot row.
- **sales-specialist** — the **business-card** pipeline (OCR a card image → contact
  + company + 名片 note + follow-up draft). Same shape, different input: use it when
  the signal arrives as a photographed card rather than as text.
- **consult-intake** — a weekly BATCH job that sweeps inbound `website@zynkr.ai`
  consult emails and de-dupes them into deals. Use it for the inbox sweep, not a
  single pasted signal.
- **consult-project-specialist** — takes ONE sales/consulting **meeting transcript**
  and documents it as a project: Weekly Update + numbered Drive folder + kickoff
  Doc + deal. Heavy. Use it after a real meeting.
- **sales-outbound** (this one) — takes ONE person's **interest signal**
  (pre-meeting) and produces a lead record + a drafted reply. No Drive folder, no
  meeting parsing, no Weekly Update.

## Fixed facts (don't re-derive these)

- **Supabase project_id**: `uomieoqlkazknjgmfdda` (the shared Zynkr project; CRM tables are `crm_*`)
- **Google account** for all Gmail tools: `peter_tu@zynkr.ai`
- **CRM record URLs** for the report: `https://platform.zynkr.ai/deals/{id}` · `.../contacts/{id}` · `.../companies/{id}` — `{id}` is the uuid the SQL returns.
- Owner (`Peter Tu`), the caller's `workspace_id`, and the default pipeline (`銷售流程`) are resolved **live inside the SQL** — never hardcode their ids.
- **Do NOT log the drafted email as a CRM activity.** Peter's Gmail is already synced into the CRM (`app/lib/integrations/sync.ts`, 15-min cron): the moment he sends the draft, it auto-appears on the contact's 電子郵件 timeline as an outbound email. Logging it here would duplicate that row.

---

## Workflow

### 1 · Acquire + parse the signal

The signal usually arrives as **pasted text**. It may also be a pointer Peter expects
you to go read yourself — a Google Sheet URL plus a name ("the feedback from Rebecca"),
or a Gmail thread. Go fetch it rather than asking him to paste it again. Also capture
anything he hands alongside:
- A **profile URL** (Threads / IG / LinkedIn / FB / a website) → for enrichment in step 2.
- A **CRM record URL** (`…/contacts/{id}` or `…/companies/{id}`) → pass that uuid so
  the deal links to the existing record instead of creating a duplicate.

Pull these fields (infer logically, never fabricate — leave blank if absent):
- **Name / handle** of the counterparty.
- **Email** they gave (the reply will go here; it's also the find-or-create key).
- **Phone**, when the source carries one (forms usually do).
- **What they want** — a demo, a call, "send me info", joining a beta, buying. On a
  DM this is what they *agreed to*; on a feedback row it is what they *asked for*,
  which is softer — see *Inference defaults*.
- **The next step** — becomes the follow-up task and the email's ask.
- **Who initiated** — Peter reached out (outbound) vs they came to him (inbound) → `lead_source`.
- **Language** of the signal (zh-TW vs EN) → the draft matches it.
- **The single most quotable line they wrote**, verbatim — the draft opens by
  mirroring it, and the CRM note stores it unedited.

**Per-shape notes**
- **Feedback / registration form row** — read the header row too, so each answer is
  attributed to the right question; keep the free-text answers verbatim, including the
  "what else would you like to learn" style column, which is usually the real buying
  signal. Note which event they attended → that is the `lead_source`.
- **Business-card text** — if it is still an image, use `sales-specialist` instead.
- **Website enquiry** — if it is a whole inbox's worth, use `consult-intake` instead.

### 2 · Enrich from the profile link

If a profile URL (or a resolvable handle) is present, fetch it with `WebFetch` and pull:
display name, bio/role, company, industry, follower count, any public contact email
or links. Fold this into the contact's `title` + the company record + the note. If no
link is given, skip — don't guess a bio.

### 3 · Build the client card

Assemble a compact summary and keep it for the report:

```
客戶名片
- 姓名 / 帳號 · …
- Email · …
- 身分 / 公司 · …            ← from enrichment
- 來源 · Threads DM（Peter 主動 / 對方來訊）
- 對話結論 · 同意看 30 分鐘 demo
- 下一步 · 約時間、寄會議連結
- 語言 · zh-TW
```

### 4 · Write the CRM lead

Read `references/lead-insert.sql`, fill the placeholders, run it via
`mcp__supabase__execute_sql(project_id="uomieoqlkazknjgmfdda", query=...)`. One
statement:
- resolves owner + workspace + default pipeline live,
- **find-or-creates the company** (case-insensitive by name; skipped if no company),
- **find-or-creates the contact** (case-insensitive by email; reused if it already exists),
- inserts a **new deal**,
- logs a **`note`** activity (the verbatim conversation + who they are) and a **`task`**
  activity (the agreed next step, due in `{{TASK_DUE_DAYS}}` days, assigned to Peter).

It returns `company_id`, `contact_id`, `deal_id`, `note_id`, `task_id`, plus
`contact_existed` / `company_existed` booleans so you can say so in the report.

**Escaping:** every `{{…}}` placeholder is replaced with a **SQL literal** — quote
text and double any single quote (`O'Brien` → `'O''Brien'`), or write `NULL`. For an
absent company, set `{{COMPANY_NAME}}` to an empty string `''` (the SQL then creates
no company and the deal's `company_id` is NULL).

**If the Supabase MCP is not authenticated** — you can tell because only
`mcp__supabase__authenticate` / `complete_authentication` are exposed and
`execute_sql` is missing — fall back to the `zynkr` MCP CRUD tools instead of
blocking: `list_contacts(search=<email>)` to dedupe, then `create_contact` →
`create_deal` → `create_note` → `create_task`. Each is a two-call handshake
(`confirm:false` to preview, then the identical call with `confirm:true`). They
resolve workspace + pipeline natively, but two things the SQL did for free you must
now pass explicitly: **`legal_basis`** (`legitimate_interest` — the same house value
baked into the SQL) and **`owner_id`** (Peter's workspace member id, from `whoami`).
There is no find-or-create on this path, hence the explicit dedupe first.

See *Inference defaults* below for the enum fields.

### 5 · If the ask is a meeting, derive three REAL slots

**Never invent availability.** Whenever the draft will propose a call / demo / meeting,
read the calendar first — a guessed window is usually already booked.

1. **Read the events.** Use
   `mcp__claude_ai_Google_Calendar__list_events(startTime=…, endTime=…, timeZone="Asia/Taipei", orderBy="startTime")`
   across the next 5–10 working days.
   ⚠️ Do **NOT** use `mcp__google-workspace__get_events` — the Calendar API is disabled
   on Peter's GCP project (`963483219986`) and it returns a hard error.
2. **Find the bookable windows.** Peter's calendar marks them with events literally
   titled **`Available`** (and **`Not available`** for the inverse). Take each
   `Available` block and subtract every real meeting overlapping it. A leftover
   shorter than 30 minutes is not a slot.
3. **Pick three**, spread across different days. Express each as the whole remaining
   window (`15:30–18:00`), not one fixed time — let the prospect choose inside it.
4. **Convert to Taipei and say so.** Peter's calendar is `Europe/Amsterdam`; almost
   every prospect is in Taiwan (+886), 6–7 hours ahead, so an unlabelled 「下午」 means
   two different things. Label the block **「（台北時間）」**. Keep the Amsterdam
   equivalents for the CRM note and your report — not for the email.
5. **Record them on the deal** so Peter needn't re-convert when she replies.

If the ask is not a meeting (send info, share a link), skip this step entirely.

### 6 · Draft the reply (Gmail draft — never send)

Draft the outbound reply with
`mcp__google-workspace__draft_gmail_message(user_google_email="peter_tu@zynkr.ai", to="<their email>", subject="…", body="…")`.
To revise a draft you already made this run, use
`mcp__claude_ai_Gmail__update_draft(draftId=…)` — it edits in place, so Peter is not
left with two near-identical drafts to choose between.

Rules for the draft:
- **Match the signal's language** (zh-TW reply to a zh-TW signal, EN to EN).
- **Peter's voice** — warm, concise, peer-to-peer; mirror the tone of the source (if
  the DM was casual and friendly, so is the email). No corporate boilerplate.
- **Open by mirroring their own words** — quote back the concrete thing they said they
  wanted. On a feedback row, that is the verbatim free-text answer. This is what makes
  the mail land as a reply rather than a pitch.
- **Earn the meeting with a point of view** — one short paragraph of substance (how
  Peter would approach their problem, what order he'd do it in) before the ask. Never
  jump straight from greeting to calendar.
- **Move the next step forward** — if a meeting is the ask, offer the three slots from
  step 5; if "send info", point to it.
- **Concrete subject line**, naming their problem in their words.
- zh-TW house style: headings/taglines take **no 句號 (。)**; `·` for series separators;
  numbered lists use plain **`1. 2. 3.`** — NOT 1️⃣2️⃣3️⃣, never circled ①②③.
  (Emoji numerals are a *UI* convention — see the numbering-format rule — and are wrong
  in email; Peter's actual sent mail uses plain digits.)
- **The slot block is fixed house wording.** Three slots, a fourth escape line, then
  the invite promise — copied from Peter's own sent mail:

  ```
  以下時間我都可以，再麻煩你挑一個（台北時間）：

  1. 9/8（二）20:00–22:00
  2. 9/9（三）15:30–18:00
  3. 9/10（四）15:00–16:00
  4. 其他你方便的時間

  確認後我會寄出會議邀請。
  ```
- **Sign off** `Best regards,` then `Peter`.
- **Create a draft, never send.** Peter reviews and sends himself.
- **Verify before reporting** — confirm the draft carries label `DRAFT` and that
  `in:sent to:<their email>` returns nothing. Say so in the report.

### 7 · Report

Show the client card, then a compact artifact table:

```
已建立 lead 並擬好回信草稿：超哥（行銷超哥 Chao.Marketing）

| 產出 | 連結 / 狀態 |
|------|------------|
| CRM Deal | <deal url> |
| 聯絡人 | <contact url>（新建 / 既有） |
| 公司 | <company url>（新建 / 既有） |
| 活動 | note · 1 task |
| Gmail 草稿 | 已放進收件匣，待你過目後寄出（已確認未寄出） |
```

When the mail carries slots, also show them with their Amsterdam equivalents and the
`Available` block each came from — that is what lets Peter sanity-check you did read
the calendar rather than guess.

If the contact already existed, say so (you attached a new deal to the existing
person rather than duplicating them).

---

## Inference defaults (Peter overrides by just saying so)

Pick the closest enum from the conversation; use the fallback when there's no signal.

- **stage** (`new|contacted|qualified|proposal|won|lost`) — they engaged and **agreed
  to a demo / call / clear next step** → **`qualified`**; softer "sounds interesting,
  maybe" → `contacted`; bare first reply → `new`. A **feedback / form row is `new`** —
  they described a need, but nothing has been agreed and Peter has not replied yet.
- **lead_source** (`content|workshop|referral|outbound|other`) — **Peter messaged them
  first** → **`outbound`**; they came via a post/content → `content`; **they name an
  event or livestream they attended → `workshop`**; warm intro → `referral`; unclear
  → `other`.
- **contact lifecycle_stage** (`subscriber|lead|mql|sql|opportunity|customer|…`) —
  demo/call agreed → **`sql`**; **attended something and self-described a need →
  `mql`**; otherwise **`lead`**.
- **company** — a personal gmail/yahoo address with no employer named means **no
  company record**. Leave it null and note it; guessing an employer poisons the CRM.
  Create it after the first call, when they've told you.
- **priority** (`low|medium|high`) — default **`medium`**; eager / near-term → `high`.
- **deal_type** — **`new_business`** (this is a fresh lead).
- **value** — **`NULL`** unless a concrete figure was discussed (beta / early chats have none).
- **close_date** — `NULL` unless a date was stated.
- **task_due_days** — default **3** (chase the demo/call within a few days).

## Why it's built this way

- **One paste → both outputs.** The point is to kill the two-step (log the lead, then
  go write the email). Peter pastes once; the lead is tracked and the reply is waiting.
- **Email is a draft, not a send.** Outbound to a real prospect is Peter's call —
  the skill prepares, he approves. That's also why it needn't confirm before running.
- **Find-or-create, always-new deal.** A person can come back for a second deal, but
  they shouldn't be duplicated as a contact — so contact/company are keyed
  (email / name), while each run books a fresh deal (re-running = a deliberate redo).
- **Don't log the email activity.** The Gmail→CRM sync already captures it on send —
  logging here would double the row. The skill writes the *note* (the source signal,
  which the sync can't see) and the *task*, and leaves the email to the sync.
- **Slots come from the calendar, never from memory.** Peter sits in Amsterdam and
  nearly every prospect sits in Taipei, six hours ahead — so an invented "next Tuesday
  afternoon" is both probably booked and ambiguous about whose afternoon it means.
  Both failures cost a round-trip and read as careless. Three real windows plus an
  escape line converts in a single reply.
- **One signal shape in, one shape out.** The input parser is the only thing that
  differs between a DM, a feedback row and a card — everything downstream (CRM write,
  calendar, draft, report) is identical. That is why this skill absorbed the extra
  input types instead of a near-duplicate skill being cloned for each one.
