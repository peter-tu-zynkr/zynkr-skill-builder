# SKB-001 — Cross-file catalog integrity: duplicate sheetId/slug check in QA

- **Status:** Draft
- **Size / DoD:** M / D2 (CI + script only; no data surface)
- **Created:** 2026-07-02 · **Repo(s):** zynkr-skill-builder
- **Links:** SKILL_SPEC.md §1 (`sheetId` contract, documented 2026-07-02) · SDD §5.4

## Context

`qa.yml` (the required PR check) runs `scripts/validate-skill.ts` on **changed files
in isolation** — no cross-file check runs anywhere before merge. Duplicate `sheetId`
(or slug) is only caught by `scripts/ingest.ts` line ~630, which throws AFTER merge
inside `ingest-skills.yml`, turning an authoring mistake into a broken pipeline run.
This has bitten before (career-consult 7.02→7.14 collision, 2026-06-19, silently
dropped a skill from the registry under the pre-2026-06-09 id regime).

## Requirements & acceptance criteria

- **AC-1** — When the catalog check runs, then it parses ALL `skills/**/SKILL.md`
  (and agent `.md` frontmatter where `sheetId` appears) and exits 1 on any duplicate
  `sheetId`, duplicate slug, or malformed `sheetId` (`^\d+\.\d+$`), naming both
  claimants.
  *Verify:* temporarily give two skills the same sheetId on a branch → exit 1 naming
  both files; revert.
- **AC-2** — When a PR touches `skills/**`, then `qa.yml` runs the catalog check as a
  step (in addition to per-file validation), and a duplicate blocks the merge.
  *Verify:* open a violation PR → red required check → close PR.
- **AC-3** — When a push to main runs `ingest-skills.yml`, then the catalog check runs
  BEFORE ingest (fail fast with a named error instead of a mid-ingest throw).
  *Verify:* seeded-violation branch dispatch, or observe ordering in a green run log.
- **AC-4** — When ingest truncates over-length IPO fields, then the truncation count
  appears in `$GITHUB_STEP_SUMMARY` (stays WARN per 2026-07-01 decision — visible,
  not blocking).
  *Verify:* green ingest run's job summary shows the count line (0 is fine).

## Design sketch

- Data: none.
- Surfaces: new `scripts/check-catalog.ts` (or a `--catalog` flag on
  `validate-skill.ts` — prefer the flag: one validation engine, many surfaces, per
  conventions.md) · `qa.yml` + `ingest-skills.yml` step each · ingest job-summary line.
- Decisions: keep per-file validation scoped to changed files (fast PR checks); the
  catalog pass is cheap (frontmatter-only parse of ~60 files) so it always runs whole-tree.

## Out of scope

- Behavioral/eval testing of skills (description-trigger accuracy) — separate future
  initiative.
- The Supabase orphan-row prune — that's website spec WEB-001.
- Elevating IPO truncation to ERROR (decided WARN, 2026-07-01).

## Tasks

- [ ] SKB-001.1 catalog mode in validate-skill.ts (dupe sheetId/slug + malformed, whole tree)
- [ ] SKB-001.2 qa.yml step + ingest-skills.yml fail-fast step
- [ ] SKB-001.3 ingest truncation count → $GITHUB_STEP_SUMMARY
- [ ] SKB-001.4 wiring proof (violation PR red) + record entry + SKILL_SPEC.md gotcha
      paragraph updated to say the gap is closed + spec → Shipped

## Verification plan

- AC-by-AC `Verify:` lines; the wiring proof is AC-2's red required check on a real PR.

## Doc-sync footprint

Same-commit updates: `to-do.md` · `docs/CHANGELOG.md` · `SKILL_SPEC.md` (§1 sheetId
gotcha paragraph) · `CLAUDE.md` (known-gap line removed) · SDD §6.3 wiring row.
