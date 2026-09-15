# Writing into the Doc

The Doc is a document people are actively editing. Everything here follows from one rule:
**a bot that silently rewrites human prose is a bot nobody trusts by week two.**

## The marked block

Auto-content only ever appears inside a block stamped with the week and a timestamp:

```
〔自動彙整 WB 9/14 · 09-15 12:00〕
· 上週 — 官網改版 Done ／ 名單匯入 WIP ↻2週
· 本週 — LINE 名單清理、SEO 三篇上稿
· 數字 — 報名 72 ／ 訂閱 +18   〔KPI Dashboard!C14〕
· 卡關 — 名單匯入需要決定是否買 Kit 方案
```

`WB 9/14` is the **week beginning** — the Monday that opens the week, which is also the day
the team posts. It replaced the ISO ordinal (`W38`) on 2026-09-15: a week number is a figure
the reader has to stop and count, and everything else in this Doc is dated.

- One block per department heading, placed **directly under the heading**, above whatever a
  human has written there.
- The stamp is also the idempotency key. Before writing, search the target section for
  `〔自動彙整 <week>`. Present → do not write a second block.
- **During the changeover, match both shapes.** Sections written before 2026-09-15 carry
  `〔自動彙整 2026-W38 · …〕`. A search for only the new shape will not find them and will
  write a second block into a section that already has one. Accept `〔自動彙整 WB 9/14` **or**
  `〔自動彙整 2026-W38` until no live section predates the change — which, with the archive in
  place, is three weeks. Then drop the legacy arm.
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

## Removing a block — the Friday `tidy` (SKB-030)

`tidy` is the only mode that deletes, and it deletes **only** whole stamped blocks that
`tidy_blocks.py` marked for archiving. It never removes part of a block, never a human line,
and never the block it decided to keep.

- **Copy to the 封存 tab first, verify, then delete.** The order is the whole safety design. A
  crash between the two leaves the content duplicated, which is visible and repairable; the
  reverse order loses it. SKB-029 threw exactly here and survived only because the copy went
  first.
- **Delete by descending index**, for the same reason insertions go bottom-up: each deletion
  shifts everything after it. Collect every range from one `inspect_doc_structure(tab_id,
  detailed=true)` call, sort descending, then issue them in that order.
- **Never delete the last paragraph of the tab.** A Docs segment must end with one. In practice
  every block group is followed by a heading or a human line, so this cannot arise — but assert
  it rather than assume it. This is the Docs-API face of the Apps Script error that killed
  SKB-029: `Can't remove the last paragraph in a document section.`
- **Re-read and confirm one stamp per group** before reporting `status=ok`. A partial delete
  that leaves half a block is worse than no delete, because the next run sees a single block
  and treats the group as already tidy.

## Verify the write

Re-read the section after writing and confirm the stamp is present exactly once. Docs writes
can partially apply when an index is stale; a silent partial write is worse than a failure,
because the next run's idempotency check sees the stamp and skips the repair.

## What never gets written here

- The H2 tracker's status column — that belongs to `planning-tracker-sync`.
- A fresh week skeleton — that belongs to Apps Script, and rebuilding it would destroy the owner
  person chips that make routing work. Chips can be **copied** but not **created**, by any API.
- Anything into a section whose Thursday is already in the past.
