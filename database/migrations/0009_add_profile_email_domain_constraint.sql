-- Enforce allowed student email domains on profiles.
-- Use NOT VALID to avoid migration failure if legacy invalid rows already exist.
-- New inserts/updates are still checked immediately.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'valid_mahidol_email'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT valid_mahidol_email
      CHECK (
        role = 'admin'
        OR lower(email) LIKE '%@student.mahidol.edu'
        OR lower(email) LIKE '%@student.mahidol.ac.th'
      ) NOT VALID;
  END IF;
END $$;
