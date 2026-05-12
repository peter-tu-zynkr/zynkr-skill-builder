# Plan — Shipped Work

Historical record of completed tasks and the progress log for the Zynkr skill directory.
For open items, see `to-do.md`.

---

## Shipped Tasks

### zynkr-website-fe

- [x] **Deduplicate fetch URL** ✓ 2026-05-12 — superseded by Phase 1; both files now hit `/api/skills*` with a single raw-GitHub fallback path.
- [x] **Add fetch error feedback** ✓ 2026-05-12 — `ai-skills-marketplace.html` reveals a bilingual "Failed to load skills — please refresh" banner and fires a `skills_load_failed` GA event when both `/api/skills*` and the raw-GitHub fallback fail.

### Repo hygiene

- [x] **Archive `zynkr-skills-staging` repo on GitHub** ✓ 2026-05-09.

### Ingest pipeline robustness — P0 (stop silent failures)

- [x] **Log Zod errors instead of returning `[]` in `ingestProjectSkills`.** ✓ 2026-05-12 — `scripts/ingest.ts:704-712` now warns inline with the `sourceFile` and a flattened `path: message` issue list before returning, so silent skips become visible.
- [x] **Add a local validator authors can run before pushing.** ✓ 2026-05-12 — `scripts/validate-skill.ts` + `npm run validate`. Accepts a `SKILL.md`, a skill folder, or the whole `skills/` tree; exits non-zero on bad frontmatter. Schema mirrors `ingest.ts`; current tree (11 SKILL.md files) is clean.

### Ingest pipeline robustness — P1 (self-heal taxonomy renames)

- [x] **Patch `cleanupRepoRecords` to prune orphans by missing `sourceFile`.** ✓ 2026-05-12 — Added repo-wide `cleanupOrphanedRepoRecords(repoUrl, repoRoot)` invoked from `main()` after all projects ingest. It walks every `content/skills/*.md` whose `sourceRepo` matches the run, and prunes any record whose `sourceFile` no longer exists on disk (logged with a `🧹` line). Complements the per-`(repoUrl, project)` cleanup so cross-project renames are self-healing. Also relaxed the per-project `isManagedPipelineRecord` check from `sourceFile === "CLAUDE.md"` to also accept `.../CLAUDE.md` (monorepo paths) so older orchestrator records with matching `(repoUrl, project)` no longer outlive their re-ingest.
- [x] **Audit `scripts/ingest.ts` for other unconditional writes to optional paths.** ✓ 2026-05-12 — Swept all `fs.{writeFileSync,mkdirSync,rmSync,…}` calls in `ingest.ts`, `build-marketplace.ts`, and `marketplace-lib.ts`. Findings: `FRONTEND_GENERATED` already guarded (`07fc0ea1`); `WEBSITE_DATA_DIR` write guarded by `existsSync(path.dirname(...))`; `CONTENT_DIR`/`GENERATED_DIR` created with `recursive: true` at startup; all `rmSync` calls use `force: true`. No new landmines.

### Ingest pipeline robustness — P2 (doc hygiene & CI visibility)

- [x] **Refresh `architecture.md` to use current repo names.** ✓ 2026-05-12 — Replaced `zynkr-skills-production` → `zynkr-skill-builder` and `zynkr-skills-idea` → `zynkr-skill-idea` throughout. Also rewrote the FE section to document the Phase 1 `/api/skills*` primary + raw-GitHub fallback flow and the post-ingest HMAC sync to `/api/skills/sync`.
- [x] **Add a CI status badge to `README.md`.** ✓ 2026-05-12 — Added the `Ingest skills` workflow badge directly under the H1 in `README.md`.
- [x] **Bump GitHub Actions Node version.** ✓ 2026-05-12 — `.github/workflows/ingest-skills.yml` now uses `node-version: 22`; `scripts/package.json` `@types/node` bumped to `^22.0.0` to match.

---

## Skills API Roadmap — Shipped Phases

### Phase 1 — Supabase read mirror — [x] shipped 2026-05-12

- `skills` + `skills_history` tables on Supabase project `uomieoqlkazknjgmfdda` (33 + 43 rows after backfill)
- Vercel Functions live: `/api/skills` (index), `/api/skills/details` (full detail dict), `/api/skills/[slug]` (one detail), `/api/skills/sync` (HMAC-verified webhook)
- FE fetches in `app.js` + `ai-skills-marketplace.html` hit `/api/skills*` with raw-GitHub fallback
- `ingest-skills.yml` posts `generated/skills-detail.json` to `/api/skills/sync` after each push
- Diagnosed and fixed a PGRST102 ("All object keys must match") on bulk upsert — coalesced `undefined → null` in `detailToRow` so heterogeneous source records (e.g. `github_url` only on some) keep a uniform key set
- Known gap: 3 non-canonical fields on record `6.12` (`upstream_repo`, `github_stars`, `github_forks`) aren't stored — FE doesn't consume them
- Fallback URLs remain in `app.js` / `ai-skills-marketplace.html`; remove after ~2 weeks of clean logs (earliest 2026-05-26) — *tracked in `to-do.md`*

### Phase 2 — GA4 events on marketplace — [x] shipped 2026-05-12 (`09a4fa2`)

- Events wired in the marketplace IIFE: `skill_view`, `skill_card_click`, `copy_install_command`, `filter_applied`, `search_performed`
- Copy button added next to `install_command` with a 1.5s "Copied" flash
- Playwright-verified all five events fire with correct params; `active_category` preserved on `search_performed` so filter+search cohorts are queryable

Plan file (original): `~/.claude/plans/i-was-thinking-of-composed-rain.md`.

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
- Verified end-to-end with Playwright before commit: all five events fire with correct params; `active_category` preserved on `search_performed` so filter+search cohorts are queryable

### May 12, 2026 — First inbound-flow skill + ingest pipeline hardening

- Shipped `inbound-sales-project-init` skill under `2-sales-consultant/` (commits `39320e1e`, `07fc0ea1`, `1b5abb01`, auto-ingest `95c2c495`); now lives at `content/skills/2.09.md`
- Fixed pre-existing CI failure: `scripts/ingest.ts` unconditionally wrote `frontend/lib/generated-skills.json` after the frontend dir was removed in `9895fdd4`. Now guarded with `existsSync` on the parent dir
- Removed stale `content/skills/6.07.md` from the `6-tech → 6-engineer` taxonomy rename. *Note: ID 6.07 was later re-allocated to `skill-sourcer` by a subsequent ingest; the file on disk today is the new record, not the orphan.*
- Surfaced retrospective items into the *Ingest pipeline robustness* section of `to-do.md`

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
