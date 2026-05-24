---
name: skill-triager
description: "Triage the queue of approved skill proposals in peter-tu-zynkr/zynkr-skill-idea (label: triage-ready), present each as a one-screen review packet, and on assign-build fire a repository_dispatch event to zynkr-skill-builder so the pickup-approved-issue workflow scaffolds the SKILL.md. The DevOps-admin middle layer of the skill pipeline. Trigger on phrases like 'triage skills', 'review skill queue', 'skill triage', or '/skill-triager'."
category: engineer
project: skill-triager
platform: claude
status: WIP
author: Peter Tu
input: "None (reads triage-ready issues from peter-tu-zynkr/zynkr-skill-idea) — or a specific issue number"
output: "For each triaged issue: sheet row updated (Pipeline Status, Build Status, Build Target), labels swapped on the issue (triage-ready → building / parked / rejected), and on assign-build a repository_dispatch fired to peter-tu-zynkr/zynkr-skill-builder triggering pickup-approved-issue.yml"
synergy: ["skill-sourcer"]
disable-model-invocation: true
---

# Skill Triager

The middle layer between **`/skill-sourcer`** (curation) and **`zynkr-skill-builder`** (build). Pull the triage queue, review one issue at a time with full context, and route the decision: assign to build, defer, or reject.

This skill is the **only authorised path** to fire a `skill-build-request` dispatch to `zynkr-skill-builder`. Manual `gh api dispatches` calls are fine for one-offs but should be tracked back into the sheet by hand.

---

## Step 1 — Pull the triage queue

Run:

```bash
gh issue list \
  --repo peter-tu-zynkr/zynkr-skill-idea \
  --label triage-ready \
  --state open \
  --json number,title,body,labels,url,createdAt \
  --limit 50
```

Show the user a numbered list: `#<num> — <title> (created <date>)`.

If the queue is empty, report that and ask whether to also pull `skill-proposal`-labelled issues without the `triage-ready` label (these are issues that were created some other way and haven't been through `/skill-sourcer`). If yes, repeat the query with `--label skill-proposal --search 'no:label triage-ready'` semantics.

Ask: **"Which issue do you want to triage? (number, 'all' to process in order, or 'q' to quit)"**

---

## Step 2 — Build the review packet

For the chosen issue, gather and display in one screen:

1. **From the issue:** title, body, labels, author, URL.
2. **From the spec md:** fetch `skills/approved/{slug}.md` from `zynkr-skill-idea`:
   ```bash
   gh api repos/peter-tu-zynkr/zynkr-skill-idea/contents/skills/approved/{slug}.md \
     --jq '.content' | base64 -d
   ```
3. **From the pipeline sheet** (`1_0bYyZiB6sGEI4nGw1QDgLip4rRQtNh9ybPGs-WXAMA`): find the row whose `Idea Issue URL` matches the issue URL. Read these columns and surface them:
   - Category (number + name)
   - Dedup verdict
   - Source URL
   - Current `Pipeline Status`, `Keep`, `Build Repo`, `Build Target`, `Build Status`

Resolve the `slug` from the spec URL on the sheet row, or fall back to the issue title (kebab-case the post-`[Skill Proposal]` portion).

If the sheet row is missing or its `Build Repo` is still `peter-tu-zynkr/zynkr-skills` (the archived repo), flag it and offer to fix on the spot — set `Build Repo` to `peter-tu-zynkr/zynkr-skill-builder` before continuing.

---

## Step 3 — Decide

Present three options. Wait for the user.

### Option A — `assign-build`

The issue is ready to go into the build pipeline.

1. **Confirm `Build Target`** with the user — defaults to the resolved slug, but the user can override (e.g. nest path like `engineer/video-use`).
2. **Ask the build mode:**
   > "Build mode? **rescaffold** (custom Zynkr skill body — for skills we'll implement ourselves) or **lift-and-shift** (mirror the upstream README as-is, set `status: Done` — for external skills we want to track without re-authoring)?"
   - Default: `rescaffold` if the issue has no upstream source URL.
   - Recommend `lift-and-shift` whenever the issue's **Source** field points to an external GitHub repo (i.e. anything except a Peter-authored skill).
   - On `lift-and-shift`, extract `upstream_url` from the issue body's `**Source**:` line (the skill-sourcer always writes it). If missing, ask the user.
   - On `lift-and-shift`, optionally ask for an `upstream_author` override (defaults to the GitHub org from `upstream_url`).
3. **Sheet writes:**
   - `Pipeline Status` → `queued`
   - `Build Status` → `context-prep`
   - `Build Target` → confirmed slug
4. **Label swap on issue:**
   ```bash
   gh issue edit <num> --repo peter-tu-zynkr/zynkr-skill-idea \
     --remove-label triage-ready --add-label building
   ```
5. **Fire repository_dispatch:**
   ```bash
   gh api repos/peter-tu-zynkr/zynkr-skill-builder/dispatches \
     -X POST \
     -f event_type=skill-build-request \
     -F "client_payload[issue_number]=<num>" \
     -F "client_payload[issue_repo]=peter-tu-zynkr/zynkr-skill-idea" \
     -F "client_payload[slug]=<slug>" \
     -F "client_payload[category]=<category-number-or-slug>" \
     -F "client_payload[spec_url]=<Idea Spec URL from sheet>" \
     -F "client_payload[mode]=<rescaffold|lift-and-shift>" \
     -F "client_payload[upstream_url]=<github URL — only if mode=lift-and-shift>" \
     -F "client_payload[upstream_author]=<optional override — only if mode=lift-and-shift>"
   ```
   `mode`, `upstream_url`, `upstream_author` are optional — omit them entirely for the default rescaffold path.
5. **Verify dispatch landed:**
   ```bash
   gh run list --repo peter-tu-zynkr/zynkr-skill-builder \
     --workflow pickup-approved-issue.yml --limit 3
   ```
   Report the run URL to the user.

### Option B — `defer`

Not now, but don't reject.

1. **Sheet:** `Pipeline Status` → `parked`.
2. **Labels:** swap `triage-ready` → `parked`.
3. Optionally prompt the user for a `parked-reason` comment to post on the issue.

### Option C — `reject`

Not happening.

1. **Sheet:** `Pipeline Status` → `rejected`.
2. **Labels:** add `rejected`, remove `triage-ready`.
3. **Close issue:**
   ```bash
   gh issue close <num> --repo peter-tu-zynkr/zynkr-skill-idea \
     --comment "Triage decision: rejected. <reason>"
   ```
   Ask the user for a one-line reason.

---

## Step 4 — Loop or stop

After each decision, ask: **"Next issue? (number / 'all' to continue / 'q' to stop)"**

In `all` mode, automatically pick the next issue in queue order and return to Step 2.

---

## Step 5 — Report

When the session ends, summarise:

- Triaged: N
- Dispatched to build: M (with workflow run URLs)
- Deferred: D
- Rejected: R
- Any sheet rows repaired during triage

**Completion checklist (per dispatched issue):**
- [ ] Sheet `Pipeline Status` = `queued`
- [ ] Sheet `Build Status` = `context-prep`
- [ ] Sheet `Build Target` set
- [ ] Issue label `triage-ready` removed, `building` added
- [ ] `repository_dispatch` fired to `zynkr-skill-builder`
- [ ] `pickup-approved-issue` workflow run observed

---

## Error handling

- **No sheet row for the issue:** ask the user whether to create one on the fly (calling out that the dedup/classification context will be missing) or skip the issue.
- **Spec md not found at `skills/approved/{slug}.md`:** continue with title-derived description, but flag it to the user; the scaffolder will leave a `_No spec md found_` marker in the SKILL.md.
- **Dispatch returns non-2xx:** report the error and do **not** flip sheet `Build Status` to `context-prep`. Roll back the label swap so the issue stays `triage-ready` for retry.
