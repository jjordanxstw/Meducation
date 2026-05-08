-- Migration: Security retention cleanup and index hardening
-- Description: Add bounded retention cleanup for auth logs/tokens and improve active-session index selectivity
-- Date: 2026-05-08

-- Improve active session queries by including expires_at in the partial active-token index.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active_expires
ON refresh_tokens(user_id, user_type, expires_at DESC)
WHERE revoked_at IS NULL;

-- Cleanup function for old authentication audit logs.
CREATE OR REPLACE FUNCTION cleanup_old_auth_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Unified cleanup entrypoint for scheduled jobs.
CREATE OR REPLACE FUNCTION cleanup_security_artifacts(
  token_retention_days INTEGER DEFAULT 30,
  auth_audit_retention_days INTEGER DEFAULT 90
)
RETURNS JSONB AS $$
DECLARE
  tokens_deleted INTEGER;
  auth_audit_deleted INTEGER;
BEGIN
  -- Preserve previous token behavior while allowing configurable retention.
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - (token_retention_days || ' days')::INTERVAL
     OR (revoked_at IS NOT NULL AND revoked_at < NOW() - (token_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS tokens_deleted = ROW_COUNT;

  auth_audit_deleted := cleanup_old_auth_audit_logs(auth_audit_retention_days);

  RETURN jsonb_build_object(
    'tokens_deleted', tokens_deleted,
    'auth_audit_deleted', auth_audit_deleted,
    'ran_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_auth_audit_logs(INTEGER)
IS 'Removes old auth audit log rows beyond retention window.';
COMMENT ON FUNCTION cleanup_security_artifacts(INTEGER, INTEGER)
IS 'Unified cleanup for refresh tokens and auth audit logs. Recommended to run daily.';
