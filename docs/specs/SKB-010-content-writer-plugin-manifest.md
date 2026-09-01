# SKB-010 — zynkr-content-writer becomes a declared plugin

- **Status:** Built 2026-09-01 · manifest authored, orchestrator frontmatter repaired
- **Size / DoD:** S / **D1** (authored + validated). No behaviour changes, no ingest
  output changes, nothing installed. D2 would require installing the plugin and
  proving Claude Code loads the skill and the seven agents from the declared paths —
  see "Not proven" below.
- **Created:** 2026-09-01 · **Repo(s):** zynkr-skill-builder
- **Links:** consumed by `ATL-036` (zynkr-atlas) · `ATL-026`'s owner ruling of
  2026-08-31, which this exists to satisfy

## Context

`zynkr-content-writer` is the only plugin-shaped bundle in this repo: seven
`.claude/agents/*.md` and one `.claude/skills/write-article/SKILL.md`, with no
`SKILL.md` at its root. Every other skill is one folder, one `SKILL.md`.

Atlas is importing this family (`ATL-036`). Its owner ruled on 2026-08-31 that a
conductor-package lands as a **代理 row**, and that the row must be `imported`
from an upstream manifest carrying a real blob sha — an Atlas-**authored**,
upstream-less agent row was explicitly rejected. Today there is no file in this
repo that represents the bundle as a whole, so there is nothing for that row to
mirror. This spec creates it.

## What changed

1. **`.claude-plugin/plugin.json`** — the plugin manifest. Identity, version,
   author, repository, plus explicit component paths so the manifest describes
   the layout **as it already is**:
   - `"skills": ["./.claude/skills/"]`
   - `"agents": [ …the seven files… ]`

   Nothing was moved. The Claude Code plugin convention puts `skills/` and
   `agents/` at the plugin root, and the migration docs say to copy `.claude/*`
   up. Doing that here would mean relocating nine files that a running
   installation reads, to satisfy a default that the manifest exists to override.
   Both keys accept custom paths, so declaring the real layout is the smaller
   and safer change.

2. **The orchestrator's frontmatter now validates.** `write-article/SKILL.md` was
   missing every field this repo requires — `category`, `project`, `platform`,
   `status`, `author` — and had no `sheetId`, so `1.01` existed only in the
   Skills Index and in the generated `content/skills/1.01.md`. The catalog entry
   had the values; the source file did not. `npm run validate` on it went from
   **5 errors to 0**. The values written in are exactly the ones the catalog
   already carried, so the ingest output does not move.

## Acceptance criteria

- **AC-1** `.claude-plugin/plugin.json` parses as JSON and names seven agents. ✅
- **AC-2** `validate-skill.ts` on `write-article/SKILL.md`: 0 errors (was 5). ✅
- **AC-3** No file was moved or renamed; the running installation reads the same
  paths it did before. ✅ (`git show --stat` — one added file, one edited)
- **AC-4** `content/skills/1.01.md` is unchanged by this spec — the frontmatter
  values match what ingest already emitted. ✅

## Not proven (why this is D1, not D2)

The manifest is **not installed anywhere**, so "Claude Code loads this plugin" is
unverified. Two specific unknowns:

- whether a plugin whose `skills`/`agents` live under `.claude/` loads correctly
  when the manifest declares those paths, and
- whether the seven agents keep the names they have today once loaded through a
  plugin rather than however they are installed now.

Neither blocks `ATL-036`: Atlas needs the manifest to **exist and be addressable**
so the 代理 row has an upstream with a blob sha. It never runs the plugin —
Atlas documents; it does not execute. Installing and proving load is its own
spec when someone wants the plugin actually distributed.

## Deliberately not done

- **The bundle was not restructured** to the default plugin layout. That is a
  separate, riskier change and this spec does not need it.
- **The `editor` agent was not created.** `write-article/SKILL.md` names it as a
  second reader of the forbidden-words Doc; no such file exists in this repo. It
  is recorded as an unresolved reference in `ATL-036`, not invented here.
- **The three stale Drive mirrors were not re-synced.** `stage-2-style-guide.md`,
  `stage-3-editor-guide.md` and `forbidden-words.md` were last committed
  2026-08-13 while their Docs moved on 2026-08-17. Re-syncing is a content
  decision on Docs the owner edits, not a manifest change.
