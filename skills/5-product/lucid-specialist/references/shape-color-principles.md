# Workflow visualization: Color & Shape principles

This document packages the **shape + color convention** used to map workflows and architecture consistently.

It comes from the course material’s workflow redesign module (Shape & Color Convention).
(See also the broader course outline for where this fits in the curriculum.)

---

## 1) Why we use Shape × Color

- **Shapes** are **semantic and color‑agnostic**: they describe *what the node is* (process, decision, storage, document, etc.).
- **Colors** are **ownership / execution / storage**: they describe *who owns the step* and *how it is executed* (FE, BE, DB; deterministic vs LLM; durable vs ephemeral vs RAG).

Together, Shape × Color makes diagrams readable at a glance:
- **Shape answers:** “What type of thing is this node?”
- **Color answers:** “Who owns it / what layer executes it / what kind of storage is involved?”

---

## 2) Shape definitions (semantic, color‑agnostic)

> Use these shapes consistently. Don’t overload a shape to convey ownership—ownership belongs to **color**.

| Shape | What it’s for | How to use it |
|---|---|---|
| **Terminal (Oval)** | Start / End / Outcome boundary | Use only for boundaries and outcomes. Keep text outcome‑focused (e.g., “End: Approved + notified”). If the outcome implies persistence, ensure there’s a **durable DB node** in the flow.  |
| **Process (Rectangle)** | A step that performs work | Name as **verb + object** (e.g., “Validate request”, “Summarize evidence”). **Do not encode business meaning in FE steps**—keep meaning in BE automation/manual.  |
| **Decision (Diamond)** | Branching gate (yes/no or multi‑branch) | Phrase as a **question** (e.g., “Eligible under policy?”). Prefer **deterministic gates** even if an LLM suggests a path (“LLM suggests → deterministic gate enforces”).  |
| **Document (Wavy)** | Document‑like artifact / knowledge artifact | Use for **artifacts, not storage**. Label with a type tag: **[DB]**, **[CTX]**, **[RAG]**. Storage location is conveyed by **green shades** (see colors).  |
| **Database (Cylinder)** | Durable system‑of‑record storage | Use **only** for durable/auditable/queryable records. **Never** use a cylinder for a vector index. Label with an entity/object (e.g., WorkflowInstance, DecisionLog).  |
| **Manual I/O (Slanted rectangle)** | Human inputs or outputs via UI | Use for FE capture/presentation (e.g., “Manual input: upload”, “Output: show result”). Meaning/rules live elsewhere.  |
| **Manual operation (Trapezoid)** | Human execution step (HITL) | Use when a human step **changes workflow state** (e.g., “Reviewer approves”). Pair with FE review surface + DB decision record.  |
| **Off‑page link (Pentagon)** | Cross‑workflow/page connector | Use as a boundary/handoff (e.g., “Invoke Refund workflow”, “Emit event”). Avoid hiding logic here—contracts live in BE.  |
| **Merge / Junction (Crosshair circle)** | Join/fork control | Use for parallelism or convergence (e.g., “Fork A/B”, “Join results”). Keep it purely control‑flow.  |

---

## 3) Color definitions (ownership / execution / storage)

> Colors are **shape‑agnostic**. The same shape can be colored differently to show different owners/execution modes.

| Color family | Meaning | When to use | Examples |
|---|---|---|---|
| **Red family** | **FE surface** (human interaction) | UI capture/display/decision‑support surface | Upload table UI; chat command input; show insight + citations  |
| **Light Blue** | **Backend manual process** (HITL execution) | Human execution owned by backend process/routing/SLA/audit | Reviewer approves; ops verifies exception  |
| **Purple** | **Backend deterministic automation** (state machine / rules) | Clear rules, stable logic, reproducible orchestration | Validate eligibility; transition state; retry with idempotency  |
| **Dark Blue** | **Backend modern automation** (LLM / agentic) | Ambiguity/judgment tasks with tool use + guardrails | Summarize evidence; draft outreach; classify free‑text  |
| **Green** | **DB durable** (system of record) | Must persist; auditable/reproducible/queryable | DecisionLog; WorkflowInstance; InsightArtifact  |
| **Light Green** | **Ephemeral context** (session‑only) | Working memory only; never system of record | Conversation snippet; temporary extraction  |
| **Dark Green** | **RAG knowledge** | Knowledge used for retrieval or enforcement | [RAG] Policy; [RAG] SOP index  |

---

## 4) Shape × Color lookup (practical patterns)

Use this section as a quick “what should this node look like?” reference.

### Process (Rectangle)
- **Red rectangle** → FE step: capture intent / display outcome
  Examples: “Enter billing address”, “Show confirmation”, “Display error state”
- **Light Blue rectangle** → Backend human execution step
  Examples: “Reviewer checks evidence”, “Ops validates exception”
- **Purple rectangle** → Deterministic automated step
  Examples: “Validate request”, “Compute score”, “Transition: queued → approved”
- **Dark Blue rectangle** → LLM/agentic step
  Examples: “Summarize case”, “Generate hypothesis”, “Draft response with tools”

### Decision (Diamond)
- **Red diamond** → UI‑only branching (rare; keep superficial)
  Example: “Did user click confirm?”
- **Light Blue diamond** → Human decides the branch
  Example: “Approve / reject?” (paired with audit log)
- **Purple diamond** → Deterministic gate (preferred)
  Examples: “Eligible under policy?”, “Risk score > threshold?”
- **Dark Blue diamond** → LLM decides a branch (use sparingly)
  Pattern: LLM suggests → **purple gate enforces**

### Document (Wavy)
- **Green wavy doc** → Durable stored artifact in DB
  Examples: “[DB] Uploaded report”, “[DB] Generated memo”
- **Light Green wavy doc** → Session‑only context artifact
  Examples: “[CTX] Extracted snippet”, “[CTX] Temporary notes”
- **Dark Green wavy doc** → RAG knowledge artifact
  Examples: “[RAG] Policy: Refund v3”, “[RAG] SOP corpus index”

### Database (Cylinder)
- **Green cylinder only** → Durable system of record
  Examples: WorkflowInstance, DecisionLog, CommandLog

### Manual I/O (Slanted rectangle)
- **Red slanted** → Human input/output in FE
  Examples: “Manual input: upload CSV”, “Output: insight + citations”

### Manual operation (Trapezoid)
- **Light Blue trapezoid** → HITL manual operation step
  Examples: “Reviewer approves”, “Escalate to supervisor”

---

## 5) Quick rules (to prevent diagram drift)

1) **Shapes convey semantics. Colors convey ownership/execution/storage.**
2) **Don’t encode business meaning in FE nodes.** FE captures/displays; BE defines meaning.
3) **Prefer deterministic gates for branching.** LLM may suggest, but deterministic gate enforces.
4) **Cylinder is only for durable system-of-record.** Never use cylinder for vector index.
5) **HITL must be paired:** FE review surface + BE routing/SLA + DB decision record.

---

## 6) Suggested node naming conventions

- **Process nodes:** `Verb + Object` (Validate request, Compute score, Summarize evidence)
- **Decision nodes:** A question (Eligible under policy? Risk score > threshold?)
- **DB cylinders:** Concrete entity/log name (WorkflowInstance, DecisionLog, CommandLog)
- **Wavy docs:** Always tag `[DB]`, `[CTX]`, or `[RAG]`
