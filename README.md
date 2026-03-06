# Zynkr Skill Directory

**Live:** zynkr.ai
**Purpose:** Browsable marketplace of Zynkr's 90+ AI assistants (GPTs, Claude skills, Gemini agents) for course students to discover, understand, and set up the right tool for their task.

---

## Project Structure

```
zynkr-skill-directory/
├── front-end/    Next.js 14 (App Router) + Tailwind — catalog & detail pages
├── back-end/     Backend API (stack TBD — planned for Phase 2)
├── database/     Database schemas & migrations (stack TBD — planned for Phase 2)
└── deploy/       Deployment docs and config
```

---

## Tech Stack

| Layer | Stack | Status |
|---|---|---|
| Frontend | Next.js 14, Tailwind CSS | ✅ Active |
| Data | Static TypeScript file (`lib/skills-data.ts`) | ✅ Active |
| Backend | TBD | 🔜 Phase 2 |
| Database | TBD | 🔜 Phase 2 |
| Hosting | Zeabur | 🔜 Deploy phase |
| Domain | zynkr.ai (GoDaddy) | 🔜 Deploy phase |

---

## Pages

| Route | Description |
|---|---|
| `/` | Catalog — hero, category filter, status toggle, search, skill grid |
| `/skills/[id]` | Detail — IPO breakdown, workflow chain, setup guide, launch CTA |

---

## Components

| Component | Description |
|---|---|
| `SkillCard` | Number, name, category, status, platform, author |
| `CategoryFilter` | Scrollable chip tabs with per-category counts |
| `SearchBar` | Debounced filter over skill name + description |
| `IPOBreakdown` | 3-panel card: Input / Process / Output |
| `WorkflowChain` | Horizontal chain linking synergy skills |
| `SetupGuide` | Step-by-step guide with platform icon + launch button |
| `StatusBadge` | Color-coded: Done / WIP / Pause / Not started / Out dated |

---

## Data Model

```ts
type Skill = {
  id: string;           // e.g. "1.01"
  category: string;     // e.g. "內容行銷"
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

Data lives in `front-end/lib/skills-data.ts` — populated manually from the Google Sheet. Phase 2 will connect to Sheets API or a database.

---

## Design Decisions

- **Default filter:** "Done only" — students only see working tools
- **IPO parsing:** `description` field split on `Input:` / `Process:` / `Output:` into 3 structured panels
- **Workflow chain:** `synergy` array rendered as linked chips with arrows
- **Setup guide:** Platform-specific steps (GPT / Claude / Gemini) with launch CTA
- **No auth for MVP:** Public read-only

---

## Development

```bash
cd front-end
npm install
npm run dev       # http://localhost:3000
npm run build     # production build check
```

---

## Deployment

See `deploy/deploy-plan.md` for full action steps.

**Summary:** Zeabur (set root directory to `front-end/`) → connect `zynkr.ai` via CNAME in GoDaddy DNS.

---

## Roadmap

- [x] Project scaffold (Next.js + Tailwind)
- [x] Skill data file (`front-end/lib/skills-data.ts`)
- [x] All components (SkillCard, CategoryFilter, SearchBar, IPOBreakdown, WorkflowChain, SetupGuide, StatusBadge)
- [x] Catalog page `/`
- [ ] Skill detail page `/skills/[id]`
- [ ] Layout & global nav
- [ ] Deploy to Zeabur + connect zynkr.ai
- [ ] Connect to Google Sheets API (Phase 2)
- [ ] Backend + database (Phase 2)
