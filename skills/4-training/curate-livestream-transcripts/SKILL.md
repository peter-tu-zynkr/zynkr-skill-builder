---
name: curate-livestream-transcripts
sheetId: "4.09"
description: "Weekly transcript curation. Sweeps the 直播筆記 livestream-note Google Docs across N upstream Drive folders, extracts each doc's 逐字稿 (verbatim transcript) tab, and writes one structured zh-TW summary Doc per source into the destination SOT folder. Fully idempotent — skips any source whose target already exists. Trigger on /curate-livestream-transcripts, '整理直播逐字稿', 'curate the livestream transcripts', 'process this week's 直播筆記', or the weekly Monday routine."
category: training
project: curate-livestream-transcripts
platform: claude
status: Done
author: Peter Tu
input: "None — all source/destination folder IDs are constants below. Reads 直播筆記 Docs from the upstream folders."
process: "list → filter → dedup-against-destination → read 逐字稿 tab → summarize → create Doc in SOT folder"
output: "One 逐字稿_{Series}_{YYYY-MM-DD}_{topic} Google Doc per new source, in the destination folder, plus a run report."
synergy: []
---

# Curate Livestream Transcripts

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill curate-livestream-transcripts
```

Autonomous, idempotent batch curator. Read every livestream-note Doc (「直播筆記…」) across the upstream folders, pull the **逐字稿** (verbatim voice-to-text) tab out of each, and produce one clean, structured zh-TW summary Doc per source in the destination (single source-of-truth) folder. Designed to run unattended on a weekly schedule — **no human gates, no questions**. When a source already has a summary, skip it.

This is the read-many-sources → merge-into-SOT pipeline, run on a recurring cadence.

---

## Constants

### Upstream source folders

| Series label | Folder ID | What it holds |
|---|---|---|
| `VibeCoding` | `16skZxvWi1V5ppBn6B7jHqFQnG33BRMr8` | 從0到1蓋產品 Vibe Coding 實戰直播 notes |
| `ClaudeCode` | `1cM5pL3FVMD5CPeL02Ti9KQr3uCStRh16` | Claude Code 實戰講座 notes |
| `BizThinking` | `1LlYRd0RTHVp4Z_zESDg89IiZoUqJMUWc` | 從產品到賺錢 商業思維實戰講座 notes (series added 2026-06-05) |

To add a future series: append one row here (label + folder ID) — nothing else changes.

### Destination (SOT) folder

`1-aXLBpLizM0PyMbYu7TIb3xw50BrFL6a` — curated `逐字稿_*` summary Docs land here. **Write-only downstream**: never read a summary back into an upstream. Data flows one direction only.

### Account

All Drive operations run as `peter_tu@zynkr.ai`.

### Tooling

- **Local run (CLI, this skill invoked manually):** use the `mcp__google-workspace__*` tools — `list_docs_in_folder`, `get_drive_file_content`, `create_doc`, `update_drive_file`.
- **Cloud routine (claude.ai weekly run):** the only Drive tools there are the **Google-Drive connector** — `search_files` (query `parentId = 'FOLDER_ID'`), `read_file_content` (by fileId), `create_file` (parentId + textContent + contentMimeType). The cloud routine prompt is self-contained and does not depend on this file being present.

---

## Step 1 — List every upstream Doc

For each upstream folder, list its Docs (`list_docs_in_folder` locally, or `search_files` with `parentId = '<folder>'` in cloud). Record `{ title, fileId, series }` for each, tagging `series` from the folder it came from.

## Step 2 — Filter to livestream-note Docs

Keep a Doc only if **both**:

1. **It is a livestream note**, i.e. its title matches ANY of:
   - contains `直播筆記` anywhere, OR
   - matches `<lecture name>_YYYY.M.D` shorthand (e.g. `Claude Code 實戰講座_2026.4.22`, `商業思維實戰講座_2026.6.5`), i.e. a course-name token immediately followed by `_` and a dotted date.
2. **A date is parseable** from the title (Step 3 returns non-null).

Explicitly **exclude** auxiliary docs even if they sit in an upstream folder: titles containing `活動準備`, `課程大綱`, `QA Master`, `Notes by Gemini`, or that are recap/demo docs without `直播筆記` (e.g. `直播回顧`, `Demo`, `Event Recap`, `Transcript`-only). These are out of scope by design.

## Step 3 — Extract + normalize the date

From the title, take the **first** match of `(20\d\d)[-./](\d{1,2})[-./](\d{1,2})`. Zero-pad month and day → `YYYY-MM-DD`. If no date matches, drop the Doc (it failed the Step-2 gate).

## Step 4 — Build the "already done" set from the destination

List the destination folder. For every existing Doc named `逐字稿_{Series}_{YYYY-MM-DD}_...`, record the prefix key `{Series}|{YYYY-MM-DD}`. This is the idempotency set.

## Step 5 — Decide what to create

For each filtered source, its key is `{series}|{date}`. **Skip** if that key is already in the destination set (record the matched existing filename for the report). Otherwise it is a **create** candidate.

## Step 6 — Read the 逐字稿 tab for each create candidate

Read the source Doc (`get_drive_file_content` / `read_file_content`). The connector flattens all tabs into one text stream: structured human notes first, then a line that is just **`逐字稿`**, then the raw verbatim transcript (often starting `Speaker 1: 00:00 …`).

- Locate the `逐字稿` section marker; the transcript is everything **after** it.
- If there is **no** `逐字稿` marker / the transcript section is empty → **skip this source**, and note `（無逐字稿 tab）` in the report. Do not create a Doc.

## Step 7 — Detect cross-source duplication

Mis-filed duplicate transcripts have been observed. Compare the first ~500 non-whitespace chars of each candidate's transcript against the others in this run. If two are near-identical, still create one Doc per source, but add a `⚠️ 重複註記` line in each affected Doc body (naming the other source) and flag it in the final report.

## Step 8 — Generate the structured summary (per source)

The 逐字稿 is long, unstructured, filler-heavy. **Never dump it raw.** Produce a clean Markdown summary, all in zh-TW (keep English technical terms in English — Skills, MCP, Vercel, Supabase, Plan Mode, agent, etc.). Structure:

```
# {original doc title}

> 來源：{original doc title}
> 原始文件：{original Google Doc URL}
> 系列：{Series}　·　日期：{YYYY-MM-DD}
> （若偵測到重複）⚠️ 逐字稿與「{other source title}」內容高度重疊，疑似誤置

## 主題
{one-paragraph main theme}

## 重點段落
### {topic heading 1}
- {key takeaway}
- {key takeaway}
### {topic heading 2}
- …

## 技術步驟 / 指令
- {concrete steps, commands, tool names, configs demonstrated — only if present}

## Q&A
- Q: {question} — A: {answer}
（若逐字稿中無問答互動則整段省略）

## 一句話總結
{single-sentence wrap-up}
```

Omit any section that has no content (except 主題, which always appears).

## Step 9 — Compute the target filename

`逐字稿_{Series}_{YYYY-MM-DD}_{topic}` where `{topic}` is a 3–6 word zh-TW/English summary derived from the transcript, using ` × ` as the separator — matching the existing house style, e.g.:
- `逐字稿_ClaudeCode_2026-05-20_Skills Pipeline × Lift-and-Shift × Schema 版本驗證`
- `逐字稿_VibeCoding_2026-05-22_Vercel 部署 × Kanban 拖拉 × 平行 Agent`

## Step 10 — Create the Doc in the destination folder

- **Local:** `create_doc(title, content)` → then `update_drive_file(fileId, add_parents=<dest>, remove_parents='root')` to move it into the SOT folder. Retrieve its URL.
- **Cloud:** `create_file(parentId=<dest>, title=<filename>, textContent=<summary>, contentMimeType='text/plain')` — text/plain auto-converts to a Google Doc inside the folder.

## Step 11 — Final report

Output (zh-TW):
- **來源總數 N** (after filtering)
- **略過 M（已存在）** — each with the matched existing destination filename
- **新建 K** — each with its new filename + Doc URL
- **重複註記** — any cross-source duplications flagged
- **錯誤** — per-source errors (e.g. 無逐字稿 tab, read failure). Never swallow errors silently.

---

## Notes

- The routine converges: once every source has a summary, a run creates 0 Docs and only reports skips. That is the healthy steady state.
- Adding a new series = one row in the Constants table (and the same row in the cloud routine prompt). The filter and dedup logic are series-agnostic.
- Keep this skill and the cloud routine prompt in sync when editing logic. The cloud routine is the claude.ai remote trigger **`Weekly livestream transcript curation`** (id `trig_01HD3SAYjYyfQCNedEsZTaTW`), cron `19 2 * * 1` (Mon 02:19 UTC), bound to the claude.ai **Google-Drive** connector. Edit it via the `RemoteTrigger` tool (`action: update`, that `trigger_id`) or `/schedule`.
- The cloud run depends on the claude.ai Google-Drive connector being authorized for `peter_tu@zynkr.ai`'s Drive (same propagation gotcha as the project-status routine). If a Monday run reports 0 sources / permission errors, re-auth the connector on claude.ai.
