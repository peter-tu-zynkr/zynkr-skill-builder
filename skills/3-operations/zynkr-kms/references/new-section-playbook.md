# New-Section Playbook — Zynkr platform 知識庫

The KB lives in the Zynkr platform (browsable at `https://platform.zynkr.ai/kb`), organized
as **sections** (the intent taxonomy) holding **fact/qa cards**. You don't create the KB —
the 13 sections already exist (see `intent-taxonomy.md` / `mcp__zynkr__list_kb_sections`).
You only use this playbook when a Peter-approved card has an intent with **no section yet**
(Step 5d of the skill).

## When a new section is justified

- Two or more `other` cards have started looking alike (a real recurring theme), OR
- A resolved thread's intent clearly doesn't fit any existing section, and Peter approved the
  new category in the Step-4 gate (⚠ new-category flag).

Never create a section silently. It changes the routing vocabulary both skills share.

## Creating the section

`mcp__zynkr__create_kb_section` — preview first (no `confirm`), show Peter if anything looks
off, then re-call with `confirm: true`:

```jsonc
{
  "slug": "logistics-overseas",            // kebab-case, unique per workspace — this is the intent tag
  "title": "Overseas Logistics",           // English title
  "title_zh": "海外授課安排",                // zh-TW title
  "description": "What it covers, phrased for routing (one or two sentences).",
  "aliases": ["海外", "出國授課", "overseas", "abroad", "international"],  // bilingual — they aid routing/search
  "icon": "plane",                         // a lucide icon slug; unknown slugs render a generic folder
  "confirm": true
}
```

- `nn` (ordering) auto-assigns to max+1 — omit it.
- The response returns the new section's `id` (uuid) — use it as `section_id` for the card(s)
  that motivated the section (Step 5a/5b).

## After creating

1. Write the approved card(s) into the new section.
2. Add a row for the new section to `references/intent-taxonomy.md` (slug, nn, titles,
   covers, aliases) so it's first-class next time.
3. Mention the new section in your run summary (🆕 New sections created).

> **History note:** before 2026-07-15 the KB was a folder of Google Docs and new sections
> meant creating a doc + registering it in an INDEX doc. That whole mechanism is retired; the
> old folder (`1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6`) is a read-only archive. Everything routes
> through `list_kb_sections` now.
