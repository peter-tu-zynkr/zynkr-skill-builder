# Canonical Placement Model — FE / BE / DB (configured source, distilled here)

> **Canon source (configure, don't commit):**
>
> ```
> ARCHITECTURE_CANON = <your-architecture-canon-doc>
> ```
>
> For Zynkr internal use this resolves to the AI-literacy course outline, tab
> **v2.1 › Ch4 "Architecture (Web)"** (the three-layer model, golden rules,
> anti-patterns) and **Ch5.3 "Framing the To-Be Architecture – FE/BE/DB"**
> (applying it to redesigned processes). The doc id lives in the runtime-config
> substitution table (project memory), not in this public repo. When the canon
> doc is reachable, it wins over this distillation; the summary below is the
> operational subset needed to place elements without a doc round-trip.

---

## The three layers

### FE — Interaction & Intent *(external / internal surfaces)*

Where humans interact with the system: forms, dashboards, chat commands, review
surfaces. FE owns interaction points, intent capture, and the presentation of
evidence and outcomes. **Decision-support UI, never decision authority.**

Decision questions:
- Is this a human interaction point? External or internal?
- What intent, inputs, or signals must be captured here?
- What must be shown so the human can decide or understand?
- What should NOT be decided here? (business rules, workflow transitions, LLM policy — all BE)

### BE — Execution & Meaning *(human / machine execution)*

Where work is orchestrated and rules are enforced. **BE is the canonical source
of meaning.** Execution modes: human (HITL approvals, judgment), deterministic
machine (workflows, rules), probabilistic machine (LLM reasoning with tools).

Decision questions:
- Who executes this step — human or machine? If machine: deterministic or LLM?
  (Are the rules clear, or is judgment/ambiguity involved?)
- What is the canonical rule/definition/contract for this step?
- What are the failure modes and fallbacks? (retry, escalate, human takeover)
- If LLM: what is the deterministic shadow? (allowed tools, policy constraints,
  eval criteria, confidence threshold + fallback path)

### DB — State & Knowledge *(durable / ephemeral / retrieval)*

Two independent dimensions:

- **State & persistence** — durable (persists across sessions, queryable,
  auditable: records, workflow states, approvals) vs ephemeral (single
  interaction, no audit: conversation context, scratchpads).
- **Knowledge & retrieval** — vectorized knowledge (searchable at runtime; an
  index that POINTS to canonical sources) vs codified/anchored knowledge
  (enforced consistently: policies, playbooks, agent rules — knowledge as code).

Decision questions:
- Does this need to persist beyond the session? Be queried? Be auditable?
  → any yes = durable state.
- Is this knowledge meant to be *retrieved* (→ index) or *enforced* (→ anchored)?
- Is there a single canonical source of truth? If not, create one before
  indexing or codifying.

## Cross-layer golden rules (placement constraints)

1. **FE shows intent; BE owns meaning.** If two clients (web vs chat) behave
   differently, a rule leaked out of BE.
2. **HITL appears in FE, belongs to BE.** FE is the review *surface*; BE is the
   review *process* (routing, decision schema, transitions, audit). If review
   can be bypassed by calling an API, it was never enforced.
3. **One canonical source; everything else links.** Same concept described in
   three places with slightly different wording = duplicated truth.
4. **LLM is an execution mode, not an organizing principle.** "The agent
   usually does the right thing" (no measurable criteria) is the smell.
5. **Vector DB is an index, not truth.** An answer "in the vector DB" without a
   canonical source link cannot be relied on for high-stakes actions.
6. **Ephemeral context is never a system of record.** "We can rely on what the
   user said in chat last time" is the smell.

## Anti-patterns (refuse these placements)

- **Business rules implemented in FE** — validation/eligibility logic only in
  UI → clients drift, rules bypassed. Enforce in BE; FE pre-validates for UX only.
- **Review UI without a backend review process** — approve/reject buttons with
  no routing/audit → approvals aren't real.
- **Duplicate truth across docs/FE/BE** — designate one canonical source; link.
- **LLM where deterministic rules suffice** — deterministic first; reserve LLM
  for ambiguity and judgment.
- **LLM without eval, policies, and fallback** — "works in demo" is not a spec.
- **Retrieval treated as canonical truth** — chunks without doc/version/owner.

## How placement maps to the diagram

| Placement outcome | Visual consequence |
|---|---|
| FE input | doc icon, top lane, stem+▼ into the node it feeds |
| BE step (any execution mode) | dark octagon node, middle lane, chained → |
| DB durable state / anchored knowledge | folder icon, bottom lane, stem+▲ into the node it informs |
| Output back to a human | doc icon, top lane far right, stem+▲ rising from BE |
| The automation verdict | the ONE orange law line, bottom-right inside the frame |

The diagram's honesty depends on the placement being real: if a "process step"
is actually a human judgment, it is still a BE node (human execution mode) —
say so in the node's subline rather than pretending it is automated.
