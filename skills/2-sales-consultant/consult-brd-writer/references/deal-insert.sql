-- sales-project-specialist :: turn ONE meeting debrief into a CRM deal + timeline
-- ---------------------------------------------------------------------------
-- Runs against the Zynkr Supabase project (project_id = uomieoqlkazknjgmfdda) via
-- mcp__supabase__execute_sql. One statement does the whole transform:
--   1. resolve the company  — explicit {{COMPANY_ID}} wins, else find-or-create by name
--   2. resolve the contact  — explicit {{CONTACT_ID}} wins, else find-or-create by email
--   3. insert a NEW deal     — ALWAYS (no dedupe; this skill is one-run-per-meeting)
--   4. log the activity timeline — one meeting row, one note row, and one task row
--      per "What's Next" item (duplicate the ('task', …) VALUES row as needed)
-- Returns the new deal id + the number of activities written.
--
-- Owner (Peter Tu) and pipeline (銷售流程) are looked up live so the skill survives
-- id changes. Escape any single quote in a value by doubling it ('' ), e.g.
-- O'Brien -> O''Brien.
--
-- Enums (pass an exact value): deal_stage{new,contacted,qualified,proposal,won,lost}
--   service_tier{workshop,coaching,transformation,advisory,other}
--   deal_priority{low,medium,high}  lead_source{content,workshop,referral,outbound,other}
--   activity_kind{note,email,task,meeting,stage_change,created,call}  task_status{open,done}

WITH params AS (
  SELECT
    NULLIF('{{COMPANY_ID}}', '')::uuid     AS in_company_id,   -- '' if not given
    NULLIF('{{CONTACT_ID}}', '')::uuid     AS in_contact_id,   -- '' if not given
    NULLIF('{{COMPANY_NAME}}', '')::text   AS company_name,    -- used only when no in_company_id
    NULLIF('{{CONTACT_FIRST}}', '')::text  AS contact_first,
    NULLIF('{{CONTACT_LAST}}', '')::text   AS contact_last,
    NULLIF('{{CONTACT_EMAIL}}', '')::text  AS contact_email,   -- used only when no in_contact_id
    NULLIF('{{CONTACT_TITLE}}', '')::text  AS contact_title,
    '{{DEAL_NAME}}'::text                   AS deal_name,
    '{{STAGE}}'::deal_stage                 AS stage,
    '{{SERVICE_TIER}}'::service_tier        AS service_tier,
    '{{PRIORITY}}'::deal_priority           AS priority,
    '{{LEAD_SOURCE}}'::lead_source          AS lead_source,
    NULLIF('{{VALUE}}', '')::numeric        AS value,          -- '' -> NULL
    NULLIF('{{CLOSE_DATE}}', '')::date      AS close_date,     -- '' -> NULL, else YYYY-MM-DD
    '{{NOTES}}'::text                       AS notes
),
own  AS (SELECT id FROM crm_users     WHERE email = 'peter_tu@zynkr.ai' LIMIT 1),
pipe AS (SELECT id FROM crm_pipelines ORDER BY is_default DESC NULLS LAST, name LIMIT 1),

-- 1. company: explicit id wins; else create when a real name has no match yet
new_co AS (
  INSERT INTO crm_companies (name)
  SELECT p.company_name FROM params p
  WHERE p.in_company_id IS NULL AND p.company_name IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM crm_companies c WHERE lower(c.name) = lower(p.company_name))
  RETURNING id
),
co_id AS (
  SELECT in_company_id AS id FROM params WHERE in_company_id IS NOT NULL
  UNION ALL SELECT id FROM new_co
  UNION ALL
  SELECT c.id FROM crm_companies c, params p
   WHERE p.in_company_id IS NULL AND p.company_name IS NOT NULL AND lower(c.name) = lower(p.company_name)
  LIMIT 1
),

-- 2. contact: explicit id wins; else create when this email has no contact yet.
--    Only the always-safe columns are set; lifecycle_stage falls back to its
--    column default ('opportunity') to avoid enum drift.
new_ct AS (
  INSERT INTO crm_contacts (first_name, last_name, email, title, company_id, owner_id)
  SELECT p.contact_first, p.contact_last, p.contact_email, p.contact_title,
         (SELECT id FROM co_id LIMIT 1), (SELECT id FROM own)
  FROM params p
  WHERE p.in_contact_id IS NULL AND p.contact_email IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM crm_contacts c WHERE lower(c.email) = lower(p.contact_email))
  RETURNING id
),
ct_id AS (
  SELECT in_contact_id AS id FROM params WHERE in_contact_id IS NOT NULL
  UNION ALL SELECT id FROM new_ct
  UNION ALL
  SELECT c.id FROM crm_contacts c, params p
   WHERE p.in_contact_id IS NULL AND p.contact_email IS NOT NULL AND lower(c.email) = lower(p.contact_email)
  LIMIT 1
),

-- 3. deal: ALWAYS insert (one run = one meeting = one fresh deal)
new_deal AS (
  INSERT INTO crm_deals
    (name, pipeline_id, stage, contact_id, company_id, value,
     service_tier, priority, close_date, owner_id, lead_source, notes)
  SELECT p.deal_name, (SELECT id FROM pipe), p.stage, (SELECT id FROM ct_id LIMIT 1),
         (SELECT id FROM co_id LIMIT 1), p.value,
         p.service_tier, p.priority, p.close_date, (SELECT id FROM own), p.lead_source, p.notes
  FROM params p
  RETURNING id
),

-- 4. activity timeline: meeting + note + one task per What's Next item.
--    Duplicate the ('task', …) row for each extra task and tune its interval.
acts AS (
  INSERT INTO crm_activities
    (deal_id, contact_id, company_id, kind, subject, body, created_by, task_status, task_due_at, assignee_id)
  SELECT (SELECT id FROM new_deal),
         (SELECT id FROM ct_id LIMIT 1),
         (SELECT id FROM co_id LIMIT 1),
         v.kind::activity_kind, v.subject, v.body,
         (SELECT id FROM own),
         v.task_status::task_status,
         v.due,
         CASE WHEN v.kind = 'task' THEN (SELECT id FROM own) ELSE NULL END
  FROM (VALUES
    ('meeting', '{{MEETING_SUBJECT}}', '{{MEETING_BODY}}', NULL::text, NULL::timestamptz),
    ('note',    '{{NOTE_SUBJECT}}',    '{{NOTE_BODY}}',    NULL,        NULL),
    ('task',    '{{TASK1_SUBJECT}}',   '{{TASK1_BODY}}',   'open',      now() + interval '7 days')
    -- ,('task', '{{TASK2_SUBJECT}}',  '{{TASK2_BODY}}',   'open',      now() + interval '14 days')
  ) AS v(kind, subject, body, task_status, due)
  RETURNING id
)
SELECT (SELECT id FROM new_deal) AS deal_id, (SELECT count(*) FROM acts) AS activities;
