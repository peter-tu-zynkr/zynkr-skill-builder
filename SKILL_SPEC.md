# SKILL.md Authoring Spec

**Status:** v1 — adopted 2026-05-15.
**Scope:** every SKILL.md file under `skills/` in this repo.
**Enforced by:** `scripts/validate-skill.ts` (frontmatter) + this doc (everything else, reviewer-enforced).

This is the canonical authoring contract. If you're scaffolding, retrofitting, or reviewing a SKILL.md, the rules below are the bar. Anything not listed here is up to the author.

> **Reference standard:** the [skills.sh](https://skills.sh) format (e.g. [skill-creator](https://skills.sh/anthropics/skills/skill-creator)) — install snippet at the top, a one-paragraph summary, then the body. Zynkr extends that pattern with stricter frontmatter and explicit attribution.

---

## TL;DR — every SKILL.md must have

1. **Frontmatter** — passes `npm run validate` (schema below)
2. **Title** — H1 matching `name`
3. **Install snippet** — one fenced code block, near the top
4. **Summary paragraph** — what + when to trigger, in plain prose
5. **Numbered workflow** — `## Step 1`, `## Step 2`, … OR `## Workflow` if linear
6. **Attribution block** — if lifted from an upstream repo, credit the original author
7. **Relative paths only** — no `/Users/...` or any absolute on-disk path

---

## 1. Frontmatter contract

Frontmatter is YAML between two `---` fences at the very top of the file. The schema below mirrors `scripts/validate-skill.ts` — when this doc and the validator disagree, the validator wins and this doc is updated.

### Required fields

| Field | Type | Rule |
|---|---|---|
| `name` | string | The skill slug. Lowercase kebab-case. Must match the folder name and the H1. |
| `category` | enum | One of the **taxonomy keys** below (not the folder name). |
| `project` | string | Stable project slug. Usually equals `name` for single-skill projects. |
| `platform` | enum | `gpt` · `claude` · `gemini` · `multi` |
| `status` | enum | `Done` · `WIP` · `Not started` · `Pause` · `Out dated` |
| `author` | string | The **original** creator. Use `Peter Tu` only when the work is genuinely original (see §6 Attribution). |

**Taxonomy keys** (validator-enforced — note these are **not** the folder names):

| Folder | `category:` value |
|---|---|
| `0-strategy/` | `strategy` |
| `1-brand-marketing/` | `brand-marketing` |
| `2-sales-consultant/` | `business-consulting` |
| `3-operations/` | `operations` |
| `4-training/` | `training` |
| `5-product/` | `product` |
| `6-engineer/` | `engineer` |
| `7-people/` | `talent-development` |
| `8-finance-admin/` | `finance-admin` |
| `9-legal/` | `legal` |

### Recommended fields

| Field | Type | Use it when |
|---|---|---|
| `description` | string | **Strongly recommended.** This is what the harness reads to decide if your skill should fire. See §3 for what makes a good description. |
| `input` | string | One-line description of what the user must supply. |
| `process` | string | One-line description of how the skill works. |
| `output` | string | One-line description of what the user gets back. |
| `synergy` | string[] | Slugs of related skills. Defaults to `[]`. |

### Attribution fields (required when lifted from an upstream)

| Field | Type | Rule |
|---|---|---|
| `upstream_repo` | string | URL of the original repository (e.g. `https://github.com/anthropics/skills`). |
| `original_source_url` | string | URL of the original SKILL.md or equivalent canonical file. |
| `original_author` | string | Author handle or name as published upstream. |

> **Validator note:** `original_source_url` and `original_author` are enforced by `scripts/validate-skill.ts` and `scripts/ingest.ts` as of 2026-05-15. The rule is **all-or-nothing**: if any of `upstream_repo` / `original_source_url` / `original_author` is set, all three must be set.

### Optional fields

- `disable-model-invocation: true` — opt the skill out of automatic triggering (rare; used when the skill is meant to be called by another skill, not the model).
- `security_audits` — object with `gen_agent_trust_hub`, `socket`, `snyk` each set to `pass | fail | pending`.

---

## 2. Easy installation — one-command snippet

Every SKILL.md must include exactly one install snippet, placed **immediately after the H1**. Format follows the skills.sh convention:

````markdown
# <Title>

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill <slug>
```
````

Rules:
- Use the **canonical** repo URL — `peter-tu-zynkr/zynkr-skill-builder` for Peter-authored skills, or the upstream URL for re-hosted skills (see §6).
- `<slug>` must equal the frontmatter `name`.
- Exactly one snippet per file. Do not add Claude Code, Cursor, or Cline variants — those are downstream concerns.

---

## 3. Summary paragraph — what triggers the skill

Two parts:

1. **The `description:` frontmatter field** is what the model actually reads at trigger-time. Make it specific. Include:
   - What the skill does (one clause)
   - When to use it (one clause — list real trigger phrases the user might type)
   - Optional: what it explicitly does *not* do, if confusion is likely

   **Good example** (from `write-newsletter/SKILL.md`):
   > "Drafts Peter's weekly Chinese newsletter by combining three sources: (1) the user's article outline or topic, (2) last 7 days of Threads engagement data, and (3) Claude Code /insights from the past week. Use this skill whenever Peter says '幫我寫電子報', '來寫電子報', '寫 newsletter', or shares a topic/outline and wants it shaped into a newsletter."

   **Weak example** (avoid):
   > "Polish long video lecture transcripts into lecturer-friendly readout scripts."
   *(Why it's weak: no trigger phrases, no scope boundary.)*

2. **The body's first paragraph** — written for a human reader who has just landed on the page. Three sentences max:
   - What the skill does (in plain prose, not frontmatter shorthand)
   - Who it's for / when to use it
   - What makes it different from generic LLM output, if anything

---

## 4. Body structure

Required headings, in order:

```markdown
# <Title>

<install snippet>

<summary paragraph>

---

## Step 1 — <action>
## Step 2 — <action>
...
```

Or for a linear, non-step workflow:

```markdown
## Workflow

1. <action>
2. <action>
...
```

Recommended additional sections (in this order when used):

- `## Inputs` — list every input the skill expects
- `## Outputs` — describe the artifact(s) produced
- `## Configuration` — any config files the skill reads (use relative refs — see §5)
- `## Reference files` — link to sibling docs under `references/` or `agents/`
- `## Limitations` — known failure modes, scope boundaries

---

## 5. Path conventions — no absolute paths

SKILL.md files are installed into arbitrary user environments. Hardcoded paths like `/Users/petertu/Desktop/...` break on install.

**Rules:**

- Reference sibling files relatively: `./config.md`, `./references/filler_words_zh.md`, `./agents/skill-extractor.md`
- If you need to point at "the skill's own folder," use the placeholder `{{SKILL_DIR}}` — the harness substitutes it at load time.
- Do not embed `<!-- SKILL BASE PATH: ... -->` comments. They are legacy and being removed.
- External data the user must provide goes through frontmatter or runtime args, not hardcoded paths.

**Existing offenders to retrofit in Phase C:**
- `skills/2-sales-consultant/biz-card/SKILL.md`
- `skills/2-sales-consultant/inbound-sales-project-init/SKILL.md`
- `skills/6-engineer/skill-sourcer/SKILL.md` (line 23 base-path comment)

---

## 6. Attribution — author vs original_source_url

The honest-by-default rule: **`author` is who wrote the original, not who imported it.**

### Case A — Original work by Peter

```yaml
author: Peter Tu
```
No `upstream_repo` / `original_source_url` / `original_author` needed.

### Case B — Lifted from an upstream author with no modifications worth claiming

```yaml
author: <original author handle>
upstream_repo: https://github.com/<owner>/<repo>
original_source_url: https://github.com/<owner>/<repo>/blob/main/skills/<slug>/SKILL.md
original_author: <original author display name>
```
The install snippet's URL should point at the **upstream** repo, not Peter's fork.

### Case C — Derivative work (Peter materially adapted an upstream skill)

```yaml
author: Peter Tu (derivative of <original author>)
upstream_repo: https://github.com/<owner>/<repo>
original_source_url: https://github.com/<owner>/<repo>/blob/main/skills/<slug>/SKILL.md
original_author: <original author display name>
```
Install snippet uses Peter's repo. Add a `## Attribution` section near the bottom describing what was changed and why.

### Re-host vs link-out

The policy decision (re-host with attribution vs link out only) is owned by `zynkr-skill-idea/to-do.md` Phase 2. Until that's locked, default to **Case B** for any upstream-sourced skill — re-host with full attribution.

---

## 7. Template — copy this to start a new SKILL.md

````markdown
---
name: my-skill-slug
description: "What it does in one clause. Use this skill when the user says 'trigger phrase 1', 'trigger phrase 2', or asks for X. Does not do Y."
category: brand-marketing
project: my-skill-slug
platform: claude
status: WIP
author: Peter Tu
input: "One-line description of the input the user supplies"
process: "One-line description of how the skill works"
output: "One-line description of what the user gets back"
synergy: []
---

# My Skill Slug

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill my-skill-slug
```

One paragraph for a human reader: what the skill does, who it's for, and what makes it different from a generic LLM response.

---

## Step 1 — <first action>

...

## Step 2 — <second action>

...

## Outputs

...
````

---

## 8. Validating before push

```bash
cd scripts
npm run validate -- ../skills/<N-category>/<slug>/SKILL.md
```

Or scan the whole tree:

```bash
npm run validate
```

CI runs the same validator on every push to `main`. Failing files block ingest.

---

## Change log

- **v1 (2026-05-15)** — initial spec. Bakes in install snippet, summary discipline, taxonomy-key clarification, path convention, and attribution fields. Validator + ingest schema extended same-day to enforce attribution trio and add `legal` to TAXONOMY (`scripts/validate-skill.ts`, `scripts/ingest.ts`).
