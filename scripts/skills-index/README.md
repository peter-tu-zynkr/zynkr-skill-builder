# Skills Index Sheet generator

Builds **[6.0] Zynkr Skills Index** — the human-readable catalogue of every skill on the
marketplace: what each does, its sub-skills, where it reads knowledge from, which Zynkr product it
connects to, and whether it needs an MCP server.

- Live Sheet: <https://docs.google.com/spreadsheets/d/1VqH1BmyRPK0khY4SBuH1uVzPtk_eh9Z2w5gfaIfKuo0>
- Drive home: the `[6.0]` governance folder (`19B9BkAPLL41vleJFu__rygRMiJF6j5hm`)
- First built 2026-08-17 from a 112-entry snapshot (79 callable skills + 33 sub-skills)

Schema deliberately mirrors the `PM skills` tab of *[3.3] PM Flow × Skill Portfolio Assessment*
(`15uxtdPhF95jP4qt0AhdulxuOP5eOwSD9K8yijZ3tqSg`): a repeating `No.` per logical unit, sub-skills
interleaved beneath their parent as `└` rows, skills named `slug (id)` inline, and a
controlled-vocabulary status column. This one is an **index** (what exists), not a coverage
**assessment** (what's missing).

## Two layers of truth

Do not conflate these — the generator reads each from a different place:

| Layer | Question | Source of truth |
|---|---|---|
| **Rows** | Is this skill published? | the live marketplace API, `https://zynkr.ai/api/skills` (Supabase-backed) |
| **Columns** | What does this skill mean? | the `SKILL.md` bodies in this repo, plus their `agents/` and `references/` files |

`generated/skills-index.json` is a build artifact and can lag the live API — on 2026-08-17 it was
one entry behind. Always take the row set from the API.

## Files

```
build_index_sheet.py          # renders data/*.json -> Zynkr-Skills-Index.xlsx (6 tabs)
build_knowledge_doc.py        # renders the same data -> Zynkr-Skills-Knowledge-Map.html (a Google Doc)
data/inventory.json           # 112 rows: live API fields + local file paths + parent/child links
data/extracted.json           # per-skill metadata read out of the SKILL.md bodies
```

`data/extracted.json` is the expensive artifact: the knowledge-source / MCP / solution columns are
**not** in SKILL.md frontmatter, so they were extracted by reading all 112 source files in full.
It is versioned here so the Sheet can be rebuilt without redoing that pass.

## Rebuild the Sheet from existing data

```bash
pip install openpyxl
python3 build_index_sheet.py
```

This writes two files: `Zynkr-Skills-Index.xlsx` (whole workbook) and
`Zynkr-Skills-Index.values.json` (every tab as a plain 2-D array of cell values).
Which one you publish with matters — see next section.

## ⚠ The live Sheet has diverged — do not re-convert over it

The published Sheet is no longer a pure render of this script. As of 2026-08-17 Peter has, by hand:

| Tab | Hand edit | Now reproduced by the script? |
|---|---|---|
| Knowledge Sources | added column **I `Comment`** (his review notes — the reason the 404 above was caught) | yes — `data/sheet-comments.json` |
| Knowledge Sources | renamed header E `Live-read ⟳` → `Live-read` | yes |
| Skill Index | **deleted the `一句話說明` column** (31 cols → 30) | yes |
| Skill Index | renamed `Skill / parent` → `Skill`, blanked the `Child / agent` header | yes |
| MCP & Services | shortened the per-server headers `MCP · gmail` → `gmail` | yes |
| Overview | dropped the `⟳` from the `Live-read` headline label | yes |
| all | hand-tuned column widths | n/a — never written, see below |

As of 2026-08-18 the generator reproduces every one of those, so its output and the live grid
line up column-for-column. That is enforced, not remembered — see **Header parity** below.

`update_drive_file(..., source_format="xlsx")` replaces the **whole file**, so publishing the
rebuilt workbook over it would silently destroy every one of those. Two consequences:

- **Column widths and row heights are never set by this script.** `set_widths()` and
  `set_row_height()` are no-ops unless `ZYNKR_SET_WIDTHS=1`; the per-tab values survive at the
  call sites only as a record of the original intent. Layout belongs to whoever is reading the
  Sheet — and a *pinned row height actively hides content*: a cell can hold ten newline-separated
  items and still look like one line if the row is stuck at 58px. That is exactly what happened
  to Knowledge source / Triggers / Key MCP tools / External services / Setup required on the live
  Sheet, and why those cells looked like run-on lines despite containing real newlines.
- **Multi-value cells are one item per line** (`bullets()`), not `·`-joined. Two things are
  needed for that to *show* in Sheets, and both must hold: real `\n` in the value, and
  `wrapStrategy=WRAP` on the column (`format_sheet_range`). Newlines alone are not enough
  when the row height is fixed.
- **To update content, write values, not the file.** Push from `…values.json` with
  `modify_sheet_values(range_name="'<Tab>'!A1", values=…, value_input_option="USER_ENTERED")`.
  `USER_ENTERED` is required or `=HYPERLINK()` cells land as literal text. The Sheets
  `values.update` endpoint has no field for column width, row height or formatting, so it
  physically cannot disturb them — that is the guarantee, not just a convention.
  Best of all, write only the cells that actually changed, as was done for the three
  column-D fixes on 2026-08-17.

### Header parity — the guard that replaced that warning

Column drift used to make a full-tab push unsafe: the script emitted 31 columns while the Sheet
had 30, so everything from `一句話說明` rightward would land one column to the left of where it
belonged. Nothing would error. The data would just be wrong, quietly, in a document people trust.

`data/live-headers.json` records the live Sheet's header row for all six tabs, and
`check_header_parity()` runs before the workbook is saved. Any added, removed or renamed column
prints a per-column diff and **exits 1** — the build produces no artifact to push.

```
HEADER DRIFT — publishing this would shift live cells. DO NOT PUSH:
  Skill Index   col I   generated='一句話說明'   live='Triggers'
REFUSING: regenerate after reconciling headers, or set ZYNKR_ALLOW_HEADER_DRIFT=1
```

If a column change is *intended*, update `live-headers.json` in the same commit. To build a
brand-new Sheet from scratch, set `ZYNKR_ALLOW_HEADER_DRIFT=1`.

### Review comments survive a rebuild

Column I of Knowledge Sources holds Peter's review notes. That tab is sorted by scope and then by
how many skills share a source, so **adding any skill reshuffles it** — the 2026-08-18 rebuild
moved his six notes from rows 15/18/23/44/52/85 to 25/31/57/98. A positional write would have left
every note against the wrong source, which reads as a comment about the wrong thing rather than as
an obvious error.

`data/sheet-comments.json` keys each note to its source's Drive ID (or, when the source has none,
its name), and the build re-attaches them by identity. A note that matches nothing is **not**
dropped silently — the build warns. Notes whose underlying request has since been carried out
carry a `done` field recording what changed; those stop being emitted and stop warning.

### Growing the grid

`values.update` does not extend a sheet: writing past the last row fails with
`Range (...) exceeds grid limits`. When a rebuild adds rows, grow the grid first with
`resize_sheet_dimensions(sheet_name=…, insert_rows=N)` (appending at the end never disturbs
existing rows), then push values.

A full re-convert is only correct when building a **new** Sheet from scratch — in which case set
`ZYNKR_SET_WIDTHS=1` so the new file gets sensible widths:

```bash
ZYNKR_SET_WIDTHS=1 python3 build_index_sheet.py
cp Zynkr-Skills-Index.xlsx ~/.workspace-mcp/attachments/
```

then `update_drive_file(file_id="1VqH1Bmy…", file_path="~/.workspace-mcp/attachments/Zynkr-Skills-Index.xlsx", source_format="xlsx")`.

Publishing gotchas:

1. The MCP can only read local files under `~/.workspace-mcp/attachments` — anywhere else errors
   with "path is outside permitted directories".
2. `import_to_google_sheets` truncates a `file_name` starting with `[` (so `[6.0] Foo` became `[6`).
   Rename afterwards with `update_drive_file(name=…)` — the parameter is `name`, not `new_name`.
3. `import_to_google_sheets` always creates a NEW file. Use `update_drive_file` to revise, or the
   old link is orphaned. Tab `gid`s change on re-convert, so share the file link, never a `#gid=`.

## The companion Doc — Zynkr Skills Knowledge Map

```bash
python3 build_knowledge_doc.py     # -> Zynkr-Skills-Knowledge-Map.html
cp Zynkr-Skills-Knowledge-Map.html ~/.workspace-mcp/attachments/
```

then `import_to_google_doc(file_path=…, source_format="html", folder_id="19B9BkAP…")` and rename
(the `[` truncation gotcha applies to Docs too). Live Doc:
<https://docs.google.com/document/d/1AcO1kshhyky21EsRnS8oEchN_CFzuY1JfHyuOCEuguM>

**Why a Doc exists at all.** A Sheets cell holds exactly one clickable link (`=HYPERLINK`), but a
skill reads up to 13 sources — so on `Skill Index` col M the URLs can only be plain text. A Doc has
no such limit: HTML `<ul>`/`<a href>` convert to native bullets and real links, one per source.
The Sheet stays the filterable table; the Doc is where you go to *open* things.

Two rules for this script:

- **It imports `build_index_sheet`, it does not re-implement it.** `ks_url()` is the single
  arbiter of where a source lives. A second copy would drift, and the two artifacts would start
  disagreeing about the same file.
- **It classifies every unlinked source, and the classification is the deliverable.** 352 sources,
  ~220 linked; of the rest, `by-design` (templated ID, Gmail query, calendar, local config, MCP
  resource, per-run web page) needs no action, `review` (a Doc named with no ID — probably
  per-engagement, but the source cannot prove it) is worth confirming, and only `defect` (a stated
  repo path resolving nowhere) plus `DEAD_IDS` are real bugs. Reporting "156 sources have no link"
  reads as rot; reporting "1 broken, 2 dead" is a to-do list. Keep the split honest — the
  precedence in `why_no_link()` matters, because the *type* settles it first (a Gmail search is
  not a file however the entry is phrased) and `via sub-skill` must be tested before the type.

`ks_url()` resolves repo paths through `resolve_repo_path()`, which tries four bases because skills
state paths from four vantage points: relative to the skill folder (`./references/x.md`), to the
sibling skill (`seo-publish-article/references/x.md`), to the repo root (`generated/x.json`), and
with the repo name still attached (`zynkr-skill-builder/scripts/x.ts`). Existence on disk arbitrates,
so widening the search cannot manufacture a dead link. A bare skill slug
(`product-flow-design (installed skill)`) resolves to that skill's folder — but *only* when the
entry states no path at all, and never to the declaring skill's own folder, or a genuinely missing
file would be masked by a link to something nearby.

## Refresh the data after skills change

1. Re-snapshot the row set (`WebFetch` gets a Cloudflare 403 here; plain `curl` works):
   ```bash
   curl -s https://zynkr.ai/api/skills -o /tmp/live-skills.json
   ```
2. Rebuild `data/inventory.json` — join that snapshot to the repo tree, resolving each entry's
   `source_path` to a local file and mapping every `agents/*.md` to its parent skill directory
   (a parent is the dir holding `agents/`, skipping a `.claude/` level when present).
3. For skills whose SKILL.md changed, re-extract their `data/extracted.json` entry by reading the
   full file — frontmatter alone is not enough. Per skill capture: one-liner (en + zh), triggers,
   knowledge sources (`type`, `name`, `id_or_url`, `runtime_read`, `purpose`), connected solutions
   (`solution`, `touchpoint`, `direction`), `requires_mcp`, `mcp_servers`, `mcp_tools`,
   `external_services`, `side_effect_level`, `human_gate`, `artifacts_produced`, `setup_required`,
   `gotchas`.
4. Re-run the builder and publish.

## Things worth knowing about the data

- **`runtime_read` is the important flag.** 294 of 310 knowledge sources are re-read on every run,
  so most skill behaviour is tuned by editing a Google Doc, not a prompt. The Sheet surfaces this as
  the `Live-read ⟳` column and the generator preserves it through dedup.
- **Dedup is by Drive ID, not name.** The same folder gets described several different ways across
  skills (`[2.2] …（numbered [N] 母層）` vs `parent [2.2] = <id>`). `ks_key()` keys on the long ID when
  one is present and falls back to a normalised name. Keep the ID's **original case** for display —
  Drive IDs are case-sensitive even though the dedup key is lowercased.
- **`external_services` arrives as free text** (51 variants for ~25 real services, mostly differing
  by a trailing parenthetical). `norm_ext()` collapses them; extend `EXT_MAP` when a new one appears.
- **Parents inherit their children's dependencies.** `rollup()` unions each sub-skill's MCP servers
  into the parent and tags the inherited-only ones `(via sub-skill)`, because invoking a parent
  invokes its children. It is a no-op on the current data (every affected parent already declared
  the server itself) but guards against a parent that only delegates.
- **Resolve paths against `origin/main`, not whatever the local checkout is on.** `zynkr-gm` (0.02)
  was first extracted from the published `zynkr.ai/s/0.02.md` because the local checkout was on a
  stale commit where `skills/0-strategy/` still held only a `.gitkeep`. The file does exist on
  `origin/main` (added by `6c6071e7`, SKB-006) and is byte-identical to the published copy, so the
  extraction stands — but step 2 should still tolerate a missing local file rather than assume one.
- **No link is emitted that cannot be stood behind.** `ks_url()` and `source_url()` only return a
  URL for an explicit URL, a Drive ID, a repo path that resolves on disk, a bare `owner/repo`, a
  Lucid UUID, or the Supabase project. Templated values (`<your-…-id>`), Gmail label names and
  per-run documents stay plain text. `is_drive_id()` requires mixed case, a digit and no `--`,
  which is what keeps slide-visual-selector's archetype slugs from being mistaken for Drive IDs.
- **A Gmail label ID looks exactly like a Drive ID.** `Label_1203655627141795093` passes every
  shape test — mixed case, digits, long enough — so it was briefly rendered as a
  `drive.google.com/open?id=…` link that could only ever 404. `ks_url()` now rejects both the
  `Label_` prefix and any source whose declared type is Gmail. Shape is not proof of type.
- **Link audit, 2026-08-17: 53 Drive IDs checked against the API, 52 alive, 1 dead.** The dead one
  is `1K-pSQtVR7ezWADIH2_tSCqpOcY-btAkK` ("02 Seed Knowledge"), declared as `seed_knowledge_folder_id`
  in `skills/1-brand-marketing/seo-article-pipeline/seo-pipeline-config.md` — the file that calls
  itself the SOT for all Drive IDs. The folder is not in trash and no folder of that name exists;
  the SEO KB root now holds `00 Brand Context / 01 Rubrics & Templates / 02 AEO Prompt Panel &
  Metrics (a Doc) / 03 … / 04 …`. **`seo-article-pipeline` and `seo-brief-writer` will fail at
  runtime when they search it.** Listed in `DEAD_IDS` so a rebuild cannot re-link it; remove the
  entry once the folder is recreated and the config repointed.
- **Appendix B in the Doc groups by resolved URL, not by `ks_key()`.** The same file stated two
  ways (`./seo-pipeline-config.md` here, `seo-article-pipeline/seo-pipeline-config.md` there) makes
  two text keys but one file, so a text key under-counts the blast radius. This is deliberately
  **not** fixed in `ks_key()`: that function decides the `Knowledge Sources` row set, and Peter's
  review comments in column I are anchored to those rows — re-grouping would silently detach them.
  Supabase sources are exempt from URL grouping, since they all resolve to the one project-level
  table editor and would otherwise fuse a dozen distinct tables into a single row.
- Also unindexed on purpose: the nested child skill at
  `skills/1-brand-marketing/zynkr-content-writer/.claude/skills/write-article/SKILL.md`, which the
  marketplace does not list.

Design tokens (colours, fonts) are copied from `zynkr-website-fe/styles.css` `:root` per the
fleet brand rule — the website is the arrow-of-truth. Orange `#F26B1F` appears exactly once, on the
WIP status flag.
