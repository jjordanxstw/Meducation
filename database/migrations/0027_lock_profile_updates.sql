-- Migration: Lock profile updates to admins only
-- Description: Students may no longer update their own profile. Profile fields
--   (avatar_url / student_id / year_level) are populated automatically from the
--   Google sign-in (service-role client, bypasses RLS) and otherwise managed by
--   admins. Drop the self-update policy added in 0016 so authenticated students
--   have no UPDATE path at the database layer.
-- Date: 2026-06-01

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
