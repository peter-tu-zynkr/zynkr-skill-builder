---
name: article-governance
sheetId: "1.12"
description: Sync a newsletter article from Google Docs to the Notion Content DB. Use this skill whenever the user shares a Google Doc URL and wants to create a Notion page, sync to Notion, add to Content DB, or archive a newsletter. Trigger on phrases like "幫我放上 Notion", "sync to Notion", "add this to Notion", "同步到 Notion", or any message combining a Google Doc link with Notion/archive intent.
category: brand-marketing
project: newsletter-to-notion
platform: claude
status: Done
author: Peter Tu
input: "Google Doc URL for a newsletter article"
process: "Fetch doc content, classify Subject tags, confirm with user, create Notion page in Content DB"
output: "Notion page URL in the Content DB"
synergy: []
---

# Newsletter → Notion Sync

Syncs a newsletter from Google Docs to Peter's Notion Content DB with auto-classified Subject metadata.

## Hardcoded context

- **Google account**: `<your-google-workspace-account>`
- **Notion Content DB data source**: `collection://64bd3535-0cb3-4f96-946c-c2240294307c`
- **Subject taxonomy file**: `/Users/petertu/Desktop/Claude/zynkr/1.0 brand-marketing/subject-taxonomy.csv`

## Steps

### 1. Fetch Google Doc content

Use `mcp__google-workspace__get_doc_content` with:
- `user_google_email`: `<your-google-workspace-account>`
- `document_id`: extracted from the URL the user provided

Extract:
- **Doc title** → use as `Article name` in Notion
- **Full body text** → used for subject classification

### 2. Read the subject taxonomy

Read the CSV at `/Users/petertu/Desktop/Claude/zynkr/1.0 brand-marketing/subject-taxonomy.csv`.

Columns: `subject`, `description_zh`, `keywords_zh`, `keywords_en`

Match the article body against `keywords_zh` and `keywords_en` for each row. Select the **3–5 most relevant** Subject tags. `Newsletter` should always be included for newsletter content.

### 3. Confirm Subject tags with user

Before creating the page, show the selected tags and a one-line reason for each. Example:

> 建議 Subject：Newsletter、Gen AI、Automation、Content Writing
> - **Newsletter** — 電子報本身
> - **Gen AI** — 文章核心是 Claude Code 使用心得
> - **Automation** — 討論到 pipeline 與 Agent 流程
> - **Content Writing** — 分析 Threads 貼文曝光表現

Let the user approve or adjust before proceeding.

### 4. Create the Notion page

Use `mcp__claude_ai_Notion__notion-create-pages` with:
- `parent`: `{ "type": "data_source_id", "data_source_id": "64bd3535-0cb3-4f96-946c-c2240294307c" }`

Properties:

| Field | Value |
|-------|-------|
| `Article name` | Doc title (string) |
| `Content type` | `["Article"]` |
| `Subject` | JSON array of confirmed tags, e.g. `["Newsletter", "Gen AI"]` |
| `Published channel` | `["Newsletter"]` |
| `Google Doc` | Full Google Doc URL as provided by the user |
| `Status` | `Draft` |

### 5. Confirm success

Return the Notion page URL to the user.
