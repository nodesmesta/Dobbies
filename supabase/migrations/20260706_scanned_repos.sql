-- Store scanned repos and their files
CREATE TABLE IF NOT EXISTS scanned_repos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  repo_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, repo_url)
);

-- Enable RLS
ALTER TABLE scanned_repos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scanned repos
CREATE POLICY "Users can view own scanned repos"
  ON scanned_repos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scanned repos"
  ON scanned_repos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scanned repos"
  ON scanned_repos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scanned repos"
  ON scanned_repos FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_scanned_repos_user_id ON scanned_repos(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_repos_repo_url ON scanned_repos(user_id, repo_url);
