-- Migration: Admin password history
-- Description: Store the last N bcrypt hashes per admin so password changes can
--   reject reuse of recent passwords (enforced in the change-password DTO/service).
-- Date: 2026-05-30

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS password_history JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN admins.password_history IS 'Array of the most recent bcrypt password hashes (newest first), capped at 3 by the application, to prevent reuse.';
