# Zynkr Skill Directory

Browsable directory for Zynkr AI assistants, workflows, and Claude skills.

Primary goals:
- help users discover the right assistant by category and project
- explain what each skill does in a scan-friendly format
- provide installation/setup instructions, especially for Claude skills
- keep GitHub repos as the source of truth while serving a stable web/app contract

Current public targets:
- `https://zynkr.ai`
- `https://zynkr.ai/ai-skills-marketplace`

---

## Pipeline Role

This repo is the staging, review, and artifact-generation layer in the Zynkr skill pipeline:

```text
product-ideas -> zynkr-skill-directory -> zynkr-skills -> zynkr-website -> zynkr.ai
```

Role boundaries:
- `product-ideas`: raw ideas, backlog, and candidate intake
- `zynkr-skill-directory`: review gate, validation, normalization, duplicate checks, and generated marketplace artifacts
- `zynkr-skills`: approved published skills and canonical source of truth
- `zynkr-website`: static presentation layer that renders copied JSON artifacts

Important rule:
- do not treat `zynkr-skill-directory` as the final published source
- approval happens here, but publish happens when approved changes land in `zynkr-skills`

---

## Current Architecture

This repo is in the middle of a migration away from `assistant-index.csv`.
It should be treated as the operational catalog layer, not the final published source.

The intended architecture is:

```text
zynkr-skills (canonical published source)
legacy/migration repos
assistant-index.csv (legacy reference)
        ↓
scripts/ingest.ts
        ↓
content/skills/*.md
generated/skills.json
        ↓
scripts/build-marketplace.ts
        ↓
generated/skills-index.json
generated/skills-detail.json
frontend/lib/generated-skills.json
../zynkr-website-fe/data/*.json
        ↓
frontend build-time import
backend read API
static website marketplace
```

Important boundary:
- GitHub repos are the authoring/source layer
- `scripts/ingest.ts` is the normalization and schema-transform boundary
- `content/` and `generated/` are the app-facing artifacts
- frontend/backend should consume artifacts, not raw GitHub repos at runtime

Current migration state:
- frontend already reads generated data
- backend now defaults to reading `generated/skills.json`
- CSV still exists only as a transitional fallback and historical reference
- ingest now centrally resolves IPO field precedence and records field provenance

---

## Repository Structure

```text
zynkr-skill-directory/
├── frontend/     Next.js 16 App Router UI
├── backend/      Fastify read API over normalized/generated skill data
├── catalog/      Stable ID overrides and catalog-specific mapping config
├── content/      Canonical normalized markdown skill records
├── generated/    Generated JSON artifacts for app and API consumption
├── scripts/      Ingest pipeline and data tooling
├── database/     Placeholder for future schema and migration work
├── deploy/       Deployment docs and config
└── assistant-index.csv   Legacy inventory source during migration
```

What each area is for:
- `frontend/`: public catalog UI
- `backend/`: stable read contract if/when runtime API is needed
- `catalog/`: explicit transform controls such as stable ID remaps
- `content/skills/`: normalized markdown files keyed by skill ID
- `generated/skills.json`: machine-friendly artifact for backend/tools
- `generated/skills-index.json`: public marketplace browse/search contract
- `generated/skills-detail.json`: public marketplace detail contract
- `frontend/lib/generated-skills.json`: frontend-local generated artifact for build-time import
- `scripts/ingest.ts`: converts external repo content into normalized records using one canonical transform
- `scripts/build-marketplace.ts`: emits public marketplace artifacts and syncs them to `zynkr-website-fe/data/`

---

## Source Of Truth

There are now three layers, with different purposes:

1. Authoring layer
- GitHub skill repos such as `peter-tu-zynkr/writing-agent`
- this is where prompt/runtime content should be maintained

2. Normalized content layer
- `content/skills/*.md`
- one file per ingested skill ID
- stores stable metadata used by the directory

3. Delivery layer
- `generated/skills.json`
- `generated/skills-index.json`
- `generated/skills-detail.json`
- `frontend/lib/generated-skills.json`
- optimized for frontend/backend consumption

The old CSV is no longer the target source of truth. It is useful for:
- migration reference
- coverage tracking
- comparing legacy descriptions against normalized fields
- anchoring legacy IPO for IDs that are intentionally mapped back to existing catalog entries

---

## Frontend

Stack:
- Next.js 16
- App Router
- Tailwind CSS

Current frontend behavior:
- imports generated data through `frontend/lib/skills-data.ts`
- renders category -> project -> skill navigation
- uses static generation for current routes

Static website marketplace behavior:
- `zynkr-website-fe/ai-skills-marketplace.html` loads copied JSON from `zynkr-website-fe/data/`
- no runtime GitHub crawling
- filter/search behavior is client-side only

Current public routes:
- `/`
  category overview and landing page
- `/[category]`
  project listing within a category
- `/[category]/[project]`
  project page with orchestrator/subagent context
- `/skills/[id]`
  skill detail page with setup guide, IPO, and workflow chain

Important note:
- frontend does not need to parse GitHub repos or CSV directly
- it should keep consuming normalized/generated artifacts unless there is a strong reason to move to runtime API fetches

---

## Backend

Stack:
- Fastify
- TypeScript
- Zod

Current backend role:
- expose a normalized read API
- preserve a stable `Skill` contract regardless of source changes underneath
- default to `generated-json`
- keep `csv` as fallback during migration

Current routes:
- `GET /health`
- `GET /skills`
- `GET /skills/:id`
- `GET /categories`

Current provider direction:
- preferred: `generated/skills.json`
- fallback: `assistant-index.csv`

This means the backend is no longer conceptually “the CSV server.” It is the API layer over normalized artifacts.

---

## Data Model

The working skill contract currently includes:

```ts
type Skill = {
  id: string;
  category: string;
  project?: string;
  name: string;
  description?: string;
  input?: string;
  process?: string;
  output?: string;
  kind?: "skill" | "orchestrator" | "subagent";
  stage?: string;
  synergy: string[];
  platform: "gpt" | "claude" | "gemini" | "multi";
  status: "Done" | "WIP" | "Not started" | "Pause" | "Out dated";
  author: string;
  link?: string;
  installCommand?: string;
  updatedAt?: string;
  sourceRepo?: string;
  sourceFile?: string;
  ipoProvenance?: {
    input?: "csv" | "frontmatter" | "pipeline" | "derived";
    process?: "csv" | "frontmatter" | "pipeline" | "derived";
    output?: "csv" | "frontmatter" | "pipeline" | "derived";
  };
  legacyIpoId?: string | null;
};
```

Notes on interpretation:
- `description` is optional and should not be treated as the only canonical skill summary
- `input/process/output` are UI-facing normalized fields
- `input/process/output` are resolved in ingest, not re-parsed in frontend/backend
- `kind` and `stage` support project workflows such as orchestrator + subagent pipelines
- `sourceRepo` and `sourceFile` preserve lineage back to authoring repos
- `ipoProvenance` records which source actually supplied each IPO field
- `legacyIpoId` marks whether a generated skill intentionally inherits IPO from a legacy CSV row

Open modeling issue:
- the original long-form spec from CSV/prompt docs does not map cleanly to UI IPO
- longer term, the source repos should carry explicit catalog metadata instead of forcing the app to infer it from prompt prose

---

## Ingest Pipeline

The ingest script lives at:
- `scripts/ingest.ts`

What it currently does:
- clones a source repo
- finds valid markdown/frontmatter files
- supports orchestrator + subagent repo layouts
- assigns or preserves stable IDs
- supports forced ID remaps through `catalog/skill-id-overrides.json`
- resolves `input/process/output` through explicit precedence instead of ad hoc reuse of descriptions
- records `ipoProvenance` and `legacyIpoId` on normalized records
- writes normalized markdown into `content/skills/`
- regenerates:
  - `generated/skills.json`
  - `frontend/lib/generated-skills.json`
  - `generated/skills-index.json`
  - `generated/skills-detail.json`
  - `../zynkr-website-fe/data/*.json`

Why this matters:
- app code stays simple
- source repos can evolve independently
- normalization rules stay in one place instead of leaking into frontend/backend
- legacy CSV parity is enforced at the transform boundary instead of visually in the UI

Current transform policy:
- frontend/backend consume normalized IPO fields only
- `description` stays a description; it is not silently treated as `process`
- legacy CSV IPO is only inherited for skills that intentionally map to a legacy catalog ID
- new skills can have stable catalog IDs without inheriting unrelated legacy CSV IPO

Validation tooling:
- `scripts/check-ipo-drift.ts` compares generated IPO against `assistant-index.csv`
- run `cd scripts && npm run check-ipo` after ingesting when you need to verify legacy parity

---

## Design Decisions

- Taxonomy-first navigation: browse by category -> project -> skill/subagent
- Artifact-first runtime: frontend/backend consume generated artifacts, not raw repos
- Ingest as normalization boundary: source repos may vary; app contract should not
- Git-managed content first: use Git repos before adding CMS/database complexity
- Public read-only MVP: no auth or admin surface yet
- Backend optional for current UI: frontend can ship from generated artifacts without waiting for backend integration

Transitional design note:
- legacy CSV descriptions can still be parsed into `Input / Process / Output`
- that parsing now happens in the ingest layer only; it should not be duplicated in frontend/backend

---

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Backend:

```bash
cd backend
npm install
npm run dev
npm run check
```

Ingest a repo:

```bash
npx tsx scripts/ingest.ts <github-repo-url>
```

Examples:
- `npx tsx scripts/ingest.ts https://github.com/peter-tu-zynkr/writing-agent`

Check IPO drift against the legacy CSV:

```bash
cd scripts
npm run check-ipo
```

---

## Deployment

Current intended deployment:
- frontend on Zeabur
- custom domain `zynkr.ai`
- backend can remain separate or deferred until needed

Current practical status:
- frontend is the primary deployment target
- raw file serving for Claude install URLs still needs to be wired

Deployment details:
- see `deploy/deploy-plan.md`

---

## Documentation Strategy

Where architecture should be documented:
- root `README.md`
  system-level architecture, source-of-truth model, migration state, repo flow
- `frontend/README.md`
  frontend-specific runtime/build/deployment notes
- `backend/README.md`
  API/provider/config notes

Use this root README as the primary architecture overview.

---

## Roadmap

Done:
- project scaffold
- taxonomy-driven frontend routes
- skill detail pages with setup and workflow context
- ingest pipeline for repo-managed content
- frontend switched to generated artifacts
- backend default provider switched to generated artifacts
- ingest-layer IPO transform with provenance and stable ID overrides
- IPO drift check against legacy CSV
- Milestone 1 cleanup
- shared site shell/header-footer for route pages

Next:
- implement raw markdown serving for install URLs
- decide whether frontend should remain artifact-first or move to backend fetches
- remove remaining hardcoded taxonomy/project assumptions where generated data should drive rendering
- keep migrating source content from legacy CSV assumptions into explicit repo-managed metadata
- deploy production on Zeabur

Later:
- add database/admin layer only if Git-managed content becomes insufficient
