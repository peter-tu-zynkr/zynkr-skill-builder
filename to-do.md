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
