-- =====================================================
-- Migration: Enable RLS and add starter policies
-- Description: Baseline row-level security for all current public tables
-- =====================================================

-- Helper: admin role check without policy recursion on profiles.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()::text
      AND p.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- =====================================================
-- Enable RLS on all current public tables
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._schema_migrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- profiles: self read/update, admin can read all
-- =====================================================
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

DROP POLICY IF EXISTS profiles_select_admin_all ON public.profiles;
CREATE POLICY profiles_select_admin_all
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- =====================================================
-- subjects: authenticated read, admin write
-- =====================================================
DROP POLICY IF EXISTS subjects_select_authenticated ON public.subjects;
CREATE POLICY subjects_select_authenticated
ON public.subjects
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS subjects_insert_admin ON public.subjects;
CREATE POLICY subjects_insert_admin
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS subjects_update_admin ON public.subjects;
CREATE POLICY subjects_update_admin
ON public.subjects
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS subjects_delete_admin ON public.subjects;
CREATE POLICY subjects_delete_admin
ON public.subjects
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- sections: authenticated read, admin write
-- =====================================================
DROP POLICY IF EXISTS sections_select_authenticated ON public.sections;
CREATE POLICY sections_select_authenticated
ON public.sections
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS sections_insert_admin ON public.sections;
CREATE POLICY sections_insert_admin
ON public.sections
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS sections_update_admin ON public.sections;
CREATE POLICY sections_update_admin
ON public.sections
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS sections_delete_admin ON public.sections;
CREATE POLICY sections_delete_admin
ON public.sections
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- lectures: authenticated read, admin write
-- =====================================================
DROP POLICY IF EXISTS lectures_select_authenticated ON public.lectures;
CREATE POLICY lectures_select_authenticated
ON public.lectures
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS lectures_insert_admin ON public.lectures;
CREATE POLICY lectures_insert_admin
ON public.lectures
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS lectures_update_admin ON public.lectures;
CREATE POLICY lectures_update_admin
ON public.lectures
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS lectures_delete_admin ON public.lectures;
CREATE POLICY lectures_delete_admin
ON public.lectures
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- resources: authenticated read, admin write
-- =====================================================
DROP POLICY IF EXISTS resources_select_authenticated ON public.resources;
CREATE POLICY resources_select_authenticated
ON public.resources
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS resources_insert_admin ON public.resources;
CREATE POLICY resources_insert_admin
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS resources_update_admin ON public.resources;
CREATE POLICY resources_update_admin
ON public.resources
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS resources_delete_admin ON public.resources;
CREATE POLICY resources_delete_admin
ON public.resources
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- announcements: authenticated read, admin write
-- =====================================================
DROP POLICY IF EXISTS announcements_select_authenticated ON public.announcements;
CREATE POLICY announcements_select_authenticated
ON public.announcements
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS announcements_insert_admin ON public.announcements;
CREATE POLICY announcements_insert_admin
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS announcements_update_admin ON public.announcements;
CREATE POLICY announcements_update_admin
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS announcements_delete_admin ON public.announcements;
CREATE POLICY announcements_delete_admin
ON public.announcements
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- calendar_events: authenticated read, owner/admin write
-- =====================================================
DROP POLICY IF EXISTS calendar_events_select_authenticated ON public.calendar_events;
CREATE POLICY calendar_events_select_authenticated
ON public.calendar_events
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS calendar_events_insert_owner_or_admin ON public.calendar_events;
CREATE POLICY calendar_events_insert_owner_or_admin
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user()
  OR created_by = auth.uid()::text
);

DROP POLICY IF EXISTS calendar_events_update_owner_or_admin ON public.calendar_events;
CREATE POLICY calendar_events_update_owner_or_admin
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user()
  OR created_by = auth.uid()::text
)
WITH CHECK (
  public.is_admin_user()
  OR created_by = auth.uid()::text
);

DROP POLICY IF EXISTS calendar_events_delete_owner_or_admin ON public.calendar_events;
CREATE POLICY calendar_events_delete_owner_or_admin
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
  public.is_admin_user()
  OR created_by = auth.uid()::text
);

-- =====================================================
-- audit_logs: admin read-only
-- =====================================================
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- =====================================================
-- Sensitive/internal tables with no client policies:
-- admins, refresh_tokens, auth_audit_logs, _schema_migrations
-- RLS is enabled above; without policies, authenticated/anon are denied.
-- =====================================================
