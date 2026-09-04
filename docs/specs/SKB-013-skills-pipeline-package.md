# SKB-013 — the skills pipeline becomes a package, and its missing stage gets written

- **Status:** Shipped 2026-09-04
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
