# Action Items

Canonical task tracker for the Zynkr skill directory.
For shipped work and the progress log, see `plan.md`.

---

## Current Focus

- [ ] Define the preferred source repo shape for skill projects (explicit catalog metadata vs. inferred from prompt prose), then apply to `writing-agent` before scaling elsewhere
- [ ] Decide next ingestion batch — current `skills/` monorepo only has 11 SKILL.md files; the other ~22 records reference upstream repos that haven't been migrated in

**Current facts:**
- `zynkr-website-fe` is the canonical frontend (HTML/CSS/JS on Vercel)
- 33 records committed in `content/skills/` spanning categories 1, 2, 4, 6 — all now point at canonical `zynkr-skill-builder` (re-rooted 2026-05-12)
- Stack confirmed: Vercel (FE + BE deployment), Supabase (skills database — read mirror live since 2026-05-12, Phase 1 of Skills API Roadmap shipped — see `plan.md`)

---

## Open Items

### Content supply

- [ ] Reconcile `cv-customizer` category drift — either move the SKILL.md folder to `2-sales-consultant/` or re-allocate the records to `7.*` IDs (the latter is breaking change for Supabase mirror)

**Ingested inventory (as of 2026-05-12, post sourceRepo re-root):**

| Category | Project | IDs | Status |
|---|---|---|---|
| 1-brand-marketing | newsletter-to-notion | 1.01 | ✅ committed |
| 1-brand-marketing | write-newsletter | 1.02 | ✅ committed |
| 1-brand-marketing | writing-agent | 1.03–1.10 | ✅ committed |
| 2-sales-consultant | biz-card | 2.01–2.02 | ✅ committed |
| 2-sales-consultant | cv-customizer | 2.03–2.08 | ✅ committed *(SKILL.md lives under `skills/7-people/cv-customizer/` — category mismatch)* |
| 2-sales-consultant | inbound-sales-project-init | 2.09 | ✅ committed |
| 4-training | polish-lecture-transcript | 4.01 | ✅ committed |
| 4-training | process-livestream | 4.02, 4.04–4.08 | ✅ committed |
| 4-training | srt-optimizer | 4.03 | ✅ committed |
| 6-engineer | skill-sourcer | 6.07–6.11 | ✅ committed |
| 6-engineer | vercel-labs-agent-browser | 6.12 | ✅ committed |

Empty categories (no records yet): `0-strategy`, `3-operations`, `5-product`, `7-people`*, `8-finance-admin`, `9-legal`.
*\*`7-people` has `cv-customizer/SKILL.md` on disk but its records sit in category 2 — needs reconciliation.*

### zynkr-website-fe

- [ ] Remove raw-GitHub `FALLBACK_URLS` from `app.js` + `ai-skills-marketplace.html` after ~2 weeks of clean `/api/skills*` logs (earliest: 2026-05-26)
- [ ] Optional: capture the 3 non-canonical fields on record `6.12` (`upstream_repo`, `github_stars`, `github_forks`) in the `skills` table — currently dropped on sync; FE doesn't consume them so low priority

### Repo hygiene

- [ ] Add branch protection to `main` on `zynkr-skill-builder` if PR review gate is wanted
- [ ] Decide fate of untracked local files: `database/api-shape.md`, `database/schema.sql`, `scripts/marketplace-lib.test.ts`. Either commit (if they're meant to be canonical Supabase schema/API docs and a real test file) or `.gitignore` + delete

### Skill writing guideline upgrades

- [ ] Review skills.sh format (e.g. `skills.sh/anthropics/skills/skill-creator`) and update the authoring guideline to include:
  - **Easy installation** — one-command install snippet at the top
  - **Summary** — short human-readable description of what the skill does and when to trigger it
  - **SKILL.md spec** — formalize required fields and structure so new skills are consistent
- [ ] Apply updated spec to existing skills when ingesting the next batch

### Ingest pipeline robustness (2026-05-12 retrospective)

Surfaced while shipping `inbound-sales-project-init`. The first push hit a silent skip plus a 3-day-old latent CI failure. Items below are the durable fixes that would have prevented the session entirely. Completed P0/P1/P2 items live in `plan.md`.

**P1 — make authoring conventions discoverable**

- [ ] **Add `scripts/new-skill.sh <category-key> <project-slug>`.** Scaffolds `skills/<N>-<folder>/<slug>/SKILL.md` with the correct `category:` value pre-filled (validated against the TAXONOMY map) plus optional `config.md` / `references/` stubs. Today's failure was that the folder name (`2-sales-consultant`) and the taxonomy key (`business-consulting`) diverge — a scaffolder makes the right value the path of least resistance.
- [ ] **Bridge the folder-name vs taxonomy-key gap.** Two options: (a) rename folders to match keys (`2-business-consulting/`, `7-talent-development/`) — clean but churny; or (b) drop a small `.taxonomy` marker file or `CATEGORY.md` in each `[N]-[folder]/` directory naming the canonical YAML key. Pick one and commit to it.

**P2 — skill authoring path convention**

- [ ] **Define a portable path convention for SKILL.md cross-file references.** Both `biz-card/SKILL.md` and `inbound-sales-project-init/SKILL.md` hardcode the user's local absolute path (`/Users/petertu/Desktop/Claude/zynkr/6.0 tech/...`) when pointing at sibling config and reference files. Once installed via the marketplace those reads fail. Options: (a) relative refs like `./config.md` that the harness resolves against the SKILL.md's own location, or (b) a `{{SKILL_DIR}}` token the harness substitutes. Whichever is picked, document it in the SKILL.md spec being written in *Skill writing guideline upgrades* above, and retrofit existing skills in the same batch.

### Longer-term decisions

- [ ] Decide where taxonomy metadata should live long term: code-owned (`ingest.ts`) or content-owned (`taxonomy.md`)
- [ ] Decide how skill content should be edited: Git-only, structured content workflow, or CMS/admin
- [ ] Add `docLink` field if prompt/reference docs should be first-class in the directory
- [ ] Replace temporary visual assets (browser tab icon) when final brand assets exist

---

## Skills API Roadmap — Remaining Phases

Current data flow: `generated/*.json` → GitHub webhook → Vercel Function → Supabase → `/api/skills*` → FE.
SKILL.md stays canonical; Supabase is a read mirror. Raw-GitHub fallback remains in FE until ~2026-05-26.
Phase 1 (Supabase read mirror) and Phase 2 (GA4 events) shipped 2026-05-12 — full detail in `plan.md`.

### Phase 3 — First-party event store — [ ] later

- [ ] Add `skill_events` table + `/api/track` if/when GA4 cohort/funnel limits hurt or ad-block coverage matters

### Phase 4 — User accounts + community submissions — [ ] later

- [ ] Next.js app + Supabase auth (same pattern as `zynkr-crm`)

Stack: Vercel Functions + Supabase (matches existing `zynkr-crm` pattern).
Original plan file: `~/.claude/plans/i-was-thinking-of-composed-rain.md`.
