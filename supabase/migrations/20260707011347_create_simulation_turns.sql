-- Migration: Create simulation_turns relational table
-- Description: Each simulation turn has its own row with FK to vulnerabilities

CREATE TABLE IF NOT EXISTS public.simulation_turns (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id       TEXT NOT NULL REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  turn_number     INTEGER NOT NULL,
  sender          TEXT NOT NULL CHECK (sender IN ('attacker', 'agent')),
  text            TEXT NOT NULL,
  target_vuln_id  UUID REFERENCES public.vulnerabilities(id) ON DELETE SET NULL,
  compromised     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_turns_report_id ON public.simulation_turns(report_id);
CREATE INDEX IF NOT EXISTS idx_turns_vuln_id ON public.simulation_turns(target_vuln_id);
CREATE INDEX IF NOT EXISTS idx_turns_report_turn ON public.simulation_turns(report_id, turn_number);

-- Enable RLS
ALTER TABLE public.simulation_turns ENABLE ROW LEVEL SECURITY;

-- Users can view turns belonging to their own reports
CREATE POLICY "Users can view own turns"
  ON public.simulation_turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = simulation_turns.report_id
      AND audit_reports.user_id = auth.uid()
    )
  );

-- Users can insert turns into their own reports
CREATE POLICY "Users can insert own turns"
  ON public.simulation_turns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_reports
      WHERE audit_reports.id = report_id
      AND audit_reports.user_id = auth.uid()
    )
  );
