# Data Source Strategy

This document defines the recommended source-of-truth model for the Zynkr skill directory.

## Recommendation

Use repo-managed structured content as the canonical inventory source.

Do not keep the long-term source of truth in:

- `front-end/lib/skills-data.ts`
- Google Sheets

Both are acceptable temporary tools, but neither is the best primary model for a growing catalog that needs reviewability, schema discipline, and maintainable deploys.

## Why

`skills-data.ts` is weak as a content system because:

- content and application code are mixed together
- non-trivial edits become noisy code diffs
- validation is implicit instead of explicit
- future ingestion by backend or tooling becomes harder

Google Sheets is weak as the canonical source because:

- schema drift is easy
- review flow is weak compared with PRs
- rich fields and nested structures become awkward
- deployment reproducibility is worse
- backend sync and auth add operational complexity early

## Recommended Architecture

### Canonical source

Store one record per skill in repo-managed content files.

Suggested layout:

```text
content/
  skills/
    0.01.md
    1.01.md
    1.02.md
  taxonomy/
    categories.json
    projects.json
generated/
  skills.json
```

Recommended file shape for each skill:

- markdown or MDX body for human-readable notes, setup text, and future docs
- frontmatter for structured fields such as `id`, `category`, `project`, `platform`, `status`, `author`, `updatedAt`, `synergy`, `installCommand`, and `docLink`

Example:

```md
---
id: "1.01"
category: "品牌行銷"
project: "writing-assistant"
name: "寫作助理 ─ 靈感發想"
platform: "claude"
status: "Done"
author: "Peter Tu"
updatedAt: "8/13"
synergy: ["1.01", "1.02", "1.03"]
installCommand: "curl -sL https://zynkr.ai/s/1.01.md -o ~/.claude/skills/writing-ideation.md"
docLink: ""
input: "A user inquiry describing a task or need to be solved."
process: "Interpret the intent, match it against a structured assistant index..."
output: "A concise recommendation..."
---

Optional long-form notes, setup detail, editorial comments, or future documentation can live here.
```

### Build-time normalization

Add a script that:

1. reads all content files
2. validates them against a schema
3. normalizes them into one stable output artifact
4. writes `generated/skills.json`

That generated artifact becomes the contract consumed by:

- the frontend directly at build time
- the backend later, if an API is needed

### Validation

Use a formal schema with `zod` or JSON Schema to enforce:

- required fields
- enum values
- slug consistency
- valid cross-links in `synergy`
- project-to-taxonomy mapping

Validation should fail the build on bad content.

## Migration Path

### Phase 1

Keep the frontend build simple.

- create `content/skills/`
- move a few records out of `front-end/lib/skills-data.ts`
- add a parser and validator
- generate `generated/skills.json`
- switch the frontend to import `generated/skills.json` instead of `skills-data.ts`

### Phase 2

Move taxonomy out of frontend code if needed.

- either keep taxonomy in code if it remains mostly static
- or move categories and projects to `content/taxonomy/`

### Phase 3

Add backend ingestion only if needed.

- backend reads the same generated artifact
- API adds filtering, search, raw file delivery, and future integrations

### Phase 4

Move to CMS or database only when there is a real operational reason.

Triggers for that move:

- non-technical editors need frequent updates
- drafts and approvals are required
- multiple writers need granular permissions
- inventory updates must happen outside deploy cycles
- analytics, sync, or dynamic search become first-class requirements

## Decision Rule

Use Git as the source of truth first.

Use a CMS or database later only when the editing workflow or operational requirements justify the added system complexity.
