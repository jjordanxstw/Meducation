-- Housekeeping: remove the unused student_sessions table and add a single
-- cleanup entrypoint that prunes every time-bounded table in one call.
--
-- 1) student_sessions was created in 0021/0024 but no application code ever reads
--    or writes it — student sessions actually run on refresh_tokens. It only
--    accumulates dead rows, so drop it (its RLS policies/indexes drop with it).
--
-- 2) cleanup_all_expired() bundles the existing cleanup functions so the daily
--    scheduled job can prune refresh_tokens + auth_audit_logs + idempotency_cache
--    with a single RPC. (audit_logs is intentionally immutable / append-only and
--    is deliberately excluded.)

DROP TABLE IF EXISTS public.student_sessions;

CREATE OR REPLACE FUNCTION cleanup_all_expired()
RETURNS JSONB AS $$
DECLARE
  v_security JSONB;
  v_idempotency INTEGER;
BEGIN
  -- refresh_tokens (expired/revoked > retention) + auth_audit_logs (> retention).
  v_security := cleanup_security_artifacts();
  -- expired idempotency cache rows.
  v_idempotency := cleanup_idempotency_cache();

  RETURN jsonb_build_object(
    'security', v_security,
    'idempotency_deleted', v_idempotency,
    'ran_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_all_expired() IS 'Unified periodic cleanup: refresh tokens, auth audit logs and idempotency cache. Run daily.';
