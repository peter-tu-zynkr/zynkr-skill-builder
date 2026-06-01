---
name: project-status-weekly
description: Generates a weekly project status update for a project tracked in a Google Sheet. Reads the live 「專案管理總表」 task tab of a project-tracker Google Sheet you configure, reasons over task status + dates against today to derive project health, blockers, this-week actions, % complete, next milestone, recent decisions and a timeline (the 「專案狀態看板」 dashboard format), renders it as a styled HTML email, and creates a Gmail DRAFT (never auto-sends) to a configurable recipient list. Trigger this skill EAGERLY whenever the user says "週報", "專案週報", "weekly report", "project weekly update", "draft the weekly status", "更新專案狀態", "PM 進度", "進度更新", "週進度更新", "跑一下專案看板", "update the dashboard", "draft the project dashboard", "寄週報給團隊", "/project-status-weekly", or otherwise asks for a weekly / status / progress update or dashboard on a project — even if they don't name the sheet, name a recipient instead of the project, or just say "the weekly". This is also the skill a scheduled / recurring / cron weekly run should invoke. When in doubt about a project status or weekly-update request, prefer this skill.
category: operations
project: project-status-weekly
platform: claude
status: Done
author: Peter Tu
input: "A project-tracker Google Sheet (a 專案管理總表 task tab) you configure, plus a recipient list. Optionally an explicit 'as of' date."
process: "Anchor on today → read the tracker tab → diff against last week's report → reason over status/dates to derive health, blockers, this-week actions, % complete, next milestone, decisions, timeline → render styled HTML → create a Gmail draft (never send)."
output: "A Gmail DRAFT (never auto-sent) containing the 專案狀態看板 weekly dashboard as a styled HTML email, addressed to a configurable recipient list."
synergy: []
---

# Weekly Project Status Update

You run a project tracked in a Google Sheet. The `專案管理總表` tab is the live task list; the `專案狀態看板` tab is a hand-formatted executive dashboard. This skill closes the gap: it reads the raw tracker, does the reasoning a human would do (what's late, what's blocked, how far along), and produces the dashboard **as a weekly HTML email draft** — so you only have to skim and hit send.

The output is a **draft, never a send**. This is deliberate: the skill reasons over dates and status, and a wrong "🔴 DELAYED" blasted to your recipients is worse than one you review first. Leave it in the drafts folder for review.

---

## Constants

> **Configure before first run:** replace the Spreadsheet ID, Google account, and Recipients below with your own values. Everything else is generic.

- **Spreadsheet ID**: `<YOUR_GOOGLE_SHEET_ID>`
- **Source tab**: `專案管理總表`
- **Format reference tab**: `專案狀態看板` (read-only — used for carry-forward context; this skill does NOT write back to the sheet)
- **Google account**: `your-google@example.com` (for all `google-workspace` MCP calls — set this to the account authenticated in your runtime)
- **Recipients**: `you@example.com`, `teammate-a@example.com`, `teammate-b@example.com`
- **MCP servers**: `google-workspace` — use this for **everything** (reading the sheet AND creating the draft). It's the server authenticated for your Google account. The separate `gmail` server is often NOT authenticated in this environment, so don't rely on it.
- **Renderer**: `scripts/render_dashboard_email.py`
- **JSON contract**: `references/dashboard_schema.json`

---

## Workflow at a glance

1. Establish "today" and the current week window.
2. Read the source tab (and the dashboard tab for carry-forward context).
3. Find last week's report in Gmail → build a week-over-week diff.
4. Reason over the data → assemble the dashboard JSON.
5. Render to HTML with the script.
6. Create the Gmail draft. Report back. Do **not** send.

---

## Step 1 — Anchor on today

Determine today's date (the date the skill runs). Everything downstream — overdue checks, "this week", timeline icons — is relative to it. The current week window is **Monday→Sunday containing today**; format it like `6/1 - 6/7` for the THIS WEEK header.

If the user gives an explicit "as of" date, use that instead.

## Step 2 — Read the tracker

Read the source tab:

```
read_sheet_values(spreadsheet_id, "專案管理總表!A1:M44", user_google_email)
```

Structure of that tab:
- **Row 1**: core goal (col D). **Row 3**: header row.
- Columns: `A no. · B 里程碑(stage name) · C 任務描述 · D Priority · E Owner · F Facilitator · G Agent · H Status · I Start · J End · K Reference · L Note · M DOD`.
- **Stage rows** (`X.0`, e.g. `1.0`, `2.0`): stage/milestone name in col B, the stage date-range in I/J, the stage's Definition-of-Done in col M.
- **Task rows** (`X.Y`, e.g. `2.3`): task description in col C, owner/facilitator, `Status`, Start/End dates, and a Note that often carries the real blocker context.

**Normalize Status before reasoning** — real sheets drift, so don't pattern-match the literal string. Trim + lowercase, then map onto three buckets:
- `Done` ← `done`, `完成`, `✓`, `✅`
- `WIP` ← `wip`, `in progress`, `doing`, `進行中`
- `Not started` ← blank, `not started`, `未開始`, `todo`, `n/a`
If a value falls outside all three (e.g. `取消`, garbage), **don't guess**: count it as `Not started` for the % math, but surface that row in blockers/this-week with a `（狀態未知：<原值>）待確認` note so the anomaly is visible rather than silently miscounted.

**Dates** are written `M/D` (US-style); some are full (`2026/5/30`), most are short (`5/30`). Don't blindly stamp the project's start year — the tracker may run past New Year (rows with `12/1`, `1/31`, `2/1`). Infer the year that places the date within or just after the project window relative to today: if a short `M/D` falls earlier in the calendar than the project's start month and you're already late in the project, it belongs to the **next** year (so `1/31`, `2/1` → next year, not this one). A bare back-dated guess here is dangerous — it can flip a future milestone into "massively overdue" and fabricate a false 🔴 DELAYED. If a date is unparseable, mark the item `（日期待確認）` and **exclude it from overdue math** rather than guessing.

Also read the dashboard tab once for carry-forward context (decisions history, prior wording):

```
read_sheet_values(spreadsheet_id, "專案狀態看板!A1:F55", user_google_email)
```

## Step 3 — Find last week's report (week-over-week diff)

This is a *weekly* update, so the most useful thing is **what changed**. Search Gmail for the previous report:

Because this skill only ever **drafts** (never sends), last week's report normally lives in **Drafts**, not Sent — so search there first:

```
search_gmail_messages(user_google_email, query='in:drafts subject:"【專案週報】"')
```

Take the newest match. Also peek at `in:sent subject:"【專案週報】"` in case a prior one was sent. Read the most recent and compare status / blockers / stage / % vs the current tracker. Populate `weekly_diff` with the concrete changes (status transitions, blockers cleared or added, % movement, milestones hit or slipped). If this is genuinely the first run (nothing found), omit `weekly_diff` entirely — don't fabricate movement.

## Step 4 — Reason over the data → build the JSON

Build a JSON payload matching `references/dashboard_schema.json`. The reasoning rules:

### Project health
First define "**met**" concretely (there is no "approved" column in the sheet, so don't invent one): a Stage Gate / stage `X.0` is **met** when all of its child `X.Y` task rows are `Done` (or the stage row's own col-H Status is `Done`). Then:
- **🔴 DELAYED** — a Stage Gate's date is before today and it is **not met**, OR a task that gates a milestone is overdue.
- **🟡 AT_RISK** — something due this week or next is `Not started`/`WIP` with little slack, but nothing is overdue yet.
- **🟢 ON_TRACK** — no overdue items, current-stage tasks progressing.
- The `summary` is one line of the *specific* reasons, `・`-separated. Name the actual task/gate numbers (e.g. `課綱 2.3 逾期`), so the verdict is auditable rather than vibes.

### Blockers
A blocker is anything that stops forward progress: an overdue task that gates a milestone, or a Stage Gate that can't open because its prerequisites aren't `Done`. Pull the *why* from the task Note column when present. Title = short, detail = impact.

### This week
The tasks that should close in the current week window: overdue must-close items first (these often double as blockers), then tasks whose Start/End straddle this week. Keep it to the few that matter. The `note` should say why it matters this week (e.g. "已逾期，本週必須關閉，解除 Blocker").

### Current stage + % complete

The tracker numbering is often messy (parallel tracks, repeated `4.0`, jumps to `7.0`/`8.0`). Do **not** map % to raw row counts. Work from the **delivery spine** — the sequential stages a viewer thinks of as "the project's phases". A typical spine looks like:

1. 專案啟動
2. 課程定位 & 課綱規劃
3. 教學教材開發
4. 錄製與後製
5. 課程包組裝
6. 上架完成 / 上線後追蹤

**Reconcile the spine to the live sheet each run** — don't trust this list blindly. Read the `X.0` stage names from col B and map them onto these slots by meaning. (A 行銷 track is usually a *parallel* track, **not** a spine stage — surface it in blockers/this-week/timeline, but it doesn't count toward the spine %.) If the live stages can't be mapped cleanly onto the spine (renamed, added, or removed stages), still emit the %, but add a `（專案結構已變動，請確認看板階段對應）` note in `summary` so a human checks it. `total_spine_stages` = the number of mapped slots, not a hardcoded 6.

**Stage state (source-faithful — a stage is only ✅ done when its work is actually all done):**
- `done` — **every** child `X.Y` task is `Done`.
- `now` — at least one child task is `Done`/`WIP` but not all are `Done` (work is underway). Real projects run out of order, so **more than one** stage can be `now` (e.g. Stage 1 still being closed while Stage 2 is active) — mark each in-progress stage `now`, and add a short `(收尾中)` to the name of an earlier in-progress stage so it reads correctly. `stage_index` = the **leading-edge** stage (the highest-numbered stage with any activity); that's the one the header's "Stage X / Y" points to.
- `todo` — no child task started.

**Percent — honest per-stage fractional sum** (this is what keeps progress comparable week to week without overstating it):

```
stage_fraction(s)   = Done child tasks in s / total child tasks in s     # 0 if the stage has no tasks yet — never divide by zero
percent             = round( Σ stage_fraction(s) over all spine stages / total_spine_stages * 100 )
```

Boundary cases: a spine stage with **no** task rows contributes `0`. If **every** spine stage is `Done`, `percent = 100` and no stage is `now` (all `done`). A stage with trailing open tasks contributes its true fraction (e.g. 2/4 = 0.5), **not** a full 1.0 — that's the whole point: don't round a half-finished stage up to "done".

Worked example (illustrative — recompute every run, these numbers are not a target): on a week where Stage 1 has 2 of 4 tasks Done and Stage 2 has 2 of 4 Done and Stages 3–6 are untouched → `(0.5 + 0.5 + 0 + 0 + 0 + 0) / 6 = 0.167 → 17%`, with both Stage 1 `(收尾中)` and Stage 2 marked `now`.

### Next milestone
The earliest Stage Gate / `X.0` milestone that is not yet complete. `overdue` = its date is before today. Pull completion criteria from the stage's DOD (col M) and mark already-satisfied parts with inline ✅.

### Overview
`project_name`, `goal` (row 1 col D, condensed to one line), `owners` (derive from the Owner/Facilitator columns), `timeline` (earliest Start → latest End across stage rows).

### Recent decisions
Carry forward the decisions already in the dashboard tab's `RECENT DECISIONS` block (read in Step 2), and append any new decision that's evident this week (e.g. a newly-locked positioning, a scope change visible in notes). Keep 3–5 most recent. If genuinely none new, just carry forward — don't invent.

### Timeline
Key dated milestones across the project (stage gates + headline deliverables). **Derive each date from the source rows** — a milestone's date is the relevant task/stage `End` (col J) or a date stated in its Note, not a hand-picked estimate. State per row: `done` (date passed & milestone met), `overdue` (date passed, not met), `todo` (future), `target` (a 🎯 headline like 開課/上架). Order by date.

**Write final reader-facing zh-TW copy in every field** — the renderer escapes and prints text verbatim. Save the payload to a temp path (e.g. `dashboard.json`).

## Step 5 — Render the HTML

```bash
python3 <skill-dir>/scripts/render_dashboard_email.py <tmp>/dashboard.json --out <tmp>/email.html
```

The script owns all styling (colored health badge, progress bar, sectioned cards, zh-TW-friendly font stack). If it errors, your JSON doesn't match the schema — fix the JSON, not the script. Read the resulting HTML back so you can pass it to the draft tool.

## Step 6 — Create the draft (do NOT send)

Subject line format: `【專案週報】<project short name> — <M/D> 更新（<health emoji><health short>）`
e.g. `【專案週報】Claude Code 課程 — 6/1 更新（🔴 進度落後）`

Create the draft with the HTML body via the **google-workspace** server (the authenticated one). Its `to` field takes a single comma-separated string, and the HTML goes in `body` with `body_format="html"`:

```
mcp__google-workspace__draft_gmail_message(
  user_google_email="your-google@example.com",
  to="you@example.com, teammate-a@example.com, teammate-b@example.com",
  subject="<subject>",
  body="<contents of email.html>",
  body_format="html"
)
```

Pass the **full HTML** (the entire contents of `email.html`) as `body`. This signature is verified working (`to` as a comma-separated string, `body_format="html"`, returns a `Draft ID`). Confirm the tool returns a `Draft ID` before reporting success — if it errors on the `to` shape, retry with a list.

(Only if `google-workspace` is somehow unavailable but the `gmail` server is authenticated, fall back to `mcp__gmail__draft_email` with `to=["you@example.com","teammate-a@example.com","teammate-b@example.com"]`, `htmlBody=<html>`, `mimeType="multipart/alternative"`.)

## Step 7 — Report back

Report back, in chat:
- the health verdict and the one-line reason,
- the computed % and active stage,
- the blockers and this-week list,
- that a **draft** (not sent) is waiting in the inbox for the recipients, with the subject line.

Then stop. The user reviews and sends.

---

## Unattended / scheduled runs

This skill is built to run **weekly on a schedule** (a cron/launchd routine invokes it — typically Monday morning). In that mode:

- **Ask nothing.** Run Steps 1→6 straight through and stop at the draft. There is no human in the loop at run time, so never pause for a clarifying question — apply the defaults in this skill (today = run date, draft-only, source-faithful %).
- **Still draft-only — never send.** The whole point of the weekly draft is that a human skims and sends. An unattended run must not send mail. (If you later want auto-send, that's a separate, explicit change — see Guardrails.)
- **Fail loud, don't fake it.** The run depends on two things being present in the runtime: the `google-workspace` MCP authenticated for your Google account, and read access to the spreadsheet. If the sheet read returns an auth error or no rows, **stop and report the failure plainly** (e.g. "週報自動化失敗：無法讀取專案管理總表（google-workspace 未授權？）") rather than drafting an empty or stale dashboard. A missing-data email is worse than a visible failure.
- **Idempotency.** Step 3 already searches Drafts for an existing `【專案週報】`. If a draft for the same week already exists, update/replace it or skip rather than piling up duplicates.

The scheduler only fixes *when* this runs; it does not change *what* it does. Everything else in this skill applies identically to a manual and a scheduled invocation.

---

## Guardrails

- **Never send.** Draft only. If asked to send, create the draft and ask for explicit confirmation first.
- **Don't write to the sheet.** The dashboard tab is read-only context here.
- **Don't invent status.** If a field is genuinely unknown (e.g. a decision's reason), write `（待補充）` rather than guessing — that mirrors how the dashboard already flags gaps.
- **Source-faithful, not flattering.** A stage is `done` only when every task is `Done`; trailing open tasks keep it `now (收尾中)`. The honest per-stage fractional % (Step 4) is the agreed method — don't round half-finished stages up. Overstating progress to stakeholders is the worst failure mode here; under-claiming is recoverable.
