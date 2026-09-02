# SKB-011 — PM shared cohort: one knowledge pack, five skills, a gate that proves it

- **Status:** Active — built 2026-09-02, currently **D1**; D2/D3 gates listed below are unfired
- **Size / DoD:** L / **D3**. L because it lands three things at once: a **new CI gate**
  (`qa.yml` gains a `push:` trigger and a `shared-refs` job), **two new skills** (3.20 · 3.21),
  and a **cross-repo follow-on** (Atlas `pm.*` pointer nodes → ATL-040). D3 because this repo's
  binding block puts workflow changes at D3 and SDD §5.4 requires a wiring proof for every new
  gate — the gate must be seen RED once before it counts as wired
- **Created:** 2026-09-02 · **Repo(s):** zynkr-skill-builder (+ zynkr-atlas, register only — see Next)
- **Links:** SKB-007 (the seed-and-copy precedent this extends, and its open follow-up
  「CI step for `check-planning-refs.sh`」 — closed here) · SKB-008 (zynkr-ops-weekly, 3.19,
  deliberately **not** a member) · SKB-001 (cross-file sheetId gap → manual ingest dry-run still
  mandated) · SKILL_SPEC.md §1/§2/§4 · PMO Playbook 五條鐵律 §5

## Context

Five skills already touch the PMO's artefacts — `project-planning` (3.07) · `project-note-specialist`
(3.08) · `project-status-update` (3.09) — and two more were missing at the two ends of the
lifecycle: standing a project up, and closing the 會議記錄 → 管控表 loop. Reading all of it on
2026-09-02 surfaced three defects that share one root cause: **the knowledge existed only inside
individual skill bodies, so nothing could be true in one place**.

1. **Six typed status columns were being read as one vocabulary.** 管控表 tab 1 `Status` ·
   Main Tracker `狀態` · 會議記錄 進度更新 · Risk Register `狀態` · Change & Decision Log `狀態` ·
   復盤 §1 結案確認 — plus two *rendered* readings (週報 RAG, dashboard health) that are outputs,
   not columns. Eight surface vocabularies in all, and skills treated them as dialects of one
   word. They are not: they sit on **five different axes** (§ below). The visible symptom was
   健康度 being copied into `Status`, and 暫停 arriving on rows that have no such state.
2. **A live 13-vs-14 column bug in the only skill that reads the sheet.** 管控表 v2 has 14 columns
   A–N; legacy v1 had 13 (no `前置任務 Depends on`). `project-status-update` hardcoded `A1:M44`,
   so on a v2 sheet it read `前置任務` as `Reference 連結` and shifted every column after it.
   Compounding it, the skill folded `取消` into `Not started` — abandoned work stayed in the
   percent denominator, which understated completion permanently.
3. **Seed-and-copy enforces identity, not correctness.** SKB-007 proved copies can be kept
   byte-identical (`check-planning-refs.sh`). It cannot prove a *skill* is reading the copy it
   claims to read: a stale copy sitting next to a SKILL.md written against a newer pack is
   byte-perfect and wrong. And the check ran nowhere but a human's terminal — `qa.yml` fired on
   `pull_request` only, so a direct-to-main push (authorized fleet-wide) skipped it entirely.

## The owner's rulings (settled 2026-09-02 — the build implements these, not alternatives)

| # | Ruling | What it decided | Where it shows in the build |
|---|---|---|---|
| **D1** | `reference-nodes` | Atlas holds `pm.*` **pointer** nodes — not a collection node, not the bytes | Nothing in this repo changes; the pointers are ATL-040 (see Next) |
| **D2** | `jane_reviewer` | Jane Liao reviews/verifies PM knowledge; Peter stays author | Editorial, not mechanical — no gate encodes it |
| **D3** | `adapters` | Per-team / per-LOB variation is adapter **DATA**, never variant knowledge | `~/.config/zynkr/pm.json` (same regime as `gm.json` / `ops-weekly.json`); contract in `pm-sources.md` §2; the pack refuses to hold it (pack §10) |
| **D4** | **PARKED** | Which surface a human edits — the Playbook Doc or the repo seed — is **undecided** | See below |
| **D5** | `crosswalk` | Build a status crosswalk covering 暫停 and Drop | `pm-status-crosswalk.json` — five axes, eight surface vocabularies, two rejected values |
| **D6** | `two` | Exactly TWO new SKILL.md: `project-init` (3.20) · `project-minutes-sync` (3.21) | Both built; no third |
| **D7** | `file_sot` | Files in this repo are the SOT for the **bytes**; Atlas is the **register** only | Atlas gets pointers; no Atlas row serves pack content |

### D4 is parked — and this is what it gates

The fork: **does a human edit the Google Doc Playbook, or this repo seed?** Undecided, so the
build takes the only posture that survives either answer:

- The repo seed is the **working master** today. `pm-knowledge-pack.md` opens with
  `<!-- pack_version: 1 · direction pending D4 -->`, and no file in the change asserts that
  either surface is generated from the other.
- **What D4 gates is exactly one line** — the first step of `scripts/check-pm-refs.sh --sync`,
  the step that decides where the seed's bytes come from. Today nothing runs before the copy.
  `doc_master` adds one Doc→seed pull in front of it (and this directory gains a generated-file
  banner). `repo_seed` never adds it. **Everything downstream is identical either way:** same
  copy step, same byte-identical `references/`, same declared sha256, same Step 0 refusal, same
  CI gate. The fork changes provenance, not mechanism.
- Until D4 rules, prose everywhere says 「direction pending D4」 and nothing more.

## Architecture

```
master (repo seed docs/pm-shared/, direction pending D4)
   │  scripts/check-pm-refs.sh --sync
   ▼
byte-identical copies  skills/<pm family>/references/pm-knowledge-pack.md
   │  each SKILL.md prints 知識來源 + declared sha256, Step 0 refuses to run on mismatch
   ▼
CI gate  .github/workflows/qa.yml  (push AND pull_request)
```

**PM family = exactly five skills**, an explicit list in `check-pm-refs.sh`, never the glob
`project-*`: `project-planning` (3.07) · `project-note-specialist` (3.08) ·
`project-status-update` (3.09) · `project-init` (3.20, new) · `project-minutes-sync` (3.21, new).
A glob would silently adopt any future `project-*` skill and silently drop a renamed one — and
this cohort has a real edge: **`zynkr-ops-weekly` (3.19) is FROZEN** behind a live launchd plist
and is not a member.

Only `pm-knowledge-pack.md` is copied into skills. `pm-sources.md` and the two JSON seeds stay in
`docs/pm-shared/` and are reached through `scripts/pm-schema.py`, never by copy — identifiers and
machine schemas have one home each.

## The five axes (D5 — the core content decision)

| Axis | Canonical values | Typed where |
|---|---|---|
| **lifecycle** | `not_started` `in_progress` `paused` `done` `dropped` | 管控表 tab 1 `Status` · Main Tracker `<cycle> 專案項目` |
| **health / RAG** (derived, never typed) | `on_track` `at_risk` `delayed` | 會議記錄 進度更新 · 週報 RAG · dashboard health |
| **risk lifecycle** | `open` `monitoring` `closed` | 管控表 Risk Register `狀態` |
| **decision lifecycle** | `proposed` `approved` `rejected` | 管控表 Change & Decision Log `狀態` |
| **closure verdict** | `passed` `passed_with_conditions` `not_delivered` | 復盤 §1 |

Three rulings the pack states as rules, each with its rationale:

1. **`paused` is project-level only.** 鐵律 3 fixes 管控表 tab 1 at four values and none is paused;
   a paused *task* is `WIP` + a Note, or `Drop` + a Change & Decision Log entry. Main Tracker's
   `暫停` therefore maps to a **project**, never to a 管控表 row.
2. **`dropped` leaves the denominator.** `% = done / (total − dropped)`, applied at every level;
   dropped rows are listed separately, never silently discarded. The old `取消 → Not started`
   fold is the bug this replaces.
3. **health is DERIVED.** 🔴 `End < today` 且 lifecycle ≠ done · 🟡 (`End ≤ today+3` 且 lifecycle =
   not_started) 或 一筆開啟中且超過 7 天的阻礙 · 🟢 otherwise. Thresholds are adapter data
   (`defaults.health_thresholds`); the *direction* of the derivation is not tunable, and a health
   reading is never written back into `Status`.

`取消` is illegal on every axis (`rejected_values`), and so is `暫停` at task level — both arrive
as **data errors** that name the row, never as a fifth bucket.

## What was built

| File | Role |
|---|---|
| `docs/pm-shared/pm-knowledge-pack.md` | The seed — 五條鐵律 · the five axes · 管控表 14 欄 · 編號與日期 · Gate · 升級與同步 · 週報四段 · 結案 · 四條技能鐵律 · §10 what it deliberately excludes |
| `docs/pm-shared/pm-sources.md` | The 8 canonical PMO artefact IDs + the `~/.config/zynkr/pm.json` adapter contract + §2.3 the rule that resolves the course-tracker mess |
| `docs/pm-shared/pm-sheet-schema.json` | Machine-readable tab → headers, v2 (14) + `legacy.v1` (13) |
| `docs/pm-shared/pm-status-crosswalk.json` | Machine-readable axes · vocabularies · rejected values · `rules.percent_complete` |
| `docs/pm-shared/README.md` | What the dir is · the D4 switch point · how to re-sync |
| `scripts/pm-schema.py` | stdlib-only validator CLI — `headers` · `values` · `--self-test`; exit `0` valid · `1` invalid · `2` legacy v1 · `3` cannot run |
| `scripts/check-pm-refs.sh` | Seed↔copy identity **and** declared-sha check; `--sync` repairs both; `--print-sha` |
| `tests/pm-fixtures/*.json` | 5 fixtures: v2-good · v1-legacy · headers-bad · values-good · values-bad |
| `.github/workflows/qa.yml` | `push:` trigger added + `shared-refs` job (planning refs · PM refs · `--self-test`) |
| `skills/3-operations/project-init/SKILL.md` | NEW · 3.20 · template copy → sub-folders → 清空範例列 → six stage rows → backlinks → `pm.json` snippet; stops at Gate 1 |
| `skills/3-operations/project-minutes-sync/SKILL.md` | NEW · 3.21 · 會議記錄 four tables → tab 1 · Change & Decision Log · Risk Register, VALUES-ONLY, diff report |
| 3 existing family SKILL.md | Step 0 pack check + `知識來源` declaration; `project-status-update` additionally rebuilt around version detection, the four buckets, the denominator rule and adapter config |
| `project-status-update/references/dashboard_schema.json` + `scripts/render_dashboard_email.py` | `sheet_version` · `dropped[]` · `data_errors[]` blocks; column map and lifecycle buckets mirrored so the three cannot drift |
| `consult-status-report` (2.x) | **Follows the rule and cites it; keeps no copy** — Drop bucket + denominator fix, `取消` stays a data error |
| `docs/planning-shared/planning-knowledge-pack.md` (+8 copies) | Cross-axis note: the planning `狀態` vocabulary is the lifecycle axis; `暫停` is project-level; health never written back |

## Requirements & acceptance criteria

- **AC-1** — When the seed and the five copies agree, the identity guard passes and names the count.
  *Verify:* `bash scripts/check-pm-refs.sh` → exit 0, prints `pm-knowledge-pack.md: seed <md5> · 5 copies checked`.
- **AC-2** — When a family SKILL.md declares a sha that is not the seed's, the guard fails loudly.
  *Verify:* edit one `知識來源` line to a wrong 12-hex value → `bash scripts/check-pm-refs.sh` exits 1 printing `SHA-MISMATCH <skill> declared=… actual=…`; `scripts/check-pm-refs.sh --sync` restores it; re-run exits 0.
- **AC-3** — When the cohort is enumerated, membership is an explicit five-line list and `zynkr-ops-weekly` is not in it and is untouched by this change.
  *Verify:* `sed -n '/^PM_FAMILY=(/,/^)/p' scripts/check-pm-refs.sh | grep -c 'skills/3-operations/'` = 5; `git diff --stat origin/main -- skills/3-operations/zynkr-ops-weekly` prints nothing.
- **AC-4** — When a header row is handed to the validator, it returns the right one of three verdicts.
  *Verify:* `python3 scripts/pm-schema.py headers --file tests/pm-fixtures/headers-v2-good.json` → 0 · `…/headers-v1-legacy.json` → 2 · `…/headers-bad.json` → 1 (`echo $?` after each).
- **AC-5** — When a column's values are checked against one axis, values from a neighbouring axis are rejected by name.
  *Verify:* `python3 scripts/pm-schema.py values --file tests/pm-fixtures/values-good.json` → 0; `…/values-bad.json` → 1, output naming `取消` and `暫停`.
- **AC-6** — When the validator is weakened to always-pass, the self-test says so rather than going green.
  *Verify:* `python3 scripts/pm-schema.py --self-test` → exit 0, `5 fixture(s) · 0 unexpected`; then seed a weakening (make `cmd_headers` return 0 unconditionally) → exit 1 with the per-fixture FAIL lines and the verdict-coverage line; revert.
- **AC-7** — When `project-status-update` reads a tracker, no range is hardcoded and no column is addressed by letter.
  *Verify:* `grep -rn 'A1:M44' skills/3-operations/project-status-update/` returns only the **legacy branch** of Step 2 and the `SHEET_RANGE` map — no unconditional read; `grep -n 'pm-schema.py headers' skills/3-operations/project-status-update/SKILL.md` shows detection precedes mapping.
- **AC-8** — When completion is computed anywhere in the fleet, dropped rows are out of the denominator and `取消` is a data error.
  *Verify:* `grep -rn 'total − dropped\|total - dropped' skills/3-operations/project-status-update skills/2-sales-consultant/consult-status-report docs/pm-shared` hits the SKILL.md, both `dashboard_schema.json` and `rules.percent_complete`; `grep -n '取消' skills/3-operations/project-status-update/SKILL.md` shows it named as a data error and never mapped to `Not started`.
- **AC-9** — When the payload carries `dropped` or `data_errors`, the renderer emits both blocks.
  *Verify:* `python3 skills/3-operations/project-status-update/scripts/render_dashboard_email.py <payload>.json --out /tmp/e.html` on a payload holding both, then `grep -c '已 Drop 的任務\|資料錯誤' /tmp/e.html` ≥ 2; `python3 -m py_compile` on the renderer exits 0.
- **AC-10** — When the two new skills are validated, they pass at every tier and claim ids nobody else holds.
  *Verify:* `cd scripts && npx tsx validate-skill.ts ../skills/3-operations/project-init/SKILL.md --tier=all` and the same for `project-minutes-sync` → 0 ERROR each; tree-wide `npx tsx validate-skill.ts ../skills --tier=all` reports no duplicate sheetId; local `ingest.ts` dry-run prints `✓ 3.20` and `✓ 3.21` with **no** redirect-prune line, and `git status` is clean of `generated/` + `content/` afterwards.
- **AC-11** — When the new files are scanned, they carry no absolute path and no real instance identifier.
  *Verify:* `grep -rn '/Users/' docs/pm-shared scripts/pm-schema.py scripts/check-pm-refs.sh skills/3-operations/project-init skills/3-operations/project-minutes-sync` returns nothing; `grep -rn '1w74oPg7jqXs3mszLzlROsAko3cCYM4_vlr_rS1-nUVg' docs/pm-shared skills/3-operations/project-init skills/3-operations/project-minutes-sync` returns nothing — the course tracker resolves from `pm.json` only, and the sole mention anywhere in the seed is the truncated `1w74oPg7…` in `pm-sources.md` §2.3, quoted as the symptom it describes.
- **AC-12** — When anything under `skills/`, `docs/*-shared/`, `scripts/` or `tests/pm-fixtures/` lands on main by **push** (not only by PR), `qa.yml` runs both jobs and the three shared-ref guards.
  *Verify:* the workflow run for the landing commit is green, its log shows a real `diff range: …` line (not an empty range), and the `shared-refs` job shows three passing steps.
- **AC-13** — When a copy drifts or a fixture's verdict changes, CI goes **red** — the wiring proof.
  *Verify:* on a throwaway branch, seed one byte of drift into a skill's `references/pm-knowledge-pack.md`, push, observe the `shared-refs` job fail at `check-pm-refs.sh` with `DRIFT`; delete the branch; paste the red run URL into the record.
- **AC-14** — When the planning family's pack is edited, its own guard still proves all eight copies identical.
  *Verify:* `bash scripts/check-planning-refs.sh` → exit 0 (the cross-axis note was re-synced to all eight copies in the same change).

## Design sketch

- **Data:** none. Skill content, two JSON seeds, one stdlib script, one bash guard, fixtures.
- **Surfaces:** `docs/pm-shared/` (5 files) · `scripts/pm-schema.py` · `scripts/check-pm-refs.sh` ·
  `tests/pm-fixtures/` (5) · `.github/workflows/qa.yml` · two new skill folders · five edited
  SKILL.md · two `dashboard_schema.json` · one renderer.
- **Duplicated, not linked — again.** `npx skills add` installs one folder, so a cross-skill
  relative link breaks on the user's disk. The pack is therefore copied, and drift is a gate, not
  a convention. What SKB-011 adds over SKB-007 is the **second** check: a copy can be
  byte-identical while its SKILL.md still promises the reader an older pack, so each family
  SKILL.md prints `知識來源：references/pm-knowledge-pack.md · v1 · sha256 <12 hex>` and Step 0
  recomputes it and **refuses to run** on a mismatch. `--sync` repairs copy and declaration
  together, so the two cannot be repaired apart.
- **Identifiers vs knowledge vs variation, one home each.** Knowledge → the pack (no IDs, ever).
  Canonical artefact IDs → `pm-sources.md` (committed literals; they are the templates, not an
  instance). Per-instance IDs and per-engagement-type variation → `~/.config/zynkr/pm.json`,
  private, fail-loud on a missing key path (`config: projects.<slug>.tracker_sheet_id unset`).
  A placeholder that survives into a run is a failure condition, not a default.
- **Detect, then map.** `pm-schema.py` gives the version verdict its own exit code (`2` = legacy
  v1) so a legacy sheet **continues** with a warning while a genuine mismatch **stops**. Columns
  are addressed by header name; the letters in the docs are a reading aid.
- **Three copies of the column map on purpose.** SKILL.md Step 2, `dashboard_schema.json`
  `_source_columns_*`, and the renderer's `COLUMNS_V2`. Each is where a different reader looks,
  and each cites the other two — the alternative (one copy, two dangling references) is what
  produced the original 13-vs-14 bug.
- **`consult-status-report` is not in the family.** It sits in category 2 and reads the CRM, not
  the 管控表. It takes the *rule* (`% = done / (total − dropped)`, `取消` = data error) and cites
  the pack; it keeps **no copy**, so it never appears in `check-pm-refs.sh`.
- **The `push:` trigger is the un-obvious half of the CI change.** A push carries no
  `github.base_ref`, so the original diff expression would have produced an **empty** range and
  passed every time — worse than no gate. The job now falls back to `github.event.before`, then
  `HEAD~1`, then the whole tree, and prints the range it chose.

## Out of scope — deliberate non-goals

- **Atlas serves nothing.** Per D1/D7 Atlas is a **register**: pointer nodes only. No Atlas row
  holds pack bytes, and no skill reads Atlas at run time. Files in this repo are the SOT.
- **`zynkr-ops-weekly` (3.19) is untouched** — frozen behind a live launchd plist; not a family
  member, no copy, no Step 0 change, zero diff.
- **`consult-*` skills are not family members** — `consult-status-report` follows and cites the
  rule; no copy, no membership, no sha declaration.
- **The 16 tacit judgements are not encoded** (pack §10) — how fine to cut the WBS, which stage
  deserves a Gate, Gate 2–5 pass criteria, when to Drop vs re-plan. Skills point at the gap; the
  human decides. Encoding them would be inventing policy the PMO has not set.
- **No Doc→seed generator** — that is precisely what D4 gates; adding one would pre-decide it.
- **No retirement of the planning-side committed course-tracker literal** — `pm-sources.md` §2.3
  names it and scopes the fix to the PM family; retiring the SKB-007 copy is a later spec.
- **No writes to the Main Tracker**, no scheduling of either new skill, no third new skill (D6).

## Tasks

- [x] SKB-011.1 Seed authored — pack · sources · sheet-schema · crosswalk · README, all stamped `direction pending D4`
- [x] SKB-011.2 `pm-schema.py` + 5 fixtures + `--self-test` verdict-coverage guard
- [x] SKB-011.3 `check-pm-refs.sh` — identity + declared-sha, `--sync` / `--print-sha`
- [x] SKB-011.4 Three existing family skills carry Step 0 + `知識來源`; `project-status-update` rebuilt (version detect · four buckets · denominator · adapter config · dropped/data_errors payload · renderer)
- [x] SKB-011.5 `project-init` (3.20) and `project-minutes-sync` (3.21) authored
- [x] SKB-011.6 `consult-status-report` follows-and-cites; planning pack cross-axis note re-synced to 8 copies
- [x] SKB-011.7 `qa.yml` — `push:` trigger, range fallback, `shared-refs` job wiring the three guards
- [ ] SKB-011.8 D2: validator per new skill + tree-wide + ingest dry-run + `/code-review` + one real install-and-trigger each
- [ ] SKB-011.9 D3: green CI run on the landing commit **and** a seeded-drift run proven RED (AC-13); evidence in the record
- [ ] SKB-011.10 Close-out: record entry with the AC-by-AC Verification block · spec → Shipped · ATL-040 raised in zynkr-atlas

## Definition-of-Done ladder — where this sits

| Tier | State |
|---|---|
| **D0 — Builds** | **Green locally.** `python3 scripts/pm-schema.py --self-test` → `5 fixture(s) · 0 unexpected`; `bash scripts/check-pm-refs.sh` → OK, seed `1ac2e9a2…`, 5 copies, every SKILL.md declaring `v1 · sha256 e4d74ef4ac4d`; `bash scripts/check-planning-refs.sh` → exit 0 |
| **D1 — Recorded** | **Where this change is now.** Spec + record + tracker follow-ups land in the same commit as the code, trailer `Spec: SKB-011` |
| **D2 — Verified** | **Not yet.** Needs AC-1…AC-11 driven for real: validator per new skill and tree-wide, ingest dry-run showing `✓ 3.20` / `✓ 3.21` with no prune line, the renderer exercised on a payload carrying `dropped` + `data_errors`, one real install-and-trigger of each new skill, `/code-review` before push, evidence pasted AC-by-AC into `docs/CHANGELOG.md` |
| **D3 — Hardened** | **Not yet — this is the bar for this change.** The `shared-refs` job is a **new gate**, and SDD §5.4 says a gate that has never been seen red is not wired. D3 requires: (a) a green run of `qa.yml` on the landing **push** to main, with the log showing a real `diff range:` line — proving the new trigger did not silently no-op; (b) a **seeded-drift branch run proven RED** at `check-pm-refs.sh`, branch then deleted; (c) both run URLs in the record's Verification block and a row added to SDD §6.3's gate ledger with the firing date |

Deliberate non-claims: `~/.config/zynkr/pm.json` is not populated in this change, so no PM-family
run has resolved a real project end-to-end; and neither new skill has written to a live Sheet.

## Verification plan

1. **Local, before push** — the three guards above, then `npx tsx validate-skill.ts` per new
   SKILL.md and tree-wide, then a local `ingest.ts` dry-run (artifacts restored, never
   hand-committed), then `/code-review` on the diff.
2. **`/verify` end-to-end (D2)** — `/project-init` against a scratch folder with a throwaway
   `pm.json`: five templates copied, four sub-folders, 範例列 cleared, six `X.0` rows seeded, the
   `pm.json` snippet printed. `/project-status-update` against a **v2** tracker and, separately,
   a hand-made **legacy v1** copy: confirm the v1 warning fires and the run continues, and that a
   seeded `取消` row lands in `data_errors` rather than in the denominator.
   `/project-minutes-sync` against one 會議記錄 Doc: values-only writes, the diff report,
   nothing written outside the three tabs.
3. **Wiring proof (D3, SDD §5.4)** — push the change, observe `qa.yml` green with both jobs and a
   real diff range; then, on a throwaway branch, flip one byte in a skill's copied pack, push,
   and observe `shared-refs` fail at `check-pm-refs.sh` with `DRIFT`. Delete the branch. Both run
   URLs go into the record, and a `skill-builder / qa.yml shared-refs` row goes into SDD §6.3.

## Doc-sync footprint

Same commit: `docs/CHANGELOG.md` entry (ID + AC-by-AC Verification block) · this spec ·
`docs/pm-shared/README.md`. Local-only `to-do.md` in the main checkout takes the follow-ups
(D2 triggers · the D3 seeded-red run · SDD §6.3 ledger row · retiring the planning-side
course-tracker literal · D4 when it lands). No `CLAUDE.md`, `SKILL_SPEC.md` or `BRAND.md`
change. Commit trailer convention: **`Spec: SKB-011`**.

## Next — the cross-repo follow-on

**ATL-040 — Atlas `pm.*` pointer nodes**, homed in `zynkr-atlas`, is the other half of D1/D7 and
is deliberately **not** in this change. Atlas registers the PM knowledge as `pm.*` **pointer**
nodes — one per seed file plus one per family skill — each carrying the repo path, the
`pack_version`, and the declared sha256, so the control plane can answer 「這條規則住在哪、目前是
哪一版」 without ever serving the bytes. Atlas governs; it runs nothing and stores no copy.

Two constraints for whoever takes it: the id **must be derived fresh** at claim time (grep
`origin/main`'s `docs/specs/` + tracker + CHANGELOG in `zynkr-atlas` — `ATL-040` is this spec's
expectation, not a reservation; ids are claimed by pushing), and per SDD §2.2 a cross-repo change
homes ONE spec in the repo that owns it — Atlas — while this spec is the upstream citation.
