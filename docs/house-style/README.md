# House style — the binding seed (SKB-031)

The canonical source of Zynkr's writing voice is **Google Docs**, not this repo. This folder
owns the *binding*: the one block of text every skill carries so that its installed copy knows
where to read the rules at runtime, and the rule that makes the binding checkable.

## Why a binding at all

Before SKB-031 the house voice was referenced by **3 of 93 skills**, each by a hand-copied
paragraph. All six slide skills referenced it zero times, and
the forbidden-word list had been forked into **10 files** across the `seo-*` family, none of them
matching 《[3.2]》 any more — and only one of those was visible by eye. A guide nothing is required
to read is a guide that drifts.

## The two Docs

Both live in the Drive folder `[@] 寫作指南` (`12DBdFz3SK22ie9im_ThFMI7IBRXsTZsV`).

| Doc | ID | Carries |
|---|---|---|
| 《[2.0] Zynkr 通用風格指南 House Voice》 | `10bOIQwRm9Pxwgct4hlwCwK_B4Pipai1HqBPZKzyRHSE` | universal core (聲音 · 標點 · 數字 · 誠實邊界 · 內部語言不外流) + one addendum per surface |
| 《[3.2] 禁用詞清單 Forbidden Words》 | `1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg` | the forbidden-word list |

《[2.2] 內文風格指南》 keeps its ID and content — it is now the 文章 addendum that 《[2.0]》 §2.1
points to. Visual and brand rules stay out of both: 《[2.0]》 §2.5 governs slide *wording* and
defers to `BRAND.md` / `conventions.md` for anything visual.

**Skills point at the Docs; they never embed a copy.** A copy is a fork with a delay.

## Declaring

Every `skills/*/*/SKILL.md` carries exactly one frontmatter key:

```yaml
house-style: bound              # produces text a human outside the loop reads
house-style: exempt — <reason>  # it does not, and here is why
```

There is no third state and no default. A file with neither fails
`scripts/check-house-style.ts`, which is the point: a new skill cannot quietly opt out by saying
nothing (SDD §0.3 — skip-green is banned).

`bound` additionally requires the block below in the body, so that the copy installed at
`~/.claude/skills/<name>/SKILL.md` — which has no access to this repo — still names its sources.

### The block

```markdown
## House style

Writing style is **not owned by this file**. The house voice lives in two Google Docs under
`[@] 寫作指南` (`12DBdFz3SK22ie9im_ThFMI7IBRXsTZsV`), read at runtime:

- 《[2.0] Zynkr 通用風格指南 House Voice》 `10bOIQwRm9Pxwgct4hlwCwK_B4Pipai1HqBPZKzyRHSE` —
  the universal core, plus the addendum for this surface
- 《[3.2] 禁用詞清單 Forbidden Words》 `1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg`

Read both before producing client- or reader-facing text, and scan the draft against 《[3.2]》
before handing it over. If Drive is unreachable, say so in the output rather than proceeding
unchecked. Never re-implement either list inside this file.
```

## When `exempt` is honest

Exempt is for skills whose output is not house-voiced prose:

- **Verbatim capture** — fidelity to the source outranks house voice
  (`consult-transcriber`, `training-srt-transcriber`, `training-lecture-transcript`,
  `training-srt-optimizer`).
- **Machine artifacts** — JSON, tickets, schema, git/publish/browser plumbing
  (`skill-publish`, `skill-qa`, `skill-triager`, `project-init`, `consult-bug-ticket`,
  `agent-browser`).
- **Pure routers** — they emit no prose, they pick a child skill
  (`zynkr-skills`, `skill-finder`, `eng-find-skills`).

A router that also drafts is `bound`, not exempt — `sales-manager` writes a pipeline review
someone reads, so it binds. "It is internal-only" is **not** a reason: internal readers are
readers. 13 of 94 skills are exempt; if that number grows, the rule is being stretched.

## Checking

```bash
cd scripts && npx tsx check-house-style.ts        # every skill declares; bound ones carry the block
cd scripts && npx tsx check-house-style.ts --list # print the current declaration per skill
```

Runs **tree-wide** in the `qa` job of `.github/workflows/qa.yml` — not diff-scoped, because a
skill that drops its declaration must fail even in a commit that touches nothing else. It sits in
`qa` rather than `shared-refs` because that job already installs Node.

There is deliberately **no git hook**. One would need `npx tsx` and would either be slow or skip
silently when `node_modules` is absent — and a gate that skips silently is exactly what SDD §0.3
bans. CI is the gate.

The check also fails a file that hardcodes its own forbidden-word list, which is how the
`seo-program-planner` drift would have been caught.
