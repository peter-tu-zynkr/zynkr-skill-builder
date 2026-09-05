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

---

## 2026-08-16 — 修好 15 支以 raw SQL 寫 CRM 的技能：6 支完全跑不起來、12 支靜默掉資料（Spec: PLAT-046）

盤點 `skills/2-sales-consultant/` 底下所有以 raw SQL 寫 `crm_*` 的技能——**15 支**，不是一開始以為的 4 支或 6 支。以 10 個 agent 扇出＋對抗式覆核跑完全樹審計。

**6 支從來沒有成功寫入過**（`consult-intake` · `consult-project-specialist` · `consult-brd-writer` · `consult-shadowing-scheduler` · `consult-uat-writer` · `sales-specialist`）：

- **`workspace_id` 從未蓋章**。`crm_companies`／`crm_contacts`／`crm_deals` 皆為 `NOT NULL DEFAULT auth.uid()`，而 Supabase MCP 連線沒有 JWT ⇒ `auth.uid()` 為 **NULL** ⇒ 每一筆 INSERT 都以 not-null violation 收場。設了 `owner_id` 不能代替。
- **`'open'::task_status` 這個值不存在**（實為 `todo|done|in_progress|hold|drop`），整條 atomic CTE 直接 abort。**根因不是技能亂寫**——平台自己的 `CLAUDE.md` 把 `task_status` 記成 `(open/done)`，技能是照抄家規。上游已修（`1124bfd`），本次把這些檔案裡的 enum 小抄一併更正，否則會再長回來。

**跨租戶**：每個 find-or-create 都用 `lower(name)`／`lower(email)` 掃**整張表**、沒有 workspace 條件。在公開 SaaS 資料庫上，這會把 lead 綁到**別的租戶**的公司或聯絡人。全部改為 workspace-scoped——順帶讓查詢改走 `crm_{companies,contacts}_workspace_id_idx` 索引掃描。

**靜默掉資料（12 支）**：`SET notes = notes || …` 沒有 `COALESCE`。當 `notes IS NULL` 時串接結果為 NULL，UPDATE 變成**回報成功但什麼都沒寫**的 no-op，技能以為自己記下了 專案資料夾／BRD／UAT 的 backlink。**322 筆交易中有 65 筆（20%）`notes IS NULL`**。已全數改為 `COALESCE(notes,'')`。

另外：補上 `legal_basis`（PDPA）——填表而來的用 `'consent'`、B2B 會議聯絡人用 `'legitimate_interest'`（與 agent 建立聯絡人的家規值一致）；`zynkr-crm.vercel.app` → `platform.zynkr.ai`（20 個檔案）；並改寫 `consult-brd-writer` 裡那段**假保證**——它宣稱「每一筆 SQL 寫入都帶明確 id」，引用的檔案卻正好漏了 `workspace_id`。

**Verification**：修好的完整 CTE 以 `EXPLAIN`（無 ANALYZE，不執行）對正式環境成功產生查詢計畫——四個 INSERT、所有 enum cast、scoped 查詢走索引 ✓ · `crm_users.id` === `auth.users.id`，故 `(SELECT id FROM own)` 確為正確的 workspace_id（該工作區已有 30 筆交易）✓ · `'consent'`／`'legitimate_interest'::legal_basis`、`'todo'::task_status` 皆可轉型 ✓ · `validate-skill.ts` 對每支改動技能 **0 errors** ✓ · 殘留掃描：0 個舊網域、0 個裸 `notes = notes ||`、0 個 `'open'` ✓ · runtime 副本（`~/.claude/skills/`）已同步，Peter 的線上 session 立即生效。

**範圍外**：`sales-outbound/references/lead-insert.sql` 維持原子不拆——它是六支裡**唯一原本就正確**的（有蓋 workspace_id、dedupe 有 scope、enum 正確）。

---

## 2026-08-17 — zynkr-gm 0.02: the GM operating-rhythm skill + Monday cloud routine that emails the weekly brief (Spec: SKB-006)

First skill in `0-strategy`. Packages Peter's Monday read pass — Main Tracker 「H2 專案項目」
(status SOR) → [3.1] ops weekly log (newest block) → OKR & KPI Tracker (metrics SOR) → Ops Gap
Heal sheet + course tracker → strategy/plan docs' authoritative sections on change — into one
fixed-shape brief: **runway line first**, ≤3 things only the GM can unblock, two clocks, P0/P1
by LOB with derived state (the tracker vocab has no 完成/延遲, so ENDS_SOON · OVERDUE · UNDATED ·
PROPOSE_DONE · DIRECTION_UNLABELLED are inferred and shown as such), per-owner rollup, KPI
off-target + asks, decisions register, deliberately-not, machine health. **Reads broadly,
writes narrowly**: v1 is read-only — never the tracker, the onboarding 母本, or another
owner's doc.

- **Public method / private config.** SKILL.md carries the method with placeholders; the doc
  IDs live in `~/.config/zynkr/gm.json` (local) and inside the routine prompt (cloud), which
  `scripts/render_routine_prompt.py` renders from `references/routine-prompt.tmpl` + config so
  the two cannot drift (the project-status-update failure mode). Leak lint = grep for Google
  ID / `@zynkr.ai` / `trig_` / `env_0` over the skill folder → nothing.
- **Routine-first automation.** Verified 2026-08-17 that the claude.ai Google-Drive connector
  reads the tracker/KPI/ops sheets as clean tables and the Gmail connector exposes
  `send_message` (its absence retired the June project-status routine). Monday 09:00 TPE
  (`0 1 * * 1`) routine sends the brief; draft fallback; idempotent per ISO week. Writes (KPI
  cells, state tabs) are P1 and stay local (workspace-mcp). Inngest = later home.
- `references/`: source-map (roles, precedence, read policy) · derived-state-rules · kpi-map
  (19 rows, AUTO/SEMI/HUMAN, cloud availability) · lob-skills-seed · brief-template ·
  routine-prompt.tmpl · config.example.json. `scripts/` (stdlib, `--selftest`):
  extract_newest_block · derive_state · tracker_diff · kpi_locate · render_routine_prompt.
- **sheetId 0.02**, not 0.01: `catalog/sheet-map.json` carries a legacy `0.01` row
  (skill-finder → 5.01); collisions drop silently, so skipped. Sibling `planning-*` proposal
  starts at 0.03.

**Verification**: `validate-skill.ts` 0 errors (single + tree) · all `--selftest` green ·
ingest dry-run assigned exactly 0.02, no redirect-prune line, no other id moved ·
routine `<trigger-id · in ~/.config/zynkr/gm.json>` created (Mon 09:00 TPE) and run once (session <first-run session id · in ~/.config/zynkr/gm.json>): all 5 SOR sources read via the Drive connector, weekly log sliced to newest 2 blocks unaided, derived states matched the local run (9/14 P0 UNDATED · 4.01 ENDS_SOON · 1.03 OVERDUE 47d · GM 6/14 P0); **Gmail connector token expired in the cloud environment** → no send/draft, fail-loud report + push notification (correct), re-auth is Peter's; W34 brief delivered by the local `week send` path instead (Gmail msg <gmail message id · in ~/.config/zynkr/gm.json>, subject 【GM 週報】2026-08-17（W34）— 先拆掉 §D，再給 P0 日期), which also seeds the routine's idempotency check · scope proposal artifact 72e63d14 (v1.1,
D1–D13 resolved).

**Open / follow-ups (P1–P3, separate specs)**: `kpi` writes + state tabs in the OKR & KPI
Tracker (needs `As of`/`Source` columns — Peter) · `month` + Q3/H2 checkpoint scoring ·
`learn` propose → `--apply` · workspace Calendar API still disabled (calendar anchors
interactive-only) · `planning-*` kit renumber to 0.03+ · Inngest migration when the
`zynkr-automation` worker exists.

## 2026-08-17 — SKB-007 Wave 1: `planning-*` family opens `0-strategy` — planning-prework-pack (0.03) · planning-session-synth (0.06) · planning-tracker-sync (0.09)

The three first-build ★ skills of the eight-skill planning family (spec
`docs/specs/SKB-007-planning-skill-family.md`, Active). Built from the 2026-07-26 H2
offsite trace: every step of that cycle had been a Claude one-off; these package the
parts that cost the most hours. All three share two byte-identical reference files —
`references/planning-knowledge-pack.md` (LOB taxonomy 1.0–8.0 + L2, 重要×緊急 → P0–P3,
status vocab, C1–C4 constraint frame, facilitation runbook incl. the 【Recap】 mail shape,
Main-Tracker tab schemas, the 17 MECE rulings from 07-27, the addendum / new-tab
versioning convention) and `references/planning-sources.md` (live Drive IDs of the H2
suite, tracker gids, 1:1 Docs, Fireflies/Meet patterns, venue conventions).

**planning-prework-pack (0.03)** — T-4w → T-1d: copies the session workbook template
(Read Me · Agenda 8 blocks · Pre-work by LOB · Laundry List + Eisenhower · Matrix) into
the hub folder and refills it for the new cycle from the tracker / OKR tracker / per-LOB
plan addenda / 1:1 Docs; writes the per-owner one-pager Doc (Top-3 delivered w/ proof or
（待補）· Top-3 goals · laundry list w/ U/I); hands the 16-slide designed deck to
`/zynkr-slide` template-fill (text-block fallback); logistics checklist + invite text.
One confirmation covers workbook + Doc + deck; the calendar event keeps its own yes.

**planning-session-synth (0.06)** — same-day digestion: whiteboard photos → verbatim
「② 白板原文」 (with 判讀信心) → 「③ 去重與歸類決策」 (合併/拆分/移欄/不合併/排除 with 判準,
the July rulings as precedent) → 「④ MECE 檢查」 (coverage per L1, flags empty LOBs) →
normalized item list for the tracker builder; transcript → 「<cycle> 回顧總結」 rows +
5 重點結論; README tab; the recap mail as a Gmail DRAFT (never sent). Cycle-aware:
the §A tracker is the default target only when its cycle label matches — a YE run
never writes into the H2 SOR file.

**planning-tracker-sync (0.09)** — the team-side / record-side companion of
`zynkr-gm` (0.02, SKB-006): reuses zynkr-gm's derived-state rules (invokes its
`scripts/derive_state.py` / `tracker_diff.py` when installed; provenance-stamped copy
as fallback), drafts the Team Weekly agenda block + per-owner nudges (chat / Gmail
draft), and in `snapshot` mode writes the ONLY thing zynkr-gm needs but never writes:
`tracker-latest` (repurposes the stale `Initiatives Q3-Q4` tab after confirmation) +
`tracker-snapshots` in the OKR & KPI Tracker, RAW, 13 tracker columns + snapshot_date +
iso_week — zero writes to the Main Tracker. `--retro` pre-fills the cycle-end
looking-back draft. Boundaries: GM-brief triggers → zynkr-gm; bare 週報 / weekly report /
Monday cron → project-status-update. Ships no cron; the `/schedule` prompt runs the
read-only block only.

**Mid-build collision handled:** the family was drafted at 0.02–0.09; `zynkr-gm`
shipped 0.02 to main during the build (parallel session). Renumbered to 0.03–0.10,
rebased onto `6c6071e7`, ID split + snapshot home agreed by cross-session message
(SDD §2.2 unmerged-branch rule).

**Verification (D2, SKB-007 AC-1/3/4/5):** `validate-skill.ts --tier=all` → **0 ERROR / 0 WARN** on all three (and on all eight —
tree-wide run 85/86 pass, the single ERROR is the pre-existing `content-governance`
`paths.absolute_home`, untouched by this batch) · tree-wide duplicate-sheetId scan → none
(0.02 zynkr-gm · 0.03–0.10 this family) · local `ingest.ts` dry-run → `✓ 0.03` `✓ 0.06`
`✓ 0.09` (+ the Wave-2 five), 120 ingested, **no** redirect-prune line; artifacts restored,
not committed · AC-4 md5: one hash per shared file across all eight folders · build =
26-agent authoring/review/fix workflow + a second fix pass + eight adversarial re-reviews,
all PASS (last blocking finds fixed by hand: 1on1 `share_file` → `manage_drive_access`
grant w/o notification; tracker-sync one-go-per-snapshot + A1:Z clear; tracker-builder
pivot off-by-one + grid pre-flight) · `/code-review medium` on the branch diff (see the
Wave-2 entry for its findings) · this push's `ingest-skills.yml` run = go-live proof;
`curl zynkr.ai/api/skills` + `/s/0.03.md` `/s/0.06.md` `/s/0.09.md` recorded at close-out ·
D2 install-and-trigger for the ★ three: evidence at SKB-007 close-out (session-synth on the
July transcript + photos into a COPY of the tracker; tracker-sync read-only run on the live
tracker; prework-pack dry-run against the July workbook).

## 2026-08-17 — SKB-007 Wave 2: planning-1on1-annual-digest (0.04) · planning-evidence-pack (0.05) · planning-tracker-builder (0.07) · planning-suite-reconciler (0.08) · planning-lob-gap-audit (0.10)

The remaining five of the planning family, same shared references as Wave 1.

**planning-1on1-annual-digest (0.04)** — one person's shared 1:1 Doc (WB entries,
label variants incl. 「需完成的事情」「已完成的部分」…, the manager's 「Peter」 sub-block
excluded) + their LOB plan → 「年度計畫＿<name>」 Doc in the exemplar's six-section
skeleton (成果總覽 · 策略透鏡 C1–C4 · 復盤 放大／收割／停止 · 年度計劃 · OKR · 接下來) via
`import_to_google_doc`; every claim quotes a WB date; morale ratings never reach the
team-visible slide; 12-line slide block for the session.

**planning-evidence-pack (0.05)** — the "looking back in numbers" `Scoreboard` tab
(KPI · source · <cycle>-start · <cycle>-end · Δ · note) from tracker 完成 counts, OKR
tracker, calendar title-pattern counts (word-bounded), Fireflies recap counts,
`tracker-snapshots`, and pasted numbers; anything unreadable → 「（待補）」+ the source
needed, never estimated; cites zynkr-gm's `kpi-map.md` when installed; read-only.

**planning-tracker-builder (0.07)** — normalized items + owner/priority decisions →
Main Tracker from the template (copy → clear body → fill) or extend an existing one.
Numbering rule matched to the actual template: the L1 number lives in the 主類別 text,
the `#` prefix is positional (sequential-by-presence); extend continues serials under
the block, new L1 blocks get last-prefix+1. Priority values or formula; `專案項目小記`
pivot with COUNTIF/COUNTIFS (all formulas USER_ENTERED, data RAW); conditional colours;
lint report (P0 cap >6 / >25%, owner >3 P0, 掛 All, missing dates, L2 not in pack)
+ the C1 cash-pre-mortem section printed before writing; fill mode refuses to touch a
live 小記 grid; never renumbers L1.

**planning-suite-reconciler (0.08)** — finalized tracker → dated addendum at the top of
the integrated plan + each per-LOB plan Doc (pack §8 wording; the 6.0 shortcut resolved
via `get_drive_file_permissions`, which returns the target's metadata), OKR & KPI
Tracker rebased as new tabs (`OKRs — YYYY-MM 現行版`, cycle-aware Q/H columns), never
touching `tracker-latest` / `tracker-snapshots`; one confirmation for the batch;
leftovers list.

**planning-lob-gap-audit (0.10)** — one LOB's plan addendum + tracker rows + Drive
folder (paged listing) → report Doc 「[N.0.1] <LOB> — <cycle> Gap Audit & Heal Plan」 +
「行動追蹤表」 Sheet (README · 修復清單 · 待決事項, 狀態 vocab), waves SOR sync → banners →
doctrine → rewrites, 可交 Claude flags, previous report proposed for [SUPERSEDED] on
re-run; report-only.

**Verification (D2, SKB-007 AC-2/3/4/5):** Wave-1 AC-1 evidence: `ingest-skills.yml` run 32055553970 = success; `curl -o /dev/null -w %{http_code}` → `/s/0.03.md` 200 · `/s/0.06.md` 200 · `/s/0.09.md` 200; `/api/skills` lists planning-prework-pack · planning-session-synth · planning-tracker-sync. This wave: `validate-skill.ts --tier=all` → **0 ERROR / 0 WARN** on all five · dry-run ✓ 0.04 · 0.05 ·
0.07 · 0.08 · 0.10 (same run as Wave 1) · adversarial re-reviews PASS ×5 (advisories
applied) · `/code-review medium` findings: 3 findings, all resolved before landing — (1) `skills/0-strategy/_shared/` was tracked and would have surfaced as a broken taxonomy node → seed moved to `docs/planning-shared/`; (2) nine copies with only a manual md5 sweep as drift guard → `scripts/check-planning-refs.sh` (`--sync` re-copies the seed; bare run exits 1 on drift), AC-4 now mechanical; (3) no record entry on the branch → these two entries · this push's `ingest-skills.yml` run =
go-live proof; curl sweep at close-out · live triggers for these five accrue as YE
exercises them (dated waiver 2026-08-17, SKB-002 pattern).

## 2026-08-17 — SKB-007 close-out: planning-* family SHIPPED (8 skills, 0.03–0.10) — governance, D2 triggers, post-trigger polish

**Governance via `/zynkr-skills` (AC-7).** Route = `local-skill-md`, no prior issue →
`/skill-qa` (engine `--json`: PASS ×8, 0 ERROR / 0 WARN on the main tree) → `/skill-publish`
fresh-intake with the dispatch **decoupled** (files were already on main; `publish-skill.ts`
refuses existing targets) → `/skill-triager confirm-ship`. Result: one `[Skill Record]` issue
per skill in `peter-tu-zynkr/zynkr-skill-idea` — **#119** planning-prework-pack · **#120**
planning-session-synth · **#121** planning-tracker-sync · **#122** planning-1on1-annual-digest ·
**#123** planning-evidence-pack · **#124** planning-tracker-builder · **#125**
planning-suite-reconciler · **#126** planning-lob-gap-audit — labels `skill-proposal` ·
`category:0-strategy` · `shipped`, closed as completed; Project 1 items with Pipeline Status =
shipped · Build Status = shipped · Category = 0-strategy · Keep = yes · Build Repo =
zynkr-skill-builder · Build Target Path = `0-strategy/<slug>` · Built URL = landing commit
(`1bd05ad9` / `f8cf74d3`) · Status = Done. Dedup verdict `new` (#99 / #115 = strategy
facilitation; #118 zynkr-gm = weekly operating rhythm; this family = the once-per-half
planning event). Field drift noted in each issue: the Project has no `Intake Source =
skill-publish` and no `Artifact = skill-md-only` option (used `manual`, left Artifact unset).
confirm-ship's three read-only checks per skill: `gh api contents` ✓ · `generated/skills-index.json`
✓ · `/api/skills` ✓ · `/s/<id>.md` 200 (curl).

**Local install (confirm-ship last step).** `npx skills add … --skill <slug>` for the ★ three
→ `~/.claude/skills/planning-prework-pack` · `planning-session-synth` · `planning-tracker-sync`
(symlinks into `~/.agents/skills/`), all three visible in the session skill list.

**D2 install-and-trigger — one real run each, zero writes:**
- `planning-tracker-sync` on the live H2 tracker (55 items, zynkr-gm `derive_state.py`
  path): 1 OVERDUE (#1.03 SEO 文章, 開始 07-01 +47d) · 1 ENDS_SOON (#4.01 企業 AI 診斷, 11 d) ·
  24 UNDATED / 掛 All · LOAD Peter 6 P0 · all 14 P0 DIRECTION_UNLABELLED · full agenda block +
  6 nudge drafts printed; no snapshot, no cell, no draft, nothing sent.
- `planning-session-synth` on the July transcript + both whiteboard photos (full-res
  column crops): 70 verbatim rows (11 layout marks; 中 8 / 低 3 confidence), 24 rulings
  (12 = pack precedents, 4 new: 知識管理 ↗B↘C split · 訂閱制/書/YouTube → 4.4 · 學員交流專場 →
  4.6 · 「（減法 使用Token）」 excluded), coverage 5.0 = 0 · 8.0 = 0 · 6.0/7.0 thin, 17 retro rows
  + 5 重點結論, recap-mail text — all printed; every write gate answered no.
- `planning-prework-pack` YE dry-run (session 2026-12-13): resolved all sources incl. the
  6.0 shortcut → target Doc, read tracker/OKR/3 plan addenda/2 1:1 Docs, printed the 5-tab
  plan (Laundry 40 rows, seed Do-now 14/40 = 35% → lint fired as designed), one owner
  one-pager, logistics + invite text; no copy/Doc/deck/event.

**Post-trigger polish (same commit).** Friction from the three runs folded back: shared
`planning-sources.md` (transcript = space-separated ASR, Part-1 only; 1:1 heading variants;
`comment_mode="none"`; July event 09:30–18:30 not all-day) and `planning-knowledge-pack.md`
(§2 which-taxonomy rule for 5.0; §6 `#` prefix is positional / L1 lives in 主類別; ≤50-row
paging) re-synced to all eight copies (`scripts/check-planning-refs.sh` OK); tracker-sync
(paging, DIRECTION/STALLED always local, 掛 All counting, `--retro` by 主類別, self-owner
nudge, P0-cap line, `--since` in the routine string); session-synth (normalise-first ASR
step, photo download has no extension, conditional rulings on 中/低 rows, as-is board
headers, README dated section, non-interactive recap stop, 筆色 uncertainty);
prework-pack (YE reads `H1 回顧總結` + fallbacks when 完成 = 0, paging + 主類別 bucketing,
1:1 variants, status-word targets, departed-owner confirm + Owner=All cell, YE Qtr vocab +
「(H2 verdict)」 seeds, working-day due date, abbreviated agenda print, shortcut/calendar
notes). Validator 0 ERROR / 0 WARN on all three after polish; tree-wide 0-strategy 9/9.

**Follow-ups (local tracker `to-do.md`):** schedule the read-only tracker-sync block via
`/schedule` + observe once (wiring proof) · CI step for `check-planning-refs.sh` (S) · D2
waivers for the five non-★ skills until YE · pipeline field drift (Intake Source /
Artifact options) · optional hub-skill hoist · pack §2 5.0/8.0 vs 2026-08 taxonomy at YE.

Spec `docs/specs/SKB-007-planning-skill-family.md` → **Shipped 2026-08-17**.

## 2026-09-02 — SKB-011: PM knowledge leaves the skill bodies — one pack, five skills, a gate that has to be seen red

Opened spec `docs/specs/SKB-011-pm-shared-cohort.md` (Active, L/D3). Five skills already
touched the PMO's artefacts and each carried its own private copy of the rules, so nothing
about 管控表 / 週報 / 結案 could be true in one place. This lands the shared seed
`docs/pm-shared/` (`pm-knowledge-pack.md` · `pm-sources.md` · `pm-sheet-schema.json` ·
`pm-status-crosswalk.json` · `README.md` · `pm.json.example`), the stdlib validator
`scripts/pm-schema.py` (`headers` · `values` · `mirrors` · `--self-test`; exit `0` valid ·
`1` invalid · `2` legacy v1 · `3` cannot run), the identity+declared-sha guard
`scripts/check-pm-refs.sh` (`--sync` · `--print-sha`), `tests/pm-fixtures/`, and a `push:`
trigger plus a `shared-refs` job on `.github/workflows/qa.yml` — the SKB-007 follow-up
「CI step for `check-planning-refs.sh`」, closed here.

**Five axes, not one vocabulary (D5 — the core content ruling).** The PMO's eight surface
status vocabularies were being read as dialects of one word; they are not, they sit on five
independent axes — **lifecycle** (`not_started` `in_progress` `paused` `done` `dropped`) ·
**health/RAG** (derived, never typed) · **risk lifecycle** · **decision lifecycle** ·
**closure verdict** — and a value may never be carried across one. Three consequences are
now rules rather than habits: `paused` is project-level only (a paused *task* is `WIP` + a
Note, or `Drop` + a Change & Decision Log entry), **only `dropped` leaves the percent
denominator**, and health is always derived from 日期 × lifecycle and never written back
into `Status`.

**Two new skills, no third (D6).** `project-init` (**3.20**) stands a project up from the
PMO template set — resolves the filing home by 專案類型, copies the five templates, creates
`[1]`–`[4]`, clears the 範例列 (鐵律 2), seeds 管控表 tab 1 with the **five** delivery-stage
`X.0` rows (`啟動 · 規劃 · 執行 · 監控 · 結案`), writes both backlinks and prints the
`pm.json` snippet to paste; it stops at Gate 1 and plans nothing. `project-minutes-sync`
(**3.21**) closes the 會議記錄 → 管控表 loop: four tables routed to tab 1 · Change &
Decision Log · Risk Register, VALUES-ONLY writes, diff report. The three existing members
— `project-planning` (3.07) · `project-note-specialist` (3.08) · `project-status-update`
(3.09) — gained a Step 0 pack check and a `知識來源 … sha256 <12 hex>` declaration.
`consult-status-report` (**2.44**) is deliberately **outside** the family: it reads the CRM,
not the 管控表, so it follows the rule and cites it and keeps no copy.

**The copy set is five artefacts, and an installed skill is self-contained.** A verifier
proved the first cut broke on install: steps marked 強制 pointed at repo-root
`scripts/pm-schema.py` and `docs/pm-shared/*.json`, which `npx skills add` never delivers.
`check-pm-refs.sh` now copies all five artefacts byte-identically into every family skill —
`references/pm-knowledge-pack.md` · `references/pm-sources.md` ·
`references/pm-sheet-schema.json` · `references/pm-status-crosswalk.json` ·
`scripts/pm-schema.py` — and every skill calls its **own** skill-folder-relative copy, the
same way it already called `render_dashboard_email.py`. One root, no split; the gate keeps
the 25 copies identical.

**Drift fixed, and named so a reader diffing old output knows why:**
- **13-vs-14 columns.** `project-status-update` hardcoded `專案管理總表!A1:M44`, so on a v2
  sheet it read `前置任務 Depends on` as `Reference 連結` and shifted every column after it.
  Version is now **detected before mapping** (`pm-schema.py headers`, exit `2` = legacy v1
  continues with a warning), and columns are addressed by header name.
- **`取消` folded into `Not started`.** Ruled the other way and fleet-wide: an illegal
  literal is a **data error** that stays *in* the denominator, counts toward neither `done`
  nor `dropped`, and is named in `data_errors`. Removing it would flatter the percent the
  same way the old fold understated it. This makes `consult-status-report` (2.44) the skill
  that was already right; `project-status-update` (3.09) was corrected to match. The
  zero-denominator boundary is explicit too: `counted(s) − dropped(s) = 0` drops that stage
  out of the spine and into `data_errors` — never a divide-by-zero, never a silent 0%.
- **`[3.4]` → `[3.3]` in the live Docs.** 鐵律 2 quotes the template folder, and the five
  PMO Docs spelled it `[3.4]` while Drive says `[3.3] 專案管理 PMO｜Playbook & Templates`.
  On **2026-09-02 all 17 occurrences were corrected in the Docs themselves** — Playbook 12 ·
  Business Case 1 · Kickoff 1 · 會議記錄 1 · 復盤 2 — so 鐵律 2's 原文 now genuinely reads
  `[3.3]` and is quoted verbatim. Every "preserve `[3.4]` when quoting" instruction is gone;
  what remains is a dated correction note, not a live drift warning.
- **Hardcoded instance data removed.** The tracker Sheet ID, the Google account, the weekly
  **recipients** (`projects.<slug>.report_recipients`) and the **delivery spine**
  (`projects.<slug>.spine`) are adapter DATA in `~/.config/zynkr/pm.json`, fail-loud on a
  missing key; the placeholders in the skills are documentation of the shape, never
  fallbacks. `spine` is the one soft key — absent ⇒ the five delivery phases **with a
  printed warning**. `跨階段 Cross-Cutting` is a parallel track and never occupies a spine
  slot or enters a denominator.
- **週報 label change.** Pack §7 is now the single home of the four section labels, and it
  prints `1 Summary Update` / `2 Progress` / `3 Blockers/Challenges` / `4 What's Next` —
  no trailing period, and section 3 gained `/Challenges`. `project-note-specialist`'s
  example was made byte-identical to the pack and carries a line pointing this out, because
  anything matching the old `3. Blockers` string sees a real output change.
- **Planning family.** `planning-knowledge-pack.md` gained the cross-axis note (the planning
  `狀態` vocabulary *is* the lifecycle axis; `暫停` is project-level; health is never written
  back) and was re-synced to all eight copies.

**D4 is parked, deliberately.** Whether a human edits the Google Doc Playbook or this repo
seed is undecided, so the build takes the only posture that survives either answer: the seed
is the working master today, `pm-knowledge-pack.md` opens with
`<!-- pack_version: 1 · direction pending D4 -->`, and no file claims either surface is
generated from the other. What D4 gates is exactly one line — a Doc→seed pull in front of
`check-pm-refs.sh --sync`. Everything downstream (copy step, byte-identical `references/`,
declared sha, Step 0 refusal, CI gate) is identical either way. No Doc→seed generator ships
here; adding one would pre-decide it.

**Verification (pre-push, in the build worktree — AC ids per the spec's AC-1…AC-14):**
- **AC-4 · PASS** — `pm-schema.py headers` on the three fixtures returned `0` / `2` / `1`
  for `headers-v2-good` / `headers-v1-legacy` / `headers-bad`.
- **AC-5 · PASS** — `values-good` → `0`; `values-bad` → `1`, naming both `取消` and `暫停`.
- **AC-6 · PASS (stronger than the spec's wording)** — `pm-schema.py --self-test` → exit 0,
  `7 fixture(s) · 5/5 (mode, verdict) pairs covered · mirrors OK · 0 unexpected`. The
  fixture set grew to 7 and the gate now also proves per-`(mode, verdict)` coverage and the
  three-copy column-map mirror, closing two holes a verifier walked through (a dead
  validator staying "covered" by another mode's fixture; a `*-bad` fixture quietly declaring
  `"expect": 0`). The spec's literal expected string `5 fixture(s) · 0 unexpected` is stale
  and should be restated at close-out. The deliberate weaken-and-observe-red half of AC-6 is
  **outstanding**.
- **AC-3 · PASS** — `PM_FAMILY=(…)` is an explicit five-line list (`grep -c` = 5), and
  `git diff --stat origin/main -- skills/3-operations/zynkr-ops-weekly` is empty: 3.19 is
  frozen behind a live launchd plist and is untouched.
- **AC-7 · PASS** — `A1:M44` survives only in the legacy branch of Step 2, the
  `_source_columns_note` range map and the renderer's mirror; `pm-schema.py headers` runs
  before any column mapping.
- **AC-11 · PASS** — no `/Users/` path and no live tracker Sheet ID anywhere in
  `docs/pm-shared`, `scripts/pm-schema.py`, `scripts/check-pm-refs.sh`, `project-init` or
  `project-minutes-sync`.
- **AC-14 · PASS** — `bash scripts/check-planning-refs.sh` → exit 0, 8 copies of both
  planning artefacts byte-identical.
- **AC-8 · PARTIAL** — the denominator rule and the `取消`-as-data-error rule are present
  and cited in `project-status-update`, `consult-status-report` (SKILL.md + its
  `dashboard_schema.json`) and `rules.percent_complete`. The spec's literal grep
  (`total − dropped`) no longer matches `project-status-update`, which was rewritten to the
  per-stage form `stage_fraction(s) = done(s) / (counted(s) − dropped(s))`; the AC's verify
  string needs restating at close-out.
- **AC-1 / AC-2 · OUTSTANDING** — the run made in this worktree was **RED** by design and
  by construction: `DRIFT` ×5 on the pack copies, `MISSING` ×20 on the four newly-copied
  artefacts, `SHA-MISMATCH` ×5 (`declared=e4d74ef4ac4d actual=15640433fbee` at the time of writing —
  the seed's sha moves with every seed edit). That is the
  expected pre-`--sync` state after the copy set grew from one artefact to five, and it is
  itself the evidence the guard cannot pass vacuously. Both ACs must be re-driven on the
  landing tree after `--sync`: exit 0 naming the copy count, then a seeded wrong sha failing
  with `SHA-MISMATCH` and `--sync` restoring it.
- **AC-9 · OUTSTANDING** — the renderer has not been exercised on a payload carrying both
  `dropped` and `data_errors`.
- **AC-10 · OUTSTANDING** — `validate-skill.ts` per new skill, tree-wide duplicate-sheetId
  sweep and the local `ingest.ts` dry-run (`✓ 3.20` / `✓ 3.21`, no redirect-prune line) have
  not been run; this worktree has no `scripts/node_modules`.
- **AC-12 / AC-13 · OUTSTANDING (the D3 bar)** — no `qa.yml` run exists yet for the landing
  push, so the new `push:` trigger has not been observed producing a real `diff range:` line,
  and the seeded-drift branch has not been pushed and seen RED. SDD §5.4: a gate never seen
  red is not wired. Both run URLs and an SDD §6.3 ledger row are required before this can be
  called D3.
- **Not claimed:** `~/.config/zynkr/pm.json` is not populated by this change, so no PM-family
  run has resolved a real project end-to-end; neither new skill has written to a live Sheet;
  and no install-and-trigger has been performed.

**Follow-ups (local tracker `to-do.md`):** D2 triggers per new skill · the D3 green-push and
seeded-red runs (AC-12 / AC-13) + SDD §6.3 gate-ledger row · restate AC-6's and AC-8's stale
verify strings · **ATL-040** in `zynkr-atlas` — `pm.*` **pointer** nodes carrying repo path,
`pack_version` and declared sha256 (Atlas registers, never serves the bytes; the id is
claimed by pushing, so derive it fresh) · D4 when it lands.

Spec `docs/specs/SKB-011-pm-shared-cohort.md` → **Active (D1)** — not shipped; D2 and D3
above are the gate.

---

## 2026-09-03 — the picture declarations: a skill can describe its own flow (Spec: SKB-012)

**A skill can now say what its own flow looks like, and Atlas draws it.** Five optional frontmatter
keys — `handoff` · `steps` · `flow` · `executed_by` · `execution_mode` — let a SKILL.md declare the
shapes of its internal process (the branch, the human sign-offs, the terminals, the durable store)
and the lines between them. They change nothing about how a skill runs. A file that declares none of
them behaves and renders exactly as before.

**The problem they solve is a vocabulary problem, not a bug.** Atlas derives its 流程圖 canvas from
what the graph already knows — an artifact's type, a node's kind, the edges between them — and that
vocabulary cannot express "a person approves here" or "this is where the branch is". For
`zynkr-slide`, ten of the nineteen shapes in the chart that documents it had no way to exist. The
four that did came from `synergy:`, which means "these go together" and is symmetric — so Atlas had
to guess a direction and drew the relay **backwards**. `handoff:` is the fix: an ordered list, and
its presence tells Atlas to stop guessing for that file.

**The encoding is a pipe-delimited quoted string, and that is the whole trick.** A block sequence of
quoted scalars is the one shape that survives every parser that reads these files — this repo's
`gray-matter`, Atlas's deliberately-small subset parser, and Atlas's separate importer parser —
**with no change to any of them**. A YAML list of maps would have needed all three widened, and the
importer's copy has already rotted silently once (`ATL-036` defect 1). So the format is ugly on
purpose and free in exchange.

**A new WARN-tier check, `steps.*`, and it stays WARN by design** — mirroring `ipo.length`: a
malformed step costs a shape on a diagram, and that must never block a skill from shipping. A `ref=`
naming a skill is checked here; one prefixed `atlas:` names a connector or knowledge node this repo
cannot see, and is checked by Atlas instead — a check that cannot fail is worse than none.

**The keys are deliberately NOT published.** They are absent from ingest's `normalized` allowlist, so
they never reach `content/<id>.md` or the marketplace. Atlas reads the repo file over GitHub raw;
publishing them would put one declaration in two places with no gate keeping them equal.

Also fixed here because a new blob sha was being minted anyway, and `ATL-026` ruled the fix belongs
upstream: `zynkr-slide`'s body cited **three dead sheetIds** (`1.12`/`1.13`/`1.14`) for its own relay
stages; the real ids are `1.25`/`1.26`/`1.27`. Six occurrences corrected.

**Verification (D2, SKB-012 AC-1…AC-6):** `validate-skill.ts` on the pilot — **1/1 pass, 0 errors**;
on all six slide skills — **6/6 pass, 0 errors** · a seeded file with 9 defects raised **9 distinct
`steps.*` warnings and 0 errors**, which is the 「prove it fired」 evidence for the new check ·
`npx tsx scripts/ingest.ts .` then grep for the five keys in `content/skills/1.24.md` — **no match**,
and the sheetId fix present in the published body · build artifacts reverted after the local run, CI's
push backstop regenerates them.

Spec `docs/specs/SKB-012-picture-declarations.md` → **Shipped 2026-09-03**. Consumer:
`zynkr-atlas` `ATL-043`, which cannot build without this half landing first.

## 2026-09-04 — SKB-013 The skills pipeline becomes a package, and its missing stage gets written

The chain every skill file documents ran through `/skill-creator` — a Claude Code plugin skill, **not
a file in this repo**. So the pipeline depended on a stage Zynkr neither owned nor versioned, and
`skill-publish` carried a `synergy` reference that could never resolve.

- **`skills/6-engineer/skill-author/` added** (`sheetId 6.12`) — the build stage. It fills the
  CI-scaffolded stub on `skill/<slug>`: frontmatter contract, sheetId rules, taxonomy keys, body
  structure, and a self-check against the same `validate-skill.ts` engine `/skill-qa` and CI run. The
  `skill-creator` plugin may still be called for prose — as a tool, not as a stage.
- **The chain declares itself** via `SKB-012`'s `handoff:`, in the `zynkr-slide` shape (orchestrator
  lists all stages in order; a stage lists only its next). Because `handoff:` demotes `synergy:` per
  file, the symmetric arrows those lists were inventing retire with it — including the unresolvable
  `skill-creator` reference.
- **`zynkr-skills` becomes a package** — `type: agent` + `skills: [...]`. Type and membership are
  different claims from sequence; all three are now declared rather than inferred.
- **`SKILL_SPEC.md` documents `type` and `skills`** (§1, the package fields). Both were already read
  by Zynkr Atlas and documented nowhere.

**Verification** — `validate-skill.ts --tier=all` over all 7 changed/added files: 7/7 pass, 0 errors;
`skill-author` 0 errors 0 warnings. `zynkr-skills`' 4 warnings are pre-existing, proven by validating
the `origin/main` copy (same 4). `ingest.ts` against the tree: `✓ 6.12 skill-author`, 124 skills, no
duplicate-id throw — the pre-push check CLAUDE.md requires for a new `sheetId`. `generated/` and
`content/` deliberately not committed. **Not proven:** `skill-author` has not been run against a real
stub; first real use is its own D2 evidence. Spec: `docs/specs/SKB-013-skills-pipeline-package.md`.

## 2026-09-04 — SKB-013 amended: `confirm` stops binding a row a second time

One line of `zynkr-skills`' `steps:` block. `confirm` declared
`ref=skill-triager`, which `triage` had already bound — the confirm-ship loop,
the same skill at two moments of the process — and `parseStepBlock` refuses a
duplicate bound ref by design (a bound step's canvas key **is** the row's key,
so two of them would collide in `stepIdByKey`).

The consequence was invisible and total. Atlas drew **16 of the 17 steps** this
file declares and **16 of its 19 lines** — `publish -> confirm`,
`confirm -> live` and `confirm ~> board` went with the step — while the canvas
reported `dropped: 0`, because those lines were gone before the backing check
that `dropped` counts ever ran. `parse_report.warnings` was `[]` too: the
importer never runs `parseStepBlock` at all, so no imported version has ever
carried a picture warning.

`confirm` is now an **inline** step titled `Confirm ship + close issue
(skill-triager)` — the moment is drawn and named, without a second claim on the
row. The row-level `skill-publish → skill-triager` handoff is unaffected and
still in the graph; Atlas now counts it under 「另有 N 條關聯未繪出」, which is
true and, as of `ATL-047`, said on screen.

Validator: **0 errors**, the same 4 warnings `SKB-013` recorded as pre-existing.

Paired with **`ATL-047`** in `zynkr-atlas`, which fixes the half that is not a
declaration problem: the column pass was a longest-path relaxation, so the retry
loop in this same file (`qagate -> author | FAIL`) laid the picture out **55
columns / 16,204 px** wide. Neither repo's gates could see any of it —
`validate-skill.ts` does not read `flow:`, and Atlas had no cyclic-flow test.

## 2026-09-05 — new skill: eli5 (audience-calibrated explainer) · `SKB-014`

`eli5` (sheetId `4.12`, category `4-training`) — explains a topic, code, concept or
error message at the level the listener can actually absorb, adapting vocabulary,
analogy, tone, depth and framing to who is listening. First net-new-prose skill in
`4-training`, whose six other members are all transcript/recording processors.

Adopted from **[DreambigOu/ELI5](https://github.com/DreambigOu/ELI5)** (904★, MIT) —
sourced via `/zynkr-skills` → `/skill-sourcer` as `zynkr-skill-idea#129`, dedup
verdict `new` against 112 board items / 122 issues / 88 on-disk skills. Nothing in
the catalog took "a topic + an audience level" and returned a calibrated
explanation; `content-translator` shifts **language**, this shifts **comprehension
level**.

Triaged `assign-build` with mode **`rescaffold`, not the `lift-and-shift` the
triager recommends for external repos** — mirroring upstream would have shipped an
English, US-centric skill (county fairs, phone books) to a zh-TW teaching audience.
Attribution is therefore SKILL_SPEC §6 **Case C** (derivative), with the full trio
declared and an `## Attribution` section naming what changed:

- Localised analogy banks (便利商店 · 夜市 · 捷運 · LINE · 健保卡) and an
  answer-in-the-language-asked rule.
- Four Zynkr-specific audience rows upstream lacks — 老闆 · 學員 · 客戶窗口 ·
  中小企業主 — which are what it is actually used for.
- A Step 4 pre-send check (upstream drafts and stops).
- An accuracy carve-out: the "simplify ruthlessly" instruction is suspended for
  legal, medical, financial and safety-critical topics.
- Scope boundaries against `content-translator` and `training-lecture-recap`.

Declares the `SKB-012` picture fields (`steps`/`flow`, 8 shapes incl. the
`check -> draft` redraft loop) so Atlas can draw it, and `handoff: []` since it is
a leaf, not a relay stage.

**Verification**: `validate-skill.ts --tier=all` → **0 errors, 0 warnings** (one
INFO: live download is a post-ship check) · `SKB-001` duplicate-id gap covered by a
pre-push ingest dry-run invoked the way CI does (`ingest.ts <root>/skills`) →
**126 ingested, 0 skipped, no throw**, `4.12` unique and absent from
`id-redirects.json`; `4.03`–`4.07` are NOT free, they are held by agent files ·
`generated/skills-index.json` emitted `id 4.12 · slug eli5 · category training` ·
build artifacts discarded, not committed (CI owns `content/` + `generated/`).
Note: invoking `ingest.ts` against the repo ROOT instead of `skills/` walks the
committed `content/` artifacts and throws a spurious `Duplicate skill name:
zynkr-gm` — pre-existing, unrelated, and not what CI does.

---

## 2026-09-05 — the SEO family says `handoff:` out loud · `SKB-016`

> ⚠️ **Renumbered from `SKB-015`, which a parallel session had already taken.** Its
> `zynkr-ops-weekly` commit (`5566ee62`) carries `Spec: SKB-015` and landed first, so
> the id is theirs by the claim-first rule. **This change's own commit trailer
> (`5fdc8e59`) still says `SKB-015` and is wrong** — `main` is not rewritten to hide
> it. The seventh id collision in two days, and the first in THIS repo: unlike
> `zynkr-atlas`, `zynkr-skill-builder` has no 「next free id」 guardrail line to claim
> against, so there is nothing here to push a claim to. That is the gap.

Ten `seo-*` SKILL.md files gain a `handoff:` line. No prose changed, no skill
behaviour changed — this is a **declaration** fix, and it exists because
`synergy:` and `handoff:` mint the identical `handoff` edge in Atlas while
meaning different things: `handoff:` is ordered and directional, `synergy:` says
"these go well together" and is written symmetrically, both files naming each
other.

Atlas reads the symmetric claim as an ordering. In production that put **four
contradicting arrows** in the graph:

    seo-article-finalizer → seo-publish-article   AND   seo-publish-article → seo-article-finalizer
    seo-article-pipeline  → seo-publish-article   AND   seo-publish-article → seo-article-pipeline

Both directions of each pair. They cannot both be true — `seo-publish-article`
is terminal, as its own description says of the finalizer: *"only adds
meta/links/schema, does NOT publish"*.

`ATL-043` already built the fix — **declaring `handoff:` switches that file's
`synergy:` off, per file** — and the slide family adopted it. This applies the
same convention to SEO, following the 14 existing adopters exactly: a step names
its one next step, a terminal step declares `handoff: []`, and **`synergy:` is
never touched** so the "related skills" meaning survives.

| sheetId | skill | `handoff:` |
|---|---|---|
| 1.15 → 1.22 | persona-builder · question-miner · angle-finder · keyword-mapper · keyword-classifier · demand-validator · brief-writer · outline-designer | the one it already named in `synergy:` — same arrow, now declared honestly |
| 1.23 | seo-article-finalizer | `["seo-publish-article"]` |
| 1.30 | seo-publish-article | **`[]`** — terminal; this is what removes both back-arrows |

**Deliberately NOT touched: the two orchestrators.** `seo-article-pipeline`
(1.14) and `seo-program-planner` (1.31) list *rosters* — 14 and 7 members — not
handoff chains. Whether an orchestrator's roster should become an ordered
`handoff:` list (as `zynkr-slide` and `zynkr-skills` did) is a modelling question
about the process itself, and the owner scoped this pass to removing the
contradiction only.

**Verification.** `validate-skill.ts` 10/10 pass, 0 errors. One pre-existing
warning on `seo-outline-designer` (`synergy.slugs_exist` — `content-draft` is a
bundle member under `zynkr-content-writer/.claude/agents/`, not a top-level
`skills/**` folder); it predates this change, fires on the `synergy:` line, and
`content-draft` **does** resolve in Atlas, where `ATL-041` retyped it to `skill`.

Atlas side: `ATL-052` re-parses the changed versions.
