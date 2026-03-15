-- Enforce valid time range for calendar events at DB level.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'calendar_events_time_range_valid'
      AND conrelid = 'calendar_events'::regclass
  ) THEN
    ALTER TABLE calendar_events
      ADD CONSTRAINT calendar_events_time_range_valid
      CHECK (end_time > start_time);
  END IF;
END $$;
