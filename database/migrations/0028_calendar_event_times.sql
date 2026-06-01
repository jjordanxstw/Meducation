-- Migration: Optional time-of-day for calendar events
-- Description: Re-introduce time on calendar events as two nullable TIME columns
--   (events stay date-first). NULL times = "all-day"; existing rows are left
--   all-day. The check guards single-day timed events so the end isn't before
--   the start (multi-day events apply the times to their respective days).
-- Date: 2026-06-01

ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_time TIME;

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_time_range_valid;
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_time_range_valid
  CHECK (
    start_time IS NULL
    OR end_time IS NULL
    OR start_date <> end_date
    OR end_time >= start_time
  );

COMMENT ON COLUMN calendar_events.start_time IS 'Optional start time-of-day; NULL = all-day event.';
COMMENT ON COLUMN calendar_events.end_time IS 'Optional end time-of-day; NULL = open-ended/all-day.';
