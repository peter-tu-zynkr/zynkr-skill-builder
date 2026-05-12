# Action Items

Canonical task tracker for the Zynkr skill directory.

---

## Current Focus

- [ ] Decide the next content ingestion batch after `writing-agent` core

**Current facts:**
- `zynkr-website-fe` is the canonical frontend (HTML/CSS/JS on Vercel)
- `writing-agent` core (`1.01`–`1.08`) has been ingested
- Stack confirmed: Vercel (FE + BE deployment), Supabase (skills database — read mirror live since 2026-05-12, Phase 1 of Skills API Roadmap)

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

- [x] Deduplicate fetch URL ✓ 2026-05-12 (superseded by Phase 1 — both files now hit `/api/skills*` with a single raw-GitHub fallback path)
- [x] Add fetch error feedback ✓ 2026-05-12 (`ai-skills-marketplace.html` now reveals a bilingual "Failed to load skills — please refresh" banner and fires a `skills_load_failed` GA event when both `/api/skills*` and the raw-GitHub fallback fail)
- [ ] Remove raw-GitHub `FALLBACK_URLS` from `app.js` + `ai-skills-marketplace.html` after ~2 weeks of clean `/api/skills*` logs (earliest: 2026-05-26)
- [ ] Optional: capture the 3 non-canonical fields on record `6.12` (`upstream_repo`, `github_stars`, `github_forks`) in the `skills` table — currently dropped on sync; FE doesn't consume them so low priority

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

- [x] **Log Zod errors instead of returning `[]` in `ingestProjectSkills`.** ✓ 2026-05-12 — `scripts/ingest.ts:704-712` now warns inline with the `sourceFile` and a flattened `path: message` issue list before returning, so silent skips become visible.
- [x] **Add a local validator authors can run before pushing.** ✓ 2026-05-12 — `scripts/validate-skill.ts` + `npm run validate`. Accepts a `SKILL.md`, a skill folder, or the whole `skills/` tree; exits non-zero on bad frontmatter. Schema mirrors `ingest.ts`; current tree (10 SKILL.md files) is clean.

**P1 — self-heal taxonomy renames**

- [x] **Patch `cleanupRepoRecords` to prune orphans by missing `sourceFile`.** ✓ 2026-05-12 — Added repo-wide `cleanupOrphanedRepoRecords(repoUrl, repoRoot)` invoked from `main()` after all projects ingest. It walks every `content/skills/*.md` whose `sourceRepo` matches the run, and prunes any record whose `sourceFile` no longer exists on disk (logged with a `🧹` line). Complements the per-`(repoUrl, project)` cleanup so cross-project renames are self-healing. Also relaxed the per-project `isManagedPipelineRecord` check from `sourceFile === "CLAUDE.md"` to also accept `.../CLAUDE.md` (monorepo paths) so older orchestrator records with matching `(repoUrl, project)` no longer outlive their re-ingest.
- [ ] **Follow-up: orphan records from the pre-monorepo writing-agent ingest.** Smoke test surfaced untracked local files `content/skills/1.11.md`–`1.19.md` with `sourceRepo: …/writing-agent` and `sourceRepo: …/zynkr-skills` (both repos no longer the canonical source). They duplicate `1.03`–`1.10`'s `writing-agent` slug locally and break `build-marketplace.ts` if run on this checkout. They are *not* in git (so CI is unaffected), but should be either (a) re-rooted to `…/zynkr-skill-builder` if treated as canonical, or (b) deleted. Decide which set is canonical before running ingest locally.
- [x] **Audit `scripts/ingest.ts` for other unconditional writes to optional paths.** ✓ 2026-05-12 — Swept all `fs.{writeFileSync,mkdirSync,rmSync,…}` calls in `ingest.ts`, `build-marketplace.ts`, and `marketplace-lib.ts`. Findings: `FRONTEND_GENERATED` already guarded (`07fc0ea1`); `WEBSITE_DATA_DIR` write guarded by `existsSync(path.dirname(...))`; `CONTENT_DIR`/`GENERATED_DIR` created with `recursive: true` at startup; all `rmSync` calls use `force: true`. No new landmines.

**P1 — make authoring conventions discoverable**

- [ ] **Add `scripts/new-skill.sh <category-key> <project-slug>`.** Scaffolds `skills/<N>-<folder>/<slug>/SKILL.md` with the correct `category:` value pre-filled (validated against the TAXONOMY map) plus optional `config.md` / `references/` stubs. Today's failure was that the folder name (`2-sales-consultant`) and the taxonomy key (`business-consulting`) diverge — a scaffolder makes the right value the path of least resistance. The architecture doc already says *"never `sales` → use `business-consulting`"* but nobody reads docs when patterning off an existing skill.
- [ ] **Bridge the folder-name vs taxonomy-key gap.** Two options: (a) rename folders to match keys (`2-business-consulting/`, `7-talent-development/`) — clean but churny; or (b) drop a small `.taxonomy` marker file or `CATEGORY.md` in each `[N]-[folder]/` directory naming the canonical YAML key. Option (b) is cheap and catches the eye at authoring time. Pick one and commit to it.

**P2 — doc hygiene & CI visibility**

- [x] **Refresh `architecture.md` to use current repo names.** ✓ 2026-05-12 — Replaced `zynkr-skills-production` → `zynkr-skill-builder` and `zynkr-skills-idea` → `zynkr-skill-idea` throughout. Also rewrote the FE section to document the Phase 1 `/api/skills*` primary + raw-GitHub fallback flow and the post-ingest HMAC sync to `/api/skills/sync`.
- [x] **Add a CI status badge to `README.md`.** ✓ 2026-05-12 — Added the `Ingest skills` workflow badge directly under the H1 in `README.md`.
- [x] **Bump GitHub Actions Node version.** ✓ 2026-05-12 — `.github/workflows/ingest-skills.yml` now uses `node-version: 22`; `scripts/package.json` `@types/node` bumped to `^22.0.0` to match.

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
Target data flow: `generated/*.json` → GitHub webhook → Vercel Function → Supabase → `/api/skills*` → FE. SKILL.md stays canonical; Supabase is a read mirror.

| Phase | Status | What |
|---|---|---|
| Phase 1 — Supabase read mirror | [x] shipped 2026-05-12 | `skills` + `skills_history` tables on Supabase project `uomieoqlkazknjgmfdda` (33 + 43 rows after backfill). Vercel Functions live: `/api/skills` (index), `/api/skills/details` (full detail dict), `/api/skills/[slug]` (one detail), `/api/skills/sync` (HMAC-verified webhook). FE fetches in `app.js` + `ai-skills-marketplace.html` hit `/api/skills*` with raw-GitHub fallback. `ingest-skills.yml` posts `generated/skills-detail.json` after each push. Diagnosed and fixed a PGRST102 ("All object keys must match") on bulk upsert — coalesced undefined→null in `detailToRow` so heterogeneous source records (e.g. `github_url` only on some) keep a uniform key set. Known gap: 3 non-canonical fields on record `6.12` (`upstream_repo`, `github_stars`, `github_forks`) aren't stored — FE doesn't consume them. Fallback URLs remain in `app.js`/`ai-skills-marketplace.html`; remove after ~2 weeks of clean logs. |
| Phase 2 — GA4 events on marketplace | [x] shipped 2026-05-12 (`09a4fa2`) | `skill_view`, `skill_card_click`, `copy_install_command`, `filter_applied`, `search_performed` wired in the marketplace IIFE; Copy button added next to install_command; Playwright-verified all five events fire with correct params. |
| Phase 3 — First-party event store | [ ] later | Add `skill_events` table + `/api/track` if/when GA4 cohort/funnel limits hurt or ad-block coverage matters. |
| Phase 4 — User accounts + community submissions | [ ] later | Next.js app + Supabase auth (same pattern as `zynkr-crm`). |

Stack: Vercel Functions + Supabase (matches existing `zynkr-crm` pattern).
Plan file: `~/.claude/plans/i-was-thinking-of-composed-rain.md`.

---

## Progress Log

### May 12, 2026 — Stack upgrade Phase 1: Supabase read mirror shipped

- Migration applied on Supabase project `uomieoqlkazknjgmfdda` — `public.skills` (PK `slug`, public read RLS) + `public.skills_history` (service-role only). Backfilled 33 rows + 43 history rows after debug iterations
- Shipped four Vercel Functions in `zynkr-website-fe` (`6aa0927` initial, `d5527ed` PGRST102 fix): `/api/skills`, `/api/skills/details`, `/api/skills/[slug]`, `/api/skills/sync` (HMAC SHA-256 verified, ESM, zero-dep fetch wrapper for Supabase REST in `api/_lib/supabase.js`)
- FE swap (`app.js` skill-count + `ai-skills-marketplace.html` index/detail) now hits `/api/skills*` primary with raw-GitHub fallback. Confirmed against the live `www.zynkr.ai` HTML
- `ingest-skills.yml` appended a `Notify Vercel sync` step that signs `generated/skills-detail.json` with `SKILLS_SYNC_HMAC_SECRET` and POSTs it with an `X-Zynkr-Source-Sha` header — only fires when the prior commit step actually pushed
- Vercel env vars set on `prj_JUk3LYUuleLPmor3CGVDQrm0YLoh`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (new-format `sb_secret_…`), `SKILLS_SYNC_HMAC_SECRET`. Matching GitHub Actions secret mirrored on `peter-tu-zynkr/zynkr-skill-builder`
- Hit PGRST102 ("All object keys must match") on any 3+ row payload — PostgREST refuses bulk upserts with non-uniform key sets. Diagnosis took a CF-replaces-5xx detour (Cloudflare strips JSON 5xx response bodies); briefly returned 200-with-error to surface the message. Fix: coalesce `undefined→null` in `detailToRow` so optional fields like `github_url` keep their keys
- Endpoint outputs match generated JSON field-for-field across all 33 records with 0 value mismatches. Known gap: 3 non-canonical fields on `6.12` (`upstream_repo`, `github_stars`, `github_forks`) — FE doesn't consume them, no schema columns added

### May 12, 2026 — Stack upgrade Phase 2: GA4 events on marketplace

- Brought forward the Vercel + Supabase migration on the *Skills API Roadmap* (was threshold-gated at ~150–200 skills; now a concrete Phase 1–4 plan). Plan file: `~/.claude/plans/i-was-thinking-of-composed-rain.md`
- Shipped Phase 2 in `zynkr-website` (`09a4fa2`): five GA4 custom events on the marketplace — `skill_view`, `skill_card_click`, `copy_install_command`, `filter_applied`, `search_performed`. Added a Copy button next to install commands with a 1.5s "Copied" flash. Skill rows now carry `data-skill-slug` / `data-skill-category` / `data-position` for future event delegation
- Verified end-to-end with Playwright before commit: all five events fire with correct params; `active_category` is preserved on `search_performed` so filter+search cohorts are queryable

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
