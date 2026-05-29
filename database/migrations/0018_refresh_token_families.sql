-- Migration: Refresh token families (theft / reuse detection)
-- Description: Add a family_id to group all rotations originating from a single
--   login event, plus reuse_detected_at to record when reuse was caught. Used by
--   AdminAuthService to invalidate an entire family when a stale token is replayed.
-- Date: 2026-05-30

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS family_id UUID,
  ADD COLUMN IF NOT EXISTS reuse_detected_at TIMESTAMPTZ;

-- Backfill: every pre-existing token becomes its own single-member family so the
-- NOT NULL constraint below holds and legacy tokens keep working until they expire.
UPDATE refresh_tokens
SET family_id = uuid_generate_v4()
WHERE family_id IS NULL;

-- New tokens always receive a family; the service overrides this on rotation so
-- the child inherits its parent's family_id.
ALTER TABLE refresh_tokens ALTER COLUMN family_id SET DEFAULT uuid_generate_v4();
ALTER TABLE refresh_tokens ALTER COLUMN family_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
-- Supports "is there a newer non-revoked sibling in this family?" lookups.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_active
  ON refresh_tokens(family_id, created_at DESC)
  WHERE revoked_at IS NULL;

-- Revoke every token in a family (used on reuse detection).
CREATE OR REPLACE FUNCTION revoke_token_family(target_family_id UUID)
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE refresh_tokens
  SET revoked_at = COALESCE(revoked_at, NOW()),
      reuse_detected_at = NOW()
  WHERE family_id = target_family_id;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN refresh_tokens.family_id IS 'Groups all tokens rotated from a single login event; entire family is revoked on reuse detection.';
COMMENT ON COLUMN refresh_tokens.reuse_detected_at IS 'Set when a previously-rotated token in this family is replayed (token theft signal).';
COMMENT ON FUNCTION revoke_token_family(UUID) IS 'Revoke all refresh tokens sharing a family_id; used when reuse is detected.';
