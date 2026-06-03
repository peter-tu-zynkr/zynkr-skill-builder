---
name: zynkr
description: "The front-door router for the Zynkr assistant ecosystem. Takes ANY input from the user — a URL, a file path, a slug, a vague idea, a question about pipeline state — figures out which Zynkr skill it belongs to, reads the relevant state across GitHub Project / issues / on-disk / live marketplace, and either auto-invokes the right sub-skill or asks one targeted clarifying question. Use this skill whenever the user drops something into the conversation without specifying which skill should handle it — every undirected URL, file mention, idea, status question, or 'what should I do with this?' is a candidate. Especially fire on phrases like 'I found this', 'I just built X', 'where am I with Y', 'what's in my queue', 'I have an idea about', '幫我看一下這個', '/zynkr', or when the user pastes a link with no further direction. Triggers MORE eagerly than the specific skills below it — when in doubt, route through /zynkr rather than asking the user to remember the right slash command. Also fire on deck / 簡報 requests — 'make me a deck', '幫我做簡報', '做投影片', 'pitch deck', 'deep dive 簡報', 'all-hands 簡報', '把這份資料做成簡報' — and route them to /zynkr-slide (the slide-relay orchestrator)."
category: engineer
project: zynkr
platform: claude
status: WIP
author: Peter Tu
input: "Anything: a URL, local file path, skill slug, free-text idea, status question, or pasted content. The skill classifies the input shape before doing anything else."
process: "Classify input shape → look up state across the four signals (Project / issues / on-disk / live API) when the input references a skill-pipeline item → route to the right sub-skill via the Skill tool when confidence is high, or ask one targeted clarifying question when ambiguous. Surfaces queue / dashboard views on read-only queries."
output: "Either: (a) an auto-invocation of the right Zynkr sub-skill (most common); (b) one targeted clarifying question when intent is genuinely ambiguous; (c) a compact state table when the user asks 'what's in my queue' / 'where is X'."
synergy: ["skill-sourcer", "skill-triager", "skill-publish", "skill-finder", "write-newsletter", "polish-lecture-transcript", "biz-card", "cv-customizer", "support-reply-drafter", "newsletter-to-notion", "write-article", "srt-optimizer", "zynkr-slide"]
---

# Zynkr

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill zynkr
```

The **front-door router** for everything Peter drops into the assistant. Take any input — a URL, a path, a slug, a half-formed idea, a "where am I with X?" question — figure out which Zynkr capability it belongs to, read the relevant state, and route. This is Zynkr's mission expressed as a skill: *gather knowledge, turn it into a capability, add it to the knowledge base* — applied recursively to the assistant itself.

> **Where this fits:** `/zynkr` sits **above** the canonical 4-skill skill-authoring chain (`/skill-sourcer` → `/skill-triager` → `/skill-creator` → `/skill-publish`) and beside the content skills (`/write-newsletter`, `/biz-card`, `/polish-lecture-transcript`, etc.). It does not replace any of them. Power users still call them directly. `/zynkr` is the catch-all for unstructured input.

---

## Step 1 — Classify the input

Pattern-match the user's input against the table below. **First match wins.** Heuristics are intentionally crude — false positives bounce to Step 3 (clarification), so a wrong guess here is cheap.

| Signal in input | Input type |
|---|---|
| `https://github.com/<owner>/<repo>` or `https://skills.sh/...` referencing a SKILL.md or repo of skills | `external-skill-url` |
| `https://github.com/peter-tu-zynkr/zynkr-skill-idea/issues/<N>` or `#<N>` referring to an idea-repo issue | `pipeline-issue-ref` |
| User says "qa `<slug>`", "check this skill", "健檢", "does this pass QA", "review this skill" — OR drops a SKILL.md with an explicit QA/review verb | `qa-request` |
| A folder path or file path that resolves to a `SKILL.md` on disk | `local-skill-md` |
| `https://docs.google.com/document/...` | `google-doc` |
| `.srt` / `.vtt` extension OR `youtu.be` / `youtube.com/watch` URL OR words like "transcript", "字幕", "逐字稿" | `transcript` |
| Image of a business card (jpg/png/heic) or words like "business card", "名片" | `biz-card` |
| Question-shaped — starts with `what / where / how many / show me / list / 還有什麼 / 還有哪些` | `query` |
| Free text mentioning a known sub-skill domain (newsletter / 電子報, CV / 履歷, support 信箱, article 文章) | `typed-text` |
| Free text asking to build a deck / 簡報 / 投影片 / presentation / pitch deck (make / build / 做 / produce) | `deck-request` |
| Anything else | `unclassified` |

State what you detected to the user in one sentence so they can correct if needed:

> "Looks like a `<input-type>` — let me check the state and route you."

---

## Step 2 — Look up state (only when input references a skill-pipeline item)

For `external-skill-url`, `pipeline-issue-ref`, or `local-skill-md` inputs, gather state from these four signals **in parallel** (use multiple Bash calls in one turn):

| Signal | How to read | What you learn |
|---|---|---|
| GitHub Project | `gh project item-list 1 --owner peter-tu-zynkr --limit 200 --format json` — match by slug (derived from URL or frontmatter `name`) | Pipeline Status, Build Status, Keep, Intake Source, Built Skill URL |
| Issue + labels | `gh issue list --repo peter-tu-zynkr/zynkr-skill-idea --search "<slug>" --json number,title,labels,state` | Existence of an issue, current label (`triage-ready` / `building` / `shipped` / `parked` / `rejected`), open vs closed |
| On-disk SKILL.md | `ls skills/<N-cat>/<slug>/SKILL.md` (run from the repo root) | Whether scaffold or publish already landed in the repo |
| Live `/api/skills` | `curl -sL https://www.zynkr.ai/api/skills` and grep for slug | Whether the skill is live on the marketplace |

Pick the slug from either the URL last segment (`.../tree/main/skills/<slug>`) or the SKILL.md frontmatter `name`. If you can't resolve a slug, skip the state lookup and treat as `unclassified`.

---

## Step 3 — Decide the route

Switch on `(input-type, state)` using the table below. Auto-invoke means use the **Skill** tool with the sub-skill's name; the sub-skill loads its own SKILL.md and runs.

### Skill-pipeline inputs

| Input × State | Action | Confidence |
|---|---|---|
| `external-skill-url`, no prior state | Invoke `/skill-sourcer <URL>` | High → auto |
| `pipeline-issue-ref`, label = `triage-ready` | Invoke `/skill-triager` (cue Option A) | High → auto |
| `pipeline-issue-ref`, label = `building`, on-disk file absent | Nudge: "Run `/skill-creator` on branch `skill/<slug>` to write the body" — don't auto-invoke; creator is human-in-the-loop interactive | High → nudge |
| `local-skill-md`, slug matches an open `triage-ready` or `building` issue | Invoke `/skill-qa <path>` FIRST. On **PASS** → chain to `/skill-publish` (continuation mode). On **ERROR** → stop, surface the QA report, don't publish. On **WARN-only** → list warnings, ask "publish anyway?" then chain. | High → auto (QA → publish on PASS) |
| `local-skill-md`, no matching open issue | Invoke `/skill-qa <path>` FIRST, then `/skill-publish` (fresh-intake mode) on PASS (same ERROR/WARN handling). | High → auto (QA → publish on PASS) |
| `pipeline-issue-ref`, PR merged + slug on `/api/skills` + Project Build Status = `ready-to-ship` (or open issue still has `building` label) | Invoke `/skill-triager` (cue Option D `confirm-ship`) | High → auto |
| `pipeline-issue-ref`, Project Pipeline Status = `shipped` | Render: "Already shipped — live at `https://www.zynkr.ai/ai-skills-marketplace` (slug `<slug>`)." Then, if `~/.claude/skills/<slug>/` is absent, offer `npx skills add … --skill <slug>` so it's invocable locally (marketplace-live ≠ installed in your session). | High → no-op (offer local install if missing) |
| `pipeline-issue-ref`, Project = `parked` / `rejected` | Render the state, ask if user wants to revive | Medium → ask |

### QA inputs (standalone — any skill, any lifecycle stage)

`/skill-qa` is also the on-demand health-check. Explicit QA intent never auto-publishes.

| Input × State | Action | Confidence |
|---|---|---|
| `qa-request` + a local SKILL.md path or folder | Invoke `/skill-qa <path>` standalone; report the verdict. | High → auto |
| `qa-request` + slug resolving to an in-pipeline `building` issue | Resolve the on-disk path (`skills/<N-cat>/<slug>/SKILL.md`) or the `skill/<slug>` branch head; invoke `/skill-qa`. | High → auto |
| `qa-request` + slug of an already-`shipped` skill | Invoke `/skill-qa <slug>` against the in-tree `main` copy (re-audit / regression check). | High → auto |
| `qa-request` + an `external-skill-url` / candidate not yet in the pipeline | Invoke `/skill-qa` on the fetched SKILL.md as a pre-intake quality probe. On PASS, offer: "Want to source this? → `/skill-sourcer`." | High → auto, then offer |
| `qa-request` but no resolvable artifact | Ask once: "Point me at the SKILL.md (path, slug, or URL) to QA." | Medium → ask |

### Knowledge-pipeline inputs (broader Zynkr scope)

| Input × Context | Action | Confidence |
|---|---|---|
| `google-doc` + the URL is a newsletter draft → invoke `/newsletter-to-notion` | High → auto |
| `google-doc` + unclear intent | Ask: "Newsletter draft to sync to Notion, or something else?" | Medium → ask |
| `transcript` (`.srt` / `.vtt`) | Invoke `/srt-optimizer` | High → auto |
| `transcript` (video URL or long YouTube link, no .srt yet) | Invoke `/polish-lecture-transcript` | Medium → confirm |
| `biz-card` image | Invoke `/biz-card` | High → auto |
| `typed-text` mentioning newsletter / 電子報 | Invoke `/write-newsletter` | Medium → confirm intent |
| `typed-text` mentioning CV / 履歷 / resume | Invoke `/cv-customizer` | Medium → confirm |
| `typed-text` mentioning article / 文章 outline | Invoke `/write-article` | Medium → confirm |
| `typed-text` about support inbox / 客服 | Invoke `/support-reply-drafter` | High → auto |
| `deck-request` — build a slide deck / 簡報 / 投影片 (from material, a topic, or a resume-mid-relay packet) | Invoke `/zynkr-slide` | High → auto |

### Read-only state queries

| Query shape | Action |
|---|---|
| "What's in my triage queue?" / "show me triage-ready" | `gh issue list ... --label triage-ready` and render a table |
| "Where is `<slug>`?" / "status of `<slug>`?" | Run the Step 2 four-signal lookup and render a one-screen state card |
| "Does `<slug>` pass QA?" / "is `<slug>` QA-clean?" | Resolve the artifact (on-disk → branch → `main`), invoke `/skill-qa <slug>` in report-only mode, render the PASS/FAIL verdict card. Read-only — never publishes. |
| "What shipped this week?" | `gh issue list ... --label shipped --search "closed:>2026-mm-dd"` and render |
| "What's stuck?" / "what's in approved >7 days?" | Read Project, filter by `Pipeline Status=approved` AND age > 7 days, render |

### Unclassified / ambiguous

Ask **one** targeted clarifying question. Never chain questions — if the user's answer is still unclear, default to the most likely sub-skill and let them course-correct. The "one question max" rule mirrors `/skill-finder`'s decision logic.

Example clarifications:
- "Is this a skill candidate I should source, or a newsletter topic?"
- "Do you want me to polish this transcript, or trim the .srt timing?"
- "I see two open issues for `<slug>` — #N (open, approved) and #M (open, parked). Which one are you asking about?"

---

## Step 4 — Render or invoke

### Auto-invoke

When confidence is **High** and the action is `auto`:

1. State your route in one sentence: "Routing to `/skill-publish` continuation against issue #84."
2. Invoke the sub-skill via the **Skill** tool, passing the relevant input as `args`.
3. Let the sub-skill drive from there. Don't re-implement its logic inline.

**QA → publish chaining.** When the route is a finished `local-skill-md` for a build issue, invoke `/skill-qa` first and read its verdict. Only chain to `/skill-publish` on a **PASS** (zero ERROR-tier findings). On FAIL, print the QA report and stop — never publish an ERROR-tier skill from the router.

### Nudge

When confidence is **High** but the action is **nudge** (e.g. `/skill-creator` is interactive and shouldn't be auto-invoked):

```
Next step: run `/skill-creator` on branch `skill/<slug>`. The stub SKILL.md is at
skills/<N-cat>/<slug>/SKILL.md with `<!-- TODO -->` markers in the body.
```

Print the suggested command in a fenced code block so the user can copy-paste.

### State render

For read-only state queries, render a compact table:

```
Slug: find-skills
Issue: #84 (CLOSED)
Labels: shipped, skill-proposal, category:6-engineer
Project: Pipeline=shipped, Build=shipped, Built Skill URL=...
Marketplace: ✅ live at https://www.zynkr.ai/ai-skills-marketplace
Recommended next step: nothing — fully shipped.
```

Always end with a **"Recommended next step"** line so the user knows what to do (even if the answer is "nothing").

### Ask

For ambiguous inputs, use one of two shapes:
- A plain-text question if it's open-ended.
- An `AskUserQuestion` call if there are 2–4 discrete options to choose between.

Default to AskUserQuestion when the options are discrete — it surfaces choices more cleanly than a free-form question.

---

## Reuse, don't reinvent

`/zynkr` is a thin coordination layer. It does **not** re-implement the logic in any sub-skill. Specifically:

- For state-aware routing patterns, see `../skill-triager/SKILL.md` (Step 2 "Detect the intake source" + Step 3 Option A/D switch) and `../skill-publish/SKILL.md` (Step 1 mode detection — continuation vs fresh-intake).
- For dedup / classify subagents, those are owned by `/skill-sourcer` (`../skill-sourcer/agents/{classifier,deduplicator,proposer}.md`). If `/zynkr` needs classification, call `/skill-sourcer` and let it run those agents.
- For GitHub Project field IDs (option IDs for `Pipeline Status`, `Keep`, etc.), see `../skill-triager/SKILL.md` Option D section. Don't re-derive — read the documented IDs.

---

## Out of scope

The plan deliberately leaves these out of v1:

- **Drift / health checks** — detecting stale items, mismatched labels, orphan PRs. Useful, but a separate concern.
- **Cross-repo dispatch automation** — closing the lifecycle gap where the builder repo doesn't notify the idea repo on ship. Lives in CI workflows, not in this skill.
- **Scheduled digests** — weekly "here's what's stuck" reports. Use `/loop /zynkr "what's in my queue?"` if you want that, no need to bake it in.
- **Replacing direct invocation of the sub-skills** — they remain first-class entry points. `/zynkr` is one of several front doors, not the only one.

---

## Done

Summarise what you routed to and why. Example:

> Routed to `/skill-sourcer` because the input was an `external-skill-url` (vercel-labs/skills/find-skills) with no prior pipeline state. `/skill-sourcer` is now running its extract → classify → dedup → propose chain.

Ask: **"Anything else to route?"**
