-- =====================================================
-- Add Query Performance Indexes (UAT-first rollout)
-- =====================================================
-- Purpose:
-- 1) Speed up admin resource list filters (lecture_id + is_active + type)
-- 2) Speed up lecture list filters by section and active state
-- 3) Speed up audit log filtering by table/action with created_at ordering
--
-- Notes:
-- - This repository's migration runner wraps SQL in a transaction.
-- - Do not use CREATE INDEX CONCURRENTLY in this migration style.
-- - All statements are idempotent via IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_resources_lecture_active_type
ON resources(lecture_id, is_active, type);

CREATE INDEX IF NOT EXISTS idx_lectures_section_active
ON lectures(section_id, is_active);

CREATE INDEX IF NOT EXISTS idx_audit_table_action_created
ON audit_logs(table_name, action, created_at DESC);

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_audit_table_action_created;
-- DROP INDEX IF EXISTS idx_lectures_section_active;
-- DROP INDEX IF EXISTS idx_resources_lecture_active_type;
