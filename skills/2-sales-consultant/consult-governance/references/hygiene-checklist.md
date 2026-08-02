# Hygiene checklist — the six portfolio invariants

This file is the contract for `/consult-governance` step 4. Each invariant
defines: **what it checks**, **how** (tool + field), **what a violation looks
like**, and the **proposed-fix line format** the report must use. The skill is
READ-ONLY — every fix here is a *proposal* routed to the skill that owns it.

## Shared finding format

Every violation becomes exactly one finding line pair under its engagement:

```
- I<n> · 問題：<one concrete sentence, with the observed value — a date, a number, a name>
  建議動作：<the exact fix, named to the owning skill, or a one-line manual edit>
```

Rules: one finding per violation (no bundling); the 問題 line quotes evidence
(the stale date, the missing title, the duplicate number); the 建議動作 line
names the owning skill with a leading `/` when one exists.

---

## I1 — Deal ↔ folder backlink

**What it checks.** Two directions: (a) every open consult deal's `notes`
contain a `專案資料夾：<url>` line whose folder id resolves to a folder under
the consult Drive parent; (b) every `[N]` folder maps back to exactly one deal.

**How.** Deal side: `notes` from `mcp__zynkr__list_deals` / `get_deal`
(read-only SQL fallback: `SELECT id, name, stage, notes FROM crm_deals`), then
regex for `專案資料夾：https://drive.google.com/drive/folders/<id>`. Folder
side: the step-2 parent inventory (`mcp__google-workspace__list_drive_items`
on `1hkXPX7OXPFOU0BcloPbJSFp8O0zArM8t`). Match by folder id first, company
name second.

**Violations.**
- *Missing*: an open consult deal (company matches a `[N]` folder) with no
  `專案資料夾：` line in its notes.
- *Dangling*: a backlink whose folder id is not in the parent listing.
- *Orphan folder*: a `[N]` folder no deal claims.
- *Fork*: a `[N]` folder two or more deals claim.

**Fix lines.**
```
建議動作：deal notes 補上 專案資料夾：<folder url>（照 /consult-intake 的 backlink 格式；本技能不寫入）
建議動作：確認資料夾是否被改名或移出母資料夾，修正 deal notes 內的 URL
建議動作：跑 /consult-project-specialist 補建 deal，或確認此資料夾該歸檔
建議動作：人工裁決哪個 deal 是本案，從另一個 deal 的 notes 移除 backlink
```

## I2 — Kickoff-doc presence

**What it checks.** Each `[N]` folder contains its kickoff/context Doc — the
doc `/consult-intake` (inbound) or `/consult-project-specialist` (meeting
debrief) creates at engagement birth.

**How.** The step-2 per-folder listing
(`mcp__google-workspace__list_drive_items(folder_id=<[N] id>)`); look for a
Doc whose *title* marks it as the kickoff/context doc. Title-based only —
contents are never read.

**Violation.** A folder whose listing has downstream artifacts (`[BRD]`,
`[Notes]`, …) but no kickoff doc; or an entirely empty folder.

**Fix line.**
```
建議動作：跑 /consult-intake（inbound 案）或 /consult-project-specialist（會議案）補 kickoff Doc
```

## I3 — Session-note recency (default window: 21 days)

**What it checks.** Every engagement *past discovery* has a `[Notes]` doc
modified within the window. "Past discovery" = deal stage at or past proposal
(map slugs via `mcp__zynkr__list_deal_stages`).

**How.** Stage from the step-3 CRM inventory; `[Notes]` doc titles +
`modifiedTime` from the step-2 per-folder listing. Take the newest `[Notes]`.

**Violation.** Newest `[Notes]` `modifiedTime` older than the cutoff, or no
`[Notes]` doc at all while the stage says sessions should be happening.

**Fix line.**
```
建議動作：跑 /consult-session-notes 補紀錄（最後一份停在 <date>）
```

## I4 — [N] numbering continuity

**What it checks.** Folder numbers run 1…max with no gaps and no duplicates,
and every folder name matches the `[N] Company（project）` convention
(full-width parentheses).

**How.** Parse every name in the parent listing against
`^\[(\d+)\] (.+?)（(.+)）$`. Non-matching names go to 本次未檢查 *and* raise
an I4 finding — their contents cannot be attributed to an engagement, so
I2/I3/I6 silently skip them (which is why the honesty list matters).

**Violations.** A gap (`[6]` absent while `[7]` exists) · a duplicate number ·
a non-conforming name (no `[N]`, half-width parens, missing（project）part).

**Fix lines.** (Drive renames keep the folder id, so a rename never breaks an
existing backlink.)
```
建議動作：確認 [<n>] 是被刪除還是漏建 — 編號由 /consult-intake 分配，缺號通常代表資料夾被移走
建議動作：依 /consult-intake 的命名慣例改名（本技能不改名）
```

## I5 — Activity pulse (default window: 14 days)

**What it checks.** Open consult deals with no CRM activity in the window are
flagged 停滯 — the portfolio-level "is anyone driving this?" signal.

**How.** Last-activity = the newest of the deal's own `updated_at` and any
linked activity rows. Prefer the zynkr MCP's deal fields; read-only SQL
fallback via `mcp__supabase__execute_sql(project_id="uomieoqlkazknjgmfdda")` —
probe the activities table's real name/columns with a `LIMIT 1` SELECT first.
If no activities table can be identified, fall back to `crm_deals.updated_at`
alone and say so in 本次未檢查.

**Violation.** Open deal whose last activity predates the cutoff.

**Fix line.**
```
建議動作：安排下一步（聯繫客戶或開 follow-up task）；若近況其實在 Drive 端（如 UAT 進行中），補一筆 CRM note 讓 pulse 反映實況
```

## I6 — Artifact chain

**What it checks.** Stage implies artifacts: at/past **proposal** ⇒ a `[BRD]`
doc exists · at **build** ⇒ a `[PRD]` · at **UAT** ⇒ a `[UAT]` doc. Later
stages inherit earlier requirements (a UAT-stage deal needs all three).

**How.** Stage from the step-3 CRM inventory (slugs mapped via
`mcp__zynkr__list_deal_stages`); doc titles from the step-2 per-folder
listing. Title-prefix match only (`[BRD]` / `[PRD]` / `[UAT]`) — an empty doc
with the right title passes; content quality is out of scope.

**Violation.** e.g. a build-stage deal whose folder has no `[PRD]`.

**Fix lines.**
```
建議動作：跑 /consult-brd-writer 產出 [BRD]（或 PRD 模式產出 [PRD]）
建議動作：跑 /consult-uat-writer 產出 [UAT]（需先有 [PRD]）
```

---

## What this checklist does not govern

- Report layout beyond the finding-line format (that lives in SKILL.md step 5).
- The window defaults (21 / 14) — Peter overrides them per run.
- Any write of any kind. If a fix looks one-keystroke trivial, it still routes
  to the owning skill or to Peter's hands.
