# Validation / Lint Rules

Ten rules. Each cites the underlying principle (from `architecture-principles.md`), how to detect it in Lucid-JSON terms, and how to fix it. Apply them on every read and as a self-check after every draft/edit.

---

## Hard rules (ship-blockers)

### V1 — Cylinder only for durable system-of-record

- **Principle**: `architecture-principles.md` §2 rule 5 ("Vector DB is an index, not truth"); §1.3 A) Durable vs ephemeral.
- **Detect**: a node with `BlockClass: DatabaseBlock` (cylinder) whose `FillColor` is *not* in the green `#e3fae3ff` family, OR whose label implies RAG / vector / index / knowledge retrieval.
- **Fix**: move the concept to a `DocumentBlock` dark-green (`#c3f7c8ff`). The cylinder is reserved for durable records like `WorkflowInstance`, `DecisionLog`, `CommandLog`.

### V2 — No business logic in FE

- **Principle**: §2 rule 1 ("FE shows intent; BE owns meaning").
- **Detect**: any `ProcessBlock` whose parent swimlane is "Front end user", unless it's *pure UX* (e.g., "validate input format", "show confirmation").
- **Fix**: move the step into the BE lane. Keep only UI-level work in FE.

### V3 — Decisions deterministic by default

- **Principle**: `shape-color-principles.md` §5 rule 3 ("Prefer deterministic gates for branching").
- **Detect**: a `DecisionBlock` colored dark-blue (LLM blue, `#cfe4ff` family).
- **Fix**: restructure as "LLM suggests → deterministic gate enforces". Add a purple `DecisionBlock` downstream of the LLM step. The LLM produces a recommendation; the purple gate enforces the branch.

### V4 — HITL must have a durable audit trail

- **Principle**: §2 rule 2 ("HITL appears in FE, but belongs to BE"); §5.1 (HITL spec requires audit record).
- **Detect**: a `ManualOperationBlockNew` whose downstream path does not reach any `DatabaseBlock` or durable green `DocumentBlock` before a terminal.
- **Fix**: add a write to a decision log between the manual op and the terminal.

### V6 — Decision branches must be labeled

- **Principle**: `shape-color-principles.md` §5 (decisions are questions; outcomes must be explicit).
- **Detect**: an outgoing edge from a `DecisionBlock` whose `TextAreas` has no `Text` field (or empty).
- **Fix**: add a label (`Yes`/`No`, or specific outcome names). Unlabeled branches = ambiguity.

### V8 — Lane order FE → BE → DB

- **Principle**: scaffold convention (see `scaffold.md`).
- **Detect**: the three top swimlanes are not in this order from top to bottom.
- **Fix**: reorder. Same content, but lanes vertically stacked FE → BE → DB.

---

## Soft rules (observations — flag but don't block)

### V5 — LLM steps need a fallback

- **Principle**: §1.2 (LLM execution requires deterministic shadow + confidence threshold + fallback path); §5.2 (LLM spec checklist).
- **Detect**: a `ProcessBlock` with LLM-blue fill (`#cfe4ff`) that has only one outgoing edge to the happy path — no review gate, no error/escalation edge.
- **Fix**: add either (a) a deterministic decision gate downstream that checks confidence/output validity, (b) an HITL fallback edge, or (c) an explicit error/retry edge.

### V7 — Off-page link is a boundary, not a hiding place

- **Principle**: `shape-color-principles.md` §2 (Off-page link table row).
- **Detect**: an `OffPageLinkBlock` placed mid-flow whose label implies business logic (e.g., "Calculate eligibility", "Apply discount tiers").
- **Fix**: move the logic to a proper BE `ProcessBlock`. Keep the off-page link as a pure handoff (e.g., "Invoke Refund Workflow", "Emit Event: RefundRequested").

### V9 — Terminals at boundaries

- **Principle**: `shape-color-principles.md` §2 (Terminal row).
- **Detect**: a flow with no `Terminator` start or end.
- **Fix**: add explicit Start and End `Terminator` nodes. Readers need to know where the flow begins and ends.

### V10 — Color must match semantic

- **Principle**: §6 / Shape × Color convention.
- **Detect**: any node whose fill family contradicts its lane (e.g., a green `DatabaseBlock` floating in the FE lane, or a red node in the DB lane).
- **Fix**: either move the node to the right lane, or recolor it to match the lane it belongs in.

---

## Lint output format

```
Lint of <doc_id> · <title>
Hard rule violations (ship-blockers):
- V<#> — <node_id> (<label>): <one-line description>
- ...

Soft observations:
- V<#> — <node_id> (<label>): <one-line description>
- ...

Total: N hard, M soft.  /  Clean.
```

If clean, say "Clean — no convention violations." Don't pad.

---

## Quick spot-checks (do these in under a minute)

From `architecture-principles.md` §10, restated for Lucid:

1. Can behavior change by changing UI labels alone? → V2 violation (business logic leaked to FE).
2. Is there a canonical source named for each rule/definition? → If a `DecisionBlock` doesn't reference a policy, something's missing.
3. Is any decision only in chat / ephemeral context? → Should be persisted; check V4.
4. Does every LLM step have a downstream gate or fallback? → V5.
5. Does every RAG knowledge node cite its source doc? → If `DocumentBlock` dark-green has no `[RAG] <name> v<version>` tagging, flag it.
