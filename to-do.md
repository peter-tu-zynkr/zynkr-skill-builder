# Action Items

Canonical task tracker for the Zynkr skill directory.

---

## Current Focus

- [ ] Decide the next content ingestion batch after `writing-agent` core

**Current facts:**
- `zynkr-website-fe` is the canonical frontend (HTML/CSS/JS on Vercel)
- `writing-agent` core (`1.01`–`1.08`) has been ingested
- Stack confirmed: Vercel (FE + BE deployment), Supabase (database, when needed)

---

## Open Items

### Content supply

- [ ] Define the preferred source repo shape for skill projects (explicit catalog metadata vs. inferred from prompt prose)
- [ ] Apply that source-repo standard to `writing-agent` before scaling elsewhere
- [ ] Choose the next repo/group to ingest after `writing-agent` core
- [ ] Ingest one project group at a time; validate `content/skills/` and `generated/` after each

**Remaining ingestion tracker:**

| Range | Project | Status |
|---|---|---|
| `1.01–1.08` | writing-agent core | ✅ done |
| `0.01` | search-index | [ ] |
| `1.09–1.14` | writing-agent extensions | [ ] |
| `2.01–2.05` | resume | [ ] |
| `2.06–2.07` | interview | [ ] |
| `2.08` | career-coach | [ ] |
| `2.09–2.10` | career-consulting | [ ] |
| `2.11–2.12` | consulting-assistant | [ ] |
| `2.13–2.16` | operations-assistant | [ ] |
| `3.01` | strategy-planning | [ ] |
| `3.02–3.05` | project-management | [ ] |
| `3.06–3.10` | project-assistant | [ ] |
| `4.01` | video-review | [ ] |
| `7.01–7.05` | recruitment | [ ] |
| `7.06–7.12` | course-ta | [ ] |
| `8.01–8.02` | sales-assistant | [ ] |

### zynkr-website-fe

- [ ] Deduplicate fetch URL — `ai-skills-marketplace.html:269` and `app.js:347` both hardcode the same raw GitHub URL; extract to a single constant
- [ ] Add fetch error feedback — `ai-skills-marketplace.html:627` silently swallows errors; show a "Failed to load skills — please refresh" banner

### Repo hygiene

- [x] Archive `zynkr-skills-staging` repo on GitHub ✓ 2026-05-09
- [ ] Add branch protection to `main` on `zynkr-skills-production` if PR review gate is wanted

### Skill writing guideline upgrades

- [ ] Review skills.sh format (e.g. `skills.sh/anthropics/skills/skill-creator`) and update the authoring guideline to include:
  - **Easy installation** — one-command install snippet at the top
  - **Summary** — short human-readable description of what the skill does and when to trigger it
  - **SKILL.md spec** — formalize required fields and structure so new skills are consistent
- [ ] Apply updated spec to existing skills when ingesting the next batch

### Ingest pipeline robustness (2026-05-12 retrospective)

Surfaced while shipping `inbound-sales-project-init`. The first push hit a silent skip plus a 3-day-old latent CI failure. Items below are the durable fixes that would have prevented the session entirely.

**P0 — stop silent failures**

- [ ] **Log Zod errors instead of returning `[]` in `ingestProjectSkills`.** `scripts/ingest.ts:701-706` currently swallows frontmatter validation failures; the operator only sees "(no ingestible skills found)". Push the error into the existing `skipped` list so the per-file reason prints at the end of the run. ~5 lines, highest leverage item on this list.
- [ ] **Add a local validator authors can run before pushing.** Wrap the existing `SkillFrontmatter` Zod schema in `scripts/validate-skill.ts <path>` so `npm run validate skills/2-business-consulting/...` exits non-zero on bad frontmatter. Eliminates the round-trip-through-CI debugging loop.

**P1 — self-heal taxonomy renames**

- [ ] **Patch `cleanupRepoRecords` to prune orphans by missing `sourceFile`.** Today's `6.07.md` was a leftover from the `6-tech → 6-engineer` rename; the cleanup keys off `(repoUrl, project)` but doesn't notice when a record's `sourceFile` no longer exists in the scan tree. Adding that check (~20 lines) makes future renames self-healing instead of producing duplicate-slug crashes downstream.
- [ ] **Audit `scripts/ingest.ts` for other unconditional writes to optional paths.** The `frontend/lib/generated-skills.json` write crashed CI for 3 days after the frontend dir was deleted. Patched in `07fc0ea1` with an `existsSync` guard — sweep the file for similar landmines.

**P1 — make authoring conventions discoverable**

- [ ] **Add `scripts/new-skill.sh <category-key> <project-slug>`.** Scaffolds `skills/<N>-<folder>/<slug>/SKILL.md` with the correct `category:` value pre-filled (validated against the TAXONOMY map) plus optional `config.md` / `references/` stubs. Today's failure was that the folder name (`2-sales-consultant`) and the taxonomy key (`business-consulting`) diverge — a scaffolder makes the right value the path of least resistance. The architecture doc already says *"never `sales` → use `business-consulting`"* but nobody reads docs when patterning off an existing skill.
- [ ] **Bridge the folder-name vs taxonomy-key gap.** Two options: (a) rename folders to match keys (`2-business-consulting/`, `7-talent-development/`) — clean but churny; or (b) drop a small `.taxonomy` marker file or `CATEGORY.md` in each `[N]-[folder]/` directory naming the canonical YAML key. Option (b) is cheap and catches the eye at authoring time. Pick one and commit to it.

**P2 — doc hygiene & CI visibility**

- [ ] **Refresh `architecture.md` to use current repo names.** Still references `zynkr-skills-production` and `zynkr-skills-idea`; the rename commit (`e6ac06cb`) updated most surfaces but missed this one. Also remove the description of the `frontend/lib/generated-skills.json` write step in the CI section — that write was deleted.
- [ ] **Add a CI status badge to `README.md`.** Today's `Ingest skills` workflow had been red for 3 days; nothing made that visible until I tried to push and got a notification. A badge at the top of the README turns the silence into a glance-test.
- [ ] **Bump GitHub Actions Node version.** `.github/workflows/ingest-skills.yml` uses `node-version: 20`; GitHub will force Node 24 starting June 2026. Move to `22` (current LTS) ahead of the deprecation.

**P2 — skill authoring path convention**

- [ ] **Define a portable path convention for SKILL.md cross-file references.** Both `biz-card/SKILL.md` and `inbound-sales-project-init/SKILL.md` hardcode the user's local absolute path (`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/...`) when pointing at sibling config and reference files. Once installed via the marketplace those reads fail. Options: (a) relative refs like `./config.md` that the harness resolves against the SKILL.md's own location, or (b) a `{{SKILL_DIR}}` token the harness substitutes. Whichever is picked, document it in the SKILL.md spec being written in *Skill writing guideline upgrades* above, and retrofit existing skills in the same batch.

### Longer-term decisions

- [ ] Decide where taxonomy metadata should live long term: code-owned (`ingest.ts`) or content-owned (`taxonomy.md`)
- [ ] Decide how skill content should be edited: Git-only, structured content workflow, or CMS/admin
- [ ] Add `docLink` field if prompt/reference docs should be first-class in the directory
- [ ] Replace temporary visual assets (browser tab icon) when final brand assets exist

---

## Skills API Roadmap

Current data flow: `generated/*.json` → raw GitHub URLs → client-side fetch + filter in `zynkr-website-fe`.

| Phase | Trigger | What to build |
|---|---|---|
| Now | — | Keep GitHub raw JSON; no change |
| ~150–200 skills | JSON too heavy for full client-side load | Vercel Functions in `zynkr-website-fe/api/` backed by Supabase — server-side search + filter |
| User features | Community submissions, saved skills, accounts | Next.js app (same pattern as `zynkr-crm`) with Supabase auth |

Stack when the time comes: Vercel Functions + Supabase (matches existing `zynkr-crm` pattern).

---

## Progress Log

### May 12, 2026 — First inbound-flow skill + ingest pipeline hardening

- Shipped `inbound-sales-project-init` skill under `2-sales-consultant/` (commits `39320e1e`, `07fc0ea1`, `1b5abb01`, auto-ingest `95c2c495`); now lives at `content/skills/2.09.md`
- Fixed pre-existing CI failure: `scripts/ingest.ts` unconditionally wrote `frontend/lib/generated-skills.json` after the frontend dir was removed in `9895fdd4`. Now guarded with `existsSync` on the parent dir
- Removed stale `content/skills/6.07.md` — orphan record from the `6-tech → 6-engineer` taxonomy rename that was colliding with the freshly-allocated `6.13` on the `vercel-labs-agent-browser` slug
- Surfaced retrospective items into the new *Ingest pipeline robustness* section above

### May 9, 2026 — Cleanup & architecture alignment

- Archived legacy intake scripts → `scripts/legacy/`
- Deleted stale `generated/review-candidates.json` + `.csv`
- Fixed duplicate slug keys in `marketplace-lib.ts` (detail JSON now keyed by `id` only)
- Added `build-marketplace` npm script to `scripts/package.json`
- Added `skills/README.md`
- Fixed CI `git add` (removed stale `frontend/lib/generated-skills.json` reference)
- Deleted `frontend/` Next.js experiment
- Deleted `deploy/`, `docs/`, `skills-building-agent/`, `tools/` folders
- Renamed category 5 `dev-ops` → `product`, category 6 `tech` → `engineer`
- Updated `taxonomy.md`, `architecture.md`, `README.md`, `ACTION-ITEMS.md`
- Merged `zynkr-skills-refactor/` planning docs into `zynkr-skills-production/`

### March 9, 2026

- Ingest pipeline supports orchestrator + subagent repo structures
- Ingest preserves IDs by `sourceRepo` + `sourceFile`
- Writing Agent core ingested (`1.01`–`1.08`) from `peter-tu-zynkr/writing-agent`
- Backend default provider switched from CSV to `generated/skills.json`
