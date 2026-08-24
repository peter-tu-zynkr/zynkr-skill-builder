# SKB-008 — zynkr-ops-weekly: the Chat → Doc weekly operations loop

- **Status:** Built 2026-08-24 · not yet exercised against production
- **Size / DoD:** L / currently **D1** (authored + validated + unit-tested on fixtures).
  L because it introduces **five scheduled triggers**, a new private config, and two
  "prove it fired" gates. D2 requires each acceptance criterion below to be `/verify`-ed
  against the real Doc and space.
- **Created:** 2026-08-24 · **Repo(s):** zynkr-skill-builder (+ an Apps Script bound to the
  weekly ops Doc, which lives outside any repo)
- **Links:** design artifact `營運週報迴路` (claude.ai artifact `b101da6e`) · SKB-006 zynkr-gm
  (reads the same Doc, never writes it) · SKB-001 (manual ingest dry-run rule)

## Context

The team posts a weekly update into a Google Chat space on Monday and discusses operations
from a weekly Google Doc on Thursday. Nothing connected the two. Six findings from reading
both surfaces on 2026-08-24:

1. The Doc records **intent, not progress** — Aug 27 was a near-verbatim copy of Aug 20, with
   the same bootstrap item at "90%" in both weeks.
2. Chat is **person-first**, the Doc is **department-first**; no routing key existed between them.
3. The requested post format **drifted** between 08-17 and 08-24.
4. Metrics slots are **named but empty** — the numbers live in trackers nobody copies across.
5. Thursday's decisions **never return to the space**, so Monday's reports have no baseline.
6. Two of the highest-surface-area owners **had never posted a weekly update**, so several Doc
   sections stay empty regardless of tooling. That is a coverage problem, not a tooling one,
   and no automation here fixes it.

## Decisions

**Routing is read from the Doc, not stored.** Each department heading already carries its
owner's Google Docs **person chip**, keyed by email. The skill keeps no department map; it
parses the chips at run time. Editing the Doc therefore changes routing **and** the recap-mail
recipient list together. This is the single most load-bearing decision in the design.

**Two layers, split by whether judgement is needed.** Apps Script owns *scaffold* (duplicate
next week's section) because it is purely mechanical, must never fail, and its authorisation
does not expire. The skill owns everything requiring interpretation. In the week the skill
breaks entirely, Thursday still has a page.

**The scaffold runs Thursday 18:00, not Wednesday.** Tuesday's roll-up needs a section to write
into; a Wednesday scaffold leaves Tuesday with nowhere to go. Closing this week and opening the
next in one move keeps **exactly one future section open** at any time.

**Copy, never rebuild.** Neither Apps Script nor the Docs REST API can *create* a person chip —
only copy one. "Generate a clean skeleton" would silently destroy the routing table.

**Chat = the working loop, Email = the record.** Nudge/chase/agenda need replies, so they live
where the conversation is. The Thursday recap needs to be searchable, forwardable and reachable
by people outside the space, so it is mail. Mail is a **delivery channel, never a data
dependency**: Monday's nudge reads last week's decisions from the Doc, so a failed send costs an
archive copy rather than breaking the chain.

**`chase` must run after `rollup`.** It cannot know who is missing until the roll-up resolves
who posted. Both sit on Tuesday morning, which the user moved from the original Wednesday.

## Cadence

| When | Mode | Owner | Beat |
|---|---|---|---|
| Mon 09:00 | `nudge` | skill | Template + last week's decisions + Tue 09:00 cut-off |
| Tue 09:00 | `rollup` | skill | Sweep → route by chip → marked block → metric backfill |
| Tue 09:30 | `chase` | skill | Doc owners − posters → name the difference |
| Wed 17:00 | `agenda` | skill | Re-sweep → carry-over · overdue · KPI · ≤3 decisions |
| Thu 18:00 | `decisions` | skill | 3-line post + recap mail + register + **assert send** |
| Thu 18:00 | `scaffoldNextWeek()` | Apps Script | Duplicate section, re-stamp next Thursday |

## sheetId allocation

| id | skill | note |
|---|---|---|
| 3.19 | zynkr-ops-weekly | authored frontmatter claim (Precedence 0 in ingest) |

**Why 3.19.** Content files run 3.01–3.18; `generated/id-redirects.json` additionally burns
**3.17 → 3.09** and **3.18 → 3.06**. Per the SKB-002/SKB-003 precedent, burned ids are never
reclaimed, so the first clean id is the one in neither set: 3.19. The ingest dry-run printed
`✓ 3.19 zynkr-ops-weekly` with **no redirect-prune line**, which is the pass condition.

## Acceptance criteria (D2 gate — none verified yet)

| # | Criterion | How to verify |
|---|---|---|
| A1 | `rollup` writes exactly one `〔自動彙整 W<week>〕` block per routed department | Open the Doc; count stamps in the target section |
| A2 | Re-running `rollup` in the same ISO week writes **nothing** further | Run twice; diff the Doc |
| A3 | No human-authored line is modified | Doc version history shows only inserted blocks |
| A4 | Monday posts land in the **upcoming** Thursday section | Compare stamp week to section date |
| A5 | `chase` names exactly the reporters who did not post | Cross-check against the space |
| A6 | `chase` with full coverage posts **nothing** | Force full coverage; assert silence |
| A7 | Recap mail reaches the Doc's owner-chip addresses | Check recipients against chips |
| A8 | A failed recap send produces a failure notice in the space | Revoke the token, run, observe |
| A9 | `scaffoldNextWeek()` preserves every person chip | Run on a duplicate, inspect chips |
| A10 | A missing next-week section produces a notice from `decisions` | Disable the trigger, run |

## Prove it fired

Two gates, both required by SDD for anything scheduled:

1. **Recap mail** — after `send_gmail_message`, search `in:sent` for the subject just used. Not
   found → post a failure notice to the space. This exists because two consecutive weekly sends
   once failed unnoticed for weeks, since nothing checked.
2. **Scaffold** — `decisions` asserts that next Thursday's section exists. Apps Script success is
   otherwise invisible until someone opens the Doc the following Tuesday and finds nowhere to write.

## Discovered while building (2026-08-24, from the live space)

**Senders arrive in two forms.** The MCP renders a sender as a **display name** for anyone in
the account's personal Contacts and as `users/<21-digit id>` for everyone else — three of six
reporters each way in this space. `chat_ids` therefore accepts both key forms. Four ids were
pinned from message evidence; the remaining three resolve by display name.

**The tagged format is not in use yet.** On 2026-08-24 the posts read `上禮拜進度` … `本週待辦`,
and on 2026-08-17 `這個禮拜我的 focus` — bare lines, no bullets, no `#週報`. A tag-only parser
matches **zero** messages, which would make the first roll-up look like total non-compliance
rather than a format that has not landed. Hence `--accept-untagged`, a transitional flag that
also parses those shapes and stamps each record `format: tagged | legacy`. Retire it once
`legacy` has been zero for two weeks; an optional format is not a format.

**Coverage finding confirmed against real data.** Parsing the real 08-24 window yields four
reporters posting and **two owners missing** — exactly finding 6. No automation changes that.

## Verified against the production Doc (read-only, 2026-08-24)

The Doc exported to 7,384 lines of markdown: **44 dated sections, 503 person chips**. Routing
resolved **all six reporters** from real chips with no configured department map. Three findings
that only real data could surface:

**`#Team update` is item-chipped, not heading-chipped.** Its heading carries no chip; each task
line does (`- [Define KPI](…) [Name](mailto:…)`). It is a shared section, not a
department-owned one. The parser reports it as `unrouted` rather than guessing — and this
exposed a latent bug: the "chip on the wrapped next line" fallback would happily have taken the
first *task's* owner as the section owner. The fallback now refuses list items. Same for
`##Operation BAU & event` and `Claude Code 課程`, which genuinely have no chip.

**The combined Sales heading resolves to the founder's address**, confirming the flagged
mis-chip: the marketing-and-sales owner is someone else, so Sales updates route to the founder
until that one chip changes.

**Carry-over needed two corrections, both invisible on fixtures.** First run flagged 46 of 76
items as stuck, topped by `Website`, `Funnel`, `TOF` — the Doc's own **template rows**, which
repeat weekly by design. Second, loose similarity matching **chained**: it reported
`CPM, CPC, Conversion rate, ROAS ↻35週` for an item present in 5% of sections, because each
week's match drifted to a different item. Fixed by a strict match threshold (identical output to
exact-key matching) plus template detection gated on *both* a large-enough corpus and the line
carrying no status — because in a short document "appears in every section" is exactly what a
genuinely stuck item looks like, and gating on ratio alone hid the fixture's real `↻4週` case.

After both fixes the production top-3 is a real finding worth taking to a Thursday:
**`Newsletter subscription (Drip comms)`, `Newsletter setting (Domain)` and
`Google admin setting`, each `↻25週` since Mar 12, 2026.** That is the "records intent, not
progress" pathology, measured.

## Verified so far

- `validate-skill.ts` on the skill: **0 errors, 0 warnings**.
- `validate-skill.ts` whole tree: no duplicate-sheetId error (the one tree error,
  `content-governance` `paths.absolute_home`, is pre-existing on `origin/main`).
- `ingest.ts` dry-run: ingested 121, skipped 0, **no redirect prune**.
- The four Python scripts unit-tested on hand-built fixtures, including full-width colons,
  prose-instead-of-bullets, thousands separators, re-posts, unmapped senders, untagged chatter,
  headings with no chip, and a four-week carry-over chain (`92% → 90% → 85% → 60%` ⇒ `↻4週`).
- `scaffold.gs` passes `node --check`.
- The parser was additionally run against the **real 08-24 space window** (not just fixtures):
  4 reporters parsed, per-item statuses correct including `Not started`, 2 missing.
- Routing and carry-over run end-to-end against the **real Doc** (read-only; nothing written).

## Not done / deliberately deferred

- **No WRITE has happened.** Reads against the real Doc and space are verified; nothing has
  been written to either, and no message has been posted.
- Apps Script not installed; `installTriggers()` not run. Pasting the file schedules nothing.
- The five cron triggers are not created.
- Private config not populated for every reporter (see the Chat-id gap below).
- **The Sales heading is chipped to the wrong owner** — the founder's chip sits on a section
  owned by the marketing-and-sales lead, so those updates misroute until the chip changes. A Doc
  edit, not a code change, which is the design working as intended.
- Metric backfill covers only metrics present in the configured sheets.
- Writing the tracker's status column stays with `planning-tracker-sync`.
