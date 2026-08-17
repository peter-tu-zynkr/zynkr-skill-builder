# SKB-007 — `planning-*` skill family: package the H2 planning cycle for YE planning

- **Status:** Active
- **Size / DoD:** L / D2 (new module — an 8-skill product line in the empty `0-strategy`
  category; no auth/cron/secret/migration in-repo → not D3. `planning-tracker-sync` is
  *designed* to be scheduled but this spec ships no cron — scheduling is a follow-up with
  its own wiring proof)
- **Created:** 2026-08-17 · **Repo(s):** zynkr-skill-builder
- **Links:** SKILL_SPEC.md §1/§2/§4/§5 · SKB-001 (cross-file sheetId gap — manual dry-run
  mandated here) · SKB-002 (batch precedent: waves, provenance, fork registry) ·
  packaging trace: artifact "Zynkr YE Planning Kit"
  (`https://claude.ai/code/artifact/8f49ad2f-f414-4dd3-b98d-f50b416627d5`) ·
  H2 hub folder `1S-u9bM4IbTxhYBDIVGglq1g41Z7Qh46R` · Main Tracker
  `1KEzywxGUv6p0blRHp6zgBN5o9Ek8pUXazJLtC0YnBXw`

## Context

The 2026-07-26 H2 offsite (retro → brainstorm → 55-item Main Tracker → suite
reconciliation) ran on ~7 Claude one-off passes plus one packaged skill
(`project-status-update`); every planning step (pre-work workbook + deck, whiteboard →
MECE tracker, transcript → 回顧總結, per-person 年度計畫 from 1:1 docs, addenda across the
suite, per-LOB gap audit) was re-prompted from scratch. `skills/0-strategy/` is empty.
This batch packages the cycle as eight `planning-*` skills sharing one knowledge pack
(taxonomy · priority rule · C1–C4 frame · facilitation runbook · MECE rulings ·
doc-versioning convention) and one sources file (live Drive IDs), so year-end planning
is a re-run: prep in hours, digestion the same day, reconciliation the same week.

SKB-001 is unshipped, so duplicate-sheetId protection is manual: tree-wide
`validate-skill.ts skills --tier=all` + a local `ingest.ts` dry-run (artifacts restored,
never hand-committed) before every push that claims new ids.

## sheetId allocation (0.01 = skill-finder in `catalog/sheet-map.json`; **0.02 = zynkr-gm, SKB-006, shipped to main 2026-08-17 (`6c6071e7`) by a parallel session** — discovered mid-build; the family therefore starts at 0.03, split confirmed by cross-session message)

| id | skill | phase | build priority |
|---|---|---|---|
| 0.03 | planning-prework-pack | A · before the room | ★ first build |
| 0.04 | planning-1on1-annual-digest | A | P1 |
| 0.05 | planning-evidence-pack | A | P2 |
| 0.06 | planning-session-synth | B · in the room / same day | ★ first build |
| 0.07 | planning-tracker-builder | B | P1 |
| 0.08 | planning-suite-reconciler | C · after the room | P1 |
| 0.09 | planning-tracker-sync | C · weekly | ★ first build |
| 0.10 | planning-lob-gap-audit | C | P2 |

## Requirements & acceptance criteria

- **AC-1** — When Wave 1 lands, `planning-prework-pack` / `planning-session-synth` /
  `planning-tracker-sync` are served by `zynkr.ai/api/skills` and `zynkr.ai/s/0.03.md`,
  `/s/0.06.md`, `/s/0.09.md` return 200.
  *Verify:* curl the API + the three `/s/` URLs; green `ingest-skills.yml` run.
- **AC-2** — When Wave 2 lands, 0.04 / 0.05 / 0.07 / 0.08 / 0.10 are served likewise.
  *Verify:* curl sweep; green ingest run.
- **AC-3** — Every skill: `validate-skill.ts <SKILL.md> --tier=all` exits 0 with zero
  ERROR; description is double-quoted or `>-` folded and carries bilingual triggers;
  `synergy` holds only real slugs (existing skills or siblings in this batch); body
  headings follow SKILL_SPEC §4 (install snippet immediately after H1 → summary
  paragraph → `## Step N` or `## Workflow`); no absolute paths; no personal e-mail
  addresses in examples.
  *Verify:* per-file validator output pasted in the record.
- **AC-4** — Every skill's `references/planning-knowledge-pack.md` and
  `references/planning-sources.md` are byte-identical across the eight folders.
  *Verify:* `scripts/check-planning-refs.sh` exits 0 (one hash per file name across the
  eight copies, equal to the seed in `docs/planning-shared/`).
- **AC-5** — Tree-wide `validate-skill.ts skills --tier=all` reports no duplicate
  sheetId, and a local `ingest.ts` dry-run shows one `✓` per new id and **no**
  "pruned … stale redirect" line (a prune line = a burned id = hard stop).
  *Verify:* command output in the record; `git status` clean of `generated/` +
  `content/` afterwards.
- **AC-6** — Batch invariants: zero renames/edits/deletions of existing skills; zero
  edits under the archived `6.0 tech/skills/`; no non-skill folder under `skills/`
  (the shared seed lives in `docs/planning-shared/`, never inside `skills/`, so
  `build-taxonomy-tree.ts` has nothing to flag); every wave's ingest run green.
  *Verify:* `git diff --stat origin/main` per wave shows only
  `skills/0-strategy/planning-*/**` + `docs/**`.
- **AC-7** — Governance: each of the eight skills has a `skill-proposal` issue + Project
  item in `peter-tu-zynkr/zynkr-skill-idea` (Intake Source = skill-publish, Built via =
  skill-publish, Built Skill URL = the landing commit/PR), and after
  `/skill-triager confirm-ship` its Pipeline Status = `shipped`; the three ★ skills are
  installed locally (`~/.claude/skills/<slug>` present) with one real trigger each
  recorded (session-synth on the July transcript + whiteboard photos; tracker-sync on the
  live tracker; prework-pack in dry-run against the July workbook as template).
  *Verify:* `gh issue list --repo peter-tu-zynkr/zynkr-skill-idea --search planning-` ·
  `gh project item-list 1 --owner peter-tu-zynkr` · `ls ~/.claude/skills/planning-*` ·
  trigger evidence in the record.

## Design sketch

- Data: none in-repo (skill content only). Surfaces: eight new
  `skills/0-strategy/planning-<slug>/` folders (SKILL.md + `references/` two shared files
  + skill-specific references), `docs/specs/SKB-007…`, `docs/CHANGELOG.md`.
- **Shared knowledge pack, duplicated not linked.** `npx skills add` installs one
  folder; cross-skill relative links break. So the two shared files are copied byte-for-
  byte into every skill and drift is checked by md5 (AC-4). The ONE canonical seed
  lives in `docs/planning-shared/` (outside `skills/`); `scripts/check-planning-refs.sh
  --sync` re-copies it and the bare script proves identity — the pre-push guard until a
  CI step exists (S follow-up). A hub-skill hoist stays a possible later change.
- **Live IDs in `references/planning-sources.md`** follow the `admin-governance`
  `lob-folder-map.md` precedent (internal-ops identifiers behind Drive permissions; no
  personal contact data). Skill bodies read the sources file; they never hard-code IDs
  inline, so a new cycle only edits the sources file.
- **Read-heavy, write-light.** Skills that write (`tracker-builder`, `suite-reconciler`,
  `prework-pack`) show a diff/plan and write only on explicit confirmation; drafts never
  send (`session-synth` recap mail = Gmail DRAFT; `tracker-sync` nudges = draft or chat
  block). Docs are versioned by dated addendum, Sheets by new tab (pack §8).
- **Boundaries with existing skills:** `project-status-update` keeps the course-project
  Monday weekly and all bare 「週報」 triggers. **`zynkr-gm` (SKB-006, 0.02, in flight in a
  parallel session) owns the founder-facing weekly GM brief and every "GM 週報 / 這週重點 /
  本週 focus / 哪些 P0 delay 了 / H2 進度盤點 / 幫我盤一下 H2 專案 / KPI off-target"
  trigger, plus the derived-state rules (ENDS_SOON · OVERDUE · UNDATED · STALLED ·
  PROPOSE_DONE · DIRECTION_UNLABELLED) in its `references/derived-state-rules.md`.**
  `planning-tracker-sync` is its team-side / record-side companion: it reuses those state
  definitions verbatim (delegating to `zynkr-gm progress` when installed, otherwise
  computing with the same rules), and owns only what zynkr-gm does not produce — the
  team-facing Team Weekly agenda block (drafted for the founder to paste — never written
  into another owner's doc), per-owner nudge drafts, the **dated tracker snapshot** — written
  NOT into the SOR sheet but into the OKR & KPI Tracker as agreed with the zynkr-gm session:
  tab `tracker-latest` (repurposes the stale `Initiatives Q3-Q4` tab; 減法) + tab
  `tracker-snapshots` (history), header = the 13 tracker columns exactly as read (`# 主類別 子類別
  項目（正規化） 重要 緊急 Priority 負責人 協助者 開始 結束 狀態 備註`) + `snapshot_date` +
  `iso_week`, one row per data row (skip `N.0` header rows) — the `rows.json` shape
  `zynkr-gm/scripts/derive_state.py --prev` consumes, which is what unlocks its STALLED
  rule — and the cycle-end `--retro` looking-back draft. State derivation: invoke
  zynkr-gm's `scripts/derive_state.py` / `tracker_diff.py` (stdlib) when that skill is
  installed; the copied `derived-state-rules.md` is the documented fallback only. `planning-evidence-pack` cites
  zynkr-gm's `kpi-map.md` when installed rather than re-deriving KPI sources. `admin-governance` (local index ↔
  Drive) and `consult-governance` (engagement portfolio) stay untouched; `planning-lob-
  gap-audit` borrows only their report-only pattern. `zynkr-slide` renders the deck for
  `prework-pack` (template-fill branch); `project-note-specialist` /
  `consult-session-notes` / `curate-livestream-transcripts` are pattern sources for
  `session-synth`'s transcript pass — not delegated to (their outputs are the wrong
  shape).
- Decisions: direct-to-main per wave (SKB-002 precedent; the only trap — duplicate
  sheetId — is invisible to `qa.yml` regardless of PR/no-PR) · governance runs AFTER
  landing via `/zynkr-skills` → `/skill-qa` → `/skill-publish` fresh-intake with the
  dispatch decoupled (files already on main; publish-skill.ts refuses to overwrite) →
  `/skill-triager confirm-ship` · English-canonical bodies with zh-TW output where the
  artefact is zh-TW (tracker tabs, recap mail, 年度計畫) · no `Provenance` sections
  needed (no forks; pattern borrows only) · sheetIds 0.03–0.10 claimed in order, no
  buffer band reserved (next fresh id after this batch and SKB-006 = 0.11) · ID split
  agreed by cross-session message with the gm-skills and pm-skills sessions 2026-08-17.

### Per-skill contracts (the authoring brief — bodies must implement exactly this)

Common to all eight: `category: strategy` · `platform: claude` · `status: Done` ·
`author: Peter Tu` · `project: <slug>` · install snippet → summary → `## How this differs
from its neighbours` (only where a neighbour exists) → `## Fixed facts (read the
references first)` → `## Hard rules` → `## Workflow` (numbered steps) → `## Outputs` →
`## Reference files` → `## Limitations`. Every workflow starts with **Step 0 — Resolve
cycle + sources**: read `references/planning-sources.md`, take `cycle` (H1/H2/YE) and
any ID overrides from the user, and state which cycle you are operating on. Every skill
ends by printing what it wrote (IDs/URLs) and what it did NOT do.

| skill | reads | produces | must / must not |
|---|---|---|---|
| **planning-prework-pack** (0.03) | cycle + session date · Main Tracker (status, dates, owners) · OKR tracker · per-LOB plan Docs · 1:1 Docs (last N weeks) · CHANGELOG-style shipped lists if given · accounting/runway numbers if given · calendar (rhythm) | (1) new session workbook = COPY of the template Sheet (`copy_drive_file`) with all 5 tabs re-filled for the cycle: Read Me (goal, pass/fail, C1–C4 fill-in, pre-work list), Agenda (8 blocks, timeboxes), Pre-work by LOB (8 rows: mandate · delivered · forward · KPIs · top risk — delivered pulled from tracker 完成 + 1:1 evidence, forward from plan Docs), Laundry List seeds (Impact/Effort/U/I + seed verdict, from plan Docs + tracker 未開始/進行中), Matrix; (2) per-owner one-pager text blocks (Top-3 delivered w/ proof number or `（待補）` · Top-3 goals · laundry list w/ U/I self-rating) written into a `Pre-work — <cycle>` Doc; (3) a deck request handed to `/zynkr-slide` template-fill using the designed deck as template (or the slide text blocks if zynkr-slide is not installed); (4) a logistics checklist + calendar-invite text (venue · lunch · team-building · Meet link · agenda note) — invite creation only on confirmation | must show the tab-by-tab plan before writing; must mark every number's source; must NOT create the calendar event or send anything without confirmation; must NOT overwrite the July template (copy, then fill) |
| **planning-1on1-annual-digest** (0.04) | one person's shared 1:1 Doc (WB entries) · that person's LOB plan Doc · the tracker rows they own · cycle window (default: last 12 months) | one Doc 「年度計畫＿<name>」 in the hub folder, sections exactly: 一、過去一年成果總覽 (timeline by product/project + 一起長出來的系統資產) · 二、策略透鏡（C1–C4 + this line's mandate）· 三、復盤：放大／收割／停止或改造 · 四、年度計劃（3–5 主軸, ordered）· 五、年度目標（OKR, 4–5 KRs with numbers or 待定）· 六、接下來（3 things this month）; plus a 12-line summary block for the person's session slide | must quote WB dates for every claim; must NOT invent metrics; must NOT write into the 1:1 Doc; language = zh-TW body (the exemplar is zh-TW) |
| **planning-evidence-pack** (0.05) | cycle window · sources it can reach: tracker 完成 items, OKR tracker, calendar (count events by title pattern: demos · 線下講座 · 直播 · Team Weekly), Gmail Fireflies recaps (count + titles), Kit/LINE/marketplace/platform/accounting numbers if the user pastes them or a connector exists | a `Scoreboard` tab appended to the session workbook (or a standalone Sheet if none): `KPI · source · <cycle>-start · <cycle>-end · Δ · note`, plus the "looking back in numbers" slide text | must write `（待補）` + the exact source it would need for anything it cannot read; must NOT estimate; read-only against every source |
| **planning-session-synth** (0.06) | transcript (Doc ID / pasted / Fireflies recap) + whiteboard photo(s) (Drive image IDs or local files) · cycle | tabs written into the Main Tracker (new or existing — pack §6): `<cycle> 回顧總結` (rows + 5 重點結論), `② 白板原文`, `③ 去重與歸類決策`, `④ MECE 檢查`, and a normalized item list handed to `planning-tracker-builder` (or written straight into `<cycle> 專案項目` when the user says so); the README tab; a Gmail DRAFT of the recap mail (pack §5 shape) to the recipients the user names | must transcribe verbatim before normalising; must mark 判讀信心 高/中/低 and list 中/低 for confirmation; must apply the §7 rulings as precedent and write every new ruling into ③; must run the §2 coverage check and flag empty LOBs; must NOT send the mail; must NOT assign owners/dates it did not hear |
| **planning-tracker-builder** (0.07) | normalized item list (from session-synth or pasted) + owner/priority decisions · cycle | the Main Tracker Sheet from template (`copy_drive_file` of the July tracker → rename → clear + fill), SOR tab with L1 header rows and `N.NN` numbering, 重要/緊急 → Priority formula or values, `專案項目小記` pivot, conditional colours by 狀態; a lint report: P0 cap (>6 or >25%), owner load (>3 P0), items 掛 All, missing dates, P3 without 放棄, L2 not in pack §2 | must print the lint report and the row plan before writing; lint warns, never blocks; must NOT renumber L1; existing tracker → append rows / new tab, never overwrite the SOR tab in place |
| **planning-suite-reconciler** (0.08) | finalized tracker + the suite IDs (pack sources §A) | for each Doc: a dated addendum section (pack §8 wording) at the top — what changed, open decisions, P0 list with owners, management fixes; OKR & KPI Tracker: `OKRs` rebased (objectives from the tracker's 策略主軸, KRs = P0 items with owner + Tracker #), `Initiatives` = P0+P1 mirror; Sheets versioned by new tab; a leftovers list (renames the API 500s on, tabs to reorder) | must show the per-doc addendum text and get one confirmation for the batch before writing; must NOT rewrite bodies; must NOT touch the tracker; addendum wins on conflict |
| **planning-tracker-sync** (0.09) | Main Tracker SOR tab · today · zynkr-gm's `scripts/derive_state.py` (+ `tracker_diff.py`) run against the rows when that skill is installed (`~/.claude/skills/zynkr-gm` or `~/.agents/skills/zynkr-gm`); else compute the same states from the copied `./references/derived-state-rules.md` (fallback, documented as such) · previous snapshot rows from the OKR & KPI Tracker `tracker-snapshots` tab · optional Fireflies recaps since last run · optional last agenda block | (a) a **team-facing** Team Weekly agenda block drafted in the chat (per owner: P0/P1 with 狀態 + Δ since last snapshot, OVERDUE / UNDATED / ENDS_SOON items with evidence, items 掛 All, PROPOSE_DONE candidates for the owner to confirm) — never written into another owner's Doc; (b) per-owner nudge drafts (chat blocks by default; Gmail DRAFT on request; never send); (c) `snapshot` mode — the ONLY write: refresh tab `tracker-latest` and append to tab `tracker-snapshots` in the **OKR & KPI Tracker** (`1ddtxkUi…`), header = the 13 tracker columns exactly as read + `snapshot_date` + `iso_week`, one row per data row, skipping `N.0` header rows (creates the tabs on first run; `tracker-latest` repurposes the stale `Initiatives Q3-Q4` tab only after showing the plan); (d) at cycle end (`--retro`), a pre-filled looking-back draft: 完成/PROPOSE_DONE by LOB, slipped items, dropped items, owner load — handed to planning-prework-pack | must NOT write to the Main Tracker at all (zynkr-gm design D1: machine state stays out of the SOR sheet); must NOT claim bare 「週報」/「weekly report」 (project-status-update) NOR any GM-brief trigger (zynkr-gm); must use zynkr-gm's state names and thresholds verbatim; explicit invocation or a schedule Peter sets — the skill ships no cron; state the run date and the 「還在摸索／已定案」 reminder in the block |
| **planning-lob-gap-audit** (0.10) | one LOB number · its plan Doc + addendum · tracker items for that LOB · the LOB's Drive folder listing (from `admin-governance` `lob-folder-map.md` if installed, else the user gives the folder ID) | one report Doc 「[N.0.1] <LOB> — <cycle> Gap Audit & Heal Plan（YYYY-MM-DD）」 (worst gaps · SOR sync · banners · doctrine to write · rewrites · decisions needed) + one tracker Sheet 「行動追蹤表」 (tabs README · 修復清單 with 狀態 vocab · 待決事項) placed in the LOB folder; items flagged 可交 Claude | report-only — must NOT touch any existing Doc; must name the owning skill for each fix where one exists |

### Build notes (2026-08-17 — accepted widenings, all confirmation-gated / read-only)

Surfaced by the adversarial review passes; each is documented in the skill's Limitations
and accepted here so spec and body agree:

- **planning-tracker-builder** gains a `fill` mode (an existing tracker whose SOR tab AND
  `專案項目小記` are empty — the shape planning-session-synth leaves behind) beside `fresh`
  and `extend`; numbering follows the ACTUAL template (L1 number in 主類別 text, `#` prefix
  positional). Grid pre-flight (`get_spreadsheet_info` sizes; resize before write).
- **planning-session-synth** may `create_spreadsheet` a blank cycle tracker (after
  confirmation) and offers an optional `⑤ 正規化清單` tab; default persistence of the
  normalized list = chat handoff + a hub-folder `.md` after confirmation. Pack §6's
  `② 白板原文` columns updated to the live header (`# · 白板欄位 · 手寫原文 · 筆色 · 判讀信心 · 備註`).
- **planning-1on1-annual-digest** reads the OKR & KPI Tracker `OKRs` + the integrated plan
  Doc for section 五/二 (read-only) and, only after a second confirmation, shares the Doc
  with the named person via `manage_drive_access(action="grant", …, send_notification=false)`.
- **planning-evidence-pack** additionally reads the workbook `Pre-work by LOB` KPI seed,
  the OKR & KPI Tracker `tracker-snapshots` tab, and zynkr-gm's `kpi-map.md` when
  installed; scoreboard slide = five tiles (the workbook template's slide 4).
- **planning-lob-gap-audit** additionally reads the GM Knowledge Directory, role-doc
  bodies and any prior `[N.0.1]` pair (read-only) and proposes the `[SUPERSEDED]` banner
  on re-runs.
- **planning-tracker-sync** waits for a one-word go on EVERY `snapshot` run (not only the
  first); the `/schedule` prompt is read-only (agenda block only — a cloud routine has no
  workspace-mcp write access).
- Shared `references/planning-sources.md` carries teammate first names as 1:1-Doc labels
  (internal identifiers, admin-governance precedent; no contact data, no HR movements).
- Roster note: `zynkr-gm` shipped mid-build → family renumbered 0.03–0.10 (see allocation).

## Out of scope

- Scheduling `planning-tracker-sync` (cloud routine / launchd) — separate S/M change with
  a wiring proof; the skill documents the invocation for `/schedule`.
- A hub skill hoisting the shared references (S follow-up if drift bites).
- Editing `project-status-update`, `admin-governance`, `consult-governance`, `zynkr-slide`,
  `zynkr-gm` or any existing skill (no synergy backlinks this batch — SKB-002 rule).
- Google Chat sweep as an evidence source (API disabled on the workspace-mcp project).
- The `[7.1] Org Taxonomy` L2 alignment (5.0 → 企業 AI 賦能) beyond noting it in the pack.

## Tasks

- [x] SKB-007.0 Spec Active + shared references authored (seed in `docs/planning-shared/`
      → copied into each skill by `scripts/check-planning-refs.sh --sync`)
- [x] SKB-007.1 Wave 1: planning-prework-pack (0.03) · planning-session-synth (0.06) ·
      planning-tracker-sync (0.09) — validate + ingest dry-run + push + curl
- [ ] SKB-007.2 Wave 2: planning-1on1-annual-digest (0.04) · planning-evidence-pack
      (0.05) · planning-tracker-builder (0.07) · planning-suite-reconciler (0.08) ·
      planning-lob-gap-audit (0.10) — same gate
- [ ] SKB-007.3 Governance: `/zynkr-skills` per skill → QA → publish (fresh-intake,
      dispatch decoupled) → confirm-ship; ★ three installed + one real trigger each
- [ ] SKB-007.4 Close-out: AC-4 md5 sweep · AC-1/2 curl sweep · record entry · main
      checkout fast-forwarded · spec → Shipped

## Verification plan

Per wave: `validate-skill.ts <file> --tier=all` per new SKILL.md (0 ERROR) → tree-wide
`validate-skill.ts skills --tier=all` (no dup sheetId) → local ingest dry-run exit 0 with
one `✓` per new id and no redirect-prune line (artifacts restored) → `/code-review` on the
diff → push → `ingest-skills.yml` green → curl `api/skills` + `/s/<id>.md`. D2 install-
and-trigger on the ★ three using July data (transcript + photos → tabs in a COPY of the
tracker, never the live SOR; live tracker read-only for tracker-sync; July workbook as
template for prework-pack dry-run); dated waivers for the other five until YE exercises
them.

## Doc-sync footprint

Same commit per wave: `docs/CHANGELOG.md` entry + spec task checkbox. Main-checkout
`to-do.md` (local-only tracker) gets the follow-up lines (schedule tracker-sync · hub
skill · waivers) at close-out. No CLAUDE.md / SKILL_SPEC change. Memory:
`project_ye_planning_kit_proposal` updated to "built".
