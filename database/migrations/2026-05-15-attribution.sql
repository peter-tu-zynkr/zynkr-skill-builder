-- Migration: add attribution columns to public.skills
-- Date: 2026-05-15
-- Source: SKILL_SPEC.md §6 attribution trio, plan at ~/.claude/plans/floating-watching-kitten.md
--
-- Adds three columns so the sync webhook can persist attribution data emitted
-- by ingest. All three are nullable — only required as a trio at the SKILL.md
-- author-time (validator-enforced in scripts/validate-skill.ts and
-- scripts/ingest.ts). Once applied, sync.js detailToRow() can map record
-- payload fields straight into these columns.
--
-- Apply: paste this entire file into the Supabase Studio SQL editor and run
-- against the project hosting public.skills. Idempotent (IF NOT EXISTS).

alter table public.skills
  add column if not exists upstream_repo text,
  add column if not exists original_source_url text,
  add column if not exists original_author text;

-- No index needed — these columns are surface metadata, not query keys.
-- No backfill — existing rows that lack attribution remain null and that is
-- the correct representation.
