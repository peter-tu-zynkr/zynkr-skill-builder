# Zynkr Skills — Architecture

## Pipeline — front door + canonical 4-skill chain

```
                    ┌────────────────────────────────────────────────────┐
                    │  /zynkr-skills  ── front-door router (Touchpoint 0)│
                    │  classifies any input + state, then dispatches:    │
                    └─────────────────────┬──────────────────────────────┘
                                          ▼
/skill-sourcer  →  /skill-triager  →  /skill-creator  →  /skill-publish  →  /skill-triager
  (find idea)       (Option A:        (build SKILL.md   (land + dispatch)    (Option D:
                     assign-build)     content)                               confirm-ship)
       │                  │                  │                  │                  │
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
   GH issue        repo_dispatch        finished           repo_dispatch       /api/skills
   + Project        skill-build-         SKILL.md          skill-publish-        verified;
   item with         request →            on               request →             Project
   triage-ready    pickup-approved-     skill/<slug>      publish-skill.yml      shipped;
   label            issue.yml             branch (or       opens PR with         issue closed
                    scaffolds stub        fresh path)       finished content
                    PR
                                                                ↓
                                                    human merges PR
                                                                ↓
                                                    ingest-skills.yml (terminal)
                                                      → generated/*.json committed
                                                      → signed POST → Supabase mirror
                                                                ↓
                                                    zynkr.ai/ai-skills-marketplace
                                                    (fetches /api/skills* on page load;
                                                     raw GitHub fallback)
```

`/zynkr-skills` is a routing layer, not a replacement. It detects input shape + pipeline state and either auto-invokes the right sub-skill (high confidence) or asks one clarifying question (ambiguous). See `process.md` "Touchpoint 0" for the routing table.

### The chain in one sentence

> **`/skill-sourcer` opens an issue, `/skill-triager` (Option A) approves it and scaffolds a stub PR, `/skill-creator` writes the real SKILL.md, `/skill-publish` lands it into the repo via dispatch, and `/skill-triager` (Option D) closes the loop after the marketplace verifies live.**

### Decouple points

Each handoff in the chain has a clean break-point. Use these when the canonical assumption doesn't fit:

| Skip | Use when | Cost |
|---|---|---|
| `/skill-sourcer` | A finished SKILL.md drops in cold (downloaded, third-party, hand-authored) — enter at `/skill-publish` **fresh-intake mode** | Lose source attribution |
| `/skill-triager` scaffold | `/skill-creator` ran standalone; no `skill/<slug>` branch exists yet — run `/skill-publish` directly against the approved issue | Lose the second-look gate |
| `/skill-creator` | Trivial skill or porting an existing prompt — hand-write the SKILL.md | Lose eval rigor |
| `/skill-publish` | The scaffold PR is sufficient — merge it after writing the body inline | Lose the publish-skill.yml audit comment + Project bookkeeping |
| `/skill-triager` Option D | Low-stakes / personal skills — merge and ignore the Project | Audit trail stays at `ready-to-ship` |

The pipeline survives any single skip — what's lost is the specific value-add that step provides.

---

## Repos

| Repo | Visibility | Role |
|---|---|---|
| [`zynkr-skill-idea`](https://github.com/peter-tu-zynkr/zynkr-skill-idea) | Private | Ideas backlog (GitHub issues) |
| [`zynkr-skill-builder`](https://github.com/peter-tu-zynkr/zynkr-skill-builder) | **Public** | Skill source + CI/CD + generated artifacts |
| [`zynkr-website`](https://github.com/peter-tu-zynkr/zynkr-website) | — | Frontend — reads from production raw URLs at runtime |

---

## Gate 0 — Front door (`/zynkr-skills`)

**Tool:** `/zynkr-skills` in Claude Code  
**Purpose:** route any input to the right sub-skill without making the user remember the routing rules.

`/zynkr-skills` is the one-stop entry point for unstructured input. It classifies what the user dropped in, looks up state across four signals (GitHub Project, issue labels, on-disk SKILL.md, live `/api/skills`), and either auto-invokes the right sub-skill via the **Skill** tool or asks one targeted clarifying question. It does **not** replace direct invocation of `/skill-sourcer`, `/skill-triager`, etc. — power users still call them directly. `/zynkr-skills` is the catch-all for everyone else.

Lives at `skills/6-engineer/zynkr-skills/SKILL.md`. See `process.md` Touchpoint 0 for the full routing table and the "when to skip `/zynkr-skills`" guidance.

## Gate 1 — Idea capture (`/skill-sourcer`)

**Tool:** `/skill-sourcer` in Claude Code  
**Pipeline state:** GitHub Project on `peter-tu-zynkr/zynkr-skill-idea` — every entry is an Issue + Project item with custom fields (`Pipeline Status`, `Keep`, `Category`, `Intake Source`, `Build *`)

Runs 4 subagents in sequence:

| Subagent | What it does |
|---|---|
| **extractor** | Pulls name, description, input/output, source URL from raw input; for GitHub links, extracts `owner/repo` as `upstream_repo` |
| **classifier** | Maps to one of the 10 taxonomy categories (0–9) |
| **deduplicator** | Scans the GitHub Project for `exact_duplicate`, `near_duplicate`, `partial_overlap`, or `new` |
| **proposer** | Creates an issue (`skill-proposal` label) + Project item: `Pipeline Status=proposed`, `Keep=?`, `Intake Source=skill-sourcer`, `Build Status=not-started`, `Artifact=issue-only` |

On approval (`Keep=yes`):
- Project item → `Pipeline Status=approved`
- `triage-ready` label added — signal for `/skill-triager`
- Optional spec md at `zynkr-skill-idea/skills/approved/{slug}.md`

## Gate 2 — Triage (`/skill-triager`, Option A)

The second-look gate that fires the build dispatch. See [process.md Touchpoint 2](process.md) for the full flow.

- Default for `Intake Source=skill-sourcer` items: **`assign-build`** → `repository_dispatch skill-build-request` → `pickup-approved-issue.yml` opens a `skill/<slug>` PR with a stub SKILL.md
- Sub-decision: `rescaffold` (default, Peter-authored) or `lift-and-shift` (mirror upstream README as-is)

## Gate 3 — Build SKILL.md content (`/skill-creator`)

Anthropic-published skill in `~/.claude/plugins`. Used on the `skill/<slug>` branch to fill in the stub. Captures intent, drafts content, optionally runs evals (with-skill vs baseline), iterates on user feedback, optimises the description for triggering accuracy.

Output: a complete SKILL.md ready for landing. Either committed in-place on the branch (canonical) or sitting in `/skill-creator`'s workspace (decoupled).

## Gate 4 — Publish (`/skill-publish`)

Lands the finished SKILL.md into the repo via dispatch. Two modes:

- **Continuation (canonical):** attaches to the existing sourcer-opened issue. No new issue, no re-classification.
- **Fresh intake (fallback):** runs the full classifier + deduplicator + proposer chain (sharing subagents with `/skill-sourcer`) and creates a new issue with `Intake Source=skill-publish`.

Both modes fire `repository_dispatch skill-publish-request` → `publish-skill.yml` opens a PR titled `publish(<slug>): from ...`.

## Gate 5 — Confirm-ship (`/skill-triager`, Option D)

After the PR merges and `ingest-skills.yml` runs, `/skill-triager` Option D runs three read-only verifications (`gh api contents`, `skills-index.json`, `/api/skills`) and flips Project to `shipped`. Bookkeeping only — no dispatch fired.

---

## Repo conventions (`zynkr-skill-builder`)

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
- `category` not in the canonical 10 values (never `sales` → use `sales-consultant`)
- `status` not exactly matching allowed values
- `description` value containing `:` without being quoted

### Taxonomy

| # | Category key | Use for |
|---|---|---|
| 0 | `strategy` | Vision, OKRs, decisions |
| 1 | `brand-marketing` | Content, copywriting, social |
| 2 | `sales-consultant` | Sales, proposals, CRM |
| 3 | `operations` | SOPs, project tracking |
| 4 | `training` | Courses, transcripts, onboarding |
| 5 | `product` | Roadmap, UX, GTM, product analytics |
| 6 | `engineer` | Platform, infra, automation, data, tooling |
| 7 | `people-talent` | Recruiting, HR, org design |
| 8 | `finance-admin` | Budgeting, invoicing |
| 9 | `legal` | Contracts, compliance |

---

## CI/CD — three workflows, distinct purposes

```
.github/workflows/
├── ingest-skills.yml          ← shared: push-to-main → marketplace publish
├── pickup-approved-issue.yml  ← sourcer path: scaffold a new SKILL.md from a triaged idea
└── publish-skill.yml          ← publish path: land an author-supplied SKILL.md
```

| Workflow | Trigger | Dispatch event | Purpose |
|---|---|---|---|
| `ingest-skills.yml` | push to `main` where `skills/**` changed (also `workflow_dispatch`) | — | Run ingest + build-marketplace, commit `generated/*.json`, POST signed webhook to Supabase. **The only path to the marketplace.** |
| `pickup-approved-issue.yml` | `repository_dispatch` from `/skill-triager` (Option A `assign-build`) (also `workflow_dispatch`) | `skill-build-request` | Fetch the source issue, scaffold a stub SKILL.md (`rescaffold` mode) or mirror an upstream README (`lift-and-shift` mode). Opens a PR titled `scaffold(<slug>): from ...`. |
| `publish-skill.yml` | `repository_dispatch` from `/skill-publish` (also `workflow_dispatch`) | `skill-publish-request` | Land an **author-supplied** SKILL.md (via `skill_md_url` OR `skill_md_b64`). Validate frontmatter. Opens a PR titled `publish(<slug>): from ...`. |

The scaffold and publish workflows are siblings — both end with `ingest-skills.yml` running on the merged PR, which is the single shared path to the marketplace. They differ only in **who authored the body**: `pickup-approved-issue` produces a stub for a human to fill, `publish-skill` accepts a complete SKILL.md.

---

## CI/CD detail — `ingest-skills.yml`

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

After each ingest run, `ingest-skills.yml` POSTs `generated/skills-detail.json` to the sync webhook (HMAC-SHA-256 signed) so the Supabase mirror reflects the latest push. The raw-GitHub fallback still serves stale-but-correct data if the API or DB is down. GitHub CDN caches raw URLs for ~5 minutes.

---

## End-to-End Timing

| Step | Trigger | Latency |
|---|---|---|
| Push SKILL.md to `main` | Manual | — |
| `ingest-skills.yml` runs | Auto | ~1–2 min |
| `generated/*.json` committed | Auto | end of CI |
| FE reflects on next hard refresh | Auto | up to 5 min (CDN cache) |

**Total: ~5–7 minutes from push to live.**
