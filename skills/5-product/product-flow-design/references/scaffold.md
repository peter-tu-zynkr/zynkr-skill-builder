# Canonical Swimlane Scaffold

Every new chart starts from this layout. Extracted verbatim from the canonical `[@] Architecture template` (Lucid doc id `bb9ba9aa-b4c2-4ad2-a432-87f6a805c4e0`).

---

## 1) Lane structure (top → bottom — mandatory order)

```
┌──────────────────────────────────────────────────────────────────┐
│ Front end user                                                   │
│   ├── External user                                              │
│   └── Internal user                                              │
├──────────────────────────────────────────────────────────────────┤
│ Backend system / process policy                                  │
│   ├── Backend manual process               (HITL — light blue)  │
│   └── Backend state machine / AI assistant (deterministic + LLM)│
├──────────────────────────────────────────────────────────────────┤
│ Data base / knowledge base                                       │
│   ├── Data base data table                 (durable — green)    │
│   └── Knowledge base knowledge             (RAG — dark green)   │
└──────────────────────────────────────────────────────────────────┘
```

**Lane labels (use exactly these strings):**
- Top lane: `Front end user`
  - Sub-lane 0: `External user`
  - Sub-lane 1: `Internal user`
- Middle lane: `Backend system / process policy`
  - Sub-lane 0: `Backend manual process`
  - Sub-lane 1: `Backend state machine / AI assistant`
- Bottom lane: `Data base / knowledge base`
  - Sub-lane 0: `Data base data table`
  - Sub-lane 1: `Knowledge base knowledge`

**Rules:**

- Lane order is mandatory: FE on top, BE in the middle, DB at the bottom. Don't reorder.
- Each lane is an `AdvancedSwimLaneBlock` with three `Primary_0/1/2` rows in the top-level scaffold of the canonical template. Reading the canonical chart's JSON shows the convention: three top-level swimlane shapes stacked vertically, each labeled, with nested rows for the sub-lanes.
- Sub-lanes are rendered inside the parent lane as labeled bands; place nodes by adjusting their `BoundingBox` so they fall inside the right band.

---

## 2) Escape hatches — when NOT to use the scaffold

- **Pure sequence diagram** (e.g., API call timing, message-passing between services): use `mcp__lucid__lucid_create_sequence_diagram` instead. The scaffold doesn't apply to sequence diagrams.
- **Single-user tool with no BE**: still use the 3-lane scaffold, but the BE lane can be minimal (one or two nodes). Don't drop lanes.
- **Architecture-only component diagram** (no process flow, just boxes-and-arrows of system components): free-form layout is acceptable, but the color convention still applies.

Otherwise: use the scaffold. Always.

---

## 3) Starter spec for `lucid_create_diagram_from_specification`

The Lucid Standard Import JSON spec evolves. **Always** fetch `lucid://diagram-specification` via `mcp__lucid__get_mcp_resource` before constructing a spec — don't memorize the schema.

The recipe (apply to whatever the current schema requires):

1. **One page** with title matching the user's process name.
2. **Three vertically-stacked `AdvancedSwimLaneBlock`** shapes — one per top lane. Each has two `Primary_0` / `Primary_1` rows for the sub-lanes.
3. **Lane labels** populated per §1 above.
4. **Lane geometry**: stack the three swimlane blocks with no gap; each ~400 high; sub-lanes split that height. The canonical template uses a width of ~3645 and height of ~1200 for the lane stack at coordinates `x: 960, y: -160`. Match approximately when in doubt.
5. **Nodes** added inside lanes with `BoundingBox` coordinates that fall inside the right band. Read existing canonical-template node coordinates as reference if needed (`mcp__lucid__fetch` on `bb9ba9aa-...`).

If `lucid_create_diagram_from_specification` rejects nested swimlanes for your current schema version, the fallback is:

- Create the diagram with a flat scaffold (three labeled containers, no sub-lanes).
- Use `mcp__lucid__lucid_add_block` for each node with explicit coordinates that visually place it inside the right sub-band.
- Add sub-lane labels as text shapes if needed.

---

## 4) Reference: lane coordinates from the canonical template

These are the actual `BoundingBox` values from `bb9ba9aa-...` — useful as a starting layout:

| Lane | Approx. `BoundingBox` |
|---|---|
| Top lane (Front end user) — outer swimlane | `x: 960, y: -160, w: 3645, h: 1200` (overlapping; the three top lanes share the same bounding rect in the canonical template because they're sub-rows of one big swimlane) |
| External user sub-band | `y: -160` to `y: 40` |
| Internal user sub-band | `y: 40` to `y: 240` |
| Backend manual process sub-band | `y: 240` to `y: 440` |
| Backend state machine / AI assistant sub-band | `y: 440` to `y: 640` |
| Data base data table sub-band | `y: 640` to `y: 840` |
| Knowledge base knowledge sub-band | `y: 840` to `y: 1040` |

In the canonical template each sub-band is 200 units tall. Nodes are ~160 wide × 120 high. Use that as your default node footprint.

---

## 5) Quick lane placement decision

When you have a node and need to pick its lane, ask in this order:

1. **Is a human directly interacting with it?**
   - Yes, external customer → FE / External user
   - Yes, internal operator/reviewer/admin → FE / Internal user
2. **Else, is it a human execution step (approval, review, override)?**
   - Yes → BE / Backend manual process
3. **Else, is it a machine-executed step (deterministic or LLM)?**
   - Yes → BE / Backend state machine · AI assistant
4. **Else, does it persist data?**
   - Durable / system-of-record → DB / Data base data table
   - RAG / knowledge for retrieval → DB / Knowledge base knowledge
5. **None of the above** → It's probably a `Terminator` or `Off-page link`; place near the relevant lane boundary.

If a node feels like it could go in two lanes, re-read `architecture-principles.md` §2 (golden rules). The smell test: "FE shows intent; BE owns meaning."

---

## 6) Clean / presentation variant (stakeholder charts)

When the chart is for stakeholders rather than an engineering audit ("make it human-readable / 視覺友善"), keep the FE→BE→DB order and Shape × Colour semantics, but relax the mandatory 6-sub-lane scaffold for readability:

- **Drop empty lanes** (no `External user` step → don't render that band) and you may collapse the BE sub-bands to `Backend · human gate (HITL)` + `Backend · AI / rules`. Net **4–5 lanes, no empty rows**.
- Add a **legend** (colour-chip key) and a **"How to read this"** panel beside the flow.
- **Light lane headers with dark, legible titles** (avoid dark `headerFill` like `#3a3f4b` — the small vertical titles drown in it; see V13) with a faint per-layer `laneFill`.
- One node per step, **≤4-word labels**, `fontSize` **10**, generous column pitch (~300).
- Plumbing edges (saves / loads / consults) = thin **dashed grey** (`#888888`, width 1); only decisions and gate outcomes get labels.
- Don't collapse distinct knowledge into one node — keep *which* RAG source feeds *which* stage as separate dashed edges.

The lane-width-sum and node-in-band rules still apply. See `SKILL.md` §8 (build reality) and §9 (two registers). Reference exemplar: Lucid's stock "AI process diagram" template.
