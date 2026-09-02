# SKB-012 — the picture declarations: a skill can describe its own flow

- **Status:** Shipped 2026-09-03
- **Size / DoD:** L / D2 *(cross-repo — the consumer is `zynkr-atlas`; no secret, no workflow, no schema here)*
- **Created:** 2026-09-03 · **Repo(s):** `zynkr-skill-builder` (consumer: `zynkr-atlas` `ATL-043`)
- **Links:** `zynkr-atlas/docs/specs/ATL-043-step-declarations.md` · `SKILL_SPEC.md` §1

## Context

Atlas draws a skill's flow on its 流程圖 canvas by deriving shapes from what the graph already knows:
an artifact's type, a knowledge node's kind, and the edges between them. That vocabulary cannot say
*"a person approves here"*, *"this is where the branch is"*, *"the user hands the material in"*, or
*"the deck lands in Drive"* — so for `zynkr-slide`, ten of the nineteen shapes in the chart that
documents it have no way to exist, and the four that do come from `synergy:`, which is symmetric and
therefore draws the relay backwards.

This spec adds the missing words **to the file**, because the file is where every other declaration in
this repo already lives. It is the upstream half of `ATL-043`; that spec cannot be built without it,
which is the same ordering `SKB-010` had to satisfy before `ATL-036` (`ATL-026`'s standing refusal:
Atlas may not mint a row whose substance it invented).

## Requirements & acceptance criteria

- **AC-1** — When a SKILL.md carries `steps:` / `flow:` / `handoff:` / `executed_by:` /
  `execution_mode:`, then `validate-skill.ts` accepts it with **0 errors**.
  *Verify:* `npx tsx scripts/validate-skill.ts skills/1-brand-marketing/zynkr-slide/SKILL.md --tier=all`
  → **ran 2026-09-03: 1/1 pass, 0 errors.**
- **AC-2** — When a block is malformed, then each defect surfaces as its own `steps.*` **WARN**, and
  none of them is an ERROR (a broken diagram must not block a skill from shipping).
  *Verify:* seeded file with 9 defects → **ran 2026-09-03: 9 distinct `steps.*` codes, 0 errors**
  (`steps.malformed` · `id_invalid` · `kind_unknown` · `id_duplicate` · `refs_exist` · `opt_unknown` ·
  `flow_unknown_step` · `gate_branch_unlabeled` · `flow_malformed`).
- **AC-3** — When a `ref=` names a skill that does not exist under `skills/**`, then `steps.refs_exist`
  names it and suggests the `atlas:` form. Refs prefixed `atlas:` are **not** checked here — this repo
  cannot see that graph, and a check that cannot fail is worse than none.
  *Verify:* the seeded file above (`ref=slide-storyline-desiner`).
- **AC-4** — The new keys do **not** reach the published marketplace copy.
  *Verify:* `npx tsx scripts/ingest.ts .` then `grep -E '^(steps|flow|handoff|executed_by|execution_mode):' content/skills/1.24.md`
  → **ran 2026-09-03: no match.** (`normalized` is an explicit allowlist; the keys are absent from it
  on purpose.)
- **AC-5** — All six slide skills still validate.
  *Verify:* `validate-skill.ts` over the six → **ran 2026-09-03: 6/6 pass, 0 errors.**
- **AC-6** — `zynkr-slide`'s body no longer cites the dead sheetIds `1.12` / `1.13` / `1.14`.
  *Verify:* `grep -c '(1\.12)\|(1\.13)\|(1\.14)' skills/1-brand-marketing/zynkr-slide/SKILL.md` → **0**.

## Design sketch

- **Data:** none. Five optional frontmatter keys.
- **Surfaces:** `scripts/validate-skill.ts` (typed schema entries + `checkSteps`, registered in
  `runChecks`) · `scripts/ingest.ts` (the mirrored schema entries only — **not** the `normalized`
  allowlist) · `SKILL_SPEC.md` §1 · the six slide `SKILL.md` files.
- **Decisions:**
  - **Pipe-delimited quoted strings, not nested YAML maps.** A block sequence of quoted scalars is
    the one shape that survives *every* parser that reads these files — this repo's `gray-matter`,
    Atlas's deliberately-small subset parser, and Atlas's separate importer parser — with no change
    to any of them. A list of maps would have needed all three widened, and the importer's copy has
    already rotted silently once.
  - **WARN, never ERROR.** Mirrors the `ipo.length` precedent: the pipeline warns about things that
    degrade output, and blocks only on things that corrupt it.
  - **`atlas:` prefix for cross-graph refs.** Makes the namespace explicit, so the upstream check is
    honest about what it can verify and Atlas's resolver has no slug-vs-key ambiguity to guess at.
  - **Not published.** Rejected mirroring the keys into `content/<id>.md`: Atlas reads the repo file,
    so publishing them would put one declaration in two places with no gate keeping them equal.

## Out of scope

- Any other skill's block — only the six slide files are touched. (`product-flow-design` was
  considered and deliberately deferred by the owner, 2026-09-03.)
- The cross-file catalog check (`SKB-001`), which is what would let `steps.refs_exist` run over the
  whole tree rather than one file at a time.

## Tasks

- [x] `SKB-012`.1 Typed optional entries in both schemas (`validate-skill.ts`, `ingest.ts`).
- [x] `SKB-012`.2 `checkSteps` + registration in `runChecks`.
- [x] `SKB-012`.3 The pilot block on `zynkr-slide`; `handoff:` on the five siblings.
- [x] `SKB-012`.4 `SKILL_SPEC.md` §1 — the picture fields, with the grammar.
- [x] `SKB-012`.5 Fix the dead sheetIds in `zynkr-slide`'s body (`ATL-026` ruled the fix belongs here).
- [x] `SKB-012`.6 Mirror the frontmatter into the zh-TW runtime copies under `~/.claude/skills/`.

## Verification plan

`validate-skill.ts` on each changed file (the same engine `qa.yml` runs), a seeded-violation run to
prove the new check fires, and a local `ingest.ts` run to prove the keys stay out of the published
artifact and that nothing else in the tree moved. Build artifacts (`content/`, `generated/`) are
reverted after the local run — CI's push backstop regenerates them.

## Doc-sync footprint

Same-commit: `SKILL_SPEC.md` · `docs/CHANGELOG.md` · this spec · `to-do.md` (gitignored — the tracker
line will not appear in the diff, called out in the commit body).
