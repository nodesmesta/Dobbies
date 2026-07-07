-- Migration: Add session_category to simulation_turns
-- Description: Enables per-OWASP-category session grouping in simulation logs

ALTER TABLE public.simulation_turns
ADD COLUMN IF NOT EXISTS session_category TEXT;

-- Index for queries grouping turns by session
CREATE INDEX IF NOT EXISTS idx_simulation_turns_session_category
  ON public.simulation_turns(session_category);
