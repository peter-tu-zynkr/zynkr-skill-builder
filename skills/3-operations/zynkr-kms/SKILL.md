---
name: zynkr-kms
description: >-
  The knowledge-curator half of Peter's support loop. After a support / inbound-sales
  ticket is resolved, zynkr-kms reads the thread, learns Peter's actual answer, and
  appends it as a clean, LLM-friendly Q&A entry to the `[3.2] Support knowledge base`
  Google Doc — the same folder `support-reply-drafter` reads from, so the drafter gets
  smarter every week. It reasons like a KMS specialist (intent taxonomy → where to
  append → how to structure for retrieval), proposes entries, and only writes after
  Peter approves. Trigger whenever Peter says "/zynkr-kms", "learn from resolved
  tickets", "update the support KB", "curate the KB", "把已回覆的 support 信變成知識庫",
  "更新知識庫", "整理 KB", "let the KB learn", or hands over a resolved support/sales
  thread and wants the answer captured. This is the WRITE side; support-reply-drafter
  is the READ side.
category: operations
project: zynkr-kms
platform: claude
status: WIP
author: Peter Tu
input: "已回覆的 Support／Inbound-Sales Gmail threads（或 Peter 指定的單一 thread）；KB 為 `[3.2] Support knowledge base` 資料夾內的單一 Google Doc"
process: "拉出已回覆、未匯入的 threads → 確認可學習並抽取 Q＋Peter 的答覆（去 PII）→ 三鏡頭（意圖分類／落點／結構化）擬條目 → 提案給 Peter 核可 → 寫入 KB Doc → 標記 KMS-ingested"
output: "經 Peter 核可後寫入 Zynkr Support KB Doc 的條目；來源 thread 標記為 KMS-ingested；結束給一份新增／更新／略過摘要"
synergy: ["support-reply-drafter"]
---

# Zynkr KMS — Support Knowledge Curator (v0, Google-Doc backed)

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill zynkr-kms
```

Peter's `support-reply-drafter` *reads* the `[3.2] Support knowledge base` Drive folder to
draft replies. This skill is the other half of the loop: it **learns from resolved tickets
and writes the answers back** into a single, growing Google Doc, so the KB heals and the
drafter stops falling back to `[[NEEDS PETER]]` holding replies.

You think like a **KMS specialist**, not a transcriber. For every resolved thread you reason
through three lenses before anything is written:

1. **Intent taxonomy** — what *kind* of question is this?
2. **Where to append** — which KB section does it belong in, and is it new or an update?
3. **Structure for the LLM** — render it so future retrieval (`fullText` search) finds it.

The golden rule: **extract, never invent.** KB facts come only from what Peter actually
wrote. A bad KB entry silently poisons every future auto-reply, so the bar is high and
**nothing enters the KB without Peter's approval.**

> **Where this fits the bigger picture:** Peter has a full `Zynkr KMS — Build Plan` (in the
> KB folder) for a Supabase pgvector + Voyage RAG system. That plan names "a Claude Code
> ingest skill (now)" as the v0 ingest runtime before it graduates to Vercel cron — **this
> skill is that v0.** The entry schema deliberately mirrors the plan's `kb_articles` fields
> so the future port is a migration, not a rewrite. v0 scope = the support/inbound-sales
> loop; the plan's course-Q&A corpus is a later extension of the same pattern.

---

## Resources you'll use (fixed facts — don't re-derive)

- **KB folder ID**: `1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6` (folder name: `[3.2] Support knowledge base`)
- **KB Doc name**: `Zynkr Support KB` (find-or-create inside that folder — see Step 5)
- **Google account**: `peter_tu@zynkr.ai`
- **MCP server**: `google-workspace` (all Gmail + Drive + Docs tools live here)
- **Source labels** (nested — use the **full path**):
  - Support: `[3] Operation/[3.8] Support`
  - Inbound Sales: `[2] Sales & consultant/[2.1] Inbound Sales`
- **Ingest-ledger label**: `KMS-ingested` — applied to a thread once its answer is in the KB.
  This is the idempotency record; never re-process a thread that already carries it.
- **Companion files**:
  - `references/intent-taxonomy.md` — the starter intent categories + aliases
  - `references/entry-schema.md` — the exact per-entry block format
  - `references/kb-doc-template.md` — the skeleton used when the KB Doc doesn't exist yet

---

## Step 1: Pull the *resolved, not-yet-ingested* queue

This is the **inverse** of `support-reply-drafter`: the drafter handles threads Peter
*hasn't* replied to; this skill harvests threads he *has* replied to and that aren't
ingested yet.

If Peter handed you a **specific thread** (pasted link or "learn from this one"), use just
that — skip the queue search.

Otherwise search both queues with `mcp__google-workspace__search_gmail_messages`:

```
(label:"[3] Operation/[3.8] Support" OR label:"[2] Sales & consultant/[2.1] Inbound Sales") from:me -label:KMS-ingested newer_than:90d
```

Fallback for website-form sales inquiries that were answered as fresh emails (these aren't
in-thread, so `from:me` on a labelled thread may miss them) — only if Peter asks you to
sweep website inquiries too:

```
from:website@zynkr.ai -label:KMS-ingested newer_than:90d
```

Dedupe by thread ID. If nothing comes back, tell Peter the KB is already up to date with the
resolved queue and stop. Otherwise list what you found (subject · sender · queue) and say
you're reviewing N threads.

---

## Step 2: Confirm the thread is *learnable*, then extract

Call `mcp__google-workspace__get_gmail_thread_content` on each thread ID. A thread is
**learnable only if all three hold**:

1. The **last message is from Peter** (`peter_tu@zynkr.ai` / any zynkr.ai sender) — i.e. he replied.
2. An **earlier inbound carried a real question** from the inquirer.
3. Peter's reply contains a **real answer** — concrete facts, not a holding reply.

**Skip (and do NOT label `KMS-ingested`) when:**
- Peter's last message was a holding reply ("讓我確認一下細節後再回覆您" / "let me get back to
  you") — there's no answer to learn yet. Leaving it un-labelled means it gets re-checked next
  run, once he truly answers.
- The thread is spam / out-of-scope / a thank-you with no Q&A content.

For each learnable thread, extract:
- The inquirer's **question(s)** — there may be several; each can become its own entry.
- Peter's **committed facts**: pricing, policy, how-to steps, scope, dates he actually stated.
- **Source context**: thread link, the date Peter answered, and the inquirer's **first name +
  company only**.

**Guardrails while extracting:**
- **Never invent or "improve" facts.** If Peter only answered part of the question, capture
  only that part; note the unanswered part in your proposal so he can decide.
- **PII guard**: keep first name + company for context; **strip** the inquirer's email, phone,
  and any 名單/attendee data. None of it reaches the KB.

---

## Step 3: Apply the three lenses → draft a proposed entry

For each question you extracted:

### Lens 1 — Intent taxonomy
Classify into the best-fit category from `references/intent-taxonomy.md`
(`pricing-quoting`, `course-content`, `scheduling-logistics`, `team-training-enterprise`,
`technical-howto`, `access-account`, `refund-policy`, …). If nothing fits well, **propose a
new category** — flag it for Peter, never silently invent one or dump it in `other` without
saying so.

### Lens 2 — Where to append
- Map the intent → the matching `## section` in the KB Doc. If that section doesn't exist
  yet, the entry will create it (Step 5).
- **Dedupe**: read the KB Doc (Step 5 fetch) and scan that section for a **near-duplicate
  question**. If one exists, propose an **UPDATE / supersede** rather than a second entry.
  This matters most for `pricing-quoting` and `refund-policy`, where stale answers are
  actively harmful.

### Lens 3 — Structure for the LLM
Render the entry exactly per `references/entry-schema.md`:

```
### Q: <canonical, normalized question — phrased the way a future inquirer might ask>
- Intent: <intent-tag>
- Keywords: <zh-TW + EN synonyms / aliases that should retrieve this entry>
- Answer: <Peter's answer, paraphrased into a clean statement; preserve exact facts verbatim (e.g. a quoted rate or fee)>
- Source: <Gmail thread link> · <YYYY-MM-DD> · <first name / company>
- Last verified: <YYYY-MM-DD>
```

Keywords must be **bilingual** so an English inquiry still retrieves a zh-TW-sourced answer
(and vice-versa). The drafter searches via `fullText contains`, so the keywords line is what
makes an entry findable.

---

## Step 4: Propose, then wait for approval (the write gate)

Present **one table** of everything you intend to write — nothing is written yet:

```
Proposed KB entries from N resolved threads:

| # | Action | Intent | Section | Entry preview | Flag |
|---|--------|--------|---------|---------------|------|
| 1 | NEW    | pricing-quoting | Pricing & Quoting | Q: 一天六小時的 AI 課程怎麼報價？ … | — |
| 2 | UPDATE | pricing-quoting | Pricing & Quoting | supersedes the older NT$X entry | ⚠ pricing change |
| 3 | NEW (new category) | logistics-overseas | (creates section) | … | ⚠ new category |
```

Then show the **full rendered block** for each proposed entry below the table.

**Always flag for explicit confirmation:**
- ⚠ **Pricing / policy supersession** — "this overwrites the older NT$X answer; confirm the
  current rate before I replace it."
- ⚠ **New category** — proposing a section that doesn't exist in the taxonomy.
- ⚠ **Ambiguous intent** or **partial answer** — where you weren't sure.

Peter approves all / edits / rejects per row. **Only approved rows proceed to Step 5.**
If he rejects a thread entirely, do not label it ingested (Step 6).

---

## Step 5: Write approved entries to the KB Doc

**Find-or-create the KB Doc:**
1. `mcp__google-workspace__search_drive_files`:
   `'1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6' in parents and name contains 'Zynkr Support KB'`
2. If it exists → `mcp__google-workspace__get_doc_content` to load current content (also used
   for the Lens-2 dedupe scan).
3. If it **doesn't exist** → create it from `references/kb-doc-template.md`:
   - `mcp__google-workspace__create_doc(title="Zynkr Support KB", content=<template>)`
   - `mcp__google-workspace__update_drive_file(file_id=<new id>, add_parents="1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6")`
     to move it into the KB folder. (Two-step create-then-move — creating directly into a
     folder 400s. Same pattern `consult-intake` uses.)

**Append / update via the section-sentinel pattern** (avoids fragile index math). Every
section in the template ends with an invisible marker line; you replace the marker with your
entry **plus the marker again**, so it stays appendable:

- **NEW entry into an existing section** — `mcp__google-workspace__find_and_replace_doc`:
  - `find_text`: `<!-- ▼APPEND:<intent>▼ -->`
  - `replace_text`: `<rendered entry block>\n\n<!-- ▼APPEND:<intent>▼ -->`
- **UPDATE / supersede** — `find_and_replace_doc`:
  - `find_text`: the old entry's unique `### Q: …` block (enough lines to be unique)
  - `replace_text`: the new block (bump `Last verified`)
- **NEW section** (intent has no section yet) — `find_and_replace_doc`:
  - `find_text`: `<!-- ▼NEW-SECTIONS▼ -->`
  - `replace_text`: `## <Section Title>\n\n<!-- ▼APPEND:<intent>▼ -->\n\n<!-- ▼NEW-SECTIONS▼ -->`
    then do the NEW-entry replace into the just-created `▼APPEND:<intent>▼` marker.

If a `find_and_replace_doc` ever reports 0 replacements (marker drift), fall back to
`mcp__google-workspace__inspect_doc_structure` to get `total_length`, then
`mcp__google-workspace__batch_update_doc` with an `insert_text` op at a safe index — and tell
Peter the marker needs repair.

---

## Step 6: Mark ingested + report

- Ensure the ledger label exists: `mcp__google-workspace__manage_gmail_label`
  (get-or-create `KMS-ingested`).
- Apply it to **every thread whose entry was written** via
  `mcp__google-workspace__modify_gmail_message_labels` (or
  `batch_modify_gmail_message_labels` for the batch). Do **not** label skipped or rejected
  threads.

Then give Peter a single summary:

```
KB updated — N entries from M threads:

✅ Added (X):
  - [Section] — Q: … — [sender / company]
✏️  Updated / superseded (Y):
  - [Section] — Q: … — replaced older answer (e.g. pricing)
🆕 New sections created (Z):
  - [Section Title]
⏭️  Skipped (W):
  - [Subject] — [reason: holding reply / no answer yet / out of scope]
⚠️  For your attention:
  - [anything you want Peter to double-check]
```

If a new category was created, suggest Peter add it to `references/intent-taxonomy.md` so it
becomes a first-class category next time.

---

## Things to be careful about

- **Extraction, not generation.** Every fact in the KB must trace to something Peter wrote in
  the thread. Holding replies teach nothing — skip them.
- **One source of truth.** The Google Doc is canonical. Don't create a second KB doc; always
  find-or-create the single `Zynkr Support KB`.
- **Supersede, don't pile up.** Especially for pricing/policy — an UPDATE that replaces the
  stale block is better than two contradictory entries the drafter might both retrieve.
- **PII never lands in the KB** — first name + company only.
- **Idempotency is the label.** A thread carrying `KMS-ingested` is done; never re-write it.
  A skipped thread stays un-labelled on purpose so it's reconsidered once truly answered.
- **zh-TW default**, bilingual keywords — match how Peter and his inquirers actually search.
