# Writing into the Doc

The Doc is a document people are actively editing. Everything here follows from one rule:
**a bot that silently rewrites human prose is a bot nobody trusts by week two.**

## The marked block

Auto-content only ever appears inside a block stamped with the mode, ISO week, and timestamp:

```
〔自動彙整 W35 · 08-24 12:00〕
· 上週 — 官網改版 Done ／ 名單匯入 WIP ↻2週
· 本週 — LINE 名單清理、SEO 三篇上稿
· 數字 — 報名 72 ／ 訂閱 +18   〔KPI Dashboard!C14〕
· 卡關 — 名單匯入需要決定是否買 Kit 方案
```

- One block per department heading, placed **directly under the heading**, above whatever a
  human has written there.
- The stamp is also the idempotency key. Before writing, search the target section for
  `〔自動彙整 W<week>`. Present → do not write a second block.
- Never modify, reflow, or delete a line outside a stamped block.
- Promotion (turning an auto line into a real Doc line) and deletion are **human acts**, done at
  Thursday's meeting. The skill never promotes its own output.
- Every number carries its source in `〔…〕`. A number without a citation should not be written.

## Targeting the tab — the part that bites

The Doc is tabbed. Verified behaviour of the tools:

| Tool | Tab support | Use it for |
|---|---|---|
| `batch_update_doc` | **Yes** — every operation takes an optional `tab_id` | All writes |
| `inspect_doc_structure` | **Yes** — `tab_id` + `detailed=true` | Getting real indices inside the tab |
| `insert_doc_elements` | **No tab parameter at all** | **Do not use on this Doc** — it cannot target the tab |
| `get_doc_as_markdown` | No tab parameter — returns the whole Doc | Reading routing + sections (parse the tab out) |

So the write path is fixed: `inspect_doc_structure(tab_id, detailed=true)` to find indices, then
`batch_update_doc` with `tab_id` set on **every** operation. Omitting `tab_id` on even one
operation in the batch sends that operation to the main body — which on a tabbed document is not
the tab you are looking at, and the edit lands somewhere invisible.

The same trap exists in Apps Script, where `doc.getBody()` returns the main body rather than the
tab; see `scaffold.md` for the `getTabs()` walk that avoids it.

## Index arithmetic

`inspect_doc_structure(detailed=true)` returns `elements[]` with `start_index`, `end_index` and
`text_preview`. Match the department heading by its `text_preview`, then insert at the index
immediately after that heading's `end_index`.

> **Insert bottom-up.** Every insertion shifts the indices of everything after it. Writing
> several department blocks in one batch using indices read from a single inspection corrupts
> every position after the first. Sort the insertions by index **descending** and apply them in
> that order, so each write only shifts text that has already been placed.

Alternative, when a section is being built from scratch rather than patched: insert everything
with `end_of_segment: true` (no index arithmetic at all), then do a second pass with real
indices for formatting. That is the documented two-phase workflow, and it is the safer path
whenever the target is the end of the tab.

## Verify the write

Re-read the section after writing and confirm the stamp is present exactly once. Docs writes
can partially apply when an index is stale; a silent partial write is worse than a failure,
because the next run's idempotency check sees the stamp and skips the repair.

## What never gets written here

- The H2 tracker's status column — that belongs to `planning-tracker-sync`.
- A fresh week skeleton — that belongs to Apps Script, and rebuilding it would destroy the owner
  person chips that make routing work. Chips can be **copied** but not **created**, by any API.
- Anything into a section whose Thursday is already in the past.
