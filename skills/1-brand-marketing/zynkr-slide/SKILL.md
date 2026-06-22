---
name: zynkr-slide
sheetId: "1.24"
description: "The conductor of the slide relay (sitting above the three-stage relay): fires when the user says '做一份簡報／做個 deck／幫我把這些做成投影片／做季報簡報／all-hands 簡報／deep dive 簡報／pitch deck'. I do a one-shot intelligent intake — detecting which kind of deck this is (deep-dive / business-review / data-presentation / all-hands / planning / pitch / update / teach / fundraise), taking stock of the material and storyline the user has already given, proposing a page count for the user to confirm, and gathering the must-include material and mode — then assembling a SLIDE_PACKET ▸ Brief and driving slide-storyline-designer → slide-page-splitter → slide-visual-selector → the slide-pptx skill in sequence to render the .pptx. Defaults to express mode (ask everything up front once, only asking the user to sign off at two points: storyline finalization and final file); pass the guided parameter to retain each stage's own per-stage human review. Scope boundary: I only do intent detection, context convergence, ▸ Brief injection, and relay orchestration; I don't lay out the narrative arc, split pages, choose layouts, or render the .pptx myself — those belong to the three stages and the slide-pptx skill respectively. In addition, if the user gives a fixed template (charter / one-page QBR / an existing deck to be re-skinned) or asks for a deliverable that maps onto the template library, I take the template-fill branch (copy template → extract content → fill fixed fields → recolor external templates to Zynkr brand colors by default) instead of the three-stage relay."
category: brand-marketing
project: zynkr-slide
platform: claude
status: Done
author: Peter Tu
input: "Raw slide material / topic + the message you want to convey (scattered notes, bullets, an old deck, data, or verbal key points all work), optionally with cues about the deck's purpose; or an existing ▸ Storyline / ▸ Pages you want to continue from. Parameter: express (default) / guided."
process: "Detect intent + take stock of existing context → single intelligent intake (confirm purpose, audience/occasion, proposed page count, must-include material, mode) → load the use-case playbook to assemble the SLIDE_PACKET ▸ Brief → create a shared working subfolder to store the ▸ Brief → drive the three-stage relay in sequence (carrying the ▸ Brief) → hand ▸ Visuals to the slide-pptx skill to render → deliver the .pptx"
output: "A finished .pptx (produced via the three-stage relay + pptx-skill rendering), plus the complete SLIDE_PACKET (▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals) stored in the same working subfolder."
synergy: ["slide-storyline-designer", "slide-page-splitter", "slide-visual-selector", "slide-pptx"]
---

# zynkr-slide

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill zynkr-slide
```

## What this is

`zynkr-slide` is the **conductor** of the slide relay, sitting **above** the three-stage relay. The full chain is:

```
zynkr-slide  ← you are here (conductor)
   │  one intake → SLIDE_PACKET ▸ Brief (deck purpose / audience & occasion / working subfolder / page budget / must-include material / mode / brand application / per-stage emphasis)
   ▼
slide-storyline-designer (1.12)
   │  SLIDE_PACKET ▸ Storyline
   ▼
slide-page-splitter (1.13)
   │  SLIDE_PACKET ▸ Pages
   ▼
slide-visual-selector (1.14)
   │  SLIDE_PACKET ▸ Visuals (render-ready)
   ▼
slide-pptx skill  → renders into a .pptx
```

**Core idea**: The three-stage relay is already quite complete on its own, but it has two gaps — (1) **four cold starts**: each stage opens by re-asking the user for context it can't infer; (2) **the whole deck has no shared understanding of "what kind of deck this is"**, so the same generic rules get applied to both a deep dive and an all-hands — the deep dive isn't deep enough and the all-hands is too dense. `zynkr-slide` fills these two gaps: **ask once** (collapse the four cold starts into a single intelligent intake), and load a playbook based on the "deck purpose" to assemble a `SLIDE_PACKET ▸ Brief` that gets injected all the way down, so every stage knows "what kind of deck this is and which direction to push."

**What it eats**: raw material / topic + the message you want to convey (no matter how messy), optionally with purpose cues; or an existing ▸ Storyline / ▸ Pages you want to continue from.

**What it produces**: a finished `.pptx`, plus the complete `SLIDE_PACKET` (▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals) stored in the same working subfolder.

**What it does NOT produce**: I do **not** lay out the narrative arc, split pages, choose layouts, or render the `.pptx` myself. I am a **thin orchestration layer** — detect intent, converge context, assemble the ▸ Brief, and drive the three stages and the slide-pptx skill in order (see ## Limitations). Each stage's professional judgment is still made by that stage itself.

> Whether the user fires me directly by shouting "make a deck" or gets routed in via `/zynkr`, the behavior is identical — both entry points run the same intake → ▸ Brief → relay.

---

## Resources you'll use

- **Use-case playbook (the knowledge core of this skill)**: `./references/use-case-playbooks.md` — the lookup table for "what kind of deck this is → which preset to use." Each purpose gives: detection cues, the mapped storyline `occasion` enum, narrative-skeleton bias, page-budget range, default information density, and **per-stage emphasis directives**. Read it both at Step 1 when detecting purpose and at Step 3 when assembling the ▸ Brief.
- **Brand visual/tone source (config)**: `./references/brand-source.md` — this skill **does not bundle brand content**; this file configures where to load the brand spec from, and ships a generic schema. Load per this file during intake and ▸ Brief assembly; if unset, fall back to neutral defaults and tell the user "brand not applied." Each of the three stages also loads its own brand-source again; this layer is only responsible for carrying the "use brand" intent into the ▸ Brief.
- **Template source (config)**: `./references/template-source.md` — configures the Drive template-library location (the SOT template folder), how templates are tagged to a use-case (`TEMPLATE-INDEX`), and the field manifest for each template. The **template-fill branch** reads it at Step 1/2 when detecting and selecting a template; if unset/unreadable, ask the user to paste the template link directly.
- **Downstream three stages (relay chain)**: `slide-storyline-designer` (stage 1), `slide-page-splitter` (stage 2), `slide-visual-selector` (stage 3). Call them stage by stage via the **Skill tool**, letting each stage read its own SKILL.md and run its own logic; I only pass the ▸ Brief and the previous stage's handoff packet, and **do not rewrite its steps**. All three stages already have the hook "if a ▸ Brief is present, obey its directives."
- **Render skill (already installed)**: the slide-pptx skill at `~/.claude/skills/slide-pptx/`, called by stage 3 once ▸ Visuals is finalized, via **Create from scratch** (`Read ~/.claude/skills/slide-pptx/pptxgenjs.md`). This skill does **not** vendor or rewrite slide-pptx.

---

## Step 1 — Detect intent + take stock of existing context

Before asking anything, take stock first, and **do not re-ask for what the user has already given** (this is exactly the value of this skill).

1. **Determine the relay entry point**: does the user already have a relay artifact in hand?
   - Already pasted/saved `▸ Visuals` → go straight to slide-pptx rendering (end of Step 4).
   - Already has `▸ Pages` → continue from stage 3.
   - Already has `▸ Storyline` → continue from stage 2.
   - Only raw material / topic → start from stage 1 (most common).
   - **The user gave/specified a fixed template** → **skip the three-stage relay**, take the **template-fill branch (Step 4-T)**: pasted a Slides/PPTX template link and wants to "use this layout," or requested a deliverable that maps onto `TEMPLATE-INDEX` (such as charter / one-page QBR / an existing deck to be re-skinned).
   - **How to detect template-fill**: any one of these holds → it's template-fill — (a) the user pasted a template link and said "use this format / apply this layout"; (b) the requested deliverable name maps onto a use-case key in the template library; (c) the source is the combination of a **content document** (Doc/notes) + a **fixed output layout**. **If unsure, ask one question at Step 2**: "Do you want me to **fill a fixed template**, or **design the narrative from scratch**?" **Don't default to the three stages** (this is exactly the lesson from last time).
   - **Still assemble a complete ▸ Brief when continuing mid-stream**: confirm the purpose first, then load from the playbook the per-stage emphasis directives **for the stages that will actually run next** (together with audience & occasion, must-include material, and brand application) — you can't just put purpose + mode + page budget, otherwise the later stages won't get that purpose's "flavor," which is the same as not applying the orchestrator at all. Fields for already-completed stages can be summarized briefly. If the artifact you're continuing from wasn't originally produced from a ▸ Brief and has no purpose cue, run a quick intake round (confirm purpose/mode/page budget/save location) before proceeding — don't silently guess a purpose that might contradict the existing content.
2. **Detect the deck purpose**: read the "detection cues" in `./references/use-case-playbooks.md` and map the user's wording/situation onto one purpose (deep-dive / business-review / data-presentation / all-hands / planning / pitch / update / teach / fundraise). If unsure, let the user choose at Step 2 — **don't force a guess**.
3. **Take stock of the fields already given**: has the user already stated audience, occasion, page-count ideas, the must-include data/cases, whether to apply branding? Note down what's given; at Step 2 only ask for **what's still missing**.

Tell the user your read in one sentence so they can correct it:

> "Looks like a **<purpose>** deck, starting the relay from **<entry point>**. Let me confirm a few things and then I'll get going."

---

## Step 2 — Single intelligent intake (HITL: ask once)

Ask for **all** the missing context **in one shot** (don't pull teeth one question at a time). Use `AskUserQuestion` to turn discrete options into menus, and ask open fields as free text. Clear it all in one round:

1. **Confirm purpose**: present the purpose detected at Step 1 for the user to confirm/change (the menu carries the playbook's 9 purposes, plus a "none of these / not sure" option). If they pick "none of these / not sure," take the playbook's **no-match fallback**: use the generic skeleton of the "mapped occasion," and write the per-stage emphasis as "occasion default, no extra flavor."
2. **Audience & occasion**: who's the audience? The occasion maps onto storyline's existing enum (**external pitch / internal update / teaching & training / fundraise**) — the playbook already gives each purpose's suggested mapping; here, let the user confirm/change it.
3. **Proposed page count (page budget)**: **proactively compute a suggested range** for the user to confirm — don't make them imagine it. Suggestion = the playbook's page-budget range ⨉ a material-volume nudge (lots of material → top of the range, little material → bottom). Make clear this is a **target, not a hard cap**; how many pages actually get cut is stage 2's call.
4. **Must-include material**: is there any data/case/message/page that "absolutely has to go in"? If none, note "none."
5. **Save location**: where should this deck's working subfolder be created? (Subsequent ▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals and the .pptx all go here.)
6. **Mode**: `express` (default — ask everything up front, only sign off at two points: storyline finalization and final file) or `guided` (retains each stage's own per-stage review)? If the user launched with the `guided` parameter, use guided; otherwise express.
7. **Brand & visual treatment**: load the brand per `./references/brand-source.md`? If it can't load, state plainly that we go with neutral defaults. **If this is the template-fill branch and the template is external (not an existing Zynkr brand asset) → default = apply brand (recolor)**, the deliverable should be in Zynkr colors rather than the template's original colors; ask the visual treatment in one extra question: **recolor (change to Zynkr brand colors, default) / keep (leave the template as-is, e.g. when the template is already Zynkr brand) / hybrid (keep the layout, swap only the key colors + fonts)**. Don't backfill branding halfway through.
8. **Template selection (template-fill branch only)**: if the user brought their own template link → use it; otherwise read `TEMPLATE-INDEX` per `./references/template-source.md`, match it against the use-case detected at Step 1, and **propose 1–2 candidates for the user to confirm**. If no match → ask the user to paste a link, or fall back to the three-stage relay.

> **On-the-spot check of must-include material vs page budget**: if the count of "must-include material" clearly blows past the top of the page budget (e.g. 10 data pages that absolutely must go in but only 8–12 pages given), raise the trade-off on the spot: raise the budget, or split into two decks — don't let content quietly get cut later or the budget quietly overflow.

> Asking everything in one shot is a hard rule. After intake ends, in express mode you **no longer interrupt the user to gather context** mid-stream (you only stop at storyline finalization and final file).

---

## Step 3 — Load the playbook + assemble SLIDE_PACKET ▸ Brief

Based on the confirmed purpose, take that cell's directives from `./references/use-case-playbooks.md` and assemble the ▸ Brief. **Per-stage emphasis** must be copied as concrete text from the playbook (not vague phrasing like "push a bit harder"), so each stage can act on it as soon as it receives it. The ▸ Brief's own field names are part of the relay contract — the three-stage hooks read them verbatim, so **do not rename them** (the one exception: `audience & occasion` is deliberately renamed by stage 1 and filled into its own "audience & situation" field — that's a field bridge between two different artifacts and is expected behavior):

```
SLIDE_PACKET ▸ Brief
────────────────────────────────────────
簡報用途 (use-case)：
  <deep-dive / business-review / data-presentation / all-hands / planning / pitch / update / teach / fundraise>

受眾與場合：
  聽眾：<who they are>
  場合：<對外提案 / 內部更新 / 教學培訓 / 募資>   ← aligned to storyline's existing enum; mapped from purpose, confirmed by the user

工作子資料夾 (working-folder)：
  <absolute path of this deck's working subfolder (the save location asked at Step 2); ▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals and the .pptx all go here>

頁數預算 (page budget)：
  <target range, e.g. 12–15; target not hard cap, actual page cutting decided by stage 2>

必含素材 (must-include)：
  <content/data/cases/pages the user named as absolutely required; if none, write "無">

模式 (mode)：
  <express | guided>

套用品牌：
  <yes, load per each stage's brand-source / no, neutral default>

逐棒強調 ▸ 故事線 (棒1)：<copy from playbook: narrative-skeleton bias + which logic checks to weight + closing requirement>
逐棒強調 ▸ 分頁 (棒2)：<copy from playbook: default density cap + which page type to prioritize + whether one beat may span multiple pages>
逐棒強調 ▸ 視覺 (棒3)：<copy from playbook: which archetypes are preferred + what the visual should "reveal" + color leaning>
────────────────────────────────────────

(Note: `逐棒強調 ▸ 故事線 (棒1)` / `▸ 分頁 (棒2)` / `▸ 視覺 (棒3)` are field names the three-stage hooks match **verbatim** — write the ▸ and the single space exactly as above; don't turn them into indented sub-items or pad them with multiple spaces for alignment.)
```

> **The template-fill variant of the ▸ Brief**: template-fill does not run the three stages, so **do not** fill the three verbatim-matched fields `逐棒強調 ▸ 故事線 (棒1)` / `▸ 分頁 (棒2)` / `▸ 視覺 (棒3)` (no stage will read them). Keep the shared fields (`簡報用途` / `受眾與場合` / `工作子資料夾` / `必含素材` / `模式` / `套用品牌`), and **add** template-fill-specific fields (existing field names must **never** be changed; the new fields are merely additions):
> - `模板來源 (template-source)`：<user-supplied link | template name in TEMPLATE-INDEX + link>
> - `視覺處理 (visual-treatment)`：<recolor (external-template default) | keep | hybrid>
> - `欄位對映 (field-map)`：<template field → source content; mark "待補" for anything not extractable>

Create the working subfolder agreed at Step 2 and store the ▸ Brief in it (durable, same copy as the later ▸ Storyline / ▸ Pages / ▸ Visuals).

---

## Step 4-T — template-fill branch (replaces the three-stage relay)

When Step 1 determines it's **template-fill**: skip the three-stage relay and the storyline/page-split/visual gates, and run the precise template-fill flow below instead. What you assemble is the **▸ Brief (template-fill variant)** (see the note in Step 3, without the three per-stage emphasis fields).

**Before starting**: confirm the slide-pptx skill is installed (`~/.claude/skills/slide-pptx/`); if missing, ask the user to run `npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill slide-pptx` and **stop here**.

1. **Get the template**: user brought their own link → use it; otherwise `copy_drive_file` to copy the template selected at Step 2 (`TEMPLATE-INDEX`) into the working subfolder. **Always copy, never edit the master in place.**
2. **Export an editable copy**: `get_drive_file_download_url(export_format="slide-pptx")` to export the copy as .pptx — Slides' `get_page` has no text/position/color, so you can't precisely locate each shape (see memory `slides-heavy-edit-technique`).
3. **Read the field manifest**: take that template's field manifest (field → shape index / type / source hint) from the `TEMPLATE-INDEX` pointed to by `./references/template-source.md`. When the manifest has gaps, use `~/.claude/skills/slide-pptx/.venv/bin/python` + python-pptx to list shapes (index + type + existing text) and backfill one on the spot.
4. **Field extraction (field-extraction)**: extract the content corresponding to each template field from the source document (Doc / notes). **Mark anything not extractable as "待補" and hand it back to the user — do not fabricate.**
5. **map-to-template + fill**: use python-pptx to fill text, table cells, and dates by shape index. **Don't re-lay-out, don't move geometry.**
6. **Visual treatment**: per the ▸ Brief's "視覺處理 (visual-treatment)" (whose default value is read from the "visual-treatment default" column in `TEMPLATE-INDEX`; external / un-indexed templates default to `recolor`). `recolor` = map the template's original colors to Zynkr brand colors (the color values are loaded at runtime by `slide-visual-selector/references/brand-source.md`; **this layer does not hardcode hex**); `keep` = don't touch colors (when the template is already brand); `hybrid` = swap only key colors + fonts. Change fill and run fonts shape by shape.
7. **Back to Drive**: `create_drive_file(mime_type=slide-pptx, fileUrl=file://…)` to upload to the working subfolder. ⚠️ **workspace-mcp's `create_drive_file` with `fileUrl=file://` can only read from `~/.workspace-mcp/attachments/` (ALLOWED_FILE_DIRS)** — `cp` the local `.pptx` into that folder first, then upload via `file:///Users/<you>/.workspace-mcp/attachments/<name>` (text handoff packets via `content=` are unaffected). MCP cannot convert slide-pptx into native Slides — tell the user to do a one-click **File → Save as Google Slides** (see memory `gws-slides-api-disabled`).
8. **QA**: soffice → pdf → `pdftoppm -r 200` → Read PNG for a visual check; `markitdown` to check text. ⚠️ Don't name the temp script `inspect.py` (it shadows stdlib and breaks lxml import).

When done → hand off at the **Step 5 final gate**, then proceed to **Step 6 retro**. Re-version / partial edits follow Step 5's return-and-rerun approach (rerun steps 4–8).

---

## Step 4 — Run the relay (relay runner)

**Preflight before starting**: first confirm that the stages and the slide-pptx skill you're about to use are all installed (the three stages live in `skills/1-brand-marketing/`; slide-pptx is at `~/.claude/skills/slide-pptx/`). For whichever is missing, tell the user to run `npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill <name>` (slide-pptx must be installed separately), and **stop here** — don't barrel through and fail halfway.

**Transport**: when calling a stage via the **Skill tool**, paste the **full ▸ Brief block + the previous stage's handoff packet** verbatim into that call's args (including the ▸ Brief's "working subfolder" path), so the stage sees the ▸ Brief right there in context; **don't** drop a one-liner hint and expect it to go dig up the file itself. **Let each stage read its own SKILL.md and run its own logic** — I don't rewrite narrative/page-split/layout judgment here.

**Relay order (enter at the entry point determined in Step 1)**: skip the stages before whichever one you start from. ⚠️ If you continue from stage 2/stage 3, stage 1's storyline-finalization gate is no longer in this run's flow — in express mode there is then **no human checkpoint mid-stream**, leaving only the final .pptx gate; before starting, confirm with the user that the ▸ Storyline / ▸ Pages they pasted is already final.

1. **Stage 1 `slide-storyline-designer`**: pass the raw material + ▸ Brief. Stage 1 reads the ▸ Brief's "故事線 (棒1)" directives and the occasion, lays out the narrative arc, and runs the logic checks.
   - **Storyline-finalization gate (kept in both modes)**: the storyline is the master template for every page that follows, so **the user must sign off whether in express or guided**. This is the first (and, aside from intake, the only) mid-stream human checkpoint in express mode.
2. **Stage 2 `slide-page-splitter`**: pass ▸ Storyline + ▸ Brief. Stage 2 reads the "分頁 (棒2)" directives and the page budget (as a target) and default density, and cuts pages.
   - `express`: stage 2's human review is **non-blocking** (list the page split, note it can be halted at any time, auto-continue if there's no major issue).
   - `guided`: keep stage 2's original per-page blocking HITL.
3. **Stage 3 `slide-visual-selector`**: pass ▸ Pages + ▸ Brief. Stage 3 reads the "視覺 (棒3)" directives, picks an archetype per page, writes the layout, and maps to pptxgenjs primitives.
   - `express`: stage 3's human review is **non-blocking**.
   - `guided`: keep stage 3's original per-page blocking HITL.
4. **Render** (who calls slide-pptx splits into two paths — don't render twice):
   - **Normal path** (stage 3 ran this time): **stage 3 itself** calls the installed **slide-pptx skill** (Create from scratch, `Read ~/.claude/skills/slide-pptx/pptxgenjs.md`) once ▸ Visuals is finalized, renders page by page, and completes the QA slide-pptx requires (markitdown text check + subagent visual check). This layer only **confirms it ran**, and does not call again.
   - **Continuing from ▸ Visuals** (Step 1 entry point = already has Visuals, stage 3 won't run): instead, **this layer (the orchestrator) directly** calls the slide-pptx skill to render + QA.
   Both paths: colors/fonts per brand (when ▸ Brief "套用品牌" = yes), layout per ▸ Visuals' layout config.

> **Returning a stage / partial edits**: triggers include a gap in the story, a single page bursting past density, **must-include material exceeding the page budget**. Approach: use the Skill tool with the existing ▸ Brief + the previous stage's handoff packet + the specific edit request to re-call that stage and have it **re-emit the whole handoff packet**, then rerun the affected downstream stages (batch rerun, not per-page patching). Returning a stage doesn't require rerunning intake — the ▸ Brief is still in the working subfolder.

---

## Step 5 — Deliver + save (final gate)

1. **Final gate (kept in both modes)**: confirm slide-pptx QA was run by the responsible party (normal path = stage 3; continuation path = this layer) and isn't re-rendered; hand the finished `.pptx` (together with the visual-QA result) to the user to review, list a one-line summary per page, and ask them to confirm or flag the pages to change. To change → follow Step 4's "returning a stage / partial edits" approach: return to the corresponding stage to re-emit, then rerun the affected downstream stages.
2. After the whole run, the working subfolder holds the complete set of four: `▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals` + the finished `.pptx` (when continuing mid-stream, the earlier handoff packets are the versions the user provided).
   - ⚠️ **When the working subfolder is on Google Drive**: the four packets are text — write them directly with `create_drive_file(content=…)`; but uploading the local `.pptx` (or any binary) needs `create_drive_file(fileUrl=file://…)`, and workspace-mcp can only read from `~/.workspace-mcp/attachments/` (ALLOWED_FILE_DIRS) — `cp` the finished file there first, then upload via `file://…/.workspace-mcp/attachments/<name>`.
3. Wrap up in one sentence: which purpose ran, how many pages, which mode was used, where the file is.

---

## Step 6 — Self-learning retro (net-new; HITL; silent by default)

After delivering and pushing the output to the working subfolder (**both branches run this step**: the three-stage relay and template-fill), spend a beat taking self-stock, and **only produce a proposal when there's genuinely something worth capturing**; a trivial one-off observation → **just stay silent, don't bother the user**.

**Retro checklist**:
1. **A reusable deliverable?** Is this output clean and worth filing into the SOT template library for future reuse?
2. **A new judgment rule / skill gap?** Did I hit a branch the SKILL.md doesn't cover, or make a judgment that should become a rule?
3. **A stable fact / pitfall?** Did I learn a stable environment fact, API limitation, or naming trap worth remembering?
4. None of the above → **trivia → silence.**

Only produce this when it's worth it (show it to the user, **write only on item-by-item approval**):

```
SLIDE_PACKET ▸ Retro Proposal
This run: <use-case / branch (relay | template-fill) / page count / file location>
Observations: <1–3 items, one sentence each>
Proposals (approve / reject item by item):
  [1] Type: <template | skill-change | memory> — <one sentence> — Destination: <…>
  [2] …
Rule: user approves item by item → only then write; no reply = no write. Trivia → silence.
```

**Routing after approval (item by item, executed only when the user nods; this step never edits the SKILL.md directly)**:

| Type | Destination | Action after approval |
|---|---|---|
| (a) Reusable deliverable | SOT template library + `TEMPLATE-INDEX` | `copy_drive_file` the deliverable → template-library folder; add a row to `TEMPLATE-INDEX`; produce and attach a field manifest |
| (b) New rule / skill change | `peter-tu-zynkr/zynkr-skill-idea` issue | `gh issue create`: **borrow only the issue-body skeleton from `skill-sourcer/agents/proposer.md` (Summary / What it does / Why)** and override — title uses `[Skill Change] zynkr-slide — <one sentence>`, label `skill-change` (**not** `skill-proposal`, to avoid being scaffolded as a new skill to a new path), Build Target Path points to the existing `1-brand-marketing/zynkr-slide`; **don't** fill the fields proposer.md depends on from extractor/classifier/deduplicator (a self-change has none of those inputs). ⚠️ proposer.md currently only has a "new skill" mode, so borrow only the skeleton, don't copy the whole package |
| (c) Stable fact / pitfall | Project memory directory (`~/.claude/projects/<project>/memory/`) | Write `<slug>.md` (frontmatter `type: reference` or `feedback`) + add a line to the index in `MEMORY.md` |
| trivia | — | Do nothing |

Skill changes **always** go through (b)'s issue pipeline; retro never directly edits this SKILL.md.

---

## Mode comparison (express vs guided)

| Checkpoint | express (default) | guided (with parameter) |
|---|---|---|
| intake (Step 2) | ✅ ask once | ✅ ask once |
| Stage 1 storyline finalization | ✅ blocking sign-off | ✅ blocking sign-off |
| Stage 2 page-split review | non-blocking (list + can halt, auto-continue) | ✅ per-page blocking |
| Stage 3 visual review | non-blocking (list + can halt, auto-continue) | ✅ per-page blocking |
| Final .pptx | ✅ review sign-off | ✅ review sign-off |

The spirit of express: **ask once up front, then only stop at two points — the master (storyline) and the deliverable (.pptx)**; the page-split and visuals in between run automatically per the ▸ Brief, and the user can halt at any time. guided suits high-risk decks or ones you want to control step by step.

---

## Outputs

A finished `.pptx`, plus the complete `SLIDE_PACKET` (▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals) stored in the same working subfolder. The whole relay carries the ▸ Brief, so the same deck is aligned to "what kind of deck this is" from storyline through visuals.

## Limitations

`zynkr-slide` is a **thin orchestration layer**. What I **do**: intent detection, single-pass context convergence, ▸ Brief assembly and injection, driving the three stages and slide-pptx in order, and guarding the two human gates of express/guided. What I do **not** do:

- **I don't lay out the narrative arc or set the core thesis myself**: that's stage 1 `slide-storyline-designer` (1.12); I only feed it the purpose/occasion/directives.
- **I don't split pages or decide how much goes on each page myself**: that's stage 2 `slide-page-splitter` (1.13); the page budget is a target I give, but the actual page cutting is its judgment.
- **I don't pick the layout archetype or write the layout or pptxgenjs primitives myself**: that's stage 3 `slide-visual-selector` (1.14).
- **I don't render the `.pptx` myself or vendor the slide-pptx skill**: rendering and render-QA are handled by the installed slide-pptx skill; this skill only calls it.
- **I don't bundle brand content**: brand is always loaded at runtime per `./references/brand-source.md`; this public skill library holds no internal IP.
- **template-fill only fills, doesn't redesign**: the template-fill branch only **fills the fixed fields of an existing template + does visual treatment**, it doesn't re-lay-out or design a new narrative — to redesign, take the three-stage relay.
- **retro only proposes, doesn't auto-write-back**: Step 6 retro always **proposes first, writes only after the user approves item by item**, and **never directly edits this SKILL.md** (skill changes go through the `zynkr-skill-idea` issue pipeline).
