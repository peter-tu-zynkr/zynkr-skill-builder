# SKB-003 — slide-arch-diagram: FE/BE/DB workflow architecture diagrams

- **Status:** Shipped 2026-08-12
- **Size / DoD:** M / D2 (single skill, no auth/cron/secret/migration; claims one
  sheetId, so the SKB-002 manual dry-run rule applies)
- **Created:** 2026-08-12 · **Repo(s):** zynkr-skill-builder
- **Links:** zynkr-skill-idea issue #116 (proposal record, pre-approved) ·
  SKB-001 (still-open cross-file gap — manual ingest dry-run mandatory) ·
  AI-literacy course doc v2.1 Ch4 (canonical FE/BE/DB model) + Ch5.3 (to-be
  framing) — doc id via runtime-config substitution, not committed here ·
  Reference visual grammar: 活動簡報 `1dK_RGC0…` p11/p12/p15

## Context

The 2026-08-12 AI Sales Workflow Workshop deck needed seven workflow diagrams.
First attempt drew Input/Process/Output as the three lanes and was rejected;
the correct grammar (Peter's canon, Ch4/Ch5.3) is **FE/BE/DB as horizontal
lanes with each workflow's IPO units stitched left→right across them**. The
rebuild also surfaced three render bugs worth institutionalising (lane-border
misalignment from `align-self:center`, emoji verdicts, stray arrow glyphs).
This skill packages the placement method + visual grammar + QA so the next
deck starts from the canon instead of rediscovering it.

Deliberately **HTML/CSS-first (v1)**: the proven `.arch` component for slide
artifacts. A pptxgenjs recipe is deferred to v2 (needs octagon clip-path and
lane-grid equivalents in native shapes — non-trivial fidelity work).

## sheetId allocation

| id | skill | note |
|---|---|---|
| 1.39 | slide-arch-diagram | authored frontmatter claim (Precedence 0 in ingest) |

**Why 1.39, not 1.34**: `generated/id-redirects.json` shows a burned band —
`1.11→1.03` and `1.32→1.02 … 1.38→1.10` are live marketplace redirects left by
an earlier duplicate-ingest incident. Claiming any of them would prune the
redirect and silently repoint historical `/s/<id>.md` URLs to a different
skill (the dry-run proved it: claiming 1.34 printed "pruned 1 stale redirect
for now-live id 1.34"). Per the SKB-002 retired-band precedent (2.21–2.37):
**burned ids are never reclaimed.** First clean id = 1.39.

Separately, 1.32/1.33 also exist as **untracked junk files** in the main
checkout (duplicate re-ingest artifacts of tracked 1.30 seo-publish-article) —
not claimed, not deleted here; cleanup tracked outside this spec.

## Requirements & acceptance criteria

- **AC-1** — SKILL.md + 3 references exist at
  `skills/1-brand-marketing/slide-arch-diagram/`, English-canonical, frontmatter
  sheetId `"1.39"`, no internal identifiers (course-doc pointer is a
  `<your-…>` placeholder per the runtime-config pattern).
  *Verify:* `validate-skill.ts` green on the new skill; grep shows no Drive/doc
  ids in the skill folder.
- **AC-2** — Local ingest dry-run assigns exactly `1.39` to the new skill and
  changes no other skill's id.
  *Verify:* `npx tsx scripts/ingest.ts "$(pwd)/skills"` → `content/skills/1.39.md`
  created with `name: slide-arch-diagram`; `git status` shows no other
  content/skills modifications; artifacts restored before commit.
- **AC-3** — After push to main, the ingest workflow is green and the skill is
  served by the marketplace endpoints.
  *Verify:* green `ingest-skills.yml` run; `curl zynkr.ai/s/1.39.md` returns the
  skill (allow CDN lag).
- **AC-4** — Follow-up `[Skill Change]` issue exists against `slide-visual-selector`
  to route architecture-flavoured process-diagram pages here (relay integration
  is out of scope for this spec).
  *Verify:* issue link recorded below.

## Record

- Proposal: zynkr-skill-idea #116
- Ship commit: (recorded on push)
- 1.27 routing follow-up: (recorded when filed)
