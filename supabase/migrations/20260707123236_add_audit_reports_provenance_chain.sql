-- Migration: Add provenance chain columns to audit_reports
-- Description: Track the origin of audited content (SHA256, commit SHA, ETag, etc.)

ALTER TABLE public.audit_reports
  ADD COLUMN IF NOT EXISTS content_sha256      TEXT,
  ADD COLUMN IF NOT EXISTS commit_sha          TEXT,
  ADD COLUMN IF NOT EXISTS git_etag            TEXT,
  ADD COLUMN IF NOT EXISTS content_bytes       INTEGER,
  ADD COLUMN IF NOT EXISTS source_url          TEXT,
  ADD COLUMN IF NOT EXISTS fetched_from_github BOOLEAN NOT NULL DEFAULT false;

-- Indexes for the common lookup patterns:
--   - "show me all audits of commit X"  → by commit_sha
--   - "audit this exact content, ever"  → by content_sha256
--   - "audits using fetched content"    → by fetched_from_github=true
CREATE INDEX IF NOT EXISTS audit_reports_commit_sha_idx        ON public.audit_reports (commit_sha) WHERE commit_sha IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_reports_content_sha256_idx    ON public.audit_reports (content_sha256);
CREATE INDEX IF NOT EXISTS audit_reports_fetched_from_github_idx ON public.audit_reports (fetched_from_github);

-- Backfill hint for existing rows: they pre-date this migration so the
-- provenance fields will be NULL. That is correct — we cannot retroactively
-- produce ETag/SHA256/URL that were never captured. New audits populate these.
