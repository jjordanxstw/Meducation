-- Migration: Admin last-login metadata
-- Description: Track the IP of the last successful admin login so the next login
--   can be compared against it for suspicious-login alerting (new /24 subnet).
--   admins.last_login_at already exists (0002).
-- Date: 2026-05-30

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(64);

COMMENT ON COLUMN admins.last_login_ip IS 'IP address of the most recent successful login; compared on next login for new-subnet detection.';
