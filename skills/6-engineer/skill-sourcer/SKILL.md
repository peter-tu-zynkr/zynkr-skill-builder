---
name: skill-sourcer
description: "Aggregate skill candidates from any source, classify against the Zynkr taxonomy, check for duplicates in the GitHub Project pipeline, and propose new skills as issues for review."
category: engineer
project: skill-sourcer
platform: claude
status: WIP
author: Peter Tu
input: "GitHub link, URL, file path, or pasted raw text describing a potential skill"
output: "Issue created in peter-tu-zynkr/zynkr-skill-idea (label skill-proposal) and added to the skills pipeline GitHub Project with Pipeline Status=proposed, Keep=?. On approval the issue gets the triage-ready label."
synergy: []
disable-model-invocation: true
security_audits:
  gen_agent_trust_hub: pending
  socket: pending
  snyk: pending
---

# Skill Sourcer

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill skill-sourcer
```

Ingest a skill candidate from any source, classify it, check for duplicates in the pipeline, and propose it for review.

> **Source of truth:** the skills pipeline lives in GitHub Project `<your-skills-pipeline-project>` (e.g., `owner/N`). Every pipeline entry is a GitHub Issue in the idea repo, added to the Project with custom fields (Pipeline Status, Keep, Category, Intake Source, Build *). The legacy Google Sheet is deprecated — do not read or write to it.

---

## Step 1 — Collect input

Accept input in any of these forms:

- **GitHub link** → fetch README and skill/agent files from the repo
- **URL** → fetch and extract skill-relevant content
- **File path** → read the file directly
- **Pasted text** → use as-is

Also check the `inbox/` folder for any dropped files not yet processed.

Inform the user what input was detected and how it will be processed.

---

## Step 2 — Extract skill intent (subagent)

Spawn the **skill-extractor** subagent with the raw input.

It returns a structured extract:
- name, title, description
- input / output
- who it helps
- source URL

Display the extract to the user and ask: **"Does this look right? Anything to correct before we classify?"**

Wait for confirmation or corrections before proceeding.

---

## Step 3 — Classify into taxonomy (subagent)

Spawn the **skill-classifier** subagent with the confirmed extract.

It returns:
- category number (0–9) and name
- confidence level
- reasoning

Display the result. If confidence is **medium or low**, show the runner-up and ask the user to confirm the category before proceeding.

---

## Step 4 — Check pipeline for duplicates (subagent)

Spawn the **skill-deduplicator** subagent with the confirmed extract and classifier output.

It reads all items from GitHub Project `<your-skills-pipeline-project>` via `gh project item-list` and checks each one for overlap.

It returns a verdict: `exact_duplicate`, `near_duplicate`, `partial_overlap`, or `new`.

**If `exact_duplicate` or `near_duplicate`:**
> "We already have **[skill name]** (Pipeline Status: [status], Keep: [keep]) which covers this. Here's how they overlap: [summary]. Skipping."
> Stop here.

**If `partial_overlap`:**
> "This overlaps partially with **[skill name]**: [summary]. It's different enough to potentially stand alone."
> Ask: **"Do you want to proceed with a proposal anyway?"**

**If `new`:**
> "No existing entry covers this. Proceeding to proposal."

---

## Step 5 — Add to pipeline (subagent)

Spawn the **skill-proposer** subagent with all outputs from previous steps.

It will:
1. Create a GitHub Issue in `peter-tu-zynkr/zynkr-skill-idea` titled `[Skill Proposal] {{category_number}} — {{title}}` with structured body and label `skill-proposal`
2. Add the issue to GitHub Project `<your-skills-pipeline-project>` and set custom fields: `Pipeline Status=proposed`, `Keep=?`, `Category={{category_number}}-{{slug}}`, `Intake Source=skill-sourcer`, `Build Repo=zynkr-skill-builder`, `Build Target Path={{category_number}}-{{cat-slug}}/{{slug}}`, `Build Status=not-started`, `Artifact=issue-only`
3. Display the issue URL and ask: **"Set Keep=yes to approve now, or leave as ? for later review."**

If the user approves immediately:
4. Update the Project item: `Keep=yes`, `Pipeline Status=approved`
5. Add the `triage-ready` label to the issue (this is the signal for `/skill-triager` to pick it up)
6. Optionally create a markdown idea record in `peter-tu-zynkr/zynkr-skill-idea` at `skills/approved/{{slug}}.md`. If created, set `Artifact=synced`.

---

## Step 6 — Sync approved skills (standalone mode)

This step runs when the user says **"sync approved skills"** outside of the normal intake flow.

Use this as a **reconciliation / backfill** command, not the primary approval path.

1. List all Project items where `Keep=yes`
2. For each item, check:
   - Issue exists in `zynkr-skill-idea`? (should always be true since items are issues)
   - Issue has `triage-ready` label?
   - Markdown idea record exists at `skills/approved/{slug}.md`?
   - `Artifact` field matches actual state?
3. Repair gaps:
   - Add `triage-ready` label if missing
   - Create the markdown idea record if absent
   - Update `Artifact` to `synced` / `issue-only` / `spec-only` to match reality
   - If item is still `Pipeline Status=proposed`, update to `approved`
4. Report repairs grouped by action taken

---

## Step 6.5 — Sync READMEs

Run this step **after every approval** (in normal intake flow) and **at the end of standalone sync mode**.

### A — Local README

Append the new skill name to the relevant row of the **Taxonomy table** in the local skills README. Format: `skill-name (proposed)`. If the category row has no skills yet, replace `—` with `skill-name (proposed)`.

### B — GitHub idea artifacts

Every approved idea must have:
- GitHub issue (labels: `skill-proposal`, `triage-ready`) — created in Step 5
- Project membership with custom fields set
- Optional markdown idea record at `zynkr-skill-idea/skills/approved/{slug}.md`

Also maintain `SOURCED.md` in `peter-tu-zynkr/zynkr-skill-idea` as a human-readable index:

```markdown
# Sourced Skills Pipeline

External skills approved for adoption into Zynkr. Sourced via skill-sourcer. Triaged via /skill-triager. Built in zynkr-skill-builder.

| Skill | Category | Description | Source | GitHub Issue | Idea Spec | Date |
|-------|----------|-------------|--------|--------------|-----------|------|
```

Append one row per newly approved skill. Use `gh api` to read the current file, update it, and push back via `gh api` PUT. If the file doesn't exist yet, create it with the header + the new row.

### C — Build handoff tracking

This skill is the curation stop gate. It does **not** start implementation in `zynkr-skill-builder`.

Maintain handoff-ready tracker fields on every approved Project item:

- `Build Repo` → default `zynkr-skill-builder`
- `Build Target Path` → expected slug or destination path
- `Build Status` → starts as `not-started`
- `Built Skill URL` → empty until shipped

`/skill-triager` (the middle layer) consumes these fields to triage approved issues and dispatch builds to `zynkr-skill-builder`.

### Status model

Use the tracker as two separate layers:

- `Pipeline Status` = business / curation stage
  - `proposed`, `researching`, `approved`, `building`, `shipped`, `parked`
- `Build Status` = implementation stage
  - `not-started`, `context-prep`, `building`, `testing`, `ready-to-ship`, `shipped`, `external`, `dropped`

Interpretation:

- Use `shipped` in `Pipeline Status` when the capability is live, whether in `zynkr-skill-builder` or through a stable external/platform path.
- Use `external` in `Build Status` when the capability exists outside `zynkr-skill-builder` and should not get a Zynkr repo link.
- Use `Built Skill URL` only for shipped capabilities that live in `zynkr-skill-builder`.

---

## Step 7 — Done

Summarize:
- What was sourced
- Where it was classified
- Duplicate verdict
- Issue created (if new)
- Project membership set
- Markdown idea record link (if approved and created)

**Completion checklist (all must be ticked before done):**
- [ ] Input collected and source identified
- [ ] Skill extract confirmed by user
- [ ] Category confirmed (with user sign-off if confidence was medium/low)
- [ ] Dedup check completed against GitHub Project `<your-skills-pipeline-project>`
- [ ] If new: issue created in `zynkr-skill-idea` with `skill-proposal` label
- [ ] If new: issue added to Project with `Pipeline Status=proposed`, `Keep=?`, Category set
- [ ] If approved: `Keep=yes`, `Pipeline Status=approved`, `triage-ready` label added
- [ ] If approved: `Build Repo=zynkr-skill-builder`, `Build Status=not-started`, `Build Target Path` set
- [ ] If approved: Local README taxonomy table updated
- [ ] If approved: `SOURCED.md` in `zynkr-skill-idea` updated

Ask: **"Want to source another skill?"**
