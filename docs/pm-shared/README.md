# `docs/pm-shared/` — the PM knowledge seed

The canonical source for everything the PM-family skills know in common: how the PMO's
artefacts are shaped, which vocabulary belongs to which axis, where the templates live, and
how a run finds a specific project's Sheet. One seed here, byte-identical copies inside each
skill, a CI gate that proves they never drift (SKB-011).

**PM family — exactly five skills:** `3-operations/project-planning` (3.07) ·
`project-note-specialist` (3.08) · `project-status-update` (3.09) · `project-init` (3.20) ·
`project-minutes-sync` (3.21). Nothing else gets a copy.
`zynkr-ops-weekly` (3.19) is **frozen** — its launchd job is live and it is not part of this
family.

## Files

| File | What it is | Copied into each skill? |
|---|---|---|
| `pm-knowledge-pack.md` | The knowledge itself — the five status axes, the 五條鐵律, the process spine, the derivation rules. Skills READ this; they do not restate it | ✅ `references/` |
| `pm-sources.md` | The identifier + adapter layer — the 8 canonical PMO artefact IDs, and the `~/.config/zynkr/pm.json` contract that holds per-project and per-engagement-type values | ✅ `references/` |
| `pm-sheet-schema.json` | Machine-readable 管控表 layout — tab → headers, v2 (14 cols) plus the legacy v1 layout (13 cols) so a skill can tell which sheet it is on | ✅ `references/` |
| `pm-status-crosswalk.json` | Machine-readable five axes, the per-surface value mappings, and the `% = done / (total − dropped)` denominator rule | ✅ `references/` |
| `pm.json.example` | A real, parseable example of the private adapter config — every documented key, obvious fake IDs, three projects (客戶案 · 課程案 · 內部案). `python3 -m json.tool docs/pm-shared/pm.json.example` exits 0. Its bytes are reproduced verbatim in `pm-sources.md` §3, which is how an installed skill shows it to a user | ❌ reproduced in §3 instead |
| `README.md` | This file — how to maintain the seed, not how to run a project | ❌ |

The fifth copied artefact is **not** in this directory: `scripts/pm-schema.py` is copied to
each skill's own `scripts/pm-schema.py`. That is the point of copying the two JSON seeds —
the installed validator resolves them from its sibling `references/`, so nothing reaches back
to the repo root at run time. `pm-sources.md` (the "Identity" block at the top) is the
canonical table of what lands where.

## Seed → copy → gate

```
master (repo seed, direction pending D4)
   docs/pm-shared/pm-knowledge-pack.md
   docs/pm-shared/pm-sources.md
   docs/pm-shared/pm-sheet-schema.json
   docs/pm-shared/pm-status-crosswalk.json
   scripts/pm-schema.py                     ← seed lives in scripts/, not here
   │  scripts/check-pm-refs.sh --sync
   ▼
byte-identical copies, per PM-family skill  (5 artefacts, 2 destinations)
   skills/<pm family>/references/pm-knowledge-pack.md
   skills/<pm family>/references/pm-sources.md
   skills/<pm family>/references/pm-sheet-schema.json
   skills/<pm family>/references/pm-status-crosswalk.json
   skills/<pm family>/scripts/pm-schema.py  ← reads the two JSON seeds from ../references/
   │  each SKILL.md prints 知識來源 + declared sha256, Step 0 refuses to run on mismatch
   ▼
CI gate  .github/workflows/qa.yml  (push AND pull_request)

NOT copied
   docs/pm-shared/pm.json.example  → its bytes are reproduced in pm-sources.md §3,
                                     which IS copied, so an installed skill still has it
   docs/pm-shared/README.md        → about maintaining the seed, not about running a project
```

**Why five and not one.** An installed skill gets its own folder and nothing else, so a step
marked 強制 that points at repo-root `scripts/pm-schema.py` or `docs/pm-shared/*.json` breaks
at install time. Each skill therefore carries its own validator and the two JSON seeds it
reads, and calls them skill-folder-relative — one root, no split.

## Re-syncing after an edit

Edit the file **here**, never a copy inside a skill. Then:

```bash
scripts/check-pm-refs.sh --sync   # copy seed → every PM-family skill's references/, then check
scripts/check-pm-refs.sh          # check only — exit 1 on any drift or stale declared sha256
```

`pm.json.example` is the one seed the sync does not touch. It is paired by hand with
`pm-sources.md` §3 — change one and you must change the other, and re-run
`python3 -m json.tool docs/pm-shared/pm.json.example` to prove the file still parses.

`--sync` also refreshes the declared `sha256` each SKILL.md prints under 知識來源. If you
change a seed file and skip the sync, three things fail in a row: the copies differ, the
declared hash no longer matches, and the skill's Step 0 refuses to run. That is the intended
behaviour — a stale copy stops the run instead of quietly answering from old rules.

## Sync direction — pending D4

**D4 is undecided.** The open question is which surface a human edits: the Google Doc
Playbook, or this repo seed. Nothing in this directory asserts an answer, and nothing
downstream depends on one.

- **Today:** the repo seed is the working master. The bytes in `pm-knowledge-pack.md` are
  what a person typed here. `pm-knowledge-pack.md` carries the stamp
  `<!-- pack_version: 1 · direction pending D4 -->` — that stamp is what a reader checks
  before believing any claim about provenance.
- **If D4 rules `doc_master`:** a generator runs **Doc → seed** before the copy step, and
  this directory becomes generated output. It then gets a generated-file banner and stops
  being hand-edited; edits move to the Playbook Doc.
- **If D4 rules `repo_seed`:** no generator is ever added, and this directory stays
  hand-edited exactly as it is today. The Playbook Doc becomes the rendered view.

**In either case everything downstream of the seed is unchanged** — the same `--sync` copy,
the same byte-identical `references/`, the same declared sha256, the same Step 0 refusal,
the same CI gate. The fork changes only where the seed's *bytes* come from.

**The single switch point** is the first step of `scripts/check-pm-refs.sh --sync`: the one
line that decides the seed's source. Today nothing runs before the copy. `doc_master` adds
exactly one line in front of it — a Doc pull into `docs/pm-shared/` — and `repo_seed` never
adds it. No skill file, no schema, no workflow and no hash changes either way.
