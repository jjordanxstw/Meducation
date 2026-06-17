-- Migration: Create learning_resources table + image storage bucket
-- Description: "Learning Hub" cards surfaced on the student portal. Each card is a
--   curated learning resource with an image, title, description, an author byline
--   and a set of `technologies` tags. Its content is grouped into `categories`
--   (a JSONB array of { name, links: [{ label, url }] }) rendered as an accordion
--   on the public detail page — categories/links are card-owned sub-content,
--   always read/written together, so they live inline as JSONB rather than in
--   normalized child tables. `is_published` hides a card from students without
--   deleting it. Mirrors news/0031 for RLS, the updated_at trigger and the public
--   Storage bucket.
-- Date: 2026-06-17

-- ---------------------------------------------------------------------------
-- learning_resources (cards)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    author_name TEXT,
    technologies TEXT[] NOT NULL DEFAULT '{}',
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the public listing (published, ordered, newest-first).
CREATE INDEX IF NOT EXISTS idx_learning_resources_published ON learning_resources(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_resources_order ON learning_resources(order_index, created_at DESC);

DROP TRIGGER IF EXISTS update_learning_resources_updated_at ON learning_resources;
CREATE TRIGGER update_learning_resources_updated_at
    BEFORE UPDATE ON learning_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS: authenticated read, admin-only write (mirrors news/0031)
-- ---------------------------------------------------------------------------
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learning_resources_select_authenticated ON public.learning_resources;
CREATE POLICY learning_resources_select_authenticated
ON public.learning_resources FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS learning_resources_insert_admin ON public.learning_resources;
CREATE POLICY learning_resources_insert_admin
ON public.learning_resources FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS learning_resources_update_admin ON public.learning_resources;
CREATE POLICY learning_resources_update_admin
ON public.learning_resources FOR UPDATE TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS learning_resources_delete_admin ON public.learning_resources;
CREATE POLICY learning_resources_delete_admin
ON public.learning_resources FOR DELETE TO authenticated USING (public.is_admin_user());

COMMENT ON TABLE learning_resources IS 'Learning Hub cards shown on the student portal; admin-managed CRUD. categories is a JSONB array of { name, links: [{ label, url }] }.';

-- ---------------------------------------------------------------------------
-- Public bucket for learning resource images. The service-api uploads with the
-- service-role key (bypasses RLS), so only a public-read policy is needed.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-resource-images', 'learning-resource-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS learning_resource_images_public_read ON storage.objects;
CREATE POLICY learning_resource_images_public_read
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'learning-resource-images');
