-- Migration: rename category slugs + seed legal category
-- Date: 2026-05-24
-- Source: ~/.claude/plans/taxonomy-md-is-the-source-zany-quasar.md
--
-- Aligns the categories table with taxonomy.md (now the canonical source of
-- truth for category names). Three concerns in one migration:
--
--   1. Widen the category_code CHECK constraint from '^[0-8]$' to '^[0-9]$'
--      so the legal category (code 9) can be inserted.
--   2. Upsert the legal row (taxonomy.md § 9). Idempotent — safe to re-run.
--   3. Rename the two drifted slugs to match their taxonomy.md headings:
--        business-consulting → sales-consultant   (taxonomy.md § 2 heading "Sales & Consultant")
--        talent-development  → people-talent      (taxonomy.md § 7 heading "People & Talent")
--      No cascade required on the skills table — skills.category_id is a UUID
--      FK to categories.id, not a string copy of the slug (schema.sql:60,89).
--
-- The frontend at ai-skills-marketplace.html ships a backward-compat shim
-- (CATEGORY_LABELS + CAT_STYLE accept both old and new keys), so applying
-- this migration before pushing the zynkr-skill-builder rename does NOT
-- break the live marketplace.
--
-- Apply: paste this entire file into the Supabase Studio SQL editor and run
-- against the project hosting public.categories. Idempotent.

begin;

-- 1. Widen CHECK constraint so code '9' is permitted.
alter table public.categories
  drop constraint if exists categories_category_code_format_chk;
alter table public.categories
  add constraint categories_category_code_format_chk
  check (category_code ~ '^[0-9]$');

-- 2. Upsert legal category. ON CONFLICT keys on category_code (unique).
insert into public.categories (category_code, slug, display_name, description, sort_order)
values (
  '9',
  'legal',
  'Legal',
  'Ensures Zynkr operates within legal, regulatory, and contractual obligations. Owns risk management, intellectual property, privacy, and external agreements across the business.',
  9
)
on conflict (category_code) do update set
  slug         = excluded.slug,
  display_name = excluded.display_name,
  description  = excluded.description,
  sort_order   = excluded.sort_order;

-- 3. Rename drifted slugs.
update public.categories
   set slug         = 'sales-consultant',
       display_name = 'Sales & Consultant'
 where slug = 'business-consulting';

update public.categories
   set slug         = 'people-talent',
       display_name = 'People & Talent'
 where slug = 'talent-development';

commit;

-- Sanity-check query (run after commit):
--   select category_code, slug, display_name, sort_order
--     from public.categories
--    order by category_code;
