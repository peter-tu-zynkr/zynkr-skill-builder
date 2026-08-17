# SKB-006 — zynkr-gm: GM operating-rhythm skill (weekly brief, emailed by a cloud routine)

- **Status:** Shipped 2026-08-17 (P0). AC-3 delivered via the local path this week;
  cloud send pending Peter's Gmail-connector re-authorization (see Record).
- **Size / DoD:** M / D2 for v1 (read-only skill + one claude.ai routine that
  emails; no schema, no secret in repo, no money; claims one sheetId in an
  EMPTY category, so the SKB-002 manual dry-run rule applies). Becomes L when
  P3 `learn --apply` starts writing canonical Drive docs — separate spec.
- **Created:** 2026-08-17 · **Repo(s):** zynkr-skill-builder (skill) ·
  claude.ai routines (Tier A) · `~/.config/zynkr/gm.json` (private config,
  outside git)
- **Links:** scope proposal artifact `72e63d14-b748-45fa-86ce-5e765d611b43`
  (v1.1, decisions D1–D13 resolved 2026-08-17) · SKB-001 (still-open
  cross-file gap — manual ingest dry-run mandatory) · GM Knowledge Directory
  (SOR precedence table; id via runtime config, not committed here) · sibling
  proposal "YE Planning Kit" (`planning-*`, 0-strategy) — renumbers to 0.03+
  behind this skill.

## Context

Peter runs Zynkr as GM at ~20h/wk (Integrated Refresh constraint C2). Every
Monday the same read pass happens by hand: Main Tracker 「H2 專案項目」 (status
SOR), the [3.1] weekly ops log (what happened), the OKR & KPI Tracker
(Actual column 100% empty), the Ops Gap Heal sheet, the course tracker, plus
the strategy docs' Refresh blocks. The 2026-08-17 manual pass ("Unblock Week"
brief) took ~40 tool calls across 6 sources and produced a plan the trackers
themselves could not surface: runway un-metered (constraint C1, zero 8.0
rows), a §D decision due the same day as the P0 it gates, 14 of 55 items P0.

`zynkr-gm` packages that pass as the first skill in `0-strategy`. It **reads
broadly and writes narrowly**: v1 reads the SOR chain and emails a fixed-shape
weekly brief; it never edits the tracker, the onboarding 母本, or another
owner's doc. It is the instrument for constraint C4 (no instrumentation) and
People P0 6.01 (公司 KPI 制度), and the manual brief is its D2 baseline.

Deliberately **routine-first**: verified 2026-08-17 that the claude.ai
Google-Drive connector reads the tracker/KPI/ops sheets as clean tables and
the Gmail connector now exposes `send_message` (its absence retired the June
"Weekly project status" cloud routine). Writes (KPI cells, state tabs) stay
local (workspace-mcp) — P1. Inngest (`zynkr-automation`) is the later home;
Phase 0 is blocked on accounts and nothing here waits on it.

Public repo ⇒ **public method / private config**: SKILL.md carries the method
with `<placeholders>`; real doc IDs live in `~/.config/zynkr/gm.json` (local)
and inside the routine prompt (cloud), which `scripts/render_routine_prompt.py`
renders from `references/routine-prompt.tmpl` + the config so the two copies
cannot drift (the project-status-update failure mode).

## sheetId allocation

| id | skill | note |
|---|---|---|
| 0.02 | zynkr-gm | authored frontmatter claim (Precedence 0 in ingest) |

**Why 0.02, not 0.01**: `generated/*` and `id-redirects.json` hold no `0.x`
ids at all (category empty), but `catalog/sheet-map.json` carries a legacy
`0.01` row (skill-finder, since resolved to 5.01). Collisions drop a skill from
the registry silently (2026-06-19 incident), so 0.01 is skipped rather than
proven. First clean id = 0.02. The parallel `planning-*` proposal starts at
0.03.

## Requirements & acceptance criteria

- **AC-1** — `skills/0-strategy/zynkr-gm/` exists: SKILL.md (English-canonical,
  frontmatter `sheetId: "0.02"`, `status: WIP`, `category: strategy`, bilingual
  triggers + BOUNDARY clause), `references/` (source-map · derived-state-rules
  · kpi-map · lob-skills-seed · brief-template · routine-prompt.tmpl ·
  config.example.json), `scripts/` (extract_newest_block · derive_state ·
  tracker_diff · kpi_locate · render_routine_prompt, stdlib, `--selftest`).
  **No internal identifiers** in the skill folder.
  *Verify:* `validate-skill.ts` green (single + `--tier=all` tree); every
  `--selftest` exits 0; `grep -RE '1[A-Za-z0-9_-]{25,}|@zynkr\.ai|trig_|env_0'`
  over the folder returns nothing.
- **AC-2** — Local ingest dry-run assigns exactly `0.02`, prints no
  redirect-prune line, changes no other skill's id.
  *Verify:* `npx tsx scripts/ingest.ts "$(pwd)/skills"` → `content/skills/0.02.md`
  with `name: zynkr-gm`; `git status` shows no other content/skills changes;
  artifacts restored before commit.
- **AC-3** — Monday cloud routine exists (Drive + Gmail connectors, cron
  `0 1 * * 1` = Mon 09:00 Asia/Taipei, prompt rendered from the template) and
  **one manual `run` lands the week-of-08-17 brief in peter's inbox** (or, if
  the connector refuses to send, a draft — and the run report says so
  explicitly). Brief follows `references/brief-template.md` (runway line first;
  ≤3 Peter-only unblocks; two clocks; P0/P1 status by LOB; per-owner rollup;
  KPI off-target + asks; decisions; deliberately-not; machine health).
  *Verify:* `RemoteTrigger get_run_log` shows send (or draft) succeeded; Gmail
  search finds the message; trigger id recorded below and in gm.json.
- **AC-4** — After push to main: ingest workflow green; `zynkr.ai/s/0.02.md`
  serves the skill (allow CDN lag); local install via
  `npx skills add … --skill zynkr-gm` resolves.
  *Verify:* CI run id + curl 200 recorded below.
- **AC-5** — Governance: `/zynkr-skills` reconciled the new skill (registry
  presence, proposal/record issue if the router requires one, marketplace
  visibility) and its findings are recorded below.
- **AC-6 (D2 quality)** — The routine's brief for the week of 08-17 covers the
  same top items as the manual "Unblock Week" brief (§D decision · 08-15 直播
  list · 09-01 送審 dates · empty KPI Actuals · runway un-metered · Jane
  capacity) without inventing numbers. Differences noted below.

## Out of scope (v1)

`kpi` writes (P1) · `month` + quarter/half escalation (P2) · `learn` /
`--apply` (P3) · launchd for the write side · Inngest migration · any write to
[3.1], the Main Tracker, or the onboarding 母本 (never).

## Record

- Proposal: scope artifact (above); no zynkr-skill-idea issue (hand-authored,
  same as 4.09 precedent) — `/zynkr-skills` decides whether to backfill one.
- AC-1: `validate-skill.ts` 0 errors (single + tree); 5/5 `--selftest` green; leak
  lint 0 hits (independently re-verified by the asset workflow's verify agent).
- AC-2: ingest dry-run → `content/skills/0.02.md` (`name: zynkr-gm`), no
  redirect-prune line, only `generated/*.json` regenerated (restored before commit).
- AC-3: routine `<trigger-id · in ~/.config/zynkr/gm.json>` (name "Weekly GM brief (zynkr-gm
  week)", cron `0 1 * * 1`, env `<environment-id · in ~/.config/zynkr/gm.json>`, Drive + Gmail
  connectors, model claude-opus-5) created and run once → session
  `<first-run session id · in ~/.config/zynkr/gm.json>` (18 turns, 285 s): all 5 SOR sources read via
  the Drive connector; weekly log (300k chars, dumped to file) sliced to the newest
  two blocks unaided; **Gmail connector: `requires re-authorization (token
  expired)`** on search/list/send/draft → the run reported 未寄出 (neither sent nor
  draft), pushed the substance as a mobile notification, and named the re-auth as
  Peter's action. Correct fail-loud behaviour. Delivery for W34 done through the
  local `week send` path (workspace-mcp): Gmail message `<gmail message id · in ~/.config/zynkr/gm.json>`,
  subject `【GM 週報】2026-08-17（W34）— 先拆掉 §D，再給 P0 日期` — which also seeds the
  routine's idempotency check (a re-run this week will skip W34).
  **Open**: Peter re-authorizes the Gmail connector in claude.ai; next scheduled
  fire 2026-08-24 01:01 UTC then sends unattended.
- AC-6: the routine's independent derivation matched both the local run and the
  manual "Unblock Week" brief — 9/14 P0 UNDATED · 4.01 ENDS_SOON (08-28) · 1.03
  OVERDUE (47 d) · GM 6/14 P0 (42.9%) · block 01 = §D decision · runway metering ·
  undated P0s. Local brief additionally surfaced course-tracker milestone dates the
  manual brief had called "undated" (7.1 overdue, 7.2 overdue-not-started, 4.4/4.5/7.3
  dated) — an improvement over the baseline, not a regression.
- Ship commit: `6c6071e7` (feat(strategy): zynkr-gm 0.02 …), pushed to main 2026-08-17.
- CI: ingest-skills.yml run 32021169276 — success; `zynkr.ai/s/0.02.md` → 200 with `name: zynkr-gm`; `/api/skills` lists `0.02 · zynkr-gm · WIP` (112 rows).
- Local install: `npx skills add … --skill zynkr-gm` → `~/.claude/skills/zynkr-gm` symlink → `~/.agents/skills/zynkr-gm`, SKILL.md md5-identical to main.
- AC-5 (`/zynkr-skills` governance): four-signal lookup — no Project card, no proposal (hand-authored), on-disk ✓, live ✓. Backfilled record issue zynkr-skill-idea **#118** (labels skill-proposal · category:0-strategy · shipped; closed completed). Open 0-strategy proposals #99 strategy-planner and #115 strategy-planning-assistant judged orthogonal (facilitation method vs operating rhythm) — left open, cross-ref comments posted with the 0.02 / 0.03+ sheetId reservations.
