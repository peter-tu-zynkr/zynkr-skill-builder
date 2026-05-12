# Zynkr Skills — Architecture

## Pipeline

```
any input (GitHub link / URL / text)
      ↓
/skill-sourcer (Claude Code)
      ↓  extract → classify → dedup check
Zynkr Skills Pipeline (Google Sheet)
      ↓  row added (Status=proposed, Keep=?)
      ↓  human sets Keep=Y
zynkr-skill-idea (GitHub issue auto-created)
      ↓
      ↓  create skills/[category]/[slug]/SKILL.md
zynkr-skill-builder
      ↓  push to main → ingest-skills.yml fires
      ↓  ingest.ts + build-marketplace.ts → generated/*.json committed
      ↓
zynkr.ai/ai-skills-marketplace (fetches raw GitHub URLs on page load)
```

---

## Repos

| Repo | Visibility | Role |
|---|---|---|
| [`zynkr-skill-idea`](https://github.com/peter-tu-zynkr/zynkr-skill-idea) | Private | Ideas backlog (GitHub issues) |
| [`zynkr-skill-builder`](https://github.com/peter-tu-zynkr/zynkr-skill-builder) | **Public** | Skill source + CI/CD + generated artifacts |
| [`zynkr-website`](https://github.com/peter-tu-zynkr/zynkr-website) | — | Frontend — reads from production raw URLs at runtime |
| ~~`zynkr-skills-staging`~~ | Archived | Merged into production — no longer used |

---

## Gate 1 — Idea Capture

**Tool:** `/skill-sourcer` in Claude Code  
**Sheet:** [Zynkr Skills Pipeline](https://docs.google.com/spreadsheets/d/1_0bYyZiB6sGEI4nGw1QDgLip4rRQtNh9ybPGs-WXAMA) — tab `Pipeline`

Runs 4 subagents in sequence:

| Subagent | What it does |
|---|---|
| **extractor** | Pulls name, description, input/output, source URL from raw input; for GitHub links, extracts `owner/repo` as `upstream_repo` |
| **classifier** | Maps to one of 9 taxonomy categories (0–9) |
| **deduplicator** | Checks Google Sheet for existing duplicates |
| **proposer** | Appends row: `Status=proposed`, `Keep=?`, `upstream_repo` column populated if external |

On approval (`Keep=Y`):
- Row updated to `Status=approved`
- GitHub issue opened in `zynkr-skill-idea` with label `skill-proposal`
- Issue URL written back to column K

---

## Gate 2 — Build & Ship

**Repo:** [`zynkr-skill-builder`](https://github.com/peter-tu-zynkr/zynkr-skill-builder)

### Folder structure

```
skills/
  [N]-[category]/
    [skill-slug]/
      SKILL.md          ← orchestrator or standalone skill
      agents/
        [agent].md      ← subagents (each needs same 6 required fields)
```

### Required SKILL.md frontmatter

```yaml
name: skill-name
description: "One-line trigger description"
category: brand-marketing        # see taxonomy below
project: skill-slug
platform: claude
status: Done                     # Done | WIP | Not started | Pause | Out dated
author: Peter Tu
input: "What the user provides"
process: "What the skill does"
output: "What gets produced"
synergy: []
upstream_repo: vercel-labs/agent-browser   # optional: owner/repo of the original third-party source
```

`upstream_repo` is an optional field for skills sourced from external GitHub repos. It is `owner/repo` format only (no full URL). Omit it for internally authored skills.

**Rules that cause ingest to skip a file:**
- Missing any of: `name`, `category`, `project`, `platform`, `status`, `author`
- `category` not in the canonical 9 values (never `sales` → use `business-consulting`)
- `status` not exactly matching allowed values
- `description` value containing `:` without being quoted

### Taxonomy

| # | Category key | Use for |
|---|---|---|
| 0 | `strategy` | Vision, OKRs, decisions |
| 1 | `brand-marketing` | Content, copywriting, social |
| 2 | `business-consulting` | Sales, proposals, CRM |
| 3 | `operations` | SOPs, project tracking |
| 4 | `training` | Courses, transcripts, onboarding |
| 5 | `product` | Roadmap, UX, GTM, product analytics |
| 6 | `engineer` | Platform, infra, automation, data, tooling |
| 7 | `people` | Recruiting, HR, org design |
| 8 | `finance-admin` | Budgeting, invoicing |
| 9 | `legal` | Contracts, compliance |

---

## CI/CD — `ingest-skills.yml`

**Trigger:** push to `main` where `skills/**` changed, or `workflow_dispatch`

**Steps:**
```
npm ci (in scripts/)
  ↓
ingest.ts "$GITHUB_WORKSPACE/skills"
  → scans skills/ locally (two-level category/project scan)
  → writes content/skills/*.md (with firstSeen preserved on re-ingest)
  → fetches GitHub API for any skill with upstream_repo set
      → appends githubStars to generated/skills.json
  → writes generated/skills.json
  ↓
build-marketplace.ts
  → reads generated/skills.json
  → passes upstream_repo, github_stars, first_seen into both index + detail JSON
  → writes generated/skills-index.json + generated/skills-detail.json
  ↓
git commit + push → generated/ committed back to main
```

No PAT needed — `GITHUB_TOKEN` with `contents: write` covers everything. The same token is used as the GitHub API `Authorization` header for star fetches (avoids the 60 req/hr unauthenticated limit).

### Source attribution fields in generated JSON

| Field | Where | Description |
|---|---|---|
| `upstream_repo` | index + detail | `owner/repo` of the original third-party source |
| `github_stars` | index + detail | Star count fetched from GitHub API at ingest time |
| `first_seen` | index + detail | ISO date the skill was first ingested; preserved on re-ingest |
| `github_url` | detail only | Direct link to the source file in the hosting repo |

---

## FE — `zynkr.ai/ai-skills-marketplace`

**File:** [`ai-skills-marketplace.html`](https://github.com/peter-tu-zynkr/zynkr-website/blob/main/ai-skills-marketplace.html)

Fetches live on every page load — no Vercel redeploy needed. Phase 1 (shipped 2026-05-12) hits Vercel + Supabase first, with the raw-GitHub URLs as a fallback for the ~2-week stabilisation window:

```javascript
// Primary: Vercel Functions backed by the Supabase read mirror
const SKILLS_INDEX_URL = '/api/skills';
const SKILLS_DETAIL_URL = '/api/skills/details';

// Fallback (to be removed after ~2 weeks of clean /api/skills* logs)
const FALLBACK_INDEX_URL = 'https://raw.githubusercontent.com/peter-tu-zynkr/zynkr-skill-builder/main/generated/skills-index.json';
const FALLBACK_DETAIL_URL = 'https://raw.githubusercontent.com/peter-tu-zynkr/zynkr-skill-builder/main/generated/skills-detail.json';
```

After each ingest run, `ingest-skills.yml` POSTs `generated/skills-detail.json` to `/api/skills/sync` (HMAC-SHA-256 signed) so the Supabase `skills` table mirrors the latest push. The raw-GitHub fallback still serves stale-but-correct data if the API or DB is down. GitHub CDN caches raw URLs for ~5 minutes.

---

## End-to-End Timing

| Step | Trigger | Latency |
|---|---|---|
| Push SKILL.md to `main` | Manual | — |
| `ingest-skills.yml` runs | Auto | ~1–2 min |
| `generated/*.json` committed | Auto | end of CI |
| FE reflects on next hard refresh | Auto | up to 5 min (CDN cache) |

**Total: ~5–7 minutes from push to live.**
