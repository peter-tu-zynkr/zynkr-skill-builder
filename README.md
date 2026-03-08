# Zynkr Skill Directory

**Live:** zynkr.ai
**Purpose:** Browsable marketplace of Zynkr's 90+ AI assistants (GPTs, Claude skills, Gemini agents) for course students to discover, understand, and set up the right tool for their task.

---

## Project Structure

```
zynkr-skill-directory/
├── front-end/    Next.js 16 (App Router) + Tailwind — public catalog UI
├── back-end/     Fastify + TypeScript API scaffold with a temporary CSV provider
├── database/     Placeholder for future schema, migration, and sync work
└── deploy/       Deployment docs and config
```

---

## Tech Stack

| Layer | Stack | Status |
|---|---|---|
| Frontend | Next.js 16, Tailwind CSS | ✅ Active |
| Data | Static TypeScript file (`front-end/lib/skills-data.ts`) | ✅ Active, temporary |
| Backend | Fastify, TypeScript, Zod | 🟡 Scaffolded |
| Database | Not started | 🔜 Later |
| Hosting | Zeabur | 🔜 Deploy phase |
| Domain | zynkr.ai (GoDaddy) | 🔜 Deploy phase |

---

## Pages

| Route | Description |
|---|---|
| `/` | Home page — category overview and brand hero |
| `/[category]` | Category page listing projects within a domain |
| `/[category]/[project]` | Project page listing subagents and workflow chain |
| `/skills/[id]` | Subagent detail page with IPO breakdown, setup guide, and workflow context |

---

## Components

| Component | Description |
|---|---|
| `SkillCard` | Catalog card for skill/subagent lists |
| `IPOBreakdown` | 3-panel card: Input / Process / Output |
| `WorkflowChain` | Horizontal chain linking synergy skills |
| `SetupGuide` | Step-by-step guide with platform icon + launch button |
| `StatusBadge` | Color-coded: Done / WIP / Pause / Not started / Out dated |

---

## Data Model

```ts
type Skill = {
  id: string;           // e.g. "1.01"
  category: string;
  project: string;      // project slug defined in taxonomy.ts
  name: string;
  description: string;  // raw IPO text
  input?: string;
  process?: string;
  output?: string;
  synergy: string[];    // e.g. ["1.01", "1.02", "1.03"]
  platform: "gpt" | "claude" | "gemini" | "multi";
  status: "Done" | "WIP" | "Not started" | "Pause" | "Out dated";
  author: string;
  link?: string;
  updatedAt?: string;
};
```

Data currently lives in `front-end/lib/skills-data.ts`.

Category and project structure live in `front-end/lib/taxonomy.ts`.

The backend scaffold mirrors the same shape and should eventually read from repo-managed generated content instead of direct frontend imports.

---

## Design Decisions

- **Taxonomy-first navigation:** browse by category → project → subagent
- **IPO parsing:** `description` is split on `Input:` / `Process:` / `Output:` into structured sections
- **Workflow chain:** `synergy` renders linked related subagents
- **Setup guide:** Platform-specific usage instructions per subagent
- **No auth for MVP:** public read-only catalog

---

## Development

```bash
cd front-end
npm install
npm run dev       # http://localhost:3000
npm run build     # production build check
```

Backend scaffold:

```bash
cd back-end
npm install
npm run dev       # http://localhost:4000
npm run check     # typecheck
```

---

## Deployment

See `deploy/deploy-plan.md` for full action steps.

**Summary:** Zeabur (set root directory to `front-end/`) → connect `zynkr.ai` via CNAME in GoDaddy DNS.

---

## Roadmap

- [x] Project scaffold (Next.js + Tailwind)
- [x] Skill data file (`front-end/lib/skills-data.ts`)
- [x] Taxonomy file (`front-end/lib/taxonomy.ts`)
- [x] Home page `/`
- [x] Category page `/[category]`
- [x] Project page `/[category]/[project]`
- [x] Skill detail page `/skills/[id]`
- [x] Backend scaffold with provider abstraction
- [ ] Add real external links for all subagents
- [ ] Add backend `.env.example`
- [ ] Wire frontend to backend API
- [ ] Implement repo-managed content ingestion
- [ ] Consolidate shared layout / global nav
- [ ] Deploy to Zeabur + connect zynkr.ai
- [ ] Add database only if Git-managed content becomes insufficient
