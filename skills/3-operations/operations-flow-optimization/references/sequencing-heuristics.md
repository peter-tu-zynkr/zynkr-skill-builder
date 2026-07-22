# Sequencing heuristics — the re-order playbook

Re-ordering is Step 5 of `operations-flow-optimization` and the **last, rarest, most-abused** move. By the time you reach it, Steps 2–4 have already fixed most of the "ideal flow": every step is I→P→O-clean, dependencies are mapped, and friction is gone. Re-sequencing only touches the steps whose order is *habitual*, not *forced*. This file is the full playbook behind Step 5.

---

## The prime directive

> **Anchor first, optimize second.** Lock the spine as **I → P → O** per node, then respect **dependencies / handoffs**. Only *after* that do you tweak the order for risk or throughput.

Everything below is subordinate to this. If a re-order fights a hard dependency or an I→P→O contract, the re-order loses.

---

## The five heuristics

### 1. Cheap checks upstream, expensive work downstream
Put low-cost validation gates early — format, required fields, permission, schema — so you never spend heavy steps on input that a trivial check would have rejected. "Expensive" = human review, LLM reasoning, multi-system writes, anything slow / costly / irreversible.

- **Why:** a 5-cent check that fails fast saves the dollar step behind it.
- **Micro-case:** required-field + schema check *before* routing a request to a human approver, so the approver never opens a malformed packet.

### 2. Move critical risk checks earlier
Identity, permission, eligibility, compliance — if a check can veto the whole flow, run it before you do work that would have to be undone.

- **Why:** downstream rework and compliance exposure are the two most expensive things a flow can generate.
- **Micro-case:** permission / identity check *before* initiating a transaction, not after drafting it.

### 3. Batch high-traffic inputs before scarce decisions; serialize where decisions branch
If many inputs funnel into one bottleneck (one approver, one reviewer, one rate-limited system), aggregate before the bottleneck. But stop batching at the point an outcome starts changing the downstream path.

- **Why:** batching reduces thrash on the scarce resource; over-batching hides branch-relevant differences.
- **Micro-case:** aggregate 100 similar requests into one approval packet — but *don't* batch past the approval if "approved" vs "rejected" sends items down different paths.

### 4. Keep state writes consistent with the sequence — no ghost states
When you reorder, confirm you are not creating a state that claims something is true before it durably is. The classic failure is **notifying before the durable record exists**.

- **Why:** ghost states cause the worst class of bug — the system and reality disagree, and downstream steps trust the system.
- **Rule of thumb:** a durable DB write should land *at the point the outcome becomes real*, and notifications fire *after* it.

### 5. No backward loops unless they're explicit retry / escalation paths
If a step returns upstream, it must be labeled **retry** or **escalation** with a clear condition (`on validation fail, return to intake`). An unlabeled loop is almost always hiding missing validation or unclear ownership.

- **Why:** loops are where flows secretly become non-deterministic. A labeled loop is a design; an unlabeled loop is a bug.
- **Fix, don't draw:** if you can't state the loop's condition in one clause, you have a Step 2 problem (missing input / undefined output), not a sequencing one.

---

## The payoff gate — the test every re-order must pass

A re-order is only allowed if it buys **one of exactly three things:**

| Payoff | You're buying | Signal |
|---|---|---|
| **Less rework** | Fewer steps redone because a problem was caught earlier | A downstream step currently fails often on something an earlier gate could catch |
| **Lower risk** | Less chance of harm / compliance breach / irreversible mistake | A risk check currently runs after the point of no return |
| **Higher throughput** | More work through a bottleneck per unit time | A scarce resource is thrashed by unbatched high-traffic input |

**If a proposed re-order buys none of these, keep the original dependency-driven order.** "The diagram looks cleaner," "it feels more logical," and "it groups similar steps" are **not** payoffs. Reordering that doesn't pay for itself just adds risk (see the ghost-state trap) for no return.

---

## The "what breaks if this step moves?" test

Before committing *any* re-order, ask it out loud and answer concretely:

- **Nothing breaks, and it buys a payoff** → make the move, log it.
- **Nothing breaks, but no payoff** → don't move it (payoff gate).
- **Something breaks** — moving it would change meaning, violate a contract, or create an inconsistent state → **stop.** This is not a sequencing optimization. It's a deeper redesign problem: a missing input, unclear ownership, or an undefined output. Send the step back to Step 2 (I→P→O validation). Do not force the move to make the sequence look right.

The teaching version: *if a change prevents waste (rework) or prevents harm (compliance), it can justify a minor re-order; otherwise, keep the sequence anchored to I→P→O and dependencies.*

---

## The decision log format

Every candidate re-order — accepted or rejected — gets one row. Rejected rows matter as much as accepted ones; they show the order was examined and deliberately kept.

| Step moved | From → To | Payoff (rework / risk / throughput) | "What breaks?" | Verdict |
|---|---|---|---|---|
| Permission check | after draft → before draft | lower risk | nothing — draft needs no permission | **keep move** |
| Group by company | scattered → batched pre-approval | none (cosmetic) | nothing | **reject — no payoff** |
| Notify requester | before DB write → after DB write | lower risk (no ghost state) | nothing | **keep move** |

**A decision log with zero accepted moves is a valid and common outcome.** Most of a good "ideal flow" comes from I→P→O cleanup (Step 2) and friction removal (Step 4), not from moving boxes around.
