# Lean Repo Refactor Plan

## Goal

Simplify the current marketplace architecture from an ops-heavy multi-repo flow into a leaner model that matches current team size and submission volume.

Target principle:
- keep the website separate
- keep the skills source separate
- remove the extra operational repo layer for now

## Recommended Target Architecture

```text
product-ideas -> zynkr-skills -> zynkr-website -> zynkr.ai
```

Role boundaries:
- `product-ideas`
  backlog, raw ideas, early notes, rough intake
- `zynkr-skills`
  draft skills, review-ready skills, approved published skills, validation scripts, generated marketplace artifacts
- `zynkr-website`
  static presentation layer that reads copied JSON artifacts

## Why Change

The current separation between:
- idea capture
- staging/review
- published skills
- website rendering

is defensible at scale, but likely too expensive right now.

Current overhead:
- cross-repo coordination
- duplicated README and architecture maintenance
- extra PR handoff steps
- more places where artifact sync can drift

For the current operating model, the main needs are simpler:
- capture ideas
- build and refine skills
- publish approved skills
- render them on the website

## Proposed `zynkr-skills` Structure

```text
zynkr-skills/
  drafts/
  skills/
    writing-agent/
      SKILL.md
      meta.json
  scripts/
  generated/
  docs/
  README.md
```

Recommended metadata fields:
- `status`: `draft | review | published`
- `visibility`: `private | public`
- `slug`
- `summary`
- `category`
- `project`
- `platform`
- `author`
- `tags`
- `input`
- `process`
- `output`
- `updated_at`

## Workflow After Refactor

1. Capture raw ideas in `product-ideas`
2. Build skill packages in `zynkr-skills/drafts/` or as non-public entries in `skills/`
3. Review and refine inside `zynkr-skills`
4. Mark approved skills as `published`
5. Generate:
   - `generated/skills-index.json`
   - `generated/skills-detail.json`
6. Sync those artifacts into `zynkr-website`
7. Render statically on `zynkr.ai`

## What To Move Out Of `zynkr-skill-directory`

Move or recreate in `zynkr-skills`:
- validation scripts
- normalization logic
- generated marketplace artifact builder
- publishing contract docs
- review/staging conventions

Do not move:
- website presentation code

## What Can Stay Temporarily

During transition, `zynkr-skill-directory` can remain as a temporary migration workspace while logic is moved into `zynkr-skills`.

Temporary rule:
- no new long-term architecture should depend on `zynkr-skill-directory`
- treat it as migration scaffolding, not the final operating model

## Migration Phases

### Phase 1

Align docs:
- update READMEs so the lean target architecture is explicit
- mark `zynkr-skill-directory` as transitional

### Phase 2

Move build logic:
- migrate marketplace artifact generation into `zynkr-skills/scripts/`
- move or rebuild required validation logic there

### Phase 3

Move content workflow:
- create `drafts/` and/or metadata-based draft states in `zynkr-skills`
- stop using `zynkr-skill-directory` as the staging gate for new work

### Phase 4

Website sync:
- make `zynkr-website` consume artifacts generated from `zynkr-skills`
- remove dependency on `zynkr-skill-directory` outputs

### Phase 5

Retire or archive:
- archive `zynkr-skill-directory`, or
- keep it only as historical migration tooling if still useful

## Decision Rule For Re-Expanding Later

Bring back a dedicated operational repo only if:
- multiple contributors regularly submit skills
- review queues become active and time-consuming
- approval workflow becomes materially different from authoring
- automation makes the extra repo cheaper than keeping everything in one place

Until then, optimize for fewer repos and fewer handoffs.
