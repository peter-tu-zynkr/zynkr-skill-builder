# scripts

Deterministic steps live here so the model never re-derives them. Each reads JSON or markdown
on stdin and writes JSON on stdout, so they compose in a pipe and can be tested without any
network call.

| Script | In → Out |
|---|---|
| `parse_routing.py` | Doc markdown → `{heading → owner email}` read from the person chips |
| `parse_reports.py` | normalised Chat messages + config → one record per reporter, plus who is missing |
| `carryover.py` | Doc markdown → `↻N週` per item, and the agenda candidates above threshold |
| `render_block.py` | reports + routing (+ carry-over) → the `〔自動彙整〕` block per heading |
| `scaffold.gs` | **Apps Script**, not Python — duplicates next week's skeleton. See `../references/scaffold.md` |

## The usual pipeline (`rollup`)

```bash
# 1. routing — MUST come from get_doc_as_markdown; get_doc_content strips person chips
parse_routing.py --section "Aug 27, 2026" --input doc.md            > routing.json

# 2. reports — messages normalised from get_messages(space_id, createTime window)
parse_reports.py --config ~/.config/zynkr/ops-weekly.json < msgs.json > reports.json

# 3. carry-over — how long each item has been open
carryover.py --input doc.md --threshold 3                            > carry.json

# 4. the blocks to write
render_block.py --reports reports.json --routing routing.json \
                --carryover carry.json --week 2026-W35 --stamp "08-24 12:00" > blocks.json
```

Then write `blocks.json` into the Doc with `batch_update_doc`, `tab_id` set on **every**
operation, inserting **bottom-up** by index. `references/doc-write-rules.md` explains why both
of those matter.

## Exit codes

`0` success · `2` bad config or a section that does not exist · `3` no owner chips found (the
usual cause is having read the Doc as plain text instead of markdown).

Diagnostics that must reach the run report are written to **stderr** and also carried in the
JSON: `unmapped_senders`, `unrouted_headings`, `reporters_without_heading`, `duplicates`. None
of these are fatal, and none should be swallowed — a report that vanished silently looks
exactly like a person who never reported.

## Testing

Pure functions, no network. Feed them hand-crafted markdown, or a real Doc export.

`carryover.py` is the one worth exercising on real data, because it is the only script whose
output is a *judgement* (what lands on the agenda) rather than a transformation, and both of
its failure modes are invisible on small fixtures:

- **Template rows.** On the real Doc, 16 of 76 "items" were skeleton labels (`Funnel`, `TOF`,
  `Website`, `CTR`) that repeat every week by design. Unfiltered they took the top of the
  agenda. They are excluded when the corpus is large enough for the ratio to mean something
  **and** the line carries no status — both conditions, because in a short document
  "appears in every section" is exactly what a genuinely stuck item looks like.
- **Drifting matches.** Loose similarity chains: each week it matches a slightly different
  item and the streak walks across unrelated work, which produced a confident `↻35週` for an
  item present in 5% of sections. The threshold is deliberately strict.

Sanity check on any new corpus: an item's `weeks` should not greatly exceed its
`template_ratio × section count`. When it does, the chain has drifted.
