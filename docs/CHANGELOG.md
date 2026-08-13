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

## 2026-08-03 — SKB-002 Wave 1: consult-brd-writer (2.12) + consult-shadowing-scheduler (2.13)

The two P0 gap skills from the consultant-flow assessment, both `2-sales-consultant/`:

**consult-brd-writer (2.12)** — turns discovery summaries / shadowing transcripts +
the CRM deal into a client-grade requirements Doc in the client's numbered `[N]`
folder, backlinked to the deal. BRD mode (zh-TW business-facing, template
`references/brd-template.md`) and PRD mode (SDD-conformant spec: per-client spec ID
`<CLIENTSLUG>-NNN` discovered by scanning the folder's `[PRD]` titles, EARS-lite
AC-n + *Verify:* lines, D0–D3 rung; template `references/prd-spec-template.md`
carries the parse contract consult-uat-writer consumes). Outline approval gate
before any prose; hard STOP instead of creating a competing folder; ships its own
`deal-insert.sql` copy so the marketplace install is self-contained.

**consult-shadowing-scheduler (2.13)** — closes the highest-friction manual loop in
Phase 3: deal → `[N]` folder from the 專案資料夾 backlink → query_freebusy →
3–5 candidate slots (Asia/Taipei, 09:30–17:30, next 10 business days, 2h; long-meeting
adjacency avoided) → slot-confirm gate (external calendar attendee default NO) →
calendar hold + `Shadowing — YYYY-MM-DD` subfolder + client logistics Gmail DRAFT
(never sent) + idempotent CRM task + deal-notes backlink.

**Verification** (D2, SKB-002 AC-1): `validate-skill.ts --tier=all` → 0 errors each
(one expected WARN: brd-writer's synergy forward-references consult-uat-writer, which
lands in Wave 2 today) · local `ingest.ts` dry-run → `✓ 2.12` `✓ 2.13`, 99 ingested,
no duplicate ids (artifacts removed, not committed) · this push's `ingest-skills.yml`
run + `zynkr.ai/api/skills` serving both ids = the go-live proof · real
install-and-trigger evidence lands at batch close-out (Wave 5).

## 2026-08-03 — SKB-002 Wave 2: consult-uat-writer (2.14) + consult-adoption-reporter (2.15) + consult-bug-ticket (2.16)

The three P1 gap skills closing the post-launch loops, all `2-sales-consultant/`:

**consult-uat-writer (2.14)** — parses a consult-brd-writer PRD (spec-ID H1, Size/DoD
line, AC-n + *Verify:* pairs, Out-of-scope — the four shapes `prd-spec-template.md`
guarantees; any missing ⇒ STOP, fix upstream) into a client-runnable zh-TW UAT guide
Doc in the `[N]` folder: S-n ↔ AC-n traceable scenarios (D3 adds negative/permission
cases), builder-only Verify lines rewritten as UI-observable with a 顧問側驗證
appendix, 問題回報方式 section format-compatible with consult-bug-ticket by
construction, sign-off block, CRM task. Scenario-table gate before any Doc.

**consult-adoption-reporter (2.15)** — read-only analyst over `crm_ai_usage`
(schema verified 2026-08-03: workspace_id/user_id/feature/model/request_count/token
counts): WAU, actions/user/week, WoW trend, top features, 14-day at-risk flags →
`[Adoption] {{COMPANY}} — YYYY-MM` Doc + zynkr-MCP deal backlink. Hard rules:
SELECT-only (no SQL write of any kind — the backlink goes through mcp__zynkr__update_deal
or falls back to a paste line for Peter), never-fabricate (無法衡量 + 資料覆蓋範圍
caveats — incl. the zero-coverage case for skill-delivered assistants), introspect
schema every run. Client mapping via local out-of-repo `adoption-config.md` with a
graceful degradation ladder.

**consult-bug-ticket (2.16)** — client bug mail → `gh issue create` in the right repo
(local out-of-repo `bug-routing-config.md`: client map first, surface fallbacks
second, no match ⇒ ask at the gate, never guess) + CRM task + threaded acknowledgment
Gmail DRAFT. One absolute gate before any external write; structural PII split
(public issue = company + defect only; person + thread live in the CRM task); client
sees the issue number only; 未確認 markers for reconstructed repro steps; severity
rubric S1–S4.

**Verification** (D2, SKB-002 AC-2): `validate-skill.ts --tier=all` → 0 errors /
0 warnings on all three · local `ingest.ts` dry-run → `✓ 2.14` `✓ 2.15` `✓ 2.16`,
102 ingested, no duplicates (artifacts removed, not committed) · uat-writer's parse
contract cross-checked against the shipped `prd-spec-template.md` (zero drift) ·
this push's `ingest-skills.yml` run = go-live proof · install-and-trigger evidence
at Wave 5 close-out. Note: adoption-reporter's synergy gains "consult-status-report"
in Wave 4 when that skill exists.

## 2026-08-03 — SKB-002 Wave 3: consult lift-and-shift forks A (2.38–2.41)

Four consult-* adaptations of existing skills, all `2-sales-consultant/`, originals
untouched (fork provenance tracked per-skill via `## Provenance` @ b6bfb04c + the
SKB-002 fork registry):

**consult-transcriber (2.38)** — delegation wrapper chaining `training-srt-transcriber`
(4.11) + `training-srt-optimizer` (4.10): engagement/phase resolution → delegated
Whisper transcription + zh-TW cleanup (the optimizer's training-folder upload
explicitly skipped) → `[N] {{COMPANY}}_{{PHASE}}_逐字稿_{{DATE}}.srt` filed into the
engagement folder (shadowing recordings into the `Shadowing — YYYY-MM-DD` subfolder,
the consult-shadowing-scheduler seam) → CRM note → hand off to consult-session-notes.
Zero mechanics copied; hard-stop with install pointers when the base skills are absent.

**consult-session-notes (2.39)** — full fork of `project-note-specialist` (3.08, ≡
admin-meeting-note 3.04): the four-section session summary (Summary Update · Progress ·
Blockers · What's Next, format preserved verbatim incl. the no-fabrication rule) plus
the consult-specific 痛點 ledger (痛點 · 現況流程 · 影響 · 頻率 · 來源 — the
consult-brd-writer feed), filed as a `[Notes]` Doc in the existing `[N]` folder with a
CRM note. Never creates deals or folders.

**consult-solution-planning (2.40)** — Case C derivative of `product-planning` (5.02):
operationalizes MrPM-Stanley's 產品企劃力 framework as a real 8-step pipeline (persona
→ operator journey → pains ranked 影響範圍×強度×頻率 with concrete 1–5 rubrics and
score bands in `references/planning-framework.md` → opportunity selection → MVP scope +
success metrics, one confirmed section at a time) → `[Plan]` Doc + CRM note + a BRD
handoff block. Full attribution trio + `## Attribution` section (validator-checked).

**consult-flow-design (2.41)** — delegation wrapper over `product-flow-design` (5.03):
paired as-is / to-be chart discipline (never a to-be without the as-is beside it),
narratives assembled from the engagement's [Notes]/[Plan]/[BRD] docs and confirmed
before drawing, all Lucid mechanics + V1–V13 lint delegated, both chart URLs recorded
on the deal.

**Verification** (D2, SKB-002 AC-3): `validate-skill.ts --tier=all` → 0 errors /
0 warnings on all four · local `ingest.ts` dry-run → `✓ 2.38–2.41`, 106 ingested, no
duplicates (artifacts cleaned, not committed) · originals byte-identical (diff scope =
new folders + docs only) · this push's `ingest-skills.yml` run = go-live proof.

## 2026-08-03 — SKB-002 close-out: consult product line SHIPPED (13 skills, 2.12–2.16 + 2.38–2.45)

Batch complete in five direct-to-main waves (60ea7ba8 · 0d23f5b8 · b6bfb04c · e35a1f57 ·
f1629ecc), every wave's `ingest-skills.yml` run green — zero pipeline failures across
the batch despite claiming 13 new sheetIds under the still-open SKB-001 gap (the
mandated local ingest dry-runs did their job).

**Verification (D2 evidence):**
- AC-4 sweep 2026-08-03: all 13 `zynkr.ai/s/<id>.md` → HTTP 200; all 13 rows present
  in the Supabase `skills` mirror (synced same-day).
- Installs: the 7 personally-used skills (brd-writer, shadowing-scheduler, uat-writer,
  bug-ticket, transcriber, session-notes, status-report) installed to `~/.claude/skills`
  via `npx skills add`; trigger contracts confirmed registered in a live session.
- launchd check (observe-only): `com.zynkr.project-status-weekly.plist` is `.disabled`;
  the active `com.zynkr.weekly-insights` job runs an unrelated pipeline — no
  trigger-collision risk for consult-status-report today; its BOUNDARY guard covers
  the case where the job is re-enabled.
- Dated waiver (2026-08-03): full live-trigger runs (a real BRD from a real
  engagement transcript, a real shadowing booking, a real bug→issue) await the next
  live engagement artifacts — to be recorded here as they happen. The scheduler's
  first real booking and bug-ticket's first real `gh issue create` double as their
  wiring proofs.

**P2 follow-ups (roadmapped, not built):** consult comms template Docs pack ·
consult-intake trigger-on-arrival mode · consult-intake no-go close-out mode ·
originals synergy backlinks (S) · SKB-001 itself — this batch's five manual dry-runs
are the standing argument for finally shipping it.

## 2026-08-13 — SKB-004: content-writer knowledge moves to Drive (Docs become the source of truth)

The writing knowledge behind `/zynkr-content-writer` was frozen prose inside the agent
prompts, and it had silently drifted from the Docs Peter actually maintains. Three
copies existed (agent-embedded · `references/*.md` · Google Doc) with nothing keeping
them in sync, and the two "live" lookups were both dead.

**What changed:**

- **Four Docs are now the runtime source of truth**, read via `get_doc_as_markdown`
  with the embedded copy as offline fallback (same Drive-first pattern the `seo-*`
  skills already use):
  | Knowledge | Doc ID | Read by |
  |---|---|---|
  | 文章架構模板 | `1-pU_bDxPdf56G5cVP7Lh9E5r6SzeX3dFtwFC6xGFdLc` | `content-style-select` |
  | 內文風格指南 | `1ect0fDoHZQ7srFEQvLNCSLsQk-UTawvbxpt3SteYP1M` | `content-draft` |
  | 編輯校稿指南 | `1dqXCtMjpxcK6aBgKMOusTXNxBPSHxeBmDCq2CcOs5TU` | `content-editor` |
  | 禁用詞清單 (**new**) | `1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg` | `content-editor`, `editor` |
- **Editor guide moved v2 → v3.** The live agent was enforcing the September rules
  ("15–20 字/句", "40–60 字/段"); the Doc's current v3 (Oct 2025) **reverses** them
  (3–6 sentences per paragraph, long sentences allowed). Every article was being cut
  to the wrong rhythm. Agents + mirror now carry v3, with an explicit note that the
  v2 rules are retired.
- **Forbidden-word check un-broke.** Both paths were dead: `wordcheckbe.zeabur.app/api/rules`
  returns nothing (HTTP 000), and `content-editor` read `forbidden-words.md` at
  「專案根目錄」 — a path that never resolves from a normal cwd, with instructions to
  skip silently. Now sourced from the new Doc, with the 17-term list embedded as fallback.
- **10th structure reconciled.** `產品介紹型 (Product Walkthrough)` existed only in the
  agent; added to the Doc and the mirror so all three agree at 10.
- **Docs relocated out of the archive.** The three guides were swept into
  `[Archive] 助理開發 pipeline` by the 2026-08-10 [5.x] audit. Moved to a new
  `[@] 寫作指南` folder (`12DBdFz3SK22ie9im_ThFMI7IBRXsTZsV`) under
  `[1.1] 內容行銷 / [@] 內容行銷知識庫`, alongside their sibling guides.

**Verification (D2 evidence):**
- `validate-skill.ts --tier=all` on the changed SKILL.md: **1/1 pass, 0 errors** when
  frontmatter was completed; reverted to the `origin/main` baseline (see below), so the
  shipped file is byte-identical in frontmatter to what was already passing the backstop.
- `ingest.ts` on a clean tree with these changes: **exit 0**, no duplicate-name error.
  (Interim finding: adding `category/project/platform/status/author` to the bundled
  `.claude/skills/write-article/SKILL.md` makes ingest register it as a *second* skill
  named `zynkr-content-writer` with a freshly-assigned sheetId → `Duplicate skill name`.
  **Do not add those fields to a `.claude/`-layout bundle SKILL.md.** Reverted.)
- Drive read-back on 《文章架構模板》 confirms all **10** types incl. 產品介紹型, and
  confirms `get_doc_as_markdown` takes **no tab parameter** — it returns every tab as a
  top-level `#` heading, so the agents are instructed to use only the `# 最終產出` section.
- `[@] 寫作指南` folder listing confirms all 4 Docs present.
- Both surfaces updated per the runtime-divergence rule: builder (English-canonical) and
  `~/.claude` (zh-TW install) — 6 matching sections each, same order.

**Open / follow-ups:** the bundled SKILL.md still carries 5 pre-existing ERROR-tier
frontmatter findings (`category/project/platform/status/author`) that cannot be fixed the
obvious way without tripping the duplicate above — needs a proper fix in ingest or the
`.claude/`-layout contract (candidate SKB-005). First real `/zynkr-content-writer` run
against the Docs is the live wiring proof, to be recorded here when it happens.
