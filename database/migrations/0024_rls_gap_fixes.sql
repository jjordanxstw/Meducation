-- Migration: RLS gap fixes
-- Description: Make "zero client access" explicit for sensitive/internal tables
--   with deny policies (rather than relying on the absence of permissive ones),
--   and harden audit_logs integrity (service-role-only writes + immutability
--   trigger). The Supabase service role bypasses RLS, so application writes via
--   the service-role client continue to work.
-- Date: 2026-05-30

-- =====================================================
-- Explicit DENY for client roles on internal tables.
-- RLS is already enabled on these (0016 / 0021 / 0022).
-- A permissive ALL policy evaluating to FALSE keeps the
-- intent explicit and self-documenting.
-- =====================================================
DO $$
DECLARE
  tbl TEXT;
  internal_tables TEXT[] := ARRAY[
    'admins',
    'refresh_tokens',
    'auth_audit_logs',
    'student_sessions',
    'idempotency_cache',
    '_schema_migrations'
  ];
BEGIN
  FOREACH tbl IN ARRAY internal_tables LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_deny_all', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);',
      tbl || '_deny_all', tbl
    );
  END LOOP;
END $$;

-- =====================================================
-- audit_logs integrity (1.5)
--   * SELECT: admins only (kept from 0016).
--   * INSERT: no authenticated/anon policy -> only the service role can write.
--   * UPDATE/DELETE: explicitly denied for client roles AND blocked at the
--     trigger level for everyone (including the service role).
-- =====================================================
DROP POLICY IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE POLICY audit_logs_no_update
ON public.audit_logs
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE POLICY audit_logs_no_delete
ON public.audit_logs
FOR DELETE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS audit_logs_no_insert_client ON public.audit_logs;
CREATE POLICY audit_logs_no_insert_client
ON public.audit_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- Belt-and-suspenders: stamp created_at on insert and forbid any mutation,
-- even from the service role / table owner.
CREATE OR REPLACE FUNCTION enforce_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = NOW();
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_set_created_at ON public.audit_logs;
CREATE TRIGGER audit_logs_set_created_at
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_log_immutability();

DROP TRIGGER IF EXISTS audit_logs_block_mutation ON public.audit_logs;
CREATE TRIGGER audit_logs_block_mutation
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_log_immutability();

COMMENT ON FUNCTION enforce_audit_log_immutability() IS 'Stamps created_at on INSERT and rejects UPDATE/DELETE so audit_logs is append-only.';
