# Skill Pipeline Process

How a skill idea travels from "I saw this on the internet" to "live on zynkr.ai." Three human touchpoints, two GitHub repos, one sheet.

```
Source     →     Triage     →     Build
(idea)            (gate)            (ship)

/skill-sourcer    /skill-triager    plain Claude Code
zynkr-skill-idea  zynkr-skill-idea  zynkr-skill-builder
                  + dispatch        + ingest workflow
```

The pipeline state lives in two places:

- **Zynkr Skills Pipeline** Google Sheet (`1_0bYyZiB6sGEI4nGw1QDgLip4rRQtNh9ybPGs-WXAMA`) — the spine. Every skill is a row. Two status columns: `Pipeline Status` (curation stage) and `Build Status` (implementation stage).
- **GitHub issue labels** on `zynkr-skill-idea` — the lightweight signal between stages. The label is what `/skill-triager` queries.

---

## Touchpoint 1 — Source

**Who:** anyone with a link.

**When:** anytime a candidate appears (GitHub repo, newsletter, conference talk).

**Invocation:**
```
/skill-sourcer <link>
```
Or paste the link with intent words like *"source this skill"* — the trigger phrase fires `/skill-sourcer` automatically.

**Skill flow (≈ 2 min):**

1. **Extract preview.** The skill spawns the `skill-extractor` subagent, which reads the source and returns a structured extract (name, description, input/output, who-it-helps). Confirm or correct.
2. **Classify.** `skill-classifier` maps the extract to one of categories 0–9. If confidence is medium or low, you sign off the category before continuing.
3. **Dedup.** `skill-deduplicator` scans the pipeline sheet for `exact_duplicate`, `near_duplicate`, `partial_overlap`, or `new`.
4. **Propose.** A row is appended to the sheet as `Pipeline Status=proposed`, `Keep=?`.
5. **Approve.** You decide on the spot:
   - `Keep=Y` → row flips to `approved`, GitHub issue is created in `zynkr-skill-idea` with labels `skill-proposal` + `triage-ready`, spec md is committed to `skills/approved/{slug}.md`, both URLs are written back to the sheet.
   - Leave `Keep=?` → comes back for review in a later sourcing batch.

**Outputs:** sheet row · GitHub issue (in `zynkr-skill-idea`) · spec md at `skills/approved/{slug}.md`.

**Stops here.** Nothing else fires automatically. The `triage-ready` label is the parking signal for stage 2.

---

## Touchpoint 2 — Triage

**Who:** the maintainer wearing a DevOps-admin hat. The only authorised path to fire a build.

**When:** in a batch — daily or weekly. Triage is the "second look" gate that protects against an ever-growing pile of sourced repos that never get built.

**Invocation:**
```
/skill-triager
```
Or *"review skill queue"*, *"triage skills"*.

**Skill flow (≈ 30 s per issue):**

1. **Pull queue.** `gh issue list --repo peter-tu-zynkr/zynkr-skill-idea --label triage-ready --state open` — present as a numbered list.
2. **Review packet.** For the chosen issue, fetch and display one screen: issue body + spec md (from `skills/approved/{slug}.md`) + the matching sheet row (category, dedup verdict, Build Repo, Build Target).
3. **Decide:**
   - **`assign-build`** — sheet writes (`Pipeline Status=queued`, `Build Status=context-prep`, `Build Target=<slug>`), label swap (`triage-ready` → `building`), then a `repository_dispatch` event is fired at `peter-tu-zynkr/zynkr-skill-builder` (event type: `skill-build-request`, payload: issue number, slug, category, spec URL).
   - **`defer`** — labels `parked`, `Pipeline Status=parked`. Returns to the cold pile.
   - **`reject`** — closes the issue with a reason, `Pipeline Status=rejected`.
4. **Loop or stop.** "Next issue? (number / all / q)"

**Outputs (on `assign-build`):** sheet status updated · issue relabelled · GH Actions run started in `zynkr-skill-builder` · workflow run URL surfaced.

---

## Touchpoint 2.5 — Automated scaffold (no human)

The `pickup-approved-issue.yml` workflow runs in `zynkr-skill-builder` within seconds of the dispatch:

1. Read the dispatch payload.
2. Run `scripts/ingest-from-issue.ts`:
   - `gh api` to fetch the issue body and the spec md.
   - Resolve category number → on-disk folder.
   - Write `skills/<N-category>/<slug>/SKILL.md` with validator-compliant frontmatter, the spec md pasted into the body, and `<!-- TODO: implement steps -->` markers. Idempotent — refuses to overwrite an existing file.
3. Run `scripts/validate-skill.ts` on the new file (fails the run if frontmatter is wrong).
4. Create branch `skill/<slug>`, commit, push.
5. Open a PR titled `scaffold(<slug>): from peter-tu-zynkr/zynkr-skill-idea#<num>` against `main`, linking back to the source issue.

**Output:** GitHub notification — PR opened by `github-actions[bot]`.

---

## Touchpoint 3 — Build

**Who:** the implementer (often the same maintainer, now wearing the builder hat).

**When:** whenever you have the focus to do real implementation work. This is the only stage where meaningful effort is invested — by design, you only get here after two gates.

**What you do:** check out `skill/<slug>`, open `skills/<N-category>/<slug>/SKILL.md` in Claude Code, and collaborate normally. The frontmatter is already valid and the spec md is in the body — your job is to write the `## Process` (the actual steps).

When the skill works:

1. Flip frontmatter `status: Not started` → `status: Done` (or `WIP` for partial).
2. Push, then merge the PR.

**What runs after merge:** the long-standing `ingest-skills.yml` workflow fires on push to `main` with paths matching `skills/**`. It runs `ingest.ts` (validates, assigns canonical IDs, normalises into `content/`) → `build-marketplace.ts` (generates `generated/skills.json`, `skills-index.json`, `skills-detail.json`) → POSTs `skills-detail.json` to the `/api/skills/sync` webhook on `zynkr.ai` with an HMAC signature. The skill is live within ~30 s.

**Close the loop in the sheet (manual today, automation deferred):** set `Build Status=shipped`, paste the final URL into `Built Skill URL`, set `Pipeline Status=shipped`.

---

## State model

Two parallel status tracks on every sheet row:

| `Pipeline Status` (curation) | `Build Status` (implementation) |
|---|---|
| `proposed` → `approved` → `queued` → `in-progress` → `review` → `shipped` | `not-started` → `context-prep` → `building` → `testing` → `ready-to-ship` → `shipped` |
| also: `rejected`, `parked` | also: `external`, `dropped` |

`external` means the capability lives outside `zynkr-skill-builder` (e.g. an Anthropic-published official skill we rely on). No repo link, no build job.

---

## Who provides what, when

| Stage | Input | Invocation | Output | Time |
|---|---|---|---|---|
| **Source** | A link / repo URL / text snippet | `/skill-sourcer <link>` | Issue + spec md + sheet row | ~2 min |
| **Triage** | A decision per issue | `/skill-triager` | Dispatch + scaffold PR | ~30 s per issue |
| **Build** | The actual SKILL.md body | Plain Claude Code on the PR branch | Live skill on zynkr.ai | Hours to days |

The deliberate design promise: stages 1 and 2 are **cheap and reversible**. Stage 3 is where real effort lives, and it only ever happens for skills that survived two gates.
