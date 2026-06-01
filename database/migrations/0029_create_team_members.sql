-- Migration: Create team_members table + avatar storage bucket
-- Description: People who built the portal, surfaced on the public About Us page
--   and managed via admin CRUD. `is_active` hides a member from the public page
--   without deleting them; `order_index` controls public display order. Avatars
--   are uploaded to the public `team-avatars` Storage bucket and the resulting
--   public URL is stored in `avatar_url`.
-- Date: 2026-06-02

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    email TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    instagram_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the public listing (active members ordered by order_index).
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(order_index);

-- Keep updated_at fresh on edits.
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: authenticated read, admin-only write (mirrors event_types/0026).
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_select_authenticated ON public.team_members;
CREATE POLICY team_members_select_authenticated
ON public.team_members FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS team_members_insert_admin ON public.team_members;
CREATE POLICY team_members_insert_admin
ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS team_members_update_admin ON public.team_members;
CREATE POLICY team_members_update_admin
ON public.team_members FOR UPDATE TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS team_members_delete_admin ON public.team_members;
CREATE POLICY team_members_delete_admin
ON public.team_members FOR DELETE TO authenticated USING (public.is_admin_user());

COMMENT ON TABLE team_members IS 'Portal team members shown on the public About Us page; admin-managed CRUD.';

-- Public bucket for team avatars. The service-api uploads with the service-role
-- key (which bypasses RLS), so only a public-read policy on the objects is
-- needed for the browser to render the images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-avatars', 'team-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS team_avatars_public_read ON storage.objects;
CREATE POLICY team_avatars_public_read
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'team-avatars');
