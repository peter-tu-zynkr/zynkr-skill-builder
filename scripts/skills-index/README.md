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

| Tab | Hand edit |
|---|---|
| Knowledge Sources | added column **I `Comment`** (his review notes — the reason the 404 above was caught) |
| Knowledge Sources | renamed header E `Live-read ⟳` → `Live-read` |
| Skill Index | **deleted the `一句話說明` column** (31 cols → 30) |
| Skill Index | renamed `Skill / parent` → `Skill`, blanked the `Child / agent` header |
| all | hand-tuned column widths |

`update_drive_file(..., source_format="xlsx")` replaces the **whole file**, so publishing the
rebuilt workbook over it would silently destroy every one of those. Two consequences:

- **Column widths are never set by this script.** `set_widths()` is a no-op unless
  `ZYNKR_SET_WIDTHS=1`; the per-tab width lists survive at the call sites only as a record of
  the original intent. Widths belong to whoever is reading the Sheet.
- **To update content, write values, not the file.** Push from `…values.json` with
  `modify_sheet_values(range_name="'<Tab>'!A1", values=…, value_input_option="USER_ENTERED")`.
  `USER_ENTERED` is required or `=HYPERLINK()` cells land as literal text. The Sheets
  `values.update` endpoint has no field for column width, row height or formatting, so it
  physically cannot disturb them — that is the guarantee, not just a convention.
  Best of all, write only the cells that actually changed, as was done for the three
  column-D fixes on 2026-08-17.

Because of the column-count drift, a **blind full-tab push is now unsafe for `Skill Index`**
(the script emits 31 columns, the Sheet has 30 — everything from `一句話說明` rightward would
shift by one). Re-align the header row first, or keep writing surgically.

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
- Also unindexed on purpose: the nested child skill at
  `skills/1-brand-marketing/zynkr-content-writer/.claude/skills/write-article/SKILL.md`, which the
  marketplace does not list.

Design tokens (colours, fonts) are copied from `zynkr-website-fe/styles.css` `:root` per the
fleet brand rule — the website is the arrow-of-truth. Orange `#F26B1F` appears exactly once, on the
WIP status flag.
