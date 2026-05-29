-- Migration: Student sessions
-- Description: Per-session metadata for student logins (device/IP/last-seen) so
--   sessions can be listed, capped (STUDENT_MAX_ACTIVE_SESSIONS) and revoked.
-- Date: 2026-05-30

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS student_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_profile ON student_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions(token_hash);
-- Active-session counting / listing for a profile.
CREATE INDEX IF NOT EXISTS idx_student_sessions_active
  ON student_sessions(profile_id, expires_at DESC)
  WHERE revoked_at IS NULL;

-- RLS: enabled with no client policies — only the service role (which bypasses
-- RLS) may read or write these rows. Explicit deny policies are added in 0024.
ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE student_sessions IS 'Active student session metadata (hashed JWT, device, IP, last-seen) for session management and concurrency limits.';
COMMENT ON COLUMN student_sessions.token_hash IS 'SHA-256 hash of the issued student access JWT.';
COMMENT ON COLUMN student_sessions.last_seen_at IS 'Debounced activity timestamp (updated at most every ~5 minutes by the guard).';
