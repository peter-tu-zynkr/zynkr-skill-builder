# SKB-002 — Consult skill batch: 5 gap builds + 8 lift-and-shift forks

- **Status:** Active
- **Size / DoD:** L / D2 (no auth/cron/secret/migration → not D3; L per SDD §2.1 "new
  module/subsystem" — this is a 13-skill product line)
- **Created:** 2026-08-03 · **Repo(s):** zynkr-skill-builder
- **Links:** SKILL_SPEC.md §1/§2/§6 · SKB-001 (open cross-file gap this batch works
  around) · Sheet "[2.3] Consultant Flow × Skill Portfolio Assessment (2026-07-29)"
  (`1Q1o2nYCBJ-uj9hYjcOzua0M4ch_iUMwg_SRdQGvvuyM`) · Lucid "[2.3] Consultant flow"
  page `workflow v2`

## Context

The consulting delivery flow (Lucid workflow v2, 8 phases / 27 steps) assessed at
~41% automated with gaps clustered at formal deliverables (BRD/PRD, UAT guide) and
post-launch loops (adoption tracking, bug ticketing, shadowing admin). This batch
ships the consulting product line: **5 net-new gap skills** on the live-engagement
critical path + **8 consult-\* adaptations** of existing training-*/admin-*/product-*/
content skills (consult-intake naming convention; originals untouched — the training
and ops businesses keep using them). sales-*/operations-*/zynkr-*/seo-* stay generic
by design.

SKB-001 is unshipped, so duplicate-sheetId protection is manual: a local
`npx tsx scripts/ingest.ts "$(pwd)/skills"` dry-run is mandatory before every push
that claims new ids (artifacts restored, never hand-committed).

## sheetId allocation (hard partition; 2.21–2.37 retired band incl. 2.27 — never claim)

| id | skill | kind |
|---|---|---|
| 2.12 | consult-brd-writer | gap P0 |
| 2.13 | consult-shadowing-scheduler | gap P0 |
| 2.14 | consult-uat-writer | gap P1 |
| 2.15 | consult-adoption-reporter | gap P1 |
| 2.16 | consult-bug-ticket | gap P1 |
| 2.17–2.20 | reserved buffer (future agents of the above) | — |
| 2.38 | consult-transcriber | wrapper (training-srt-transcriber + -optimizer) |
| 2.39 | consult-session-notes | fork (project-note-specialist) |
| 2.40 | consult-solution-planning | Case C derivative (product-planning / MrPM-Stanley) |
| 2.41 | consult-flow-design | wrapper (product-flow-design) |
| 2.42 | consult-launch-comms | new body (content-newsletter-draft handoff shape) |
| 2.43 | consult-info-session | fork-lite (guest-lecturer timeline + lecture-recap) |
| 2.44 | consult-status-report | fork (project-status-update, CRM-sourced) |
| 2.45 | consult-governance | new build (admin-governance report-only pattern) |

## Requirements & acceptance criteria

- **AC-0** — When Wave 0 lands, consult-discovery's `synergy` contains real slugs
  (no `"2.11"`/`"2.12"` sheetId strings) and the ingest run is green.
  *Verify:* `validate-skill.ts --tier=all` on consult-discovery shows no synergy WARN;
  green `ingest-skills.yml` run on the push.
- **AC-1** — When Wave 1 lands, consult-brd-writer (BRD + PRD mode) and
  consult-shadowing-scheduler are served by `zynkr.ai/api/skills` +
  `zynkr.ai/s/2.12.md` / `/s/2.13.md`.
  *Verify:* curl both endpoints; green ingest run.
- **AC-2** — When Wave 2 lands, consult-uat-writer / consult-adoption-reporter /
  consult-bug-ticket are served likewise (2.14–2.16), and uat-writer's body names the
  exact PRD sections it parses (the brd-writer contract).
  *Verify:* curl; cross-read the two SKILL.md contracts match.
- **AC-3** — When Wave 3–4 forks land, every fork has: a fresh sheetId per the table,
  a double-quoted/`>-` description, a `## Provenance` section @ source SHA, and
  synergy → its source (one-way); source skills stay byte-identical.
  *Verify:* `git diff --stat` per wave shows only `skills/<new>/**` + `docs/**`;
  ingest green.
- **AC-4** — When the batch completes, all 13 skills appear in `zynkr.ai/api/skills`
  and each `/s/<id>.md` returns 200.
  *Verify:* scripted curl sweep in the record entry.
- **AC-5** — Batch invariants: zero renames/deletions of existing skills; zero edits
  under archived `6.0 tech/skills/`; the only edit to an existing skill file is the
  Wave-0 consult-discovery synergy line; every wave's ingest run green.
  *Verify:* per-wave diff scope + `gh run list` all green.

## Design sketch

- Data: none (skill content only). Surfaces: new `skills/2-sales-consultant/<slug>/`
  folders + docs. Out-of-repo runtime configs (`adoption-config.md`,
  `bug-routing-config.md`) hold client PII/commercials — never committed
  (guest-lecturer-program pattern).
- PRD spec-ID namespace (Peter, 2026-08-03): per-client `<CLIENTSLUG>-NNN`
  (e.g. ACME-001); sequence discovered by scanning the client's `[N]` Drive folder
  for `[PRD]` docs; the Doc header is the registry.
- Adoption telemetry verified 2026-08-03: `crm_ai_usage` has
  `workspace_id`/`user_id`/`feature`/`model`/token+request counts — per-client
  attribution works for platform-workspace clients; skill-only deliveries get a
  資料覆蓋範圍 caveat section, never fabricated numbers.
- Decisions: direct-to-main per wave (PR adds ceremony, not coverage — the one trap
  that matters is invisible to qa.yml) · provenance = body section + the fork registry
  below (no tooling) · originals get NO synergy backlink this batch (2026-08-03:
  blast-radius > benefit; S-sized follow-up) · attribution trio only on
  consult-solution-planning (external upstream); internal lineage stays in body
  `Source:` lines.

### Fork registry (drift dashboard — update on any M+ change to a source)

| fork | source | forked @ | divergence policy |
|---|---|---|---|
| consult-transcriber | training-srt-transcriber + training-srt-optimizer | delegation (no copy) | mechanics live upstream; wrapper only breaks if base CLI contract changes |
| consult-session-notes | project-note-specialist (3.08) | Wave 3 SHA | source frozen; diverges by design (+ledger, +filing) |
| consult-solution-planning | product-planning (5.02, MrPM-Stanley) | Wave 3 SHA | derivative; upstream README changes reviewed opportunistically |
| consult-flow-design | product-flow-design (5.03) | delegation (no copy) | conventions single-sourced upstream |
| consult-launch-comms | content-newsletter-draft (pattern only) | — | pattern borrow, no drift exposure |
| consult-info-session | guest-lecturer-program + training-lecture-recap | Wave 4 SHA | checklist/recap slimmed; diverges by design |
| consult-status-report | project-status-update (3.09) | Wave 4 SHA | renderer script copied; re-sync if upstream renderer changes |
| consult-governance | admin-governance (pattern only) | — | pattern borrow, no drift exposure |

## Out of scope

- P2 roadmap items (tracker lines only): consult comms template Docs pack ·
  consult-intake trigger-on-arrival mode · consult-intake no-go close-out mode ·
  originals synergy backlinks (S) · SKB-001 implementation (its manual dry-run
  workaround is mandated here instead).
- launchd / project-status-update changes — CHECK only (Wave 5 records that the
  Monday weekly job still resolves to the original skill; no edits).

## Tasks

- [x] SKB-002.0 Wave 0: spec Active + consult-discovery synergy fix (canary push —
      ingest run green on 60ea7ba8, 2026-08-03)
- [x] SKB-002.1 Wave 1: consult-brd-writer + consult-shadowing-scheduler (P0)
- [ ] SKB-002.2 Wave 2: consult-uat-writer + consult-adoption-reporter + consult-bug-ticket
- [ ] SKB-002.3 Wave 3: forks A (transcriber, session-notes, solution-planning, flow-design)
- [ ] SKB-002.4 Wave 4: forks B (launch-comms, info-session, status-report, governance)
- [ ] SKB-002.5 Close-out: evidence sweep (AC-4 curl) · launchd check recorded ·
      personally-used installs · spec → Shipped

## Verification plan

Per wave: `validate-skill.ts --tier=all` green per new/changed file → local ingest
dry-run exit 0 (one `✓` per new id; artifacts restored) → push → `ingest-skills.yml`
green → curl `api/skills` + `/s/<id>.md`. D2 install-and-trigger: one real trigger
per personally-used skill; triggers requiring live-engagement artifacts get dated
waivers in the record, closed as engagements exercise them.

## Doc-sync footprint

Per wave, same commit: `docs/CHANGELOG.md` entry + spec task checkbox. Main-checkout
`to-do.md` lines (local-only tracker) added at close-out. No CLAUDE.md/SKILL_SPEC
changes expected.
