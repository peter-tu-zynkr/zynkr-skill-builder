# Action Items

This is the canonical project task list as of March 8, 2026.

## Current State Snapshot

- [x] Frontend scaffold exists in `frontend/`
- [x] Home page, category pages, project pages, and skill detail pages are implemented
- [x] Static data lives in `frontend/lib/skills-data.ts`
- [x] Taxonomy lives in `frontend/lib/taxonomy.ts`
- [x] Backend scaffold exists in `backend/` with `GET /health`, `GET /skills`, `GET /skills/:id`, and `GET /categories`
- [x] CSV fallback source exists via `assistant-index.csv`
- [x] Google Sheets is no longer part of the active project plan
- [x] Canonical inventory direction is Git-managed structured content plus generated artifacts
- [ ] Frontend is still using static imports instead of the backend API
- [ ] Deployment to Zeabur is not yet verified in docs

## Frontend

- [x] Replace platform-link model with install command model in `SetupGuide` component
- [x] Add `installCommand?: string` field to `Skill` type in `frontend/lib/skills.ts`
- [x] Rename "如何使用" section to "如何安裝" on skill detail page
- [x] Redesign skill detail page to two-column layout with install command as hero and metadata sidebar
- [x] Create `frontend/lib/platforms.ts` as single source of truth for platform labels and icons
- [x] Fill in `installCommand` for writing-assistant skills (1.01–1.06) — `platform` updated to `claude`
- [ ] Fill in `installCommand` for all remaining skills — blocked on backend URL pattern being confirmed (see Backend section below)
- [ ] Decide whether to keep or remove unused catalog-era files such as `frontend/app/catalog-client.tsx`, `frontend/components/CategoryFilter.tsx`, and `frontend/components/SearchBar.tsx`
- [ ] Add global navigation or shared header/footer instead of repeating top-nav markup in route pages
- [ ] Decide whether the browser tab icon should use the final brand asset instead of the temporary recreated SVG in `frontend/app/icon.svg`

## Taxonomy And Data Model

- [ ] Document the current 4-level structure clearly: Category → Project → Subagent, plus how "Skill" should be interpreted in product copy
- [ ] Decide whether "Skill" should become an explicit first-class entity in the data model or remain equivalent to a project/workflow
- [ ] Add a `docLink` field to the frontend/backend `Skill` model for Google Drive prompt docs
- [ ] Confirm that all `project` slugs in `frontend/lib/skills-data.ts` map cleanly to `frontend/lib/taxonomy.ts`

## Content Source Strategy

- [x] Adopt repo-managed structured content as the canonical inventory source instead of `frontend/lib/skills-data.ts`
- [x] Choose the on-disk format for inventory records: Markdown with frontmatter
- [x] Define a canonical content folder layout: `content/skills/{id}.md` plus `generated/skills.json`
- [x] Schema validation using Zod is implemented in `scripts/ingest.ts`
- [x] Normalization + generation step implemented in `scripts/ingest.ts` — outputs `generated/skills.json` and `frontend/lib/generated-skills.json`
- [ ] Decide whether taxonomy should remain code-owned in `frontend/lib/taxonomy.ts` or move into structured content alongside skills
- [ ] Decide who edits inventory content and whether the first version should stay Git-only or require a CMS/admin layer
- [ ] Add contributor documentation for how to add or update one skill entry through a PR
- [ ] Decide the long-term dataset solution after repo-managed content: headless CMS, internal admin + DB, or keep Git as the source of truth

### Phase 1 Next Steps

- [x] Create `content/skills/` folder (exists, currently empty with `.gitkeep`)
- [x] Choose the initial file format: Markdown with frontmatter
- [x] Define the canonical schema — implemented in `scripts/ingest.ts` (includes `installCommand`, `project`, `synergy`, etc.; `docLink` not yet added)
- [x] Add a content loader/ingest script: `scripts/ingest.ts` clones a GitHub repo and writes validated skill files
- [x] Validation in loader: Zod schema guards bad frontmatter and fails with clear messages
- [ ] Ingest actual skills into `content/skills/` — folder is empty, no skills migrated yet
- [ ] Generate `generated/skills.json` — blocked on ingesting at least one skill
- [ ] Switch the frontend from `frontend/lib/skills-data.ts` to `generated/skills.json` / `frontend/lib/generated-skills.json`
- [ ] Keep `frontend/lib/skills-data.ts` only as a temporary fallback until all records are migrated
- [ ] Add `docLink` field to the ingest schema and generated output
- [ ] Add a short contributor guide for creating one new skill file and validating it

## Backend

- [x] `backend/.env.example` exists for local setup
- [x] Fastify server bootstrap exists in `backend/src/server.ts`
- [x] Read routes exist for `GET /health`, `GET /skills`, `GET /skills/:id`, and `GET /categories`
- [x] Provider abstraction exists in `backend/src/provider.ts`
- [x] CSV provider exists in `backend/src/providers/csv-provider.ts`
- [x] Filter logic exists in `backend/src/lib/filters.ts`
- [x] Folder is confirmed as `backend/` (not `back-end/`)
- [ ] Decide whether the backend is needed in the next milestone, or whether the frontend should stay build-time only while the repo-content system is introduced
- [ ] If the backend stays in scope, replace the temporary CSV source with repo-content ingestion
- [ ] If the backend stays in scope, extend the backend `Skill` contract to include frontend-needed fields such as `project`, `installCommand`, and `docLink`
- [ ] If the backend stays in scope, point the backend at the generated content artifact instead of duplicating normalization logic in multiple places
- [ ] If the backend stays in scope, wire the frontend to the backend API after the content contract is stable

### Install Command Distribution (new — unblocks Frontend fill-in above)

> Context: The frontend now shows a `curl` install command for each skill. The backend needs to host the raw `.md` skill files so the command resolves.

- [x] **Confirm the URL pattern** for install commands — confirmed as `curl -sL zynkr.ai/s/{id}.md -o ~/.claude/skills/{slug}.md`; built into `scripts/ingest.ts` automatically
- [ ] **Add `installCommand?: string` to `backend/src/types.ts`** — mirror the same optional field added on the frontend if the backend remains in scope
- [ ] **Add `GET /skills/:id/raw` route in `backend/src/routes.ts`** — returns the raw `.md` file content as `text/plain` for curl downloads; returns 404 if skill has no prompt file yet
- [ ] **Set up static `.md` file hosting** — `content/skills/` will serve this purpose; route should read from there (or a symlink/copy)
- [ ] **Write the `.md` prompt files** for each skill — one file per skill ID; content is the full system prompt that installs into `~/.claude/skills/`
- [ ] **Confirm install destination path** — the `curl` command currently outputs to `~/.claude/skills/{slug}.md`; confirm this matches Claude Code's expected skills directory
- [ ] **Test end-to-end** — run `curl -sL zynkr.ai/s/1.01.md -o ~/.claude/skills/writing-ideation.md` and verify the skill is usable in Claude Code

## Deploy To Zeabur

- [ ] Push repo changes to `main`
- [ ] Create the Zeabur project and connect the GitHub repo
- [ ] Set the frontend service root directory to `frontend`
- [ ] Confirm the frontend build passes and the `.zeabur.app` URL loads
- [ ] Add `NODE_ENV=production` in Zeabur environment variables
- [ ] Add custom domain `zynkr.ai` and copy the Zeabur CNAME target
- [ ] Update GoDaddy DNS to point to Zeabur
- [ ] Verify SSL and production routing for `https://zynkr.ai`

## Later

- [ ] Add a second Zeabur service pointing to `backend/` when backend deployment is actually needed
- [ ] Add database schema and migration work under `database/` once Git-managed content plus generated artifacts are no longer enough
