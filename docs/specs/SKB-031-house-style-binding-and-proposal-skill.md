# SKB-031 — bind every skill to one house style, and add the proposal skill

- **Status:** Built 2026-09-18
- **Size / DoD:** L / D2 *(new subsystem + fleet-wide convention + new CI gate; no schema, secret,
  auth, money or cron ⇒ not D3)*
- **Created:** 2026-09-18 · **Repo(s):** `zynkr-skill-builder`
- **Links:** `docs/house-style/README.md` (the binding seed) · `scripts/check-house-style.ts` (the
  gate) · 《[2.0] Zynkr 通用風格指南 House Voice》 `10bOIQwRm9Pxwgct4hlwCwK_B4Pipai1HqBPZKzyRHSE`
  (new) · 《[3.2] 禁用詞清單》 `1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg` (unchanged)

## Context

Writing the 步步升 proposal (v1 → v2 → two review rounds, 21 comments) surfaced two gaps.

**No proposal skill existed.** The sales category had 22 skills and none produced a priced client
proposal: `sales-follow-up` writes the post-demo email, `consult-solution-planning` an internal
plan, `consult-brd-writer` a requirements doc. Every proposal was hand-built, so the pricing
anchor, the lane split and the "never ship internal notation" rule were re-derived from scratch
each time.

**House voice was written down but almost nowhere applied.** Measured before this change:

| | |
|---|---|
| Skills binding to the house voice Docs | **3 of 93** (`content-newsletter-draft`, `sales-outbound`, `sales-follow-up`) |
| Slide skills referencing voice rules | **0 of 6** |
| Files carrying their own forked 禁用詞 list | **10** (the whole `seo-*` family — only 1 was visible by eye) |
| Mechanism binding skill #4 | none — the 3 bound skills used a copy-pasted paragraph |

The guide was fine. Nothing required anyone to read it.

## Design

### The words stay in Drive; the repo owns the binding

Peter edits the guide in Google Docs, skills read it at runtime, and the repo owns only the
*pointer* and the rule that makes the pointer checkable. A new surface-agnostic Doc 《[2.0]》
carries the universal core (聲音 · 標點 · 數字 · 誠實邊界 · 內部語言不外流) plus one addendum per
surface. 《[2.2] 內文風格指南》 keeps its ID and becomes the 文章 addendum; 《[3.2]》 stays the sole
owner of the forbidden-word list. Visual rules stay out — §2.5 governs slide *wording* and defers
to `BRAND.md` / `conventions.md`.

### Declare-or-fail, instead of a scope list

Every `skills/*/*/SKILL.md` carries exactly one frontmatter key — `house-style: bound` or
`house-style: exempt — <reason>`. There is no default and no third state, so a new skill cannot
opt out by staying silent (SDD §0.3). This replaces hand-classifying 93 skills with a rule that
keeps working after this change ships, and makes every exemption visible and arguable instead of
buried in one author's judgement.

`bound` additionally requires both Doc IDs in the body, because the copy installed at
`<home>/.claude/skills/<name>/SKILL.md` has no access to this repo and must name its own sources.

### Exemptions

13 of 94, only where house voice would harm the output or there is no prose at all: verbatim
capture (4), machine artifacts (6), pure routers (3). "Internal-only" is explicitly not a reason.
`sales-manager` binds despite routing, because it also writes a pipeline review someone reads.

### `sales-proposal-writer` (sheetId 2.47)

Encodes the 步步升 session as procedure: read the deal timeline first · rank the asks by a stated
criterion into 第一順位／額外項目 · split into recurring and build lanes · price every line at the
NT$10,000/hr anchor with hours shown · quote only confirmed scope · write honest boundaries ·
publish as 交付文件 · log one CRM note. Its revision loop — comment → apply with per-edit
assertions → resolve → **verify the published body by checksum** → sync the Gmail draft, CRM note
and kickoff doc in the same pass — is the half that earns its keep. Registered in `sales-manager`.

## Acceptance criteria

- **AC-1** Every `skills/*/*/SKILL.md` declares `house-style`. → `check-house-style.ts` exits 0;
  `grep -rL "house-style:" skills/*/*/SKILL.md` is empty.
- **AC-2** A skill that drops its declaration fails the gate, naming the file.
- **AC-3** A `bound` skill that omits either Doc ID fails the gate.
- **AC-4** `exempt` without a stated reason fails the gate.
- **AC-5** No file re-implements the forbidden-word list; re-adding one fails the gate.
- **AC-6** `sales-proposal-writer` passes `validate-skill.ts --tier=all` with 0 errors, 0 warnings.
- **AC-7** The whole tree still passes QA, and the pre-existing guards stay green.

## Verification (2026-09-18)

| AC | Evidence |
|---|---|
| AC-1 | `check-house-style.ts` → `94 skills declared (81 bound · 13 exempt), no inline forbidden-word lists` |
| AC-2 | probe 1 — key stripped from `sales-proposal-writer` → **failed**, `missing \`house-style:\``; restored |
| AC-3 | probe 2 — 《[2.0]》 id redacted → **failed**, `does not name`; restored |
| AC-4 | probe 3 — `house-style: exempt` with no reason → **failed**, `needs a stated reason`; restored |
| AC-5 | probe 4 — forbidden list re-added to `governance-guardrails.md` → **failed**, `re-implements the forbidden-word list`; restored |
| AC-6 | `validate-skill.ts --tier=all` → `1/1 pass (0 errors)`, 0 warnings |
| AC-7 | tree QA **94 skills checked, 0 failing**; `check-planning-refs.sh` OK · `check-pm-refs.sh` OK · `pm-schema.py --self-test` OK (7 fixtures, mirrors OK) |

Probe harness ran baseline → 4 probes → restore, and asserted the tree was clean again
afterwards: **6 passed, 0 failed**. A gate that has never failed is unproven, so each rule was
broken on purpose once.

## Pre-existing finding, not fixed here

`check-ipo-drift.ts` reports drift on `7.03 cv-story-extractor` (CSV text longer than the
generated JSON's 260-char cap). It is **unrelated to this change**: `assistant-index.csv` and
`generated/` are byte-identical to `origin/main`, and no `cv-story-extractor` folder exists in
`skills/7-people-talent/`. That check is also not wired into `qa.yml`, so it gates nothing today.
Left for a separate pass.

## Notes for the next change

- The gate is CI-only, deliberately. A pre-push hook would need `npx tsx` and would either be slow
  or skip silently when `node_modules` is absent — and silent skipping is the thing SDD §0.3 bans.
- `check-house-style.ts` uses **node stdlib only**, so it runs in a fresh worktree before
  `npm ci`. Keep it dependency-free.
- The forbidden-list detector is a 3-of-7 marker heuristic, not a parser. It caught all 10 real
  forks; if it ever fires on innocent prose, tighten the markers rather than the threshold.
