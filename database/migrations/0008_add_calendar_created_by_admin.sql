-- Migration: Add admin creator reference for calendar events
-- Description: Track calendar event creator as admin user instead of student profile
-- Date: 2026-03-15

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES admins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_created_by_admin ON calendar_events(created_by_admin);

COMMENT ON COLUMN calendar_events.created_by_admin IS 'Admin user who created the calendar event';