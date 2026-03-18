-- =====================================================
-- Add Calendar Query Performance Indexes
-- =====================================================
-- Purpose:
-- 1) Speed up calendar list range queries by start_time
-- 2) Speed up calendar list filters by subject/type + start_time ordering
-- 3) Improve upcoming events endpoint (start_time >= now ORDER BY start_time)
--
-- Notes:
-- - Migration runner executes inside a transaction.
-- - Use IF NOT EXISTS for idempotency.

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time
ON calendar_events(start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_start_time
ON calendar_events(subject_id, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type_start_time
ON calendar_events(type, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_type_start_time
ON calendar_events(subject_id, type, start_time);

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_calendar_events_subject_type_start_time;
-- DROP INDEX IF EXISTS idx_calendar_events_type_start_time;
-- DROP INDEX IF EXISTS idx_calendar_events_subject_start_time;
-- DROP INDEX IF EXISTS idx_calendar_events_start_time;
