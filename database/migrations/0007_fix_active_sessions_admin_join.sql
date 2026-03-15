-- Migration: Fix active_sessions admin join cast
-- Description: Avoid invalid UUID cast on OAuth student user_id values when querying active_sessions
-- Date: 2026-03-15

CREATE OR REPLACE VIEW active_sessions AS
SELECT
    rt.id,
    rt.user_id,
    rt.user_type,
    rt.created_at,
    rt.expires_at,
    rt.ip_address,
    rt.device_info->>'device' AS device,
    rt.device_info->>'browser' AS browser,
    rt.created_at AS last_seen,
    CASE
        WHEN rt.user_type = 'student' THEN
            COALESCE(p.email, p.full_name)
        ELSE
            a.username
    END AS display_name
FROM refresh_tokens rt
LEFT JOIN profiles p ON rt.user_id = p.id AND rt.user_type = 'student'
LEFT JOIN admins a ON a.id::text = rt.user_id AND rt.user_type = 'admin'
WHERE rt.revoked_at IS NULL
  AND rt.expires_at > NOW()
ORDER BY rt.created_at DESC;

COMMENT ON VIEW active_sessions IS 'View of currently active user sessions for session management UI';