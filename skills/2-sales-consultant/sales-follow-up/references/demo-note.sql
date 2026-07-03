-- demo-note.sql — log a completed demo as a `note` activity on an EXISTING deal.
--
-- Why raw SQL: the Zynkr MCP has no create-note tool (only create_task). A demo
-- is not in Gmail, so the sync can't capture it — this note is the only record
-- of the call, and only this skill writes it.
--
-- Fill THREE placeholders with SQL literals (quote text and double any single
-- quote: O'Brien → 'O''Brien'). Everything else — the author (created_by),
-- contact_id, company_id — is resolved LIVE from the deal, so nothing is
-- hardcoded and it can't drift to the wrong workspace.
--
--   {{DEAL_ID}}       the deal uuid, quoted  e.g. '6004b982-7078-4983-8cb8-188ff1ec7432'
--   {{NOTE_SUBJECT}}  e.g. '[DEMO] Zynkr AI 平台 Demo 紀要 — 超哥（7/3）'
--   {{NOTE_BODY}}     the structured recap: 展示內容 · 痛點 · feedback · 方案 · 下一步
--
-- Run via: mcp__supabase__execute_sql(project_id="uomieoqlkazknjgmfdda", query=<this>)

INSERT INTO crm_activities
  (kind, subject, body, deal_id, contact_id, company_id, created_by, metadata, created_at, updated_at)
SELECT
  'note',
  {{NOTE_SUBJECT}},
  {{NOTE_BODY}},
  d.id,
  d.contact_id,
  d.company_id,
  d.owner_id,                                  -- author = deal owner, resolved live
  '{"source":"manual","event":"product_demo"}'::jsonb,
  now(),
  now()
FROM crm_deals d
WHERE d.id = {{DEAL_ID}}
RETURNING id AS note_id, deal_id;
