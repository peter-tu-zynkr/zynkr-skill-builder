# Zynkr Taxonomy

This is the canonical category index for the Zynkr skill directory. Each top-level number maps to a functional domain. Skills and subagents are assigned IDs using the format `{prefix}.{sequence}` (e.g. `1.01`, `5.03`), incremented FIFO within each category.

---

## 0. Strategy & Leadership

**Definition**: Guides company vision, long-term direction, and strategic decision-making. Ensures alignment across all functions and manages growth horizons.

**Functions**:
- Founder / CEO
- Strategic planning (OKRs, horizon planning, competitive analysis)
- Board / Advisors
- Business development partnerships

**Slug**: `strategy`

---

## 1. Brand & Marketing

**Definition**: Builds Zynkr's visibility, reputation, and demand through content, campaigns, and community. Owns positioning, funnel generation, and thought leadership.

**Functions**:
- Brand strategy & positioning
- Content marketing (articles, newsletters, SEO)
- Social media & community management
- Growth marketing & paid ads
- CRM & marketing ops

**Slug**: `brand-marketing`

---

## 2. Sales & Consultant

**Definition**: Converts leads into clients through prospecting, pitching, and relationship management. Also includes consultants who deliver value directly to customers.

**Functions**:
- B2C sales funnel (lead magnet → courses → upsell)
- B2B enterprise sales (pilot → retainer model)
- Consultants (career, AI, process)
- Client success & account management

**Slug**: `business-consulting`

---

## 3. Operations

**Definition**: Ensures smooth execution of projects, services, and internal workflows. Focuses on consistency, SOPs, and efficiency.

**Functions**:
- Service delivery & fulfillment (courses, workshops, consulting)
- Workflow & project management
- Process & SOP design
- Customer support & client success
- Admin & back office

**Slug**: `operations`

---

## 4. Training

**Definition**: Creates and delivers learning programs, educational content, and training experiences. Covers both instructional design (4.1) and facilitation/delivery (4.2) — use projects to distinguish.

**Functions**:
- Instructional design & curriculum development
- Content/media production (slides, visuals, Notion pages)
- Trainers & facilitators
- Cohort/community managers
- Video editors & production specialists

**Slug**: `training`

---

## 5. Product

**Definition**: Defines what gets built and why. Owns the product roadmap, user experience, and go-to-market strategy. Bridges business needs and engineering execution.

**Functions**:
- Product management (roadmap, prioritization, OKRs)
- Product design & UX
- Go-to-market & marketplace management
- Customer discovery & feedback loops
- Product analytics & growth

**Slug**: `product`

---

## 6. Engineer

**Definition**: Builds and maintains Zynkr's technological foundation — from internal automation to the AI Agent Platform. Ensures scalable, reliable, and secure systems.

**Functions**:
- Platform engineering (modular agent architecture, FE/BE/DB)
- Knowledge-into-agent pipelines
- Automation & integration (n8n, RPA, API)
- Data & intelligence (RAG, embeddings, vector DBs, MLOps)
- Security & infrastructure (cloud, compliance, access control)
- Tooling & enablement (GPTs, plugins, collaboration stack)

**Slug**: `engineer`

---

## 7. People & Talent

**Definition**: Attracts, develops, and retains talent while fostering Zynkr's culture.

**Functions**:
- Recruiting & onboarding
- Learning & development
- HR business partners
- Community of practice leaders

**Slug**: `talent-development`

---

## 8. Finance & Admin

**Definition**: Maintains financial health, compliance, and administrative support for scale.

**Functions**:
- Finance (budgeting, reporting, tax, P&L)
- Accounting & audit
- Admin & office management

**Slug**: `finance-admin`

---

## 9. Legal

**Definition**: Ensures Zynkr operates within legal, regulatory, and contractual obligations. Owns risk management, intellectual property, privacy, and external agreements across the business.

**Functions**:
- Contracts & negotiations (NDAs, MSAs, statements of work, vendor agreements)
- Compliance & regulatory (AI policy, accessibility, sector-specific rules)
- IP & licensing (trademarks, copyright, open-source licence review)
- Privacy & data governance (GDPR, CCPA, PIPL, data processing agreements)
- Dispute resolution & external counsel coordination

**Slug**: `legal`

---

## ID Assignment Rules

| Rule | Detail |
|---|---|
| Format | `{prefix}.{two-digit sequence}` — e.g. `1.01`, `5.03` |
| Sequencing | FIFO within each category — next available number |
| Sub-categories | Use `project` slug to distinguish (e.g. `5.1` vs `5.2` within `dev-ops`) |
| Source | IDs are assigned by the ingestion script, never in the SME repo |
