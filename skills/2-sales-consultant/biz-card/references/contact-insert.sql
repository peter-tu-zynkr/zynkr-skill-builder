-- biz-card :: create one CRM contact from one business card
-- ---------------------------------------------------------------------------
-- Runs against the Zynkr Supabase project (project_id = uomieoqlkazknjgmfdda)
-- via mcp__supabase__execute_sql. One statement does the whole transform:
--   1. find-or-create the company (by case-insensitive name) -> company_id
--   2. insert the contact — but ONLY if this email isn't already a contact
-- It mirrors the CRM's createContact server action (app/contacts/actions.ts):
-- same columns, owner = Peter, legal_basis required.
--
-- Returns the new contact id, or ZERO rows if the contact was de-duped (a
-- contact with this email already exists). Zero rows = report "already in CRM".
--
-- Cards with NO email can't be de-duped (there's no stable key), so they always
-- insert — that's intentional; the skill reports them so a dup is never silent.
--
-- NAME: the contacts page renders a contact as last_name + first_name. To show
-- the name exactly as printed on the card, the whole name goes in last_name and
-- first_name is left empty. So {{FULL_NAME}} is the name as printed (the Chinese
-- side if the card is bilingual). Don't split it.
--
-- Substitute the {{...}} placeholders. Pass already-cleaned values: translate the
-- card's "—" sentinel and blanks to an EMPTY string before substituting, and
-- escape any single quote by doubling it ('' ),  e.g.  O'Brien -> O''Brien.
--
-- Defaults baked in (change a default here, not in the SKILL prose):
--   lifecycle_stage = 'lead'      (潛在客戶 — a freshly-met card is top-of-funnel)
--   legal_basis     = 'consent'   (同意 — required by the CRM; the card was handed over)
--   lead_status     = 'other'     (其他 — "met in person / event" has no dedicated enum)
--   deal_status     = NULL        (not a deal yet)
-- Owner is looked up live so the template survives id changes.

WITH params AS (
  SELECT
    NULLIF('{{FULL_NAME}}', '')::text AS full_name,
    NULLIF('{{EMAIL}}',     '')::text AS email,
    NULLIF('{{TITLE}}',     '')::text AS title,
    NULLIF('{{PHONE}}',     '')::text AS phone,
    NULLIF('{{COMPANY}}',   '')::text AS company_name
),
own AS (SELECT id FROM crm_users WHERE email = 'peter_tu@zynkr.ai' LIMIT 1),

-- 1. company: insert only when a real (non-empty) name has no match yet
new_co AS (
  INSERT INTO crm_companies (name)
  SELECT p.company_name FROM params p
  WHERE p.company_name IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM crm_companies c WHERE lower(c.name) = lower(p.company_name))
  RETURNING id
),
co_id AS (
  SELECT id FROM new_co
  UNION ALL
  SELECT c.id FROM crm_companies c, params p
   WHERE p.company_name IS NOT NULL AND lower(c.name) = lower(p.company_name)
  LIMIT 1
),

-- 2. contact: the de-dup guard lives here so re-scanning a card never doubles it.
--    Whole name -> last_name; first_name stays NULL (renders the name as printed).
new_ct AS (
  INSERT INTO crm_contacts
    (last_name, email, title, phone, company_id, owner_id,
     lifecycle_stage, lead_status, legal_basis, deal_status, last_activity_at)
  SELECT p.full_name, p.email, p.title, p.phone,
         (SELECT id FROM co_id LIMIT 1), (SELECT id FROM own),
         'lead', 'other', 'consent', NULL, now()
  FROM params p
  WHERE p.email IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM crm_contacts c
       WHERE c.email IS NOT NULL AND lower(c.email) = lower(p.email)
     )
  RETURNING id
)
SELECT id AS contact_id FROM new_ct;
