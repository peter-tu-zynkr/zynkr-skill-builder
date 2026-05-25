# Worked Examples

Two examples — one read, one draft — to anchor what the protocols produce.

---

## Example 1 — READ: the canonical `[@] Architecture template`

**Input from user:** "Read this chart: https://lucid.app/lucidchart/bb9ba9aa-b4c2-4ad2-a432-87f6a805c4e0/edit"

**Steps you take:**

1. Extract doc id `bb9ba9aa-b4c2-4ad2-a432-87f6a805c4e0`.
2. Call `mcp__lucid__fetch` with that id.
3. Identify lanes: top swimlane `Front end user` (with sub-lanes `External user`, `Internal user`); middle `Backend system / process policy` (sub-lanes `Backend manual process`, `Backend state machine / AI assistant`); bottom `Data base / knowledge base` (sub-lanes `Data base data table`, `Knowledge base knowledge`).
4. Tag nodes against `encoding-table.md`:
   - `WjM.n7tEMPmM` `ManualInputBlock` `#ffd9d9ff` → FE manual input (Internal user)
   - `-jM.8Y_5tZln` `ProcessBlock` `#cfe4ffff` → BE LLM process step
   - `dkM.X~sIl5DW` `DocumentBlock` `#e3fae3ff` → DB durable document
   - `DkM.RMEaEThF` `DecisionBlock` `#dedeffff` → BE deterministic decision
   - `UlM.43gkZl7L` `ManualOperationBlockNew` `#edf5ffff` → BE HITL
   - `dlM.rrlo2WGW` `ProcessBlock` `#cfe4ffff` → BE LLM process step
   - `BnM.-sXv9~YE` `ManualOperationBlockNew` `#edf5ffff` → BE HITL
   - `7nM.qS-GAeuu` `DocumentBlock` `#c3f7c8ff` → DB RAG knowledge
   - `LnM.dxA3ExJx` `DocumentBlock` `#c3f7c8ff` → DB RAG knowledge
   - `TkM.x.zytY2a` `DatabaseBlock` `#e3fae3ff` → DB durable cylinder
   - `.mM.oP9X.Je1` `ManualInputBlock` `#fff0f0ff` → FE output to human
5. Walk edges. Decision `DkM.RMEaEThF` branches `Yes → dlM.rrlo2WGW` (LLM process) and `No → UlM.43gkZl7L` (HITL).
6. Lint with `validation.md` — no violations.

**Output to the user:**

> **Chart**: `[@] Architecture template` (`bb9ba9aa-...`)
>
> A generic AI-assisted human workflow template, structured as the canonical 3-lane scaffold.
>
> - **Flow**: An internal user provides a manual input → routed to a BE AI process step, which also persists a context document. The AI step feeds a deterministic decision gate.
>   - On **Yes**, another AI process runs and consults RAG knowledge.
>   - On **No**, an HITL manual-operation step handles it, also pulling RAG knowledge, then surfaces an output back to the human via FE.
>   - The shared durable cylinder logs the decision.
> - **FE**: 1 manual input (Internal user), 1 output to human.
> - **BE**: 2 LLM process steps, 1 deterministic decision, 2 HITL manual operations.
> - **Persistence**: 1 durable document, 1 cylinder; 2 RAG knowledge documents.
> - **Convention notes**: Clean — no violations.
>
> Edit: <https://lucid.app/lucidchart/bb9ba9aa-b4c2-4ad2-a432-87f6a805c4e0/edit>

---

## Example 2 — DRAFT: invoice approval flow

**Input from user:** "Draw this: customer uploads a CSV of invoices, AI extracts line items, a reviewer approves anything over $10k, everything else auto-posts, results stored in InvoiceLog and the customer gets notified."

**Steps you take:**

1. Layer extraction (using `architecture-principles.md` §4.1):

   | Step | Layer | Mode |
   |---|---|---|
   | Customer uploads CSV | FE / External user | Manual input |
   | AI extracts line items | BE | LLM / agentic |
   | "Total > $10k?" | BE | Deterministic decision |
   | Reviewer approves | BE / Backend manual process | HITL |
   | Auto-post | BE / State machine | Deterministic process |
   | Write InvoiceLog | DB / Data table | Durable cylinder |
   | Notify customer | FE / External user | Output to human |

2. I-P-O check on every step. All three are fillable.
3. Place each in its lane (per `scaffold.md`).
4. Pick shape + color (per `encoding-table.md`):

   | Node | shapeType | FillColor |
   |---|---|---|
   | Start terminator | `Terminator` | `#ffe342ff` |
   | Upload CSV | `Manual input` | `#ffd9d9ff` |
   | Extract line items (LLM) | `Process` | `#cfe4ffff` |
   | Total > $10k? | `Decision` | `#dedeffff` |
   | Reviewer approves (HITL) | `Manual operation` | `#edf5ffff` |
   | Auto-post (deterministic) | `Process` | purple-family `#9391ffff` |
   | InvoiceLog | `Database` | `#e3fae3ff` |
   | Notify customer | `Manual input` | `#fff0f0ff` |
   | End terminator | `Terminator` | `#ffe342ff` |

5. Build the spec on top of the scaffold (3 stacked swimlanes with sub-lanes labeled per `scaffold.md`). Edges:
   - `Start → Upload CSV → Extract line items → Total > $10k?`
   - Decision `Yes` → `Reviewer approves` → `InvoiceLog`
   - Decision `No` → `Auto-post` → `InvoiceLog`
   - `InvoiceLog → Notify customer → End`

6. Call `mcp__lucid__lucid_create_diagram_from_specification`.

7. Self-lint:
   - V1: cylinder is green durable ✓
   - V2: no `ProcessBlock` in FE ✓
   - V3: Decision is purple ✓
   - V4: HITL branch reaches InvoiceLog cylinder ✓
   - V5: LLM step has a downstream deterministic gate ✓
   - V6: Yes/No labels present ✓
   - V8: lane order correct ✓
   - V9: Start + End terminators present ✓
   - Clean ✓

**Output to the user:**

> Drafted "Invoice approval flow" — 9 nodes across 3 lanes.
> - **FE / External**: Customer uploads CSV → notified at end.
> - **BE**: LLM extracts line items → deterministic gate on $10k threshold → either HITL reviewer approval or deterministic auto-post.
> - **DB / Data table**: `InvoiceLog` (durable cylinder).
> Clean against the convention.
>
> Edit: <https://lucid.app/lucidchart/{new-doc-id}/edit>

---

## What these examples *don't* show

- Edits / modifications: see `SKILL.md` §4 for the edit protocol.
- Lint-only output: see `validation.md` for the report format.
- Multi-page charts: same protocol, just iterate per page via `page_index`.
- Sequence diagrams: out of scope — use `mcp__lucid__lucid_create_sequence_diagram` directly.
