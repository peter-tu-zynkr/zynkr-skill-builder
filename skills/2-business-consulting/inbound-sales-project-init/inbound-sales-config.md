# Inbound Sales Project Init — Config

This file is the single source of truth for IDs and accounts the skill depends on. When something moves (a folder gets renamed, a Notion DB is rebuilt), update this file — don't edit SKILL.md.

---

## Google account

```
user_google_email: <your-google-workspace-account>
```

All Google Workspace MCP calls (Gmail search, Drive create, Doc create) use this account.

---

## Drive

**Parent folder for inbound sales projects:**

```
drive_parent_folder_id: 1hkXPX7OXPFOU0BcloPbJSFp8O0zArM8t
drive_parent_folder_url: https://drive.google.com/drive/folders/1hkXPX7OXPFOU0BcloPbJSFp8O0zArM8t
```

Every new project folder created by this skill is a direct child of this parent. If the user asks for the project to live somewhere else, override per-run but don't change this default without explicit confirmation — other workflows assume it.

---

## Notion

**Database:** `💼 Consultant service`

```
notion_parent_page_url: https://www.notion.so/Consultant-service-281ad634eef280599403e50ea0e5eaa5
notion_database_url:    https://www.notion.so/281ad634eef280f69882fce14fd6d86a
notion_data_source_id:  281ad634-eef2-8081-a4a8-000b9d96d5dc
notion_data_source_url: collection://281ad634-eef2-8081-a4a8-000b9d96d5dc
```

Always create new tickets with `parent = { type: "data_source_id", data_source_id: "281ad634-eef2-8081-a4a8-000b9d96d5dc" }`. Do **not** use the database URL or page ID as the parent — that path errors out for multi-source DBs.

### Schema (as of 2026-05-12)

Re-verify with `notion-fetch` on the data source URL on every run — Notion DBs drift. If the live schema differs from below, trust the live schema and update this file.

| Property | Type | Notes |
|---|---|---|
| `Project name` | title | Required. Lowercase `name`, not `Name`. |
| `Status` | status | Use `Consult intake` for fresh inbounds. |
| `Team` | multi_select | JSON array string. |
| `Priority` | select | `High` / `Medium` / `Low`. |
| `Assignee` | person | Skip on creation; set after triage. |
| `Start date` | date | Use today on creation. Set via `date:Start date:start`. |
| `End date` | date | Skip on creation. |
| `Attach file` | file | Skip; attachments live in Drive instead. |

### Allowed values

**Status:** `Sales outbound`, `Consult intake`, `Discovery shadowing`, `Design / Visualize`, `Proposal`, `Develop`, `Deploy`, `Govern`, `Closed`, `Archive / Drop`

**Team:** `Account Management`, `Business Development`, `Product Design`, `Human Resources`

**Priority:** `High`, `Medium`, `Low`

### Default ticket state for this skill

```
Status:   Consult intake
Priority: Medium
Team:     [Business Development] + domain-specific team (HR / Product Design / Account Mgmt)
Start date: <today>
```

---

## Conventions

- **Project name format:** `<Org or Sender Short Name> - <Topic Phrase> (<Original Title or Key Hook>)`
- **Icon hints:** 🎤 talk / lecture · 🤝 partnership · 💼 consulting · 📨 generic inbound · 🛠️ implementation · 📈 growth
- **Date format:** ISO `YYYY-MM-DD` (matches Notion's expanded `date:<prop>:start` field)
- **Doc filename:** `<Project name> - 脈絡彙整` (Chinese inbound) or `<Project name> - Context` (English inbound)
