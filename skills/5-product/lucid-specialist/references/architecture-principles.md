# Architecture Principles & Knowledge (Guidebook)

> Purpose: A single reference to keep workflow / assistant architectures **navigable, consistent, auditable, and safe**—especially when combining **human surfaces, deterministic automation, LLM/agentic automation, durable state, ephemeral context, and RAG knowledge**.

---

## 1) Core Mental Model (Canonical)

This system is organized around **three layers**. Each layer has:
- a primary responsibility
- placement questions
- hard constraints (“golden rules”)

### 1.1 Frontend (FE) — Interaction & Intent

**What FE is**
- Where humans interact with the system.
  - **External users:** customers (forms, dashboards)
  - **Internal users:** operators/reviewers (admin console, chat-to-trigger, review UI)

**What FE owns**
- Interaction points
- Intent capture (inputs, commands)
- Evidence + outcomes presentation
- Decision-support UI (**not** decision authority)

**FE decision questions**
1) Is this a human interaction point?
   - External or internal?
2) What intent/inputs/signals must be captured?
   - required fields, constraints, operator commands
3) What must be shown to help the human decide or understand?
   - preview, citations, confidence, comparisons, explanation
4) What should **not** be decided here?
   - business rules, workflow transitions, LLM behavior/policies

**Typical FE artifacts**
- UI components & states (loading/empty/error/success)
- Forms, dashboards, charts
- Chat command UI + helpers
- UX-level validation (format, hints)
- Review surface (approve/reject/comment) + evidence display

---

### 1.2 Backend (BE) — Execution & Meaning

**What BE is**
- Where work is orchestrated and rules are enforced.
- BE is the **canonical source of meaning**.

**Execution modes**
- **Human execution (HITL):** approvals, exception handling, judgment
- **Machine execution**
  - **Deterministic:** workflows, rules engines, state machines
  - **Probabilistic:** LLM/agentic reasoning with tools

**BE decision questions**
1) Who should execute this step?
   - Human or machine?
2) If machine, should it be deterministic or LLM-based?
   - rules clear vs. judgment/ambiguity
3) What is the canonical rule/definition/contract?
   - API/event schema, business rule, metric meaning
4) What are the failure modes and fallbacks?
   - retries, timeouts, escalation, human takeover
5) If LLM is used, what is the **deterministic shadow**?
   - allowed tools & schemas
   - policy constraints
   - eval criteria / tests
   - confidence thresholds + fallback path

**Typical BE artifacts**
- Workflow/state machine + orchestration specs
- Canonical rule definitions
- API/event contracts
- HITL routing + decision schema + SLAs
- LLM execution spec (tools + policy + eval + fallback)
- Error handling + idempotency + observability hooks

---

### 1.3 Database (DB) — State & Knowledge

DB has **two independent dimensions**:

#### A) State & Persistence

**1) Transactional / Durable state** (system of record)
Use when data must:
- persist across sessions
- be queried/reported
- be auditable/reproducible

Examples: tables/docs, workflow states, approvals, analysis runs, insight artifacts.

**2) Ephemeral / In-context state** (session-only)
Use only when data:
- is temporary
- supports a single interaction
- does not require audit or reuse

Examples: conversation context, temporary doc snippets, scratchpad.

**State decision questions**
- Does it persist beyond session?
- Does it need query/report?
- Does it need auditability/reproducibility?

If **yes** to any → **Durable**.

#### B) Knowledge & Retrieval (RAG)

**3) Vectorized knowledge (retrieval index)**
- Used when knowledge must be searchable/retrievable at runtime.
- Vector DB is an **index**, not truth; it must point to canonical sources (doc/version/owner).

**4) Codified / anchored knowledge (execution policy)**
- Used when knowledge must be enforced consistently:
  - policies, playbooks, constraints
  - agent rules + tool allow-lists
  - compliance requirements
- Treat as **knowledge as code** (versioned, governed).

**Knowledge decision questions**
- Retrieved or enforced?
  - retrieved → vector index
  - enforced → anchored/codified
- Is there a canonical source of truth?
  - if not, create one first
- Can we tolerate ambiguity?
  - if no (high-stakes), prefer anchored rules + HITL

---

## 2) Cross-layer Golden Rules (Placement Constraints)

1) **FE shows intent; BE owns meaning**
   - Smell test: if two clients (web vs chat) behave differently, the rule leaked out of BE.

2) **HITL appears in FE, but belongs to BE**
   - FE = review surface (buttons, evidence display, notes UX)
   - BE = review process (routing, permissions, decision schema, state transitions, SLA, audit)
   - Smell test: if review can be bypassed by calling an API, it wasn’t enforced.

3) **One canonical source; everything else links**
   - business rule → BE
   - state → DB durable
   - policy constraints → anchored knowledge / BE config
   - docs → canonical doc repo
   - Smell test: same concept described in 3 places with slightly different wording.

4) **LLM is an execution mode, not an organizing principle**
   - Any LLM step must define tools+schemas, constraints, eval, fallback, thresholds.
   - Smell test: “The agent usually does the right thing.”

5) **Vector DB is an index, not truth**
   - If something must be enforced/audited/high-stakes → it cannot live only in embeddings.
   - Smell test: “The answer is in the vector DB” without canonical source link.

6) **Ephemeral context is never a system of record**
   - Smell test: “We can rely on what the user said in chat last time.”

---

## 3) Anti-Patterns (Common Failure Modes)

A) Business rules implemented in FE → enforce in BE; FE can pre-validate for UX only

B) Review UI exists but no BE review process → BE owns routing/schema/audit

C) Duplicate truth across docs/FE/BE → pick canonical; link everywhere else

D) LLM used where deterministic rules suffice → deterministic first

E) LLM without eval/policy/fallback → not shippable

F) Retrieval treated as canonical truth → vector points to canonical docs; require doc/version/owner

G) Anchored policies not versioned/governed → treat as code; review cadence + release notes

H) Ephemeral context used for durable decisions → write to DB durable with provenance

I) No provenance for insights/analysis outputs → store inputs/method/time/version

J) Ownership unclear → assign owner + review cadence per canonical source

---

## 4) Placement Decision System (How to Decide)

### 4.1 Decision Flow (use in every spec)

**Step 1 — Surface check (FE)**
- External user → FE External
- Internal operator/reviewer → FE Internal
- FE captures intent, shows evidence/outcomes.

**Step 2 — Execution check (BE)**
- Human → BE Human Execution (HITL)
- Machine → BE Machine Execution
  - Deterministic when logic is clear & stable
  - LLM/agentic when ambiguity/judgment exists and risk is controlled
- Define contracts, meaning, failure modes, fallbacks.

**Step 3 — Persistence check (DB: State)**
- Persist/audit/reproduce? → DB Durable
- Session-only working memory? → DB Ephemeral (sparingly)

**Step 4 — Knowledge intent check (DB: Knowledge)**
- Retrieved → Vector index
- Enforced → Anchored/codified
- If no canonical source exists, create one first.

### 4.2 Placement Matrix (quick reference)

**Information**
- UI labels/copy/presentation → FE
- Canonical definitions/validations/metric meaning → BE
- Storage constraints/history/audit fields → DB Durable
- Temporary snippets for a single chat → DB Ephemeral

**Actions**
- Triggers (form submit, chat command) → FE
- Orchestration/decisioning/routing → BE
- Execution by reviewer/operator → BE HITL (with FE review surface)
- Outcomes/approvals/logs → DB Durable

**Process / Workflow**
- User journey steps → FE
- State machine/transitions → BE
- Workflow instance + transition history → DB Durable
- Runbook/SOP → Reference docs (optionally indexed)

**LLM usage**
- “Should we use LLM?” decision → BE
- Tool schema + policy + eval + fallback → BE (+ anchored knowledge)
- Prompt/policy that must be enforced → Anchored knowledge
- Supporting docs for RAG → Reference docs + Vector index
- Never: LLM logic embedded only in FE

---

## 5) Minimal Checklists (Ship-ready)

### 5.1 If you add a HITL step
You must define:
- routing conditions (when human is required)
- decision schema (allowed outputs)
- SLA/escalation
- audit record format
- FE review surface requirements (evidence display)

### 5.2 If you add an LLM step
You must define:
- allowed tools + schemas
- policy constraints (must/never)
- evaluation criteria (tests/evals)
- confidence threshold
- deterministic or human fallback
- logging/provenance

### 5.3 If you add vector retrieval
You must define:
- canonical doc sources
- version/owner metadata
- refresh cadence
- citation requirement (doc ID + section) when applicable

---

## 6) Workflow Visualization Standard (Shapes + Colors)

> Convention: **Shape = semantic meaning** (what the node is). **Color = ownership/execution/storage mode**.

### 6.1 Shape definitions (semantic, color-agnostic)

| Shape | What it’s for | How to use it |
|---|---|---|
| Terminal (Oval) | Start / End / Outcome boundary | Use only for boundaries/outcomes. If outcome implies persistence, ensure a durable DB node exists earlier. |
| Process (Rectangle) | A step that performs work | Name as verb + object. Avoid encoding business meaning in FE steps—meaning belongs in BE. |
| Decision (Diamond) | Branching gate (yes/no or multi-branch) | Phrase as a question. Prefer deterministic gates even if LLM suggests. |
| Document (Wavy) | Document-like artifact / knowledge artifact | Use for artifacts, not storage. Label with a type tag: `[DB]`, `[CTX]`, `[RAG]`. |
| Database (Cylinder) | Durable system-of-record storage | Use **only** for durable/auditable/queryable records. **Never** use cylinder for vector index. |
| Manual I/O (Slanted) | Human inputs/outputs via UI | FE capture/presentation (manual input, output display). Meaning lives elsewhere. |
| Manual operation (Trapezoid) | Human execution step (HITL) | When a human step changes workflow state (approve/reject). Pair with FE review surface + DB durable decision record. |
| Off-page link (Pentagon) | Cross-workflow/page connector | Boundary/handoff. Contracts live in BE. |
| Merge/Junction (Crosshair circle) | Join/fork control | Parallelism/convergence control only; keep it purely control-flow. |

### 6.2 Color definitions (ownership/execution/storage)

| Color | Meaning | When to use | Examples |
|---|---|---|---|
| Red family | FE surface (human interaction) | UI capture/display/decision-support | Upload UI, chat command input, show result + citations |
| Light Blue | BE manual process (HITL execution) | Human execution owned by BE process/routing/SLA/audit | Reviewer approves, ops verifies exception |
| Purple | BE deterministic automation (state machine/rules) | Clear rules, stable logic, reproducible orchestration | Validate eligibility, transition state, retry with idempotency |
| Dark Blue | BE modern automation (LLM/agentic) | Ambiguity/judgment tasks with tools + guardrails | Summarize evidence, draft outreach, classify free-text |
| Green | DB durable (system of record) | Must persist, be auditable/reproducible/queryable | DecisionLog, WorkflowInstance, InsightArtifact |
| Light Green | Ephemeral context (session-only) | Working memory only; never system of record | Conversation snippet, temporary extraction |
| Dark Green | RAG-related knowledge | Knowledge used for retrieval/enforcement | `[RAG] Policy`, `[RAG] SOP index` |

### 6.3 Shape × Color examples (practical lookup)

| Shape | Color | Use this when… | Example node titles |
|---|---|---|---|
| Rectangle (Process) | Red | FE step: capture intent / display outcome | Enter billing address; Show confirmation; Display error state |
| Rectangle (Process) | Light Blue | BE human execution step | Reviewer checks evidence; Ops validates exception |
| Rectangle (Process) | Purple | Deterministic automated step | Validate request; Compute score; Transition: queued→approved |
| Rectangle (Process) | Dark Blue | LLM/agentic step | Summarize case; Generate hypothesis; Draft response with tools |
| Diamond (Decision) | Purple (preferred) | Deterministic gate | Eligible under policy?; Risk score > threshold? |
| Diamond (Decision) | Light Blue | Human decides branch | Approve / reject? (paired with audit log) |
| Document (Wavy) | Green | Durable stored artifact in DB | `[DB] Uploaded report`; `[DB] Generated memo` |
| Document (Wavy) | Light Green | Session-only context artifact | `[CTX] Extracted snippet`; `[CTX] Temporary notes` |
| Document (Wavy) | Dark Green | RAG knowledge artifact | `[RAG] Policy: Refund v3`; `[RAG] SOP corpus index` |
| Cylinder (Database) | Green only | Durable system-of-record | WorkflowInstance; DecisionLog; CommandLog |
| Slanted (Manual I/O) | Red | Human input/output in FE | Manual input: upload CSV; Output: insight + citations |
| Trapezoid (Manual Ops) | Light Blue | HITL manual operation step | Reviewer approves; Escalate to supervisor |

**DB recommendation (enforced):**
- Cylinder is reserved for **durable DB only**.
- Vector index / anchored policy are represented as **dark-green Document** artifacts (knowledge), not cylinders.

---

## 7) Templates (Copy/Paste)

### 7.1 FE External Spec
- User goal
- Primary screens/components
- UI states (loading/empty/error/success)
- UX validations (format, required fields, hints)
- Tracking/events
- Links: backend contract + canonical rules

### 7.2 FE Internal Spec (Chat/Admin/Review)
- Operator goal
- Surface type (admin / queue / chat)
- Commands/actions + confirmations
- Evidence display requirements
- Decision UX (approve/reject/hold; reason codes; notes)
- Links: BE HITL spec + DB decision log + policies

### 7.3 BE Workflow Spec (Deterministic)
- Service owner + scope
- Canonical business rules
- Contracts (API/events) + schemas
- State machine (states/transitions)
- Failure modes (timeouts, retries, idempotency)
- Security (authz)
- Links: DB schema + runbook + ADRs

### 7.4 BE HITL Spec
- What requires human review and why
- Routing conditions + SLAs + escalation
- Decision schema (allowed outcomes, required evidence)
- Audit requirements
- Links: FE review surface + DB decision log

### 7.5 BE LLM Execution Spec
- Use case + boundaries
- Allowed tools + schemas
- Policy constraints (must/never)
- Evaluation checks / test cases
- Deterministic shadow + confidence threshold
- Fallback path (deterministic or HITL)
- Links: anchored policy + runbook

### 7.6 DB Transactional Spec
- System of record statement
- Entities + schema
- Constraints + indexes
- Retention + audit + PII classification
- Migration/versioning approach
- Links: BE owner + data consumers

### 7.7 Knowledge Spec — Anchored Policy
- Intent + scope + definitions
- Enforceable rules (must/never)
- Versioning + owner + review cadence
- Enforcement points (which BE components enforce what)

### 7.8 Knowledge Spec — Vector Index
- Purpose of index (questions to answer)
- Canonical sources (doc IDs/versions/owners)
- Chunking strategy
- Freshness + reindex cadence
- Security boundaries
- Truth rule: index stores pointers; canonical sources are authoritative

### 7.9 ADR (1 page)
- Context
- Decision
- Alternatives
- Tradeoffs
- Consequences
- Date + owner

### 7.10 Runbook
- Service/workflow
- Common failure modes + symptoms
- Diagnosis
- Mitigation/rollback
- Escalation + owners
- Dashboards/logs

---

## 8) Lean Operating Model (Keep it MVP)

We don’t want a beautiful encyclopedia nobody maintains.

**MVP v0**
- 1 page: placement decision flow + mapping table
- Templates: FE/BE/DB + ADR + Runbook

**Build–Measure–Learn loop (monthly or per release)**
1) Sample 3 recent features
2) Ask: “Where did people look first and fail?”
3) Update rules/templates based on real friction

**Lightweight metrics**
- Discoverability: find canonical rule in <3 clicks
- Change defect rate: how often docs were wrong/missing
- Cycle time: time from feature decision → docs updated

---

## 9) Worked micro-example (pattern)

**“Internal chat triggers a workflow”**
- FE Internal: chat command UI + confirmation + errors
- BE: command validation, authorization, orchestration, state transitions
- DB Durable: command log, workflow instance, audit trail
- Knowledge: anchored policies (who can trigger what), indexed docs (SOPs)

---

## 10) Quick spot-checks (1 minute before ship)

- Can behavior change by changing UI? → logic leaked from BE
- Is there a canonical source for each rule/definition? → if no, define one
- Is any decision only in chat context? → persist/audit it
- Does every LLM step have tools+policy+eval+fallback? → if no, not ready
- Does retrieval point to canonical docs (version/owner)? → fix indexing

