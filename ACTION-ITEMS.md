# Action Items

Canonical task tracker for the Zynkr skill directory.

This file is organized into:
- `Current Focus`: the immediate execution queue
- `Remaining Plan`: a MECE forward plan by workstream
- `Progress Log`: dated history in reverse chronological order

---

## Current Focus

### Now

- [x] Implement raw markdown serving for Claude install URLs at `frontend/app/s/[id]/route.ts`
- [x] Verify the install flow end-to-end with `curl -sL zynkr.ai/s/1.01.md -o ~/.claude/skills/writing-agent.md` (local confirmed; production pending deploy)
- [x] Replace remaining hardcoded project rendering with generated-data-driven rendering
- [ ] Decide the next content ingestion batch after `writing-agent` core
- [ ] Deploy the frontend to Zeabur once raw file serving is in place

### Current Facts

- [x] Frontend reads generated artifacts through `frontend/lib/generated-skills.json`
- [x] Backend now defaults to reading `generated/skills.json`
- [x] `writing-agent` core (`1.01`–`1.08`) has been ingested
- [x] Shared UI shell/header-footer is in place
- [x] Cleanup of dead catalog-era frontend files is complete

---

## Remaining Plan

### Workstream A — Delivery Surface

Goal:
make the public site and install URLs work as a coherent user-facing product

### A1. Raw file delivery

- [x] Add `frontend/app/s/[id]/route.ts` to serve `content/skills/{id}.md` as `text/plain`
- [x] Return 404 for unknown skill IDs
- [x] Confirm route shape matches generated `installCommand`
- [x] Test local route behavior against at least `1.01` — confirmed serving raw markdown and 404 on unknown IDs

### A2. Production deployment

- [ ] Push the current repo state to `main`
- [ ] Create/connect the Zeabur project
- [ ] Set frontend service root to `frontend/`
- [ ] Set required Zeabur environment variables
- [ ] Point `zynkr.ai` DNS to Zeabur
- [ ] Verify SSL and production routing
- [ ] Re-test install URL behavior on production

---

### Workstream B — Application Data Model And Rendering

Goal:
make the app consume normalized/generated data consistently, without hardcoded project assumptions

### B1. Remove hardcoded taxonomy rendering

- [x] Derive project listing pages from generated skills instead of `projects[]` in `taxonomy.ts`
- [x] Derive `[category]/[project]` static params from generated skills
- [ ] Remove helpers that depend on hardcoded project objects if they are no longer needed (deferred to B2)
- [x] Keep only category-level presentation metadata in `taxonomy.ts` if still useful
- [x] Verify all current routes still build and resolve

### B2. Close the metadata gap between source repos and UI

- [ ] Add explicit project display metadata such as `projectName` and `projectDescription`
- [ ] Decide whether `useWhen` and/or `sourceDescription` should be first-class fields
- [ ] Stop overloading long prompt prose as web-app `process` text
- [ ] Update ingest output so UI-facing fields are normalized intentionally rather than inferred ad hoc

### B3. Backend/API alignment

- [ ] Decide whether the frontend should remain build-time artifact-first or move to backend fetches
- [ ] If backend remains in scope, extend backend filters to support `project`, `kind`, and `stage`
- [ ] Keep the backend contract aligned with generated artifact fields

---

### Workstream C — Content Supply

Goal:
finish migrating from legacy CSV assumptions to repo-managed content

### C1. Clean source repos

- [ ] Define the preferred source repo shape for skill projects
- [ ] Decide whether source repos should carry explicit catalog metadata separate from prompt/runtime text
- [ ] Apply that source-repo standard to `writing-agent` before scaling it elsewhere

### C2. Ingest remaining projects

- [ ] Choose the next repo/group to ingest after `writing-agent` core
- [ ] Ingest one project group at a time via `scripts/ingest.ts`
- [ ] Validate `content/skills/` output and generated artifacts after each ingest
- [ ] Keep progress visible by project group, not by scattered individual patches

### C3. Remaining ingestion tracker

- [x] `1.01–1.08` — writing-agent core
- [ ] `0.01` — search-index
- [ ] `1.09–1.14` — writing-agent extensions
- [ ] `2.01–2.05` — resume
- [ ] `2.06–2.07` — interview
- [ ] `2.08` — career-coach
- [ ] `2.09–2.10` — career-consulting
- [ ] `2.11–2.12` — consulting-assistant
- [ ] `2.13–2.16` — operations-assistant
- [ ] `3.01` — strategy-planning
- [ ] `3.02–3.05` — project-management
- [ ] `3.06–3.10` — project-assistant
- [ ] `4.01` — video-review
- [ ] `5.01–5.02` — prompt-engineering
- [ ] `7.01–7.05` — recruitment
- [ ] `7.06–7.12` — course-ta
- [ ] `8.01–8.02` — sales-assistant

---

### Workstream D — Longer-Term Platform Decisions

Goal:
capture important but non-blocking architectural decisions without mixing them into the execution queue

- [ ] Decide where taxonomy metadata should live long term: code-owned or content-owned
- [ ] Decide how skill content should be edited: Git-only, structured content workflow, or CMS/admin
- [ ] Add `docLink` if prompt/reference docs should be first-class in the directory
- [ ] Decide whether backend deployment is needed beyond the current frontend-first MVP
- [ ] Decide when a database becomes justified instead of Git-managed artifacts
- [ ] Replace temporary visual assets such as the current browser tab icon when final brand assets exist

---

## Progress Log

### March 9, 2026 (session 2)

**Done:**
- [x] `frontend/app/s/[id]/route.ts` created — serves `content/skills/{id}` as `text/plain`, returns 404 for unknown IDs
- [x] `generateStaticParams` for `[category]/[project]` now derived from generated skills (not hardcoded `projects[]`)
- [x] Category page now filters projects to only those with ingested skills
- [x] Build verified clean — 22 pages, `/s/[id]` dynamic route confirmed present

**Carryover:**
- [ ] Local install flow smoke test (`curl -sL localhost:3000/s/1.01.md`)
- [ ] Zeabur deployment still not done
- [ ] Decide next content ingestion batch

---

### March 9, 2026

**Done:**
- [x] Ingest pipeline now supports orchestrator + subagent repo structures such as `CLAUDE.md`, `.claude/skills/.../SKILL.md`, and `.claude/agents/*.md`
- [x] Ingest now preserves IDs by `sourceRepo` + `sourceFile`
- [x] Writing Agent core batch ingested from `github.com/peter-tu-zynkr/writing-agent` — `1.01` orchestrator plus `1.02`–`1.08` subagents
- [x] `content/skills/1.01.md` through `content/skills/1.08.md` now exist
- [x] `generated/skills.json` and `frontend/lib/generated-skills.json` now contain 8 records for the Writing Agent project
- [x] Shared site shell added for breadcrumb header + footer across home, category, project, and skill pages
- [x] Dead catalog-era files removed: `frontend/app/catalog-client.tsx`, `frontend/components/CategoryFilter.tsx`, `frontend/components/SearchBar.tsx`
- [x] Backend default provider switched from CSV to generated JSON artifacts
- [x] Root architecture docs updated to reflect the artifact-first migration design

**Carryover:**
- [ ] Raw markdown serving route is still not implemented
- [ ] Zeabur deployment is still not done
- [ ] Hardcoded project rendering still exists in taxonomy-driven pages

### March 8, 2026

**Done:**
- [x] Frontend scaffold in `frontend/` with home, category, project, and skill detail pages
- [x] Static data in `frontend/lib/skills-data.ts` and taxonomy in `frontend/lib/taxonomy.ts`
- [x] Backend scaffold in `backend/` with `GET /health`, `GET /skills`, `GET /skills/:id`, `GET /categories`
- [x] `content/skills/` folder created
- [x] `generated/` folder created
- [x] Ingest schema defined in Zod (`scripts/ingest.ts`)
- [x] Ingest pipeline implemented — clones a repo, validates frontmatter, writes `content/skills/{id}.md`, regenerates `generated/skills.json` and `frontend/lib/generated-skills.json`
- [x] `installCommand` auto-generated by ingest as `curl -sL zynkr.ai/s/{id}.md -o ~/.claude/skills/{slug}.md`
- [x] Backend `Skill` schema expanded with `project`, `kind`, `stage`, `installCommand`, `sourceRepo`, and `sourceFile`
- [x] `description` field made optional in `Skill` type; `filterSkills` updated accordingly
- [x] `skills-data.ts` switched to generated JSON input
- [x] `writing-agent` project added to taxonomy under `brand-marketing`
- [x] First generated route build verified for `/skills/1.01` and `/brand-marketing/writing-agent`

**Carryover:**
- [ ] Raw markdown serving was not yet implemented
- [ ] Deployment was not yet done
