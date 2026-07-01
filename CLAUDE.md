# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this is

`zynkr-skill-builder` — the single ingest source for the Zynkr AI-skills marketplace. SKILL.md sources live under `skills/[N]-[category]/[skill-slug]/` (plus optional `agents/` and `references/`); TypeScript scripts in `scripts/` validate, ingest, and build the generated JSON artifacts in `generated/`; CI ships them to the live marketplace (Supabase mirror behind `zynkr.ai/api/skills/*`) via an HMAC-signed webhook. **The `skills/` tree here is the only path to the marketplace** — never edit skill files in the archived `6.0 tech/skills/` folder. Note the runtime divergence: locally-installed command skills run from `~/.claude`/`6.0 tech/skills/`, so a change that must take effect in Peter's live sessions may need editing BOTH copies.

## The two contracts

- **`SKILL_SPEC.md`** — canonical for the *authoring contract* (frontmatter fields incl. `sheetId`, install snippet, body structure, attribution). Its own rule applies: when the doc and `scripts/validate-skill.ts` disagree, the validator wins.
- **`architecture.md`** — canonical for *pipeline mechanics* (the 4-skill chain, the 3 dispatch workflows, ingest → generated JSON → signed POST to `zynkr.ai/api/skills/sync`, marketplace fetch).

## Common commands

```bash
npx tsx scripts/validate-skill.ts <path/to/SKILL.md> [--tier=all]   # per-file QA (same engine as CI)
npx tsx scripts/ingest.ts                                            # full-tree ingest → content/ + generated/skills.json
npx tsx scripts/build-marketplace.ts                                 # generated/skills-index.json + skills-detail.json
npx tsx scripts/build-taxonomy-tree.ts                               # regenerate skills/README.md tree
```

## CI / QA gates

- `qa.yml` — required PR check; runs `validate-skill.ts` on **changed SKILL.md files only** (ERROR tier blocks).
- `ingest-skills.yml` — push-to-main backstop (validates changed files) → ingest → build → HMAC-signed POST to the marketplace sync webhook.
- **Known gap (spec SKB-001):** nothing cross-file runs anywhere — a duplicate `sheetId` passes the PR check and only throws inside ingest AFTER merge. Until SKB-001 lands, dry-run `ingest.ts` before pushing a new `sheetId`.
- `pickup-approved-issue.yml` / `publish-skill.yml` — `repository_dispatch` scaffolding/publish flows (see architecture.md).

## Danger zones

- **sheetId is the marketplace content id** (precedence-0; see SKILL_SPEC.md §1). Claim the next FREE per-category id, count agent files too, never reuse a retired id (`generated/id-redirects.json`).
- **Renaming a skill slug orphans its Supabase row** — the sync webhook upserts `onConflict: slug` and never prunes. Until website spec WEB-001 ships the soft-delete prune, manually DELETE the old slug row after a rename.
- `generated/` and `content/` are **build artifacts** — never hand-edit; CI commits them.
- All skill sources are **English-canonical** (bilingual triggers kept; zh output/data files preserved).

## SDD binding (fleet rule — full text: ../SDD.md from repo root, i.e. 6.0 tech/SDD.md)

This repo follows Zynkr SDD. Repo code: **SKB**. Tracker = `to-do.md` (**local-only by design** — `.gitignore` keeps roadmap/backlog off the public surface; it lives in Peter's checkout, alongside the legacy local `plan.md` progress log) · Record = `docs/CHANGELOG.md` (public, in-repo, created 2026-07-02).

- Size gates: schema/secret/pipeline-workflow/cross-repo ⇒ L (spec in `docs/specs/` + plan mode first).
- DoD: S→D1 · M→D2 (`/verify`: one real install-and-trigger of the skill + `/code-review`) · workflow/secret/webhook changes→D3.
- Every shipped change: tracker line moves out, record entry with ID + Verification block, commit trailer `Spec: <ID>` (M/L).
- This repo's PR-check + push-backstop already satisfies D0/D1 mechanically for skill-content changes.
- New gate/cron/secret ⇒ wiring proof: see it fire once, record evidence (SDD §5.4).

## Repo placement (Zynkr-wide)

This repo lives at `~/Desktop/Claude/zynkr/6.0 tech/zynkr-skill-builder/` and remotes to `peter-tu-zynkr/zynkr-skill-builder`. Direct-to-`main` pushes are authorized (the ingest backstop covers them).
