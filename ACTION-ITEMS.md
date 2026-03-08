# Action Items

This is the canonical project task list as of March 8, 2026.

## Current State Snapshot

- [x] Frontend scaffold exists in `front-end/`
- [x] Home page, category pages, project pages, and skill detail pages are implemented
- [x] Static data lives in `front-end/lib/skills-data.ts`
- [x] Taxonomy lives in `front-end/lib/taxonomy.ts`
- [x] Backend scaffold exists in `back-end/` with `GET /health`, `GET /skills`, `GET /skills/:id`, and `GET /categories`
- [x] CSV fallback source exists via `assistant-index.csv`
- [x] Google Sheets is no longer part of the active project plan
- [x] Canonical inventory direction is Git-managed structured content plus generated artifacts
- [ ] Frontend is still using static imports instead of the backend API
- [ ] Deployment to Zeabur is not yet verified in docs

## Frontend

- [x] Replace platform-link model with install command model in `SetupGuide` component
- [x] Add `installCommand?: string` field to `Skill` type in `front-end/lib/skills.ts`
- [x] Rename "如何使用" section to "如何安裝" on skill detail page
- [x] Redesign skill detail page to two-column layout with install command as hero and metadata sidebar
- [x] Create `front-end/lib/platforms.ts` as single source of truth for platform labels and icons
- [x] Fill in `installCommand` for writing-assistant skills (1.01–1.06) — `platform` updated to `claude`
- [ ] Fill in `installCommand` for all remaining skills — blocked on backend URL pattern being confirmed (see Backend section below)
- [ ] Decide whether to keep or remove unused catalog-era files such as `front-end/app/catalog-client.tsx`, `front-end/components/CategoryFilter.tsx`, and `front-end/components/SearchBar.tsx`
- [ ] Add global navigation or shared header/footer instead of repeating top-nav markup in route pages
- [ ] Decide whether the browser tab icon should use the final brand asset instead of the temporary recreated SVG in `front-end/app/icon.svg`

## Taxonomy And Data Model

- [ ] Document the current 4-level structure clearly: Category → Project → Subagent, plus how "Skill" should be interpreted in product copy
- [ ] Decide whether "Skill" should become an explicit first-class entity in the data model or remain equivalent to a project/workflow
- [ ] Add a `docLink` field to the frontend/backend `Skill` model for Google Drive prompt docs
- [ ] Confirm that all `project` slugs in `front-end/lib/skills-data.ts` map cleanly to `front-end/lib/taxonomy.ts`

## Content Source Strategy

- [x] Adopt repo-managed structured content as the canonical inventory source instead of `front-end/lib/skills-data.ts`
- [ ] Choose the on-disk format for inventory records: `JSON`, `YAML`, or `MD/MDX` with frontmatter
- [ ] Define a canonical content folder layout, suggested: `content/skills/{id}.md` plus shared taxonomy metadata
- [ ] Add schema validation for content records during build time using `zod` or JSON Schema
- [ ] Add a normalization step that compiles repo content into a generated JSON artifact for frontend/backend consumption
- [ ] Decide whether taxonomy should remain code-owned in `front-end/lib/taxonomy.ts` or move into structured content alongside skills
- [ ] Decide who edits inventory content and whether the first version should stay Git-only or require a CMS/admin layer
- [ ] Add contributor documentation for how to add or update one skill entry through a PR
- [ ] Decide the long-term dataset solution after repo-managed content: headless CMS, internal admin + DB, or keep Git as the source of truth

### Phase 1 Next Steps

- [ ] Create `content/skills/` and choose the first 3-5 skills to migrate out of `front-end/lib/skills-data.ts`
- [ ] Choose the initial file format for skill records, recommended: Markdown with frontmatter
- [ ] Define the canonical schema for one skill record, including `installCommand` and `docLink`
- [ ] Add a content loader script that reads the new skill files from disk
- [ ] Add validation to the loader so bad content fails locally and in CI
- [ ] Generate `generated/skills.json` from the migrated records
- [ ] Switch the frontend from `front-end/lib/skills-data.ts` to `generated/skills.json`
- [ ] Keep `front-end/lib/skills-data.ts` only as a temporary fallback until all records are migrated
- [ ] Add a short contributor guide for creating one new skill file and validating it

## Backend

- [x] `back-end/.env.example` exists for local setup
- [x] Fastify server bootstrap exists in `back-end/src/server.ts`
- [x] Read routes exist for `GET /health`, `GET /skills`, `GET /skills/:id`, and `GET /categories`
- [x] Provider abstraction exists in `back-end/src/provider.ts`
- [x] CSV provider exists in `back-end/src/providers/csv-provider.ts`
- [ ] Confirm whether the final folder name should stay `back-end/` or be renamed to `backend/`
- [ ] Decide whether the backend is needed in the next milestone, or whether the frontend should stay build-time only while the repo-content system is introduced
- [ ] If the backend stays in scope, replace the temporary CSV source with repo-content ingestion
- [ ] If the backend stays in scope, extend the backend `Skill` contract to include frontend-needed fields such as `project`, `installCommand`, and `docLink`
- [ ] If the backend stays in scope, point the backend at the generated content artifact instead of duplicating normalization logic in multiple places
- [ ] If the backend stays in scope, wire the frontend to the backend API after the content contract is stable

### Install Command Distribution (new — unblocks Frontend fill-in above)

> Context: The frontend now shows a `curl` install command for each skill. The backend needs to host the raw `.md` skill files so the command resolves.

- [ ] **Confirm the URL pattern** for install commands — suggested: `https://zynkr.ai/s/{id}.md` (e.g. `https://zynkr.ai/s/1.01.md`)
- [ ] **Add `installCommand?: string` to `back-end/src/types.ts`** — mirror the same optional field added on the frontend if the backend remains in scope
- [ ] **Add `GET /skills/:id/raw` route in `back-end/src/routes.ts`** — returns the raw `.md` file content as `text/plain` for curl downloads; returns 404 if skill has no prompt file yet
- [ ] **Set up static `.md` file hosting** — create a `back-end/skills/` folder where each file is named `{id}.md` (e.g. `1.01.md`); the raw route reads from this folder
- [ ] **Write the `.md` prompt files** for each skill — one file per skill ID; content is the full system prompt that installs into `~/.claude/skills/`
- [ ] **Confirm install destination path** — the `curl` command currently outputs to `~/.claude/skills/{slug}.md`; confirm this matches Claude Code's expected skills directory
- [ ] **Test end-to-end** — run `curl -sL zynkr.ai/s/1.01.md -o ~/.claude/skills/writing-ideation.md` and verify the skill is usable in Claude Code

## Deploy To Zeabur

- [ ] Push repo changes to `main`
- [ ] Create the Zeabur project and connect the GitHub repo
- [ ] Set the frontend service root directory to `front-end`
- [ ] Confirm the frontend build passes and the `.zeabur.app` URL loads
- [ ] Add `NODE_ENV=production` in Zeabur environment variables
- [ ] Add custom domain `zynkr.ai` and copy the Zeabur CNAME target
- [ ] Update GoDaddy DNS to point to Zeabur
- [ ] Verify SSL and production routing for `https://zynkr.ai`

## Later

- [ ] Add a second Zeabur service pointing to `back-end/` when backend deployment is actually needed
- [ ] Add database schema and migration work under `database/` once Git-managed content plus generated artifacts are no longer enough
