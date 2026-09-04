# SKB-013 — the skills pipeline becomes a package, and its missing stage gets written

- **Status:** Shipped 2026-09-04 · **amended same day** — `confirm` bound `skill-triager` a
  second time, which cost the picture a step and three lines in silence (see 「Amendment」 below)
- **Size / DoD:** M / D2 *(cross-repo consumer — `zynkr-atlas`; no secret, no workflow, no schema here)*
- **Created:** 2026-09-04 · **Repo(s):** `zynkr-skill-builder` (consumer: `zynkr-atlas`)
- **Links:** `SKILL_SPEC.md` §1 (package fields) · `SKB-012` (picture declarations) ·
  proposal [`zynkr-skill-idea#127`](https://github.com/peter-tu-zynkr/zynkr-skill-idea/issues/127)

## Context

The canonical chain is written in five SKILL.md files as:

```
/skill-sourcer → /skill-triager → /skill-creator → /skill-qa → /skill-publish → /skill-triager
```

`/skill-creator` is a **Claude Code plugin skill — not a file in this repo**. The pipeline therefore
documented, and depended on, a stage Zynkr did not own or version. Three consequences:

1. `skill-publish` declared `synergy: [skill-creator]`, a reference that can never resolve.
2. Zynkr already owned everything *around* that stage — the `repository_dispatch` scaffold, the
   `skill/<slug>` branch, the stub's `<!-- TODO -->` markers, the QA gate, the sheetId economy — but
   nothing said *how to fill the stub*, which is the one part a general-purpose plugin cannot know.
3. In **Zynkr Atlas** the family could not be drawn end to end: a package can only declare members
   that exist, so the chain had a hole in the middle.

## What shipped

**1. `skills/6-engineer/skill-author/` — the missing build stage.** `sheetId 6.12`, the next
genuinely free id in category 6 (`6.01`–`6.11` are used or burned; `6.14`–`6.19` sit in
`generated/id-redirects.json`). It owns the Zynkr-specific half of authoring: the frontmatter
contract, the sheetId rules, the taxonomy keys, the body structure, and a self-check against the same
`validate-skill.ts` engine `/skill-qa` and CI run. It may call the `skill-creator` plugin for prose —
**as a tool it uses, not as a stage in the chain**.

**2. The chain declares itself.** Following the `SKB-012` vocabulary and the `zynkr-slide` pattern —
an orchestrator lists all its stages in order, a stage lists only its next one:

| File | `handoff:` |
|---|---|
| `zynkr-skills` | `[skill-sourcer, skill-triager, skill-author, skill-qa, skill-publish]` |
| `skill-sourcer` | `[skill-triager]` |
| `skill-triager` | `[skill-author]` |
| `skill-author` | `[skill-qa]` |
| `skill-publish` | `[skill-triager]` — the confirm-ship loop |
| `skill-finder` | `[]` — a lookup, not a stage |

Because `handoff:` demotes `synergy:` **per file**, this also retires the symmetric arrows those
`synergy` lists were inventing — including `skill-publish`'s unresolvable `skill-creator` reference.

**3. `zynkr-skills` becomes a package.** `type: agent` plus
`skills: [sourcer, triager, author, qa, publish, finder]`. The first types the row; the second says
what is wrapped. Membership and sequence are different claims and both are now declared.

**4. `SKILL_SPEC.md` documents `type` and `skills`** — the package fields, in the shape `SKB-012` used
for the picture fields. They were already read by Atlas and documented nowhere.

## Why `skill-author`, not `skill-creator`

Naming it `skill-creator` would have kept ~17 existing references valid, at the price of two different
things sharing one name — one of which this skill may call. `skill-author` is also the more accurate
verb: the stage *authors a body*, it does not create the skill (the scaffold already did that).

## Not proven

- **No install-and-trigger run.** `skill-author` has not been invoked against a real stub; it ships
  validator-clean, not exercised. First real use is its own D2 evidence.
- **Nothing consumes the package fields yet.** Atlas must first read `fm.type` — its importer
  currently hardcodes `artifactType`, which is tracked on the Atlas side, not here.
- **`/skill-creator` references elsewhere are unchanged.** The other four files still name it in prose
  where it is genuinely the tool being suggested.

## Verification

- `validate-skill.ts --tier=all` over all seven changed/added files: **7/7 pass, 0 errors.**
  `skill-author` is **0 errors, 0 warnings**. `zynkr-skills` carries 4 warnings, all of which are
  **pre-existing** — verified by validating the `origin/main` copy, which reports the same 4.
- `ingest.ts` run against the tree: **`✓ 6.12 skill-author`**, 124 skills total, **no duplicate-id
  throw** — the check CLAUDE.md requires before pushing a new `sheetId`, since a clash only surfaces
  here and only after merge.
- Build artifacts (`generated/`, `content/`) deliberately **not** committed; CI regenerates them.

## Finding, not fixed here

`validate-skill.ts`'s `body.h1_present` check does not strip fenced code blocks, so a shell comment at
column 0 inside a ```bash fence is counted as a second H1. It cost one false WARN while writing
`skill-author`; the workaround (end-of-line comments) is documented in that skill's Step 5.

## Amendment — 2026-09-04 · `confirm` stops binding a row a second time

The `steps:` block shipped above declared `ref=skill-triager` twice: `triage`
(approve the build) and `confirm` (confirm the ship). That is the process as
written — the confirm-ship loop is real — but `parseStepBlock` refuses a
duplicate bound ref, because a bound step's canvas key **is** the row's key and
two of them collide in `stepIdByKey`. So `confirm` was skipped, and the three
`flow:` lines naming it went with it: Atlas drew **16 / 17 steps and 16 / 19
lines**, reported `dropped: 0`, and stored `parse_report.warnings = []`.

`confirm` is now inline, titled `Confirm ship + close issue (skill-triager)`.
The moment is drawn and attributed without a second claim on the row.

**What this cost, and what it did not.** The `skill-publish → skill-triager`
handoff is a declared row-level edge and is untouched; it simply is not drawn as
a line, so Atlas counts it under `hiddenEdges` — honest, and now visible, since
`ATL-047` puts omissions and hidden relations on the canvas.

**The deeper limit is unfixed and deliberate:** the picture model cannot show
one row at two moments of a process. Lifting it means making `stepIdByKey`
one-to-many, which is a model change, not a patch — recorded here rather than
smuggled into a one-line fix.

**The finding this file already carried got a sibling.** `validate-skill.ts`
does not parse `flow:` at all, so neither the duplicate ref nor the retry loop
that `ATL-047` fixes could have been caught on this side.
