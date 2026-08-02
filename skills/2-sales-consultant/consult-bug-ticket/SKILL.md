---
name: consult-bug-ticket
sheetId: "2.16"
description: >-
  Turn a client bug report — a Gmail thread, a forwarded mail, or pasted text —
  into tracked work in one pass: a well-formed GitHub issue in the right repo
  (routed via a local bug-routing-config.md), a CRM follow-up task on the
  client's deal, and a threaded acknowledgment reply left as a Gmail DRAFT
  (never sent). Trigger on /consult-bug-ticket or when Peter says "開 bug 單",
  "把這封信開成 issue", "回報這個 bug", "客戶回報問題", "file this bug",
  "turn this bug mail into a ticket", "log this defect and reply", or hands
  over a client mail describing something broken and wants it tracked — fire
  eagerly even when he never says the word "bug". Distinct from zynkr-support
  (drafts KB-based ANSWERS to product questions; when a support mail turns out
  to be a DEFECT in a delivered assistant or product, THIS skill is the
  write-side that takes over), from skill-sourcer (files skill IDEAS as
  proposals, not defects), and from consult-uat-writer (upstream of this one:
  its UAT guide's 問題回報方式 section shapes the very mails this skill parses).
category: sales-consultant
project: consult-bug-ticket
platform: claude
status: Done
author: Peter Tu
input: "A bug report (Gmail link/thread, forwarded mail, or pasted text), optionally the client/deal if not inferable"
process: "Parse the report → extract repro/expected/actual + severity → route to a repo via local bug-routing-config.md → approval gate on issue body + target repo → gh issue create → CRM task on the deal + threaded acknowledgment Gmail draft → report"
output: "A GitHub issue (URL), a CRM tracking task linked on the deal, and an acknowledgment draft in Peter's inbox — none of it sent or posted without the gate"
synergy:
  - "zynkr-support"
  - "consult-uat-writer"
---

# Consult Bug Ticket

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill consult-bug-ticket
```

When a client reports a defect — in a delivered assistant, in the platform, on
the website — the report tends to die in the inbox. This skill turns one bug
report into three artifacts in a single pass: a **well-formed GitHub issue** in
the right repo, a **CRM follow-up task** on the client's deal so the sales side
sees the open loop, and a **threaded acknowledgment reply** waiting as a Gmail
draft so the client knows they were heard.

It is deliberately gated: nothing external is written until Peter approves the
target repo, issue title, complete body, and severity at one hard gate. The
public issue and the private CRM record carry *different* halves of the story —
company + defect in the issue, person + thread in the CRM task — by design.

## How this differs from its neighbours

- **zynkr-support** — drafts KB-based ANSWERS to product questions (the READ
  side of the support loop). When a support mail turns out to be a DEFECT in a
  delivered assistant or product, THIS skill is the write-side that takes over:
  zynkr-support answers "how do I…", consult-bug-ticket tracks "it broke".
- **skill-sourcer** — files skill IDEAS as proposals in the idea backlog; it
  never touches defects or client threads.
- **consult-uat-writer** — upstream: its UAT guide's 問題回報方式 (steps /
  expected / actual / screenshot) shapes these mails — they parse almost 1:1
  into step 2; free-form mails need best-guess reconstruction with 未確認.

## Fixed facts (don't re-derive these)

- **Supabase project_id**: `uomieoqlkazknjgmfdda` (the shared Zynkr project; CRM tables are `crm_*`)
- **Google account** for all Gmail/Drive tools: `peter_tu@zynkr.ai`
- **Drive parent folder** (`[2.2]` consult projects, where the client's numbered `[N]` folder lives): `1hkXPX7OXPFOU0BcloPbJSFp8O0zArM8t`
- **CRM deal URL** for the task/report (internal-only — never in the public issue): `https://zynkr-crm.vercel.app/deals/{deal_id}`
- Over the Supabase MCP, `auth.uid()` is **NULL** — every SQL write carries
  explicit ids (owner/creator via a `crm_users` lookup); never rely on defaults
  that read the session user.

## Hard rules

1. **The gate is absolute.** No `gh issue create`, no CRM write, no Gmail draft
   before Peter approves the step-5 packet.
2. **PII split.** The public issue carries the **company name only** — no
   contact name/email/phone, no CRM or deal URLs, no quoted mail bodies with
   signatures. The person and the Gmail thread link live in the CRM task.
3. **Client-facing email is ALWAYS a Gmail draft** — created with
   `mcp__google-workspace__draft_gmail_message`, never sent.
4. **The client sees the issue number only** (問題編號 #12) — never the repo
   path, the issue URL, or any internal tooling detail.

## Configuration — `bug-routing-config.md` (out-of-repo)

Repo routing lives in a **local** `bug-routing-config.md` maintained outside
this repo (client repo mappings are business-confidential; ask Peter where his
copy lives on first run). Read it at the start of every run. Expected shape:

- **Client map** — `company → github repo`, one row per client. Client
  assistants may live in per-client repos, so a client row always outranks a
  surface fallback.
- **Surface fallbacks** — `product surface → repo`, overriding these proposed
  defaults when present:

| Surface | Default repo |
|---|---|
| platform / CRM / KB | `peter-tu-zynkr/zynkr-ai-platform` |
| marketplace / skills | `peter-tu-zynkr/zynkr-skill-builder` |
| website | `peter-tu-zynkr/zynkr-website` |
| CMS / blog | `peter-tu-zynkr/zynkr-cms` |

**No row matches** (or the config file is missing entirely) → do NOT guess: the
step-5 gate asks Peter to pick a repo and proposes the exact config line for
him to add himself. This skill **reads** the config; it never edits it.

---

## Workflow

### 1 · Acquire the report

Three arrival shapes:

- **A Gmail link / search hint** — `mcp__google-workspace__search_gmail_messages`
  (as `peter_tu@zynkr.ai`), then `mcp__google-workspace__get_gmail_thread_content`.
- **A forwarded mail** — read the forwarded body; the real reporter is inside
  the forward, not the `From:` header.
- **Pasted text** — use it directly.

Capture: reporter name + email, company, report date, and the **thread id**
(needed for the threaded draft in step 8; pasted text has none — note that).
Mails following consult-uat-writer's 問題回報方式 arrive semi-structured — map
those blocks (操作步驟 / 預期結果 / 實際結果 / 截圖) straight into step 2.

### 2 · Extract the defect

Pull out, in this order:

- **Symptom** — one observable sentence, no cause speculation.
- **Repro steps** — numbered. If the mail gives none, reconstruct a best-guess
  path from context and mark every inferred step with **（未確認）** — never
  present a guess as reported fact.
- **Expected vs actual** — both sides, even when the mail only implies one.
- **Environment** — surface, URL/screen, browser/device, first-observed date;
  未確認 where absent.
- **Screenshots/attachments** — note their existence and content; only re-host
  them if scrubbed of personal data.

### 3 · Assign severity

The rubric: **S1** outage / data loss · **S2** core flow broken, no workaround ·
**S3** degraded, workaround exists · **S4** cosmetic. Pick exactly one level
and write a **one-line rationale** ("S2 — 報價單無法送出，無替代路徑"). When
torn between two levels, take the higher one; the gate corrects it cheaply.

### 4 · Route to a repo and resolve the deal

**Repo** — apply the config: client-map row first, surface fallback second,
neither → flag "routing unresolved" for the gate to ask.

**Deal** — `mcp__zynkr__get_deal` / `mcp__zynkr__list_deals` when the zynkr
MCP is connected; fallback via `mcp__supabase__execute_sql(project_id="uomieoqlkazknjgmfdda", ...)`:
`SELECT id, name, notes FROM crm_deals WHERE name ILIKE '%<company>%' ORDER BY created_at DESC;`
If neither the company nor the deal is inferable from the mail, ask Peter —
one question, before the gate, not after.

### 5 · GATE — approval before any external write

Present, then **wait**:

1. **Target repo** — full name (e.g. `peter-tu-zynkr/zynkr-ai-platform`) and
   which rule chose it (client row / surface fallback / unresolved → pick one,
   plus the proposed config line for Peter to add).
2. **Issue title** — `[<company>] <symptom>` (e.g. `[宏宇精密] 報價單送出後畫面凍結`).
3. **The complete issue body** — `./references/issue-template.md` filled in,
   comment blocks deleted.
4. **Severity label** — level + rationale.

Peter replies approve / adjust. Only an approval unlocks steps 6–8.

### 6 · Post the issue

Write the approved body to a temp file, then:

```bash
gh issue create \
  --repo <owner/repo> \
  --title "[<company>] <symptom>" \
  --body-file /tmp/consult-bug-issue.md \
  --label "bug"
```

Add the severity as a second `--label "S2"` only if the repo defines it
(`gh label list --repo <owner/repo>`); otherwise degrade gracefully — post with
`bug` alone (severity lives in the body). Capture the **issue URL and number**.

### 7 · CRM task + deal note

Create the tracking task on the deal — title **`Bug #<n> 追蹤 — <symptom>`** —
with the issue URL, the reporter (name + email — this is the private side, the
person belongs here), and the Gmail thread link in the task description.
Prefer `mcp__zynkr__create_task`; SQL fallback carries explicit ids
(`auth.uid()` is NULL over the MCP — look up the owner in `crm_users` and set
`created_by` / `assignee_id` explicitly). Then append to the deal's notes:

```sql
UPDATE crm_deals
SET notes = notes || E'\n\nBug #<n>：<issue url>（<severity>，追蹤任務已建立）'
WHERE id = '<deal_id>';
```

Escape single quotes by doubling them (`O'Brien` → `O''Brien`).

### 8 · Acknowledgment — a threaded Gmail DRAFT, never sent

`mcp__google-workspace__draft_gmail_message` with `thread_id` set (hard rule 3
— it stays a draft; the thread id makes it a proper reply that references the
original message). In the **inbound language**, the draft says three things:

1. **Received** — thanks for the report, briefly mirroring the symptom.
2. **Tracked** — 問題編號 **#<n>** (the issue number ONLY — no repo path, no
   URL, no internals; hard rule 4).
3. **Next update** — when they'll hear back, per the severity defaults below.

Pasted-text reports with no thread: draft a fresh mail to the reporter's
address if known; if no address exists, skip the draft and say so in step 9.

### 9 · Report

A compact artifact table, then the headline in prose:

```
Bug 單已建立：[宏宇精密] 報價單送出後畫面凍結

| 產出 | 內容 |
|------|------|
| GitHub issue | #12 · S2 · <issue url>（repo：client-map row）|
| CRM 任務 | Bug #12 追蹤 — 報價單送出後畫面凍結（deal：<deal url>）|
| 回覆草稿 | 已建立（threaded，zh-TW）— 待 Peter 檢查後寄出 |
| 未確認 | repro 步驟 3 為推測，已標記（未確認）|
```

---

## Why it's built this way

- **One gate, before everything.** The three writes are cheap individually but
  public collectively — a wrong repo or a leaked name can't be un-posted.
  Gating once, on the full packet, keeps review to a single glance.
- **The PII split is structural, not stylistic.** GitHub issues outlive deals
  and may be visible to collaborators or future contractors; splitting
  person/thread (CRM) from company/defect (issue) means no cleanup pass later.
- **未確認 markers instead of silent reconstruction.** Engineering triages
  differently when a repro step is reported vs inferred; marking the guess
  keeps the issue honest without making thin reports unfileable.
- **Config-driven routing that the skill never edits.** Client→repo mappings
  change with every engagement; a local file Peter owns stays current without
  a repo commit, and proposing (not writing) the missing line keeps him the
  only author of his own routing table.
- **Issue number as the client-facing ticket id.** It's stable, short, and
  meaningful to both sides — without exposing where or how the work is tracked.

## Inference defaults (Peter overrides by just saying so)

- **Severity when torn** → the higher level; the gate corrects it cheaply.
- **Next-update promise in the draft** → S1: 1 個工作天 · S2: 2 個工作天 ·
  S3/S4: 下次定期更新. Never promise a fix date, only an update date.
- **Draft language** → the inbound mail's language (zh-TW ↔ EN).
- **Labels** → `bug` always; severity label only if the repo defines it.
- **Deal stage** → untouched — a bug is not a pipeline event.
- **One report per run** → a mail listing several distinct defects = propose a
  split at the gate (one issue each, one shared acknowledgment draft).

## Reference files

- `./references/issue-template.md` — the GitHub issue body skeleton (Summary /
  Environment / Repro / Expected vs Actual / Severity / Client impact / Links)
  with the PII rule restated at the top; fill it, delete its comment blocks,
  and present it at the gate.

## Limitations

- Files and tracks defects only — no diagnosis, no fix, no root-cause guessing.
- Routing quality equals config quality — an out-of-date `bug-routing-config.md`
  routes to the gate's ask-Peter path, never to a silent wrong repo.
- The acknowledgment draft can only thread when the report arrived as a Gmail
  thread; pasted text yields a fresh draft (or none, if no address is known).
- It answers nothing: if the "bug" turns out to be a how-do-I question, hand
  the thread to /zynkr-support instead of filing an issue.
