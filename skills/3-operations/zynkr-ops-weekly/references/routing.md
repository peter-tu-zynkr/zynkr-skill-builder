# Routing — the Doc already holds the map

The largest finding from reading the Doc: **each department heading already carries its owner's
Google Docs person chip**, keyed by email. Somebody maintains that by hand for other reasons.
So this skill keeps no department table — it reads the chips at run time.

Consequence worth stating plainly: **whoever owns a department is changed by editing the Doc**,
not by editing this skill. And because the recap mail is addressed to the same chips, the Doc
edit updates the mailing list too. One artefact, two behaviours, no second table to drift.

## Reading the chips

Fetch with **`get_doc_as_markdown`**.

> `get_doc_content` returns plain text and **strips person chips entirely**. Using it makes the
> Doc look like it has no routing information at all — the chips are invisible in that view.
> This cost a full pass on first read; use markdown.

In markdown a person chip arrives as a mailto link:

```
### #Demand Marketing   [Sam Rivera](mailto:owner-a@example.com)
```

`scripts/parse_routing.py` walks the headings, takes the **first** mailto on each heading line
(or on the line immediately following, which is where a chip lands when the heading wrapped),
and emits `{heading, owner_email, owner_name, level}`.

## Grouping rules

- One heading may pair with a sub-heading (`#Demand Marketing` + `##Branding`) under the same
  owner. Same owner on adjacent headings → treat as one routing target, and write the block
  under the **parent**.
- One owner may hold several unrelated headings. A report goes under the heading it names
  explicitly; if it names none, under that owner's **primary** heading — the first in Doc order.
- A heading with **no chip** is not a routing target. Report it as `unrouted_heading`; do not
  fall back to guessing from the heading text.
- An owner email not in `reporters` is a legitimate non-reporting owner (a section somebody owns
  but does not report on weekly). Route to it, never chase it.

## Chip maintenance is a real task

Chips go stale. Two failure modes, both silent:

1. **A chip names the wrong owner.** Routing is confidently wrong — updates land under someone
   else's name and that owner is chased for a report they did post.
2. **A departed colleague's chip stays on a heading.** Old sections keep it as history, which is
   fine; a *current* section keeps chasing a ghost. Only `reporters` stops the chase.

The skill cannot detect either — a chip is just an email. What it *can* do is surface every
owner it resolved in the run report, so a wrong one is visible the first week rather than the
fifth. Read that list.

## The off-by-one

The Doc names its sections by **Thursday** (`Aug 27`, `Aug 20`, `Aug 13`…). The team reports on
**Monday**. So:

> **Monday's posts belong to the Thursday that is coming, not the one that just passed.**

Getting this wrong writes a whole week of updates into the previous meeting's section, where it
reads as a duplicate of last week and confirms the very "the Doc just repeats itself" problem
this skill exists to fix.

Assert it: `target_thursday >= today`. If the newest section in the Doc is already in the past,
the Apps Script scaffold has not run — **stop and report**. Do not write into a stale section,
and do not create a new one here (creating loses the chips — see `scaffold.md`).
