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
