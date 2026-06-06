-- consult-intake :: create one CRM deal from one inbound consult inquiry
-- ---------------------------------------------------------------------------
-- Runs against the Zynkr Supabase project (project_id = uomieoqlkazknjgmfdda)
-- via mcp__supabase__execute_sql. One statement does the whole transform:
--   1. find-or-create the company (by case-insensitive name)
--   2. find-or-create the contact (by case-insensitive email)
--   3. insert the deal — but ONLY if this contact's email has no deal yet
--   4. log the matching 'created' activity (mirrors the CRM's createDeal action)
--
-- It returns the new deal id, or ZERO rows if the lead was de-duped (a deal
-- for that email already existed). Zero rows = skip the folder/doc for this
-- lead too; you already created them on a previous run.
--
-- Substitute the {{...}} placeholders. Escape any single quote in a value by
-- doubling it ('' ), e.g.  O'Brien -> O''Brien.
--
-- Defaults baked in (correct these in the deal later if a lead warrants it):
--   stage='new'  service_tier='advisory'  priority='medium'
--   lead_source='content'  value=NULL  close_date=today+30
-- Owner and pipeline are looked up live so the skill survives id changes.

WITH params AS (
  SELECT
    '{{FIRST_NAME}}'::text          AS first_name,
    '{{EMAIL}}'::text               AS email,
    NULLIF('{{COMPANY}}', '')::text AS company_name,
    '{{DEAL_NAME}}'::text           AS deal_name,
    '{{NOTES}}'::text               AS notes
),
own  AS (SELECT id FROM crm_users      WHERE email = 'peter_tu@zynkr.ai' LIMIT 1),
pipe AS (SELECT id FROM crm_pipelines  ORDER BY is_default DESC NULLS LAST, name LIMIT 1),

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

-- 2. contact: insert only when this email has no contact yet
new_ct AS (
  INSERT INTO crm_contacts
    (first_name, email, company_id, owner_id, lifecycle_stage, deal_status, lead_status)
  SELECT p.first_name, p.email, (SELECT id FROM co_id LIMIT 1), (SELECT id FROM own),
         'lead', 'new', 'content'
  FROM params p
  WHERE NOT EXISTS (SELECT 1 FROM crm_contacts c WHERE lower(c.email) = lower(p.email))
  RETURNING id
),
ct_id AS (
  SELECT id FROM new_ct
  UNION ALL
  SELECT c.id FROM crm_contacts c, params p WHERE lower(c.email) = lower(p.email)
  LIMIT 1
),

-- 3. deal: the de-dup guard lives here so re-runs never double-book a lead
new_deal AS (
  INSERT INTO crm_deals
    (name, pipeline_id, stage, contact_id, company_id, value,
     service_tier, priority, close_date, owner_id, lead_source, notes)
  SELECT p.deal_name, (SELECT id FROM pipe), 'new', (SELECT id FROM ct_id LIMIT 1),
         (SELECT id FROM co_id LIMIT 1), NULL,
         'advisory', 'medium', (CURRENT_DATE + 30), (SELECT id FROM own), 'content', p.notes
  FROM params p
  WHERE NOT EXISTS (
    SELECT 1 FROM crm_deals d JOIN crm_contacts c ON d.contact_id = c.id
    WHERE lower(c.email) = lower(p.email)
  )
  RETURNING id
),

-- 4. activity log (always runs; inserts nothing when the deal was de-duped)
act AS (
  INSERT INTO crm_activities (deal_id, kind, created_by)
  SELECT id, 'created', (SELECT id FROM own) FROM new_deal
  RETURNING deal_id
)
SELECT id AS deal_id FROM new_deal;
