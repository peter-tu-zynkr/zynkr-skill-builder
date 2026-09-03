# Skills Index Sheet + Drive `[6.2]` mirror — the two destinations CI does not touch

## Why this file exists

`ingest-skills.yml` automates everything downstream of a merge to `main`:

```
merge → ingest.ts → content/ → build-marketplace.ts → generated/skills-index.json
      → build-taxonomy-tree.ts → skills/README.md → auto-commit
      → POST skills-detail.json → zynkr.ai/api/skills/sync → Supabase → marketplace
```

It touches **git, Supabase and the website. Nothing else.** Two human-facing surfaces are
outside that chain and no script in this repo writes them:

| Surface | What writes it | Consequence if skipped |
|---|---|---|
| **Skills Index Sheet** (`Skill Index` tab) | nothing automated | the skill is absent from the portfolio index, or present as a row whose four link columns are dead plain text |
| **Drive `[6.2]` mirror** | nothing automated | there is no Drive target for the Sheet's link columns to point at |

A skill merged after the last mirror run has **no Drive folder**, so its Sheet row cannot be
linked even if someone adds the row. That is why this runs at `confirm-ship`: post-merge, the
files are on `main` and can be copied.

## Fixed IDs (committed literals — do not re-derive them from a Drive search)

- **Skills Index Sheet**: `1VqH1BmyRPK0khY4SBuH1uVzPtk_eh9Z2w5gfaIfKuo0`, tab `Skill Index` (gid `907874376`)
- **Drive root** `[6.2] Skills & Knowledge Library`: `1Q0XwdR574cNUVlT7lYVbpzNbVsup2KAu`
  - `1 Skills/` — `1r92r__bUGZ61ZJP5fGcHGg_mnTaicFhz`
  - `2 Knowledge/` — `1jkloCgEHHfy83R-PFPTZBCllh4znvhi2`

Category folders under `1 Skills/` (the eight that carry skills):

| Repo dir | Drive folder | ID |
|---|---|---|
| `0-strategy` | `0 Strategy & Leadership 策略與領導` | `1igX5f8UQu5vy9c3tMCT5yLFxA89Wm2kt` |
| `1-brand-marketing` | `1 Brand & Marketing 品牌與行銷` | `1IoMVkF0Me2iSJnnSC-0_wyqx8KLjOgsc` |
| `2-sales-consultant` | `2 Sales & Consultant 銷售與顧問` | `1R_c1NR_cnhqkXs-MMYvCjuKZTLtO2YPD` |
| `3-operations` | `3 Operations 營運` | `1fQRS_m4CssL9KPjizei3TmTIcot-5agP` |
| `4-training` | `4 Training 培訓` | `1Amn0jHj8Mv9wfj2nQNysc3BMDgyznnY5` |
| `5-product` | `5 Product 產品` | `1GEGRw6-2vASi3IqMUA5Y7Sla26VFxpCx` |
| `6-engineer` | `6 Engineer 工程` | `1r4ulOn6hW3K1haR5oKhFbE4hzJK6mzU_` |
| `7-people-talent` | `7 People & Talent 人才與招募` | `1Rn-RrM8TwpUk4O37QjorEf6GmN_b2B9U` |

`8-finance-admin` and `9-legal` exist in `taxonomy.md` but carry no skills and therefore have
**no Drive folder yet**. If the skill being shipped is the first in one of those, create the
category folder under `1 Skills/` first, named to match the pattern above.

## What gets created

- **Always** — `1 Skills/<category folder>/<slug>/` holding `SKILL.md` (raw, `text/markdown`).
- **Only when the skill ships knowledge** — `2 Knowledge/<slug>/` holding every other
  git-tracked file in the skill directory, **flattened**: `references/foo.md` becomes
  `references__foo.md`, `scripts/bar.py` becomes `scripts__bar.py`.

A skill whose directory contains nothing but `SKILL.md` gets **no** knowledge folder, and its
Sheet cell `N` stays blank. That is the normal case for roughly a third of the portfolio — an
empty knowledge folder is worse than none, because `N` would then link to nothing.

## Deciding "is there knowledge" — one command, not a judgement call

```bash
git ls-tree -r --name-only origin/main -- "skills/<N-cat>/<slug>" \
  | grep -v '/SKILL\.md$' | grep -v '^skills/<N-cat>/<slug>/SKILL\.md$'
```

The count of those lines is both the answer and the label for column `N`
(`1 file` / `<n> files`; blank when zero). This is the column's stated definition —
git-tracked files the skill ships **besides** its `SKILL.md`.

## The Sheet contract

The tab is 33 columns, `A`–`AG`. Four of them carry links, one link per cell:

| Col | Header | Target | Label |
|---|---|---|---|
| `C` | `Skill` | GitHub blob of the source path on `main` | `<slug> (<sheetId>)` |
| `M` | `Skills md` | the Drive **file** `1 Skills/<cat>/<slug>/SKILL.md` | `SKILL.md` |
| `N` | `Knowledge files` | the Drive **folder** `2 Knowledge/<slug>` | `<n> files` — blank if none |
| `AG` | `Skill folder` | the Drive **folder** `1 Skills/<cat>/<slug>` | `<slug>` |

Write them as `=HYPERLINK("<url>","<label>")` with `value_input_option="USER_ENTERED"`, or the
formula lands as literal text. Sub-skill rows (column `C` is `└`) leave `M`, `N` and `AG`
blank — a child is filed inside its parent.

## Procedure A — mirror to Drive

1. Resolve the category folder ID from the table above.
2. Create `1 Skills/<cat>/<slug>/`.
3. Stage the files. **Uploads must be staged under `~/.workspace-mcp/attachments/`** and passed
   as a `file://` URL — anything outside that directory is refused by the sandbox, and passing
   file bodies inline round-trips them through the model instead of copying bytes.
4. Upload `SKILL.md` with `mime_type="text/markdown"`.
5. If, and only if, the knowledge count is non-zero: create `2 Knowledge/<slug>/` and upload the
   flattened files. Mime types: `.md` → `text/markdown`; `.json`, `.py`, `.sh`, `.gs` →
   `text/plain`.
6. Delete the staging directory afterwards.

## Procedure B — record in the Sheet

1. Read the tab and find the skill's row by its `sheetId` in column `C`. If the row is missing,
   append one — its data columns come from the SKILL.md frontmatter, the same fields the
   generator reads.
2. Write the four link cells above.
3. If a new row was appended, refresh the `Overview` tab's headline counts.

## Verify before flipping the issue to `shipped`

- Re-read `M`/`N`/`AG` for the row and confirm each returns a hyperlink, not plain text.
- Confirm the uploaded `SKILL.md`'s frontmatter `name` matches the slug — a mis-parented file is
  the failure mode that looks fine in the Sheet and opens the wrong skill.
- Confirm the knowledge folder's file count equals the label written in `N`.

## Gotchas that have already cost time

- **`.md` content cannot be replaced in place.** `update_drive_file` handles only native
  Docs/Sheets/Slides. A refresh means create-new + trash-old, so **file IDs churn while folder
  IDs survive** — which is why `M` needs rewriting on every re-sync and `N`/`AG` do not.
- **Two folders legitimately share the slug name** — one under `1 Skills/`, one under
  `2 Knowledge/`. A Drive search by name returns both. They are not duplicates; do not
  "clean up" either.
- **`_SOURCES.md` is not universal.** Folders created before the 2026-08-28 pass do not have
  one, and it is generated from the Knowledge Map Doc's three-group logic. Do not hand-author
  one to make a folder look complete.
- **Never repair the tab by republishing** `scripts/skills-index/build_index_sheet.py` unless
  that is the intent: a full render rewrites roughly two-thirds of the `Knowledge files` values,
  because that column only got a single stated definition after the fact. Incremental cell
  writes are the safe repair; a full republish is a deliberate, separate act.
- **The mirror is one-way**: `zynkr-skill-builder/skills/` → Drive. Never edit in Drive; the
  next sync destroys it.
