# SKB-018 — four orchestration pictures leave their SKILL.md and become Atlas 流程圖 rows

- **Status:** Shipped 2026-09-06 — four files trimmed, validator green on each, `SKILL_SPEC.md`
  says where a picture belongs; the Atlas half is `ATL-058` (rows created and proven on production)
- **Size / DoD:** S / D1 *(content-only in this repo; no schema, no secret, no workflow; cross-repo
  consumer `zynkr-atlas`, which carries the proof)*
- **Created:** 2026-09-06 · **Repo(s):** `zynkr-skill-builder` (consumer: `zynkr-atlas`)
- **Links:** `SKILL_SPEC.md` §picture fields · `SKB-012` (picture declarations) · `SKB-013` (package
  fields) · Atlas `ATL-057` (流程圖 becomes a shelf) · Atlas `ATL-058` (the rows)

## Context

`SKB-012` gave a SKILL.md a `steps:` / `flow:` picture, and four files used it to draw something larger
than themselves: the slide **relay** (`zynkr-slide` handing to four stages), the skills **pipeline**
(`zynkr-skills` fronting six), the **build stage** (`skill-author` → `skill-qa`) and the ops **loop**
(`zynkr-ops-weekly`, where the skill is one actor among six humans, a meeting and an Apps Script).

Atlas listed those four on its 流程圖 page by *borrowing* them from the skills — which is why the owner
saw `zynkr-ops-weekly` there and took it for a workflow. It is a skill. `ATL-057` gave 流程圖 its own row
type (`workflow`, like `agent`, one altitude lower), and the owner ruled 2026-09-06 that the 流程圖 page
lists **rows only, like 代理** — no more borrowing. So the four pictures had to move: one picture, one
home, and the home of an orchestration is a 流程圖 row.

## What shipped

**1. Four SKILL.md lose their `steps:` and `flow:` blocks — and nothing else.** The removal was a
script anchored on the two keys and their `  - ` items; the diff is 166 deletions across four files
and zero other changes. `handoff:`, `synergy:`, `skills:`, `executed_by:` all stay: a handoff is a claim
about *this* file's next step, and Atlas still draws it as a line.

| File | Lines removed | Became (Atlas, `ATL-058`) |
|---|---|---|
| `skills/3-operations/zynkr-ops-weekly/SKILL.md` | 53 (23 steps · 28 flow) | `ops-weekly-flow` 營運週報循環 |
| `skills/1-brand-marketing/zynkr-slide/SKILL.md` | 41 (19 · 20) | `slide-relay-flow` 簡報接力流程 |
| `skills/6-engineer/zynkr-skills/SKILL.md` | 38 (17 · 19) | `skills-pipeline-flow` 技能產線流程 |
| `skills/6-engineer/skill-author/SKILL.md` | 34 (16 · 16) | `skill-author-flow` 技能撰寫流程 |

The lifted text is the text in the new rows, byte for byte — the new files were assembled from the
removed lines, not retyped (the `ATL-048` lesson: guarded edit over transcription). This commit's diff
is therefore also the archival copy of each picture as it stood in this repo.

**2. `SKILL_SPEC.md` says where a picture belongs.** One paragraph under the picture fields: `steps` /
`flow` describe *this skill's own* flow and draw on its own canvas; a picture that orchestrates other
skills is a 流程圖 row in Atlas. `SKB-012` stays valid for anatomy (`eli5` keeps its eight-step picture
here — it is not in Atlas and orchestrates nothing).

**3. Validator: unchanged, green on all four.** `steps.*` checks are WARN-tier and simply have nothing
to check now. No rule was added to *forbid* a picture, deliberately: the spec paragraph is the rule.

## What was deliberately not done

- **`skill-author`'s body still tells an author to consider `handoff / steps / flow`.** That step was
  itself part of the lifted picture. Rewording the prose to point orchestration pictures at Atlas is a
  follow-up for the next `skill-author` revision, not a silent edit under a content move.
- **No validator hint** (「this `steps:` block references ≥ 2 other skills — consider a 流程圖 row」).
  Worth adding once a second author writes one in the wrong place; premature on a sample of four.
- **`6.0 tech/skills/` runtime mirror not touched.** `steps:` / `flow:` change nothing about how a
  skill runs, and that folder is archived.

## Verification

- `npx tsx scripts/validate-skill.ts <file> --tier=all` on each of the four: green (see the shipping
  session's log).
- `git diff -U0` filtered to lines that are not `steps:`, `flow:` or a `  - "` item: empty.
- Atlas side: `ATL-058`'s proof against production — 4 `workflow` rows, each with its picture in the
  manifest and its lines swept; the four skills' manifests no longer carry `steps`; skill count
  unchanged.
