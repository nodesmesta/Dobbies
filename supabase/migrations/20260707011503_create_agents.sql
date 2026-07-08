-- Migration: Create agents normalized table
-- Description: Each agent profile has its own row, FK from audit_reports

CREATE TABLE IF NOT EXISTS public.agents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  repo_url    TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, repo_url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Users can view their own agents
CREATE POLICY "Users can view own agents"
  ON public.agents FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own agents
CREATE POLICY "Users can insert own agents"
  ON public.agents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own agents
CREATE POLICY "Users can update own agents"
  ON public.agents FOR UPDATE
  USING (user_id = auth.uid());

-- Add agent_id FK to audit_reports
ALTER TABLE public.audit_reports
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_agent_id ON public.audit_reports(agent_id);
