-- Migration: Daily-schedule flag for calendar events
-- Description: Disambiguates multi-day timed events. With daily_schedule = false
--   (default) a timed event spanning several days is one continuous block
--   (start_date start_time → end_date end_time). With daily_schedule = true the
--   same start/end times repeat as a window on every day in the range
--   (e.g. 08:30–17:30 each day). The time-range check is tightened so daily
--   events still require end_time >= start_time even when multi-day.
-- Date: 2026-06-17

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS daily_schedule BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_time_range_valid;
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_time_range_valid
  CHECK (
    start_time IS NULL
    OR end_time IS NULL
    OR (start_date <> end_date AND daily_schedule = false)
    OR end_time >= start_time
  );

COMMENT ON COLUMN calendar_events.daily_schedule IS
  'When true, a multi-day timed event repeats its start/end window on each day in the range; when false, it is one continuous span.';
