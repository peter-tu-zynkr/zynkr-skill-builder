---
name: skill-author
sheetId: "6.12"
description: "Fill a scaffolded Zynkr skill stub into a shippable SKILL.md — claim the sheetId, write frontmatter that satisfies SKILL_SPEC.md, replace every <!-- TODO --> marker with real steps, and self-check against the same validate-skill.ts engine /skill-qa will run. The build stage of the skill pipeline, between /skill-triager and /skill-qa. Trigger on 'write this skill', 'fill the stub', 'author the SKILL.md', 'finish skill <slug>', '把這個 skill 寫完', '填 stub', or '/skill-author'."
category: engineer
project: skill-author
platform: claude
status: WIP
author: Peter Tu
input: "A scaffolded stub: a `skill/<slug>` branch, a folder under `skills/**`, a path to a SKILL.md, or the approved proposal issue the stub came from."
process: "Locate the stub → read the contract (SKILL_SPEC.md + taxonomy) → claim the next free sheetId → write frontmatter → replace every TODO marker with real steps → run validate-skill.ts → hand off to /skill-qa."
output: "A completed SKILL.md on the working branch: schema-valid frontmatter, a real body with no `<!-- TODO -->` markers left, and a green local validator run."
synergy: ["skill-triager", "skill-qa", "skill-publish"]
handoff: ["skill-qa"]
executed_by: internal-user
execution_mode: llm
steps:
  - "start | start | Start"
  - "input | input | Stub branch, folder, or issue ref"
  - "locate | deterministic | Resolve the stub SKILL.md"
  - "contract | knowledge | [RAG] Frontmatter contract | ref=atlas:skill-spec"
  - "taxonomy | knowledge | [RAG] Category taxonomy 0-9 | ref=atlas:skill-sourcer.taxonomy"
  - "sheetid | deterministic | Claim next FREE sheetId in category"
  - "front | llm | Write frontmatter"
  - "body | llm | Replace every TODO marker"
  - "picture | llm | Optional: handoff / steps / flow"
  - "validate | deterministic | Run validate-skill.ts --tier=all"
  - "gate | gate | Errors left?"
  - "creator | offpage | Optional prose pass (skill-creator plugin)"
  - "signoff | hitl | Author reviews the filled body"
  - "qa | artifact | Hand off to /skill-qa | ref=skill-qa"
  - "output | output | Shippable SKILL.md on the branch"
  - "end | end | End"
flow:
  - "start -> input"
  - "input -> locate"
  - "locate -> sheetid"
  - "sheetid -> front"
  - "front -> body"
  - "body -> picture"
  - "picture -> validate"
  - "validate -> gate"
  - "gate -> body | errors remain"
  - "gate -> signoff | clean"
  - "signoff -> qa"
  - "qa -> output"
  - "output -> end"
  - "front ~> contract"
  - "front ~> taxonomy"
  - "body ~> creator"
---

# skill-author

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill skill-author
```

The **build stage** of the skill pipeline. `/skill-triager` fires a `repository_dispatch` that opens a
`skill/<slug>` branch with a stub `SKILL.md` — schema-valid frontmatter and a body full of
`<!-- TODO -->` markers. This skill turns that stub into something shippable, then hands it to
`/skill-qa`.

> **Where this fits:** `/skill-sourcer` → `/skill-triager` → **`/skill-author`** → `/skill-qa` →
> `/skill-publish` → `/skill-triager` (confirm-ship). It authors; it does not triage, QA, or publish.

**It owns the Zynkr-specific half of authoring.** A general-purpose skill writer knows what a good
skill looks like; it does not know this repo's frontmatter contract, its sheetId economy, its taxonomy
keys, or what `/skill-qa` rejects. Those are the things that get a skill sent back. You may still call
the `skill-creator` plugin for prose — treat it as a tool, not as a stage.

---

## Step 1 — Locate the stub

Resolve the target, in priority order:

1. An explicit path to a `SKILL.md` → use it.
2. A skill-folder path → `./SKILL.md` inside it.
3. A `skill/<slug>` branch → `git fetch origin <branch> && git switch <branch>`, then
   `skills/**/<slug>/SKILL.md`.
4. A proposal issue ref (`#N`) → read the issue, take the slug from the board's `build Target Path`
   basename or the title token after `—`, then resolve as (3).
5. A bare slug → glob `skills/**/<slug>/SKILL.md`. More than one match → list them and ask which.

If nothing resolves, ask once: **"Point me at the stub — a path, slug, or `skill/<slug>` branch."**

> **No stub yet?** That means `/skill-triager` has not dispatched the build. Say so and stop — do not
> hand-create the folder. The scaffold carries the issue link and the branch name that
> `/skill-publish` later reads.

## Step 2 — Read the contract before writing anything

Two files govern the result. Read them; do not work from memory:

| Read | For |
|---|---|
| `SKILL_SPEC.md` | Required frontmatter, the taxonomy keys, attribution rules, the picture fields |
| `skills/6-engineer/skill-sourcer/references/taxonomy.md` | Which of the ten categories this belongs in |

The `category:` value is the **taxonomy key**, not the folder name — `6-engineer/` takes
`category: engineer`. Getting this wrong is the single most common validator failure.

## Step 3 — Claim the sheetId

`sheetId` is the marketplace content id and it is **required in practice**. Format `N.NN` — category
number, dot, two-digit serial.

```bash
grep -rhoE '^sheetId: *"6\.[0-9]{2}"' skills/*/*/SKILL.md | sort -u          # declared today
grep -ohE '"6\.[0-9]{2}"' generated/*.json | sort -u                         # + every burned id
```

Three rules that bite:

- **Burned ids stay burned.** An id that appears in `generated/id-redirects.json` or in the generated
  index belongs to a renamed or retired skill. Never reuse it, even if no file declares it today.
- **Count agent files too.** The id namespace maps to the assistant-index Sheet, where sub-agents
  occupy their own rows.
- **Duplicates are not caught by the PR check.** `validate-skill.ts` does not inspect `sheetId`;
  a clash only throws inside `ingest.ts`, *after* merge. Check the whole tree before you pick.

## Step 4 — Write the frontmatter

Required: `name` · `category` · `project` · `platform` · `status` · `author`. Strongly recommended:
`description` · `input` · `process` · `output` · `synergy` · `sheetId`.

- `name` must equal the folder name and the H1. Folder = name = slug = what the user types.
- `status` is one of `Done` · `WIP` · `Not started` · `Pause` · `Out dated`. A stub arrives
  `Not started`; move it to `WIP` when the body is real.
- `author` is the **original** creator. If any of `upstream_repo` / `original_source_url` /
  `original_author` is set, **all three** must be — the validator enforces all-or-nothing.

**The `description` is the trigger.** The harness reads it to decide whether the skill fires, so it
carries the trigger phrases — English and 中文 — and a boundary clause naming the neighbouring skills
it should *not* hijack. Write it as one line; keep it specific.

## Step 5 — Replace every TODO marker

The stub body carries `<!-- TODO -->` markers. **None may survive.** Structure the body the way the
rest of the repo does:

1. `# <slug>` — the H1, matching `name`.
2. The one-line install snippet in a `bash` fence.
3. A short paragraph saying what the skill is for, plus a **「Where this fits」** blockquote when it
   sits in a relay.
4. Numbered `## Step N — ...` sections that a reader can actually follow.
5. A closing **`## Done`** section: what to summarise, and what to ask next.

Two habits worth keeping: state the **boundary** (what this skill does *not* do, and which skill owns
that instead), and prefer a table over prose whenever you are listing rules.

> **Watch the fences.** The H1 check does not strip fenced code blocks, so a shell comment at
> column 0 inside a ```bash fence is counted as a second `# heading`. Put such comments at the end of
> the line instead.

> **Never paste a machine-specific absolute path** (`/Users/...`) into the body. It is an ERROR-tier
> finding, and it is the leak `/skill-qa` most often catches.

## Step 6 — Optional: declare the picture

If the skill sits in a relay or has an internal flow worth drawing, add the picture fields —
`handoff` · `steps` · `flow` · `executed_by` · `execution_mode`. `SKILL_SPEC.md` carries the grammar;
`skills/1-brand-marketing/zynkr-slide` is the worked example.

Two rules that decide whether the drawing is right:

- **Prefer `handoff` over `synergy` for a relay.** `synergy` is symmetric, so Atlas has to guess a
  direction and draws the chain both ways. Declaring `handoff` — even `[]` — stops that guess for this
  file.
- **An orchestrator lists all its stages, in order; a stage lists only its next one.** That is what
  makes the flow render as a sequence rather than a pointer.

## Step 7 — Self-check, then hand off

Run the same engine `/skill-qa` and CI run, so a local pass means a green gate:

```bash
npx tsx scripts/validate-skill.ts skills/<N-cat>/<slug>/SKILL.md --tier=all
```

Fix every ERROR. Fix WARNs unless you can say why they stand. Then commit to the `skill/<slug>` branch
and hand off:

> "`<slug>` is written and the validator is clean. Running `/skill-qa` before publish."

Do **not** publish from here — `/skill-qa` is the gate and `/skill-publish` is the closer.

## Done

Summarise in three lines: what the skill does, which `sheetId` it claimed, and the validator result.
Then ask: **"Run `/skill-qa` on it now?"**
