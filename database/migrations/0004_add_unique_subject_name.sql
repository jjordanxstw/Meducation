-- Enforce unique subject names (case-insensitive)
-- This allows the API to return granular conflict error codes for duplicate names.

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_name_unique_ci
  ON subjects (LOWER(name));
