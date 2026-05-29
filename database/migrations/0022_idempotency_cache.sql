-- Migration: Idempotency cache
-- Description: Store responses for admin mutating endpoints keyed by an
--   Idempotency-Key header so retried requests replay the original response
--   instead of creating duplicates. TTL ~24h, purged by cleanup function.
-- Date: 2026-05-30

CREATE TABLE IF NOT EXISTS idempotency_cache (
    key TEXT PRIMARY KEY,
    request_hash TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_cache_expires ON idempotency_cache(expires_at);

-- RLS: service-role only (enabled here, explicit deny policies in 0024).
ALTER TABLE idempotency_cache ENABLE ROW LEVEL SECURITY;

-- Purge expired idempotency records.
CREATE OR REPLACE FUNCTION cleanup_idempotency_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE idempotency_cache IS 'Cached responses for idempotent admin mutations, keyed by Idempotency-Key header.';
COMMENT ON COLUMN idempotency_cache.request_hash IS 'Hash of method+path+body; a key reused with a different request is rejected.';
COMMENT ON FUNCTION cleanup_idempotency_cache() IS 'Removes expired idempotency cache rows; run periodically.';
