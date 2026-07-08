-- Migration: Create vulnerabilities relational table
-- Description: Each vulnerability has its own row — queryable, filterable, indexed

CREATE TABLE IF NOT EXISTS public.vulnerabilities (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id       TEXT NOT NULL REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES public.vulnerability_categories(id),
  title           TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description     TEXT NOT NULL,
  remediation     TEXT,
  file_path       TEXT,
  line_number     INTEGER,
  code_snippet    TEXT,
  root_cause      TEXT,
  attack_path     TEXT,
  impact          TEXT,
  cvss_score      NUMERIC(3,1),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'fixed', 'wontfix')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_vulns_report_id ON public.vulnerabilities(report_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON public.vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_category ON public.vulnerabilities(category_id);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON public.vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_vulns_report_severity ON public.vulnerabilities(report_id, severity);
CREATE INDEX IF NOT EXISTS idx_vulns_created_at ON public.vulnerabilities(created_at DESC);

-- Enable RLS
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;

-- Users can view only vulnerabilities belonging to their own audit reports
CREATE POLICY "Users can view own vulns"
  ON public.vulnerabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = vulnerabilities.report_id
      AND audit_reports.user_id = auth.uid()
    )
  );

-- Users can insert vulns into their own reports
CREATE POLICY "Users can insert own vulns"
  ON public.vulnerabilities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = report_id
      AND audit_reports.user_id = auth.uid()
    )
  );

-- Users can update vulns in their own reports
CREATE POLICY "Users can update own vulns"
  ON public.vulnerabilities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = report_id
      AND audit_reports.user_id = auth.uid()
    )
  );

-- Users can delete vulns in their own reports
CREATE POLICY "Users can delete own vulns"
  ON public.vulnerabilities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = report_id
      AND audit_reports.user_id = auth.uid()
    )
  );
