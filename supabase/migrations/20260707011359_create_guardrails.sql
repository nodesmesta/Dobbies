-- Migration: Create guardrails relational table
-- Description: Each guardrail config has its own row

CREATE TABLE IF NOT EXISTS public.guardrails (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id       TEXT NOT NULL REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  guardrail_type  TEXT NOT NULL,
  label           TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guardrails_report_id ON public.guardrails(report_id);

-- Enable RLS
ALTER TABLE public.guardrails ENABLE ROW LEVEL SECURITY;

-- Users can view guardrails belonging to their own reports
CREATE POLICY "Users can view own guardrails"
  ON public.guardrails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = guardrails.report_id
      AND audit_reports.user_id = auth.uid()
    )
  );

-- Users can insert guardrails into their own reports
CREATE POLICY "Users can insert own guardrails"
  ON public.guardrails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = report_id
      AND audit_reports.user_id = auth.uid()
    )
  );
