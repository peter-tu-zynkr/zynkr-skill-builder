# zynkr-skill-builder — Build Log

Append-only record of shipped work (SDD altitude: Record; newest at the bottom).
Created 2026-07-02 with SDD adoption — earlier history lives in the git log and
the ingest-workflow run history.

## 2026-07-02 — SDD adoption: CLAUDE.md + sheetId documented + jurisdiction rule + SKB-001

Third fleet repo bound to `6.0 tech/SDD.md`:

- **CLAUDE.md created** (first for this repo): pipeline overview, the two-contract
  split, common commands, CI gates, danger zones (sheetId identity · Supabase
  orphan-on-rename · generated-never-hand-edit · English-canonical), SDD binding
  (repo code **SKB**, tracker `to-do.md`, record this file).
- **`sheetId` finally documented in SKILL_SPEC.md §1** — it was validator-enforced
  (ingest precedence-0, N.NN regex, duplicate throw) but absent from the authoring
  contract, so new authors couldn't know to set it. New subsection covers format,
  allocation (next FREE per-category id, count agent files), the id-redirects rule,
  and the honest gotcha: duplicates pass the PR check and only throw post-merge in
  ingest (until SKB-001).
- **Jurisdiction rule added to both governance docs** — SKILL_SPEC.md owns the
  authoring contract, architecture.md owns pipeline mechanics, disagreements fix the
  wrong doc same-day (ends the two-surface drift).
- **`docs/specs/` created** with `SKB-001-catalog-integrity.md` (Draft): whole-tree
  duplicate sheetId/slug check wired into qa.yml + ingest fail-fast + IPO-truncation
  visibility in the job summary. `to-do.md` (tracker) created with its line.

**Verification**: sheetId behavior statements verified against source before writing
(`validate-skill.ts` — zero sheetId references; `ingest.ts` L68 optional-with-regex,
L619–630 precedence-0 + malformed/duplicate throws) · docs-only change, no pipeline
surface touched — `qa.yml`/`ingest-skills.yml` do not fire (no `skills/**` paths).

## 2026-07-02 — slide relay: token manifest named as the color-value source

Peter designated the `/zynkr-slide` relay the fleet's applied-rendering exemplar
(recorded in SDD §4 + the Brand Guide status block). Closed the one value-drift
seam: both brand-source configs (`zynkr-slide` + `slide-visual-selector`) now say
color VALUES come from `zynkr.ai/data/tokens.json` (`TOKENS_VERSION`-stamped)
while `Zynkr-Brand-Guide.md` supplies roles/usage rules — so rendered decks stay
in lockstep with canonical tokens even when the guide lags styles.css by design.
Local zh-TW runtime copies in `~/.claude/skills/` updated in the same session
(edit-BOTH rule).

**Verification**: S-sized docs change · references/*.md only (no SKILL.md → PR-QA
n/a) · ingest backstop expected green on push (re-emits content/, no slug/sheetId
changes).

## 2026-07-03 — new skill: sales-follow-up (post-demo conversion follow-up)

`sales-follow-up` (sheetId `2.10`, category `2-sales-consultant`) — the post-demo
counterpart to `sales-outbound`. From one completed demo transcript it (1) drafts a
threaded pre-sales follow-up as a Gmail DRAFT in Peter's voice — leading with the
prospect's own pain points, mapping each to the matching `zynkr.ai/ai-platform`
capability, converting toward adoption; and (2) light-syncs the EXISTING CRM deal —
logs the demo as a `note`, refreshes the deal summary, nudges the stage only if
earned, closes the stale scheduling task, and books the agreed follow-up task.
Bundles `references/demo-note.sql` (the single raw-SQL write, since the Zynkr MCP has
no create-note tool; author/contact/company resolved live from the deal). Captured
from a real run (超哥 / 行銷超哥 Chao.Marketing demo). Installed to the
`~/.claude/skills/` runtime in the same session (edit-BOTH rule) so `/sales-follow-up`
is invocable immediately.

Deliberately does NOT log the follow-up email as an activity — the Gmail→CRM sync
captures it on send; logging here would duplicate the row (same rule as
`sales-outbound`).

**Verification**: M-sized skill-content add · `validate-skill.ts --tier=all` → 0
errors, 0 warnings (IPO frontmatter tightened under truncation caps) · `ingest.ts`
dry-run exit 0, sheetId `2.10` confirmed free (no duplicate throw) · `qa.yml` fires on
the new `skills/**/SKILL.md` in the PR (D0/D1 mechanical) · local install verified
(skill appears in the session's available-skills list) · live-trigger (D2 `/verify`)
deferred to Peter's first real use per build-and-review scope.

## 2026-07-06 — new skill: training-srt-transcriber (audio → SRT, the step before the optimizer)

`training-srt-transcriber` (sheetId `4.11`, category `4-training`) — the missing
UPSTREAM half of the subtitle pipeline. `training-srt-optimizer` starts from "a .srt
of raw STT output" but nothing produced that from audio; this skill does. Local
Whisper (`stable-ts` + `torch`, no API key, offline) with two modes: **transcribe**
(fresh STT, timestamps from the audio) and **retime** (keep an existing transcript's
exact wording, re-derive every timestamp by forced alignment — the fix for "the SRT
says the right things but the times are wrong"). Ships `scripts/transcribe_srt.py`
(`setup`/`transcribe`/`retime`/`validate`) which self-bootstraps a dedicated py3.12
venv on first run (override via `SRT_VENV`), plus `references/transcription_notes.md`
(model/device trade-offs + the numba/llvmlite dependency-pin rationale that keeps a
bare `stable-ts` install off the Python-3.14-incompatible numba 0.53). Built out of a
real task — re-timing a `Zynkr demo` product-demo `.m4a`. Hands off to
`$training-srt-optimizer` for the zh-TW text cleanup; it deliberately does NOT clean
wording itself. Installed to the `~/.claude/skills/` runtime in the same session
(edit-BOTH rule) so `/training-srt-transcriber` is invocable immediately.

**Verification** (D2): M-sized skill-content add · `validate-skill.ts` → 0 errors, 0
warnings · `ingest.ts` dry-run exit 0, `✓ 4.11 training-srt-transcriber` (sheetId free,
no duplicate throw) · engine live-triggered end-to-end on the real demo audio —
`transcribe` (28s clip → 6 cues, validated OK), `retime` (5-line reference → 5 cues,
exact wording, timing matches the full-length run, validated OK), `validate` (full
187-cue SRT → OK); full-length `retime` of the 10:57 demo produced a 187-cue SRT whose
timestamps were spot-checked at 6 points across the timeline against independent
re-transcription · `qa.yml` fires on the new `skills/**/SKILL.md` on push (D0/D1
mechanical).

## 2026-07-22 — new skill: operations-flow-optimization (§5.3.2 ideal-flow ordering)

`operations-flow-optimization` (sheetId `3.14`, category `3-operations`) — the lean
"ideal flow ordering" pass from Ch5 §5.3.2 that streamlines a process *before*
re-architecture: I→P→O validation · dependency mapping · friction elimination
(duplicative / loop / missing) · disciplined re-sequencing gated by a payoff test
(less rework / lower risk / higher throughput) plus the "what breaks if this step
moves?" test. Enforces the one law **"eliminate before you automate."** Fills the gap
where `operations-transformation` jumped SIPOC → four-quadrant → FE/BE/DB with no
streamlining stage — that logic previously existed only as a buried 5-bullet checklist
inside the `operations-process-redesign` agent (never surfaced, not reusable, missing
the friction taxonomy and the whole re-sequence discipline). Ships two references:
`sequencing-heuristics.md` (the full re-order playbook — heuristics, payoff gate,
"what breaks?" test, decision-log format) and `worked-example.md` (event-roster
reconciliation end-to-end, the companion case to training workshop 4.6 流程重構工作坊,
PII-safe placeholders). Non-destructive wiring: added to `operations-transformation`
synergy + an optional Stage 1.5 pointer between SIPOC and automation diagnosis, and
named the canonical owner of the flow-streamlining checklist in the redesign agent.
Intake: `zynkr-skill-idea#111` · built via draft PR #29.

**Verification** (D2): M-sized skill-content add · `validate-skill.ts --tier=all` →
0 errors, 0 warnings · sheetId `3.14` grep-confirmed unique tree-wide (the exact
condition `ingest.ts`'s duplicate-throw guards; SKB-001 cross-file gap checked by hand)
· method dogfooded on a fresh unseen process ("weekly social scheduling") — reproduced
all four deliverables (I→P→O table, dependency map, friction log dropping a no-value
copy step, re-sequence decision log with one payoff-justified move) · `qa.yml` PASS on
PR #29 · `ingest-skills.yml` fires on the new `skills/**` on merge to main (the real
ingest run is the definitive no-duplicate + live-on-marketplace proof).

## 2026-07-22 — fix: unbreak ingest pipeline (zynkr-support malformed frontmatter + PII)

`ingest-skills.yml` had been failing on every push to main since **2026-07-15** — the
`zynkr-support` (3.01) KB re-anchor commit left its `description` as an unquoted YAML
scalar containing `: ` and double-quoted trigger phrases, which crashed `gray-matter`
(`incomplete explicit mapping pair`) before ingest could emit `generated/` or POST the
marketplace sync webhook. Net effect: the marketplace **silently stopped updating for a
week** — nothing pushed after 2026-07-15 actually went live (including, at first, the
`operations-flow-optimization` merge above). Surfaced when that merge's ingest run
failed on the pre-existing bad file, not on the new skill (`✓ 3.14` ingested fine).

Fixed by wrapping the description in double quotes + converting the inner trigger
phrases to single quotes (house style). Once the file could finally be parsed,
`validate-skill.ts` surfaced a second pre-existing ERROR — a real gmail address in a
website-form example (`pii.personal_email`) that would have re-blocked the backstop's
validate step — replaced with an `example.com` placeholder.

**Verification**: whole-tree `gray-matter` scan → 170/170 frontmatter parse OK (was 1
failure) · `validate-skill.ts` on zynkr-support → 0 errors (3 pre-existing WARNs left
as non-blocking follow-ups: missing install snippet, `input`/`process` over the ingest
truncation length) · the `ingest-skills.yml` run on this merge is the proof the pipeline
completes again and republishes the whole 2026-07-15→now backlog to the marketplace.

## 2026-08-03 — SKB-002 Wave 0: consult skill batch opened + consult-discovery synergy fix

Opened spec `docs/specs/SKB-002-consult-skill-batch.md` (Active, L/D2): the consulting
product line — 5 net-new gap skills (consult-brd-writer 2.12 · consult-shadowing-scheduler
2.13 · consult-uat-writer 2.14 · consult-adoption-reporter 2.15 · consult-bug-ticket 2.16)
plus 8 consult-* lift-and-shift adaptations (2.38–2.45) of existing training-*/admin-*/
product-*/content skills, per the 2026-07-29 Consultant Flow × Skill Portfolio Assessment
and Lucid workflow v2. Originals untouched; hard sheetId partition (gap builds 2.12–2.16,
buffer 2.17–2.20, forks 2.38–2.45; retired band 2.21–2.37 skipped).

Also fixed `consult-discovery` (2.06) frontmatter: `synergy: ["2.11","2.12"]` — the
tree's only sheetId-style synergy, stale since the id-regime change (2.11 now means
sales-research; 2.12 was unassigned and is claimed by this batch) — replaced with real
slugs `["sales-research", "consult-project-specialist"]` per SKILL_SPEC §1.

**Verification** (Wave 0 = canary for the batch runbook): `validate-skill.ts --tier=all`
on consult-discovery → no synergy WARN · local `ingest.ts` dry-run exit 0 (artifacts
restored, not committed) · this push's `ingest-skills.yml` run green = the wiring proof
that the runbook holds before 13 new skills ride it.
