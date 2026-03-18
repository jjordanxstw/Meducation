-- =====================================================
-- Add audit_logs.user_email for dashboard/audit queries
-- =====================================================
-- Reason:
-- - service-api writes and reads audit_logs.user_email
-- - older schemas created audit_logs without this column
-- - missing column triggers PostgreSQL 42703 and breaks statistics overview

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_user_email
ON audit_logs(user_email);

-- Backfill best-effort from profiles for historical rows
UPDATE audit_logs AS al
SET user_email = p.email
FROM profiles AS p
WHERE al.user_email IS NULL
  AND al.user_id = p.id;

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_audit_user_email;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_email;
