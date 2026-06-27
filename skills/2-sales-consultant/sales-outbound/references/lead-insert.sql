-- sales-outbound · lead-insert.sql
-- Atomic: resolve owner+workspace+pipeline → find-or-create company → find-or-create
-- contact (by email) → new deal → conversation note + follow-up task. Returns the ids
-- and whether the company/contact already existed.
--
-- Run via: mcp__supabase__execute_sql(project_id="uomieoqlkazknjgmfdda", query=<this>)
--
-- PLACEHOLDERS — replace each {{...}} with a SQL LITERAL (quote text, double any
-- single quote, or write NULL). For "no company", set {{COMPANY_NAME}} to ''.
--   {{COMPANY_NAME}}     e.g. '行銷超哥 Chao.Marketing'   ('' = no company)
--   {{COMPANY_DOMAIN}}   e.g. 'ubmg.xyz'                 (or NULL)
--   {{COMPANY_INDUSTRY}} e.g. '品牌策略 / 行銷顧問'        (or NULL)
--   {{COMPANY_COUNTRY}}  e.g. '台灣'                      (or NULL)
--   {{COMPANY_DESC}}     e.g. '個人品牌與行銷策略顧問…'     (or NULL)
--   {{FIRST_NAME}}       e.g. '超哥'                      (or NULL)
--   {{LAST_NAME}}        e.g. NULL
--   {{EMAIL}}            e.g. 'albert321528@gmail.com'    (find-or-create key; keep real)
--   {{TITLE}}            e.g. '品牌策略行銷顧問'           (or NULL)
--   {{CONTACT_LIFECYCLE}} e.g. 'sql'                      (lifecycle_stage enum)
--   {{DEAL_NAME}}        e.g. '超哥 — Zynkr CRM Beta'
--   {{STAGE}}            e.g. 'qualified'                 (deal_stage enum)
--   {{LEAD_SOURCE}}      e.g. 'outbound'                  (lead_source enum)
--   {{PRIORITY}}         e.g. 'medium'                    (deal_priority enum)
--   {{DEAL_NOTES}}       e.g. 'Threads DM 邀請加入 Beta…'  (or NULL)
--   {{NOTE_SUBJECT}}     e.g. 'Threads 初次接觸 — 同意 demo'
--   {{NOTE_BODY}}        e.g. '來源：Threads…\n\n對話重點：…'  (verbatim thread + who they are)
--   {{TASK_SUBJECT}}     e.g. '安排 30 分鐘 Demo + 開通 Beta'
--   {{TASK_BODY}}        e.g. '已擬好邀約草稿，待回覆時段後寄出'  (or NULL)
--   {{TASK_DUE_DAYS}}    e.g. 3
--   {{SOURCE_META}}      e.g. '{"source":"threads","handle":"@chao.marketing"}'  (jsonb literal, or '{}')

WITH peter AS (
  SELECT u.id AS uid,
         (SELECT id FROM crm_pipelines WHERE is_default ORDER BY created_at LIMIT 1) AS pipe
  FROM crm_users u
  WHERE u.email = 'peter_tu@zynkr.ai'
  LIMIT 1
),
existing_company AS (
  SELECT id FROM crm_companies
  WHERE workspace_id = (SELECT uid FROM peter)
    AND lower(name) = lower({{COMPANY_NAME}})
    AND length(trim({{COMPANY_NAME}})) > 0
  LIMIT 1
),
new_company AS (
  INSERT INTO crm_companies (name, domain, industry, country, description, owner_id, workspace_id, lifecycle_stage)
  SELECT {{COMPANY_NAME}}, {{COMPANY_DOMAIN}}, {{COMPANY_INDUSTRY}}, {{COMPANY_COUNTRY}}, {{COMPANY_DESC}},
         (SELECT uid FROM peter), (SELECT uid FROM peter), 'opportunity'::lifecycle_stage
  WHERE NOT EXISTS (SELECT 1 FROM existing_company)
    AND length(trim({{COMPANY_NAME}})) > 0
  RETURNING id
),
company AS (
  SELECT id FROM existing_company
  UNION ALL
  SELECT id FROM new_company
),
existing_contact AS (
  SELECT id FROM crm_contacts
  WHERE workspace_id = (SELECT uid FROM peter)
    AND lower(email) = lower({{EMAIL}})
  LIMIT 1
),
new_contact AS (
  INSERT INTO crm_contacts (first_name, last_name, email, title, company_id, owner_id, workspace_id, lifecycle_stage, last_contacted_at)
  SELECT {{FIRST_NAME}}, {{LAST_NAME}}, {{EMAIL}}, {{TITLE}},
         (SELECT id FROM company LIMIT 1),
         (SELECT uid FROM peter), (SELECT uid FROM peter), {{CONTACT_LIFECYCLE}}::lifecycle_stage, now()
  WHERE NOT EXISTS (SELECT 1 FROM existing_contact)
  RETURNING id
),
contact AS (
  SELECT id FROM existing_contact
  UNION ALL
  SELECT id FROM new_contact
),
ins_deal AS (
  INSERT INTO crm_deals (name, pipeline_id, stage, contact_id, company_id, owner_id, workspace_id,
                         deal_type, lead_source, priority, notes, last_activity_at)
  SELECT {{DEAL_NAME}}, (SELECT pipe FROM peter), {{STAGE}}::deal_stage,
         (SELECT id FROM contact LIMIT 1), (SELECT id FROM company LIMIT 1),
         (SELECT uid FROM peter), (SELECT uid FROM peter),
         'new_business'::deal_type, {{LEAD_SOURCE}}::lead_source, {{PRIORITY}}::deal_priority,
         {{DEAL_NOTES}}, now()
  RETURNING id
),
ins_note AS (
  INSERT INTO crm_activities (kind, subject, body, contact_id, company_id, deal_id, created_by, metadata)
  SELECT 'note'::activity_kind, {{NOTE_SUBJECT}}, {{NOTE_BODY}},
         (SELECT id FROM contact LIMIT 1), (SELECT id FROM company LIMIT 1), (SELECT id FROM ins_deal),
         (SELECT uid FROM peter), {{SOURCE_META}}::jsonb
  RETURNING id
),
ins_task AS (
  INSERT INTO crm_activities (kind, subject, body, contact_id, company_id, deal_id, created_by, assignee_id, task_status, task_due_at)
  SELECT 'task'::activity_kind, {{TASK_SUBJECT}}, {{TASK_BODY}},
         (SELECT id FROM contact LIMIT 1), (SELECT id FROM company LIMIT 1), (SELECT id FROM ins_deal),
         (SELECT uid FROM peter), (SELECT uid FROM peter), 'todo'::task_status,
         now() + ({{TASK_DUE_DAYS}} || ' days')::interval
  RETURNING id
)
SELECT
  (SELECT id FROM company LIMIT 1)                       AS company_id,
  (SELECT id FROM contact LIMIT 1)                       AS contact_id,
  (SELECT id FROM ins_deal)                              AS deal_id,
  (SELECT id FROM ins_note)                              AS note_id,
  (SELECT id FROM ins_task)                              AS task_id,
  EXISTS (SELECT 1 FROM existing_company)                AS company_existed,
  EXISTS (SELECT 1 FROM existing_contact)                AS contact_existed;
