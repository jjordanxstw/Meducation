-- Migration: Refresh Tokens and Auth Audit Logs
-- Description: Add refresh token storage and authentication event audit logging
-- Date: 2026-03-13

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum type for type safety (skip if exists)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Refresh tokens table for both students and admins
-- Stores hashed refresh tokens with rotation support
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_type user_role NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{"device": "unknown", "browser": "unknown"}'::jsonb
);

-- Indexes for refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(user_id, user_type) WHERE revoked_at IS NULL;

-- Auth audit logs table for security events
CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    user_type user_role NOT NULL,
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for auth_audit_logs
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_success ON auth_audit_logs(success) WHERE success = false;
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip ON auth_audit_logs(ip_address);

-- Create a view for active sessions (useful for session management UI)
CREATE OR REPLACE VIEW active_sessions AS
SELECT
    rt.id,
    rt.user_id,
    rt.user_type,
    rt.created_at,
    rt.expires_at,
    rt.ip_address,
    rt.device_info->>'device' AS device,
    rt.device_info->>'browser' AS browser,
    rt.created_at AS last_seen,
    CASE
        WHEN rt.user_type = 'student' THEN
            COALESCE(p.email, p.full_name)
        ELSE
            a.username
    END AS display_name
FROM refresh_tokens rt
LEFT JOIN profiles p ON rt.user_id = p.id AND rt.user_type = 'student'
LEFT JOIN admins a ON rt.user_id::uuid = a.id AND rt.user_type = 'admin'
WHERE rt.revoked_at IS NULL
  AND rt.expires_at > NOW()
ORDER BY rt.created_at DESC;

-- Function to clean up expired refresh tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens
    WHERE (expires_at < NOW() - INTERVAL '30 days')
       OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all user sessions
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(target_user_id TEXT, target_user_type user_role)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = target_user_id
      AND user_type = target_user_type
      AND revoked_at IS NULL
      AND expires_at > NOW();

    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke specific session
CREATE OR REPLACE FUNCTION revoke_session(token_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE id = token_id
      AND revoked_at IS NULL;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores hashed refresh tokens for both students and admins with rotation support';
COMMENT ON TABLE auth_audit_logs IS 'Security event logging for authentication events';
COMMENT ON VIEW active_sessions IS 'View of currently active user sessions for session management UI';
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Cleanup function to remove old expired/revoked tokens - run weekly';
COMMENT ON FUNCTION revoke_all_user_sessions(TEXT, user_role) IS 'Revoke all active sessions for a specific user';
COMMENT ON FUNCTION revoke_session(UUID) IS 'Revoke a specific session by token ID';
