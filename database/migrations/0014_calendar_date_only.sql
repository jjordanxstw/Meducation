-- Migration: Convert calendar_events from time-range to date-only
-- Replaces start_time/end_time (TIMESTAMPTZ) with start_date/end_date (DATE)
-- Removes is_all_day column (all events are now implicitly all-day)

-- Step 1: Add new date columns
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_date DATE;

-- Step 2: Migrate existing data
UPDATE calendar_events
SET start_date = start_time::date,
    end_date = end_time::date
WHERE start_date IS NULL;

-- Step 3: Set start_date NOT NULL
ALTER TABLE calendar_events ALTER COLUMN start_date SET NOT NULL;

-- Step 4: Drop old time range constraint
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_time_range_valid;

-- Step 5: Add new date range constraint
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_date_range_valid
  CHECK (end_date IS NULL OR end_date >= start_date);

-- Step 6: Drop old time-based indexes
DROP INDEX IF EXISTS idx_calendar_events_start_time;
DROP INDEX IF EXISTS idx_calendar_events_subject_start_time;
DROP INDEX IF EXISTS idx_calendar_events_type_start_time;
DROP INDEX IF EXISTS idx_calendar_events_subject_type_start_time;

-- Step 7: Create new date-based indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_start_date ON calendar_events(subject_id, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type_start_date ON calendar_events(type, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_type_start_date ON calendar_events(subject_id, type, start_date);

-- Step 8: Drop is_all_day column
ALTER TABLE calendar_events DROP COLUMN IF EXISTS is_all_day;

-- Step 9: Drop old time columns
ALTER TABLE calendar_events DROP COLUMN IF EXISTS start_time;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS end_time;
