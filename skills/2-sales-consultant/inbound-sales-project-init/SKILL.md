---
name: inbound-sales-project-init
description: "Intake an inbound sales / consulting email, gather all of its context, create a project folder in Drive with a structured context doc + attachments, and create a matching Notion ticket in the Consultant service DB with status 'Consult intake'. Trigger whenever the user forwards or references an inbound lead email and says things like '幫我建專案', 'create a ticket for this', 'intake this email', 'kick off this lead', 'log this inbound', or shares an inbound proposal / introduction / 講座提案 / 合作邀請 and wants it stacked up into a trackable project — even if they only say 'I got this email' with intent to process it."
category: business-consulting
project: inbound-sales-project-init
platform: claude
status: Done
author: Peter Tu
input: "Gmail message (ID, thread link, or search query) for an inbound sales / consulting lead"
process: "Read email + attachments → fetch Notion DB schema → create Drive project folder → create Google Doc with structured context (sender, body, proposal breakdown, open questions, next actions) → re-upload attachments → create Notion ticket (Consult intake) → bidirectionally link Drive ↔ Notion"
output: "Drive project folder (with context doc + attachments) + Notion ticket in Consultant service DB, status Consult intake, body linking back to all assets"
synergy: []
---

# Inbound Sales Project Init

Turn an inbound sales / consulting email into a fully-scaffolded project: a Drive folder with a structured context doc and attachments, plus a Notion ticket in the Consultant service DB at status **Consult intake**. The goal is to capture the inbound while context is fresh, so the next step (review, reply, decide) starts from one canonical place — not a Gmail thread that will get lost.

<!-- SKILL BASE PATH: /Users/petertu/Desktop/Claude/zynkr/6.0 tech/zynkr-skill-builder/skills/2-sales-consultant/inbound-sales-project-init -->

---

## Step 0 — Load Config

Read the config file at:
`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/zynkr-skill-builder/skills/2-sales-consultant/inbound-sales-project-init/inbound-sales-config.md`

This file holds the IDs and paths the skill depends on — Drive parent folder, Notion data source ID, Google account, default status. Don't hard-code these in the conversation; always re-read them so the skill stays correct when they move.

Also read the context-doc template at:
`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/zynkr-skill-builder/skills/2-sales-consultant/inbound-sales-project-init/references/context-doc-template.md`

That template defines the canonical structure for the Google Doc so every project folder feels the same.

---

## Step 1 — Locate & Read the Email

The user will reference the inbound in one of three ways:

1. **A Gmail link or message ID** — use it directly.
2. **A subject / sender / topic hint** — search Gmail with `search_gmail_messages` using `user_google_email` from config.
3. **A forwarded message body pasted in chat** — extract subject + sender from the paste and skip to Step 2 (but flag to the user that without a real Gmail thread you can't auto-pull attachments).

Once you have the message ID, fetch full content with `get_gmail_message_content`. Capture:
- `Subject`, `From`, `Date`, `Message-ID`, `To` / `Cc`
- Full plain text body (verbatim — don't paraphrase yet)
- Every attachment's `filename`, `mime_type`, `size`, and `attachment_id`

If there are attachments, download them via `get_gmail_attachment_content` — they'll be saved locally and you'll need the path to re-upload to Drive in Step 4.

---

## Step 2 — Derive Project Name & Team

The project name is the human-readable handle that will appear in both Drive and Notion. Construct it as:

```
<Org or Sender Short Name> - <Topic Phrase> (<Original Title or Key Hook>)
```

**Example:** From subject `【講座提案】有關HRAI 從痛點到系統的發想框架講座提案` sent by Wesley → `HRAI - Wesley 講座提案 (從痛點到系統的發想框架)`.

The key is that the name should make sense glanced-at in a Drive folder list six months from now without opening anything. Avoid leading brackets / emoji prefixes from the original subject line — those get noisy in URLs.

**Team assignment** — pick from the Notion DB's allowed values (see config). Default heuristics:
- HR / 人資 / talent topics → `Human Resources`
- Anything inbound and revenue-bearing → also add `Business Development`
- Product / UX / design topics → `Product Design`
- Account expansion / existing client → `Account Management`

Multiple teams are fine and usually correct for inbound — most leads involve at least BD plus a domain owner.

**Priority** — default to `Medium`. Bump to `High` only if the email signals a hard deadline or a strategic account; drop to `Low` for clearly speculative inbounds.

---

## Step 3 — Fetch Notion DB Schema (sanity check)

Before creating the ticket, call `notion-fetch` on the data source URL from config to confirm the schema hasn't drifted (property names, allowed Status / Team / Priority values). Notion DBs change; the skill is more robust if it re-reads the schema each time than if it trusts a frozen snapshot.

If a property name in config no longer matches the live schema, stop and tell the user — don't guess. A misnamed property will silently fail to set.

---

## Step 4 — Create the Drive Folder & Assets

Order matters here — folder first, then doc/PDFs inside.

**4a. Create the project folder** under the Drive parent in config:

```
create_drive_file(
  file_name = <project name from Step 2>,
  folder_id = <drive_parent_folder_id from config>,
  mime_type = "application/vnd.google-apps.folder",
  content = " "   # tool quirk: requires non-empty content even for folders
)
```

Capture the new folder ID — every subsequent asset goes into it.

**4b. Create the context Google Doc.** `create_doc` does not accept a parent folder, so the doc is born at Drive root. You'll move it in 4c.

The doc content must follow the template in `references/context-doc-template.md`. Fill in:
- Project metadata (status, Notion ticket URL once known — see Step 5)
- Inbound source block (From / Date / Subject / Gmail thread URL / attachments)
- Wesley's-original-letter-style verbatim block (the full email body, no paraphrasing)
- Proposal core breakdown (target audience, angle, positioning, business logic, asks)
- Open questions
- Next actions
- A "working context (rolling)" section left empty for future updates

Use the actual sender name in the verbatim section heading — e.g., `2. Wesley 原始信件全文`. Do the breakdown in the email's original language (Chinese for Chinese inbounds, English for English inbounds) so it reads naturally to the user.

**4c. Move the doc into the project folder:**

```
update_drive_file(
  file_id = <doc id>,
  add_parents = <project folder id>,
  remove_parents = "root"
)
```

**4d. Re-upload attachments.** For each downloaded attachment, `create_drive_file` with `fileUrl = "file://<local path>"`, `folder_id = <project folder id>`, and the correct `mime_type`. Keep the original filename so the user recognizes it.

---

## Step 5 — Create the Notion Ticket

Use `notion-create-pages` with `parent = { type: "data_source_id", data_source_id: <from config> }`.

Required properties:
- `Project name` — same string as Step 2
- `Status` — `Consult intake` (the canonical entry state; never start a ticket past this)
- `Team` — JSON array string of team values
- `Priority` — `Medium` (or your adjusted value)
- `date:Start date:start` — today's date in `YYYY-MM-DD`
- `icon` — pick an emoji that hints at the inbound type (🎤 for talks, 🤝 for partnerships, 💼 for consulting, 📨 generic). This is a small touch but makes the board scannable.

For the page content, write a structured summary that mirrors (but doesn't duplicate verbatim) the context doc:
- `## Inbound context` — From / Date / Subject / Attachment names
- `## Proposal summary` — 3-6 bullets of the key framing in the sender's own conceptual terms
- `## <Sender>'s ask` — what specifically they want from us
- `## Notes / open questions` — checkbox list
- `## Links` — Gmail thread, Drive folder, Context doc, each attachment

For the Links section, use the form `- Drive folder: [<readable label>](<url>)` so the Notion page renders clean clickable text instead of raw URLs.

---

## Step 6 — Backfill the Notion URL into the Doc

The context doc has a `Notion ticket:` line near the top that was a placeholder when you created the doc (because the ticket didn't exist yet). After Step 5 returns the new page URL, you can either:

1. **Skip it for the first version** and accept the minor inconsistency (simpler, fewer tool calls), or
2. **Patch it** using Docs find-and-replace if available.

Default to option 1 unless the user explicitly wants tight bidirectional linking — the Notion side links to the doc, which is the more important direction (the doc is where context lives; the Notion ticket is where you act on it).

---

## Step 7 — Report Back

Give the user a tight summary with:
- 📁 Drive folder link
- 📄 Context doc link
- 📎 Each attachment link
- 🎤 Notion ticket link + status
- A 2-3 sentence plain-language summary of what the inbound is actually about (so they don't need to re-read the email to remember)
- A single suggested next step (usually: review attachments → decide reply angle)

Keep this report short. The skill's job is to remove friction, not to add a wall of text on top of the assets it just created.

---

## Failure modes to watch for

- **`create_drive_file` rejects folder creation with "must provide content"** — pass `content = " "` (single space). The tool requires it even though Drive's API doesn't.
- **`create_doc` creates the file at root, not inside the folder** — that's expected; move with `update_drive_file` in Step 4c.
- **Notion property names case-mismatch** — use the exact casing from the live schema (e.g., `Project name`, not `Project Name`).
- **Team value not in allowed list** — the Notion API silently drops invalid select values. Always cross-check against the schema from Step 3.
- **Attachment IDs are ephemeral** — if you wait too long between fetching the message and downloading the attachment, the ID expires. Download promptly.

---

## Why this shape

The skill is deliberately split into discrete steps with explicit tool names rather than a vague "create a project for this email" because inbound triage is mostly a coordination problem, not a thinking problem — every inbound looks slightly different, but the assets we need to create around it are the same. Codifying the steps lets the user trust that nothing falls through the cracks (the attachment didn't get saved, the Notion ticket didn't get the right team, etc.) on the second or third inbound of the day when attention is thinning out.
