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
