# KB Doc Template — `Zynkr Support KB`

This is the skeleton used **only when the KB Doc doesn't exist yet**. Pass the body below as
the `content` of `mcp__google-workspace__create_doc(title="Zynkr Support KB", content=...)`,
then move it into the KB folder with `update_drive_file(add_parents=...)`.

## How the anchors work

Each section ends with an anchor line `<!-- ▼APPEND:<intent>▼ -->`. To add an entry, run
`find_and_replace_doc` with `find_text` = that anchor and `replace_text` = `<your entry>` +
the same anchor (so it stays at the bottom of the section for next time). The single
`<!-- ▼NEW-SECTIONS▼ -->` at the very end is where brand-new sections get inserted.

The **`## Core Facts`** section sits first and holds canonical `### FACT:<id>` blocks (pricing,
policy…) via its own `<!-- ▼APPEND:core-facts▼ -->` anchor. Q&A entries below **cite** these
facts (`Cites: FACT:<id>`) instead of restating numbers — see `entry-schema.md`.

> These anchor lines are intentionally visible plain text in the Doc — they're harmless
> markers and they make appends index-free. Don't delete them.

## Template body (everything between the rules)

---

```
Zynkr Support KB

Auto-curated by the zynkr-kms skill. This is the single source of truth that
support-reply-drafter reads to draft replies. Each entry is one resolved Q&A.
Do not hand-edit the ▼ anchor lines — the skill uses them to append/update.

Owner: Peter Tu (peter_tu@zynkr.ai)
Conventions: canonical numbers live once in Core Facts · Q&A entries cite facts, don't restate them
· zh-TW default, bilingual keywords · supersede stale facts rather than duplicating.

========================================================================

## Core Facts
> Canonical facts = the single source of truth. Q&A entries cite these by ID (Cites:) instead of restating them, so updating a fact here updates every answer that depends on it.

<!-- ▼APPEND:core-facts▼ -->

========================================================================

## Pricing & Quoting

<!-- ▼APPEND:pricing-quoting▼ -->

========================================================================

## Course Content & Curriculum

<!-- ▼APPEND:course-content▼ -->

========================================================================

## Scheduling & Logistics

<!-- ▼APPEND:scheduling-logistics▼ -->

========================================================================

## Team Training & Enterprise

<!-- ▼APPEND:team-training-enterprise▼ -->

========================================================================

## Technical How-To

<!-- ▼APPEND:technical-howto▼ -->

========================================================================

## Access & Account

<!-- ▼APPEND:access-account▼ -->

========================================================================

## Refunds & Policy

<!-- ▼APPEND:refund-policy▼ -->

========================================================================

## Other

<!-- ▼APPEND:other▼ -->

========================================================================

<!-- ▼NEW-SECTIONS▼ -->
```

---

## Section ↔ intent map (keep in sync with `intent-taxonomy.md`)

| Section title | anchor intent tag |
|---|---|
| Core Facts | `core-facts` (holds `FACT:<id>` blocks, not Q&A) |
| Pricing & Quoting | `pricing-quoting` |
| Course Content & Curriculum | `course-content` |
| Scheduling & Logistics | `scheduling-logistics` |
| Team Training & Enterprise | `team-training-enterprise` |
| Technical How-To | `technical-howto` |
| Access & Account | `access-account` |
| Refunds & Policy | `refund-policy` |
| Other | `other` |
