-- Migration: Clean up audit_reports — drop JSONB columns, add count/status columns
-- Description: Remove JSONB blobs replaced by relational tables, add queryable counters

-- Add count columns for fast queries (no need to count rows in related tables)
ALTER TABLE public.audit_reports
  ADD COLUMN IF NOT EXISTS vulnerability_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compromised_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed'));

-- Drop JSONB columns that are now in relational tables
ALTER TABLE public.audit_reports
  DROP COLUMN IF EXISTS vulnerabilities,
  DROP COLUMN IF EXISTS simulation_logs,
  DROP COLUMN IF EXISTS guardrails;

-- Add indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_reports_overall_score ON public.audit_reports(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.audit_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_score ON public.audit_reports(user_id, overall_score DESC);
