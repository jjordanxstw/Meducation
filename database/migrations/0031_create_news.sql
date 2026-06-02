-- Migration: Create news + news_categories tables + news cover storage bucket
-- Description: "Hot News" articles surfaced on the student home dashboard and a
--   public detail page, managed via admin CRUD. Articles carry a markdown `body`,
--   an optional cover image (uploaded to the public `news-covers` Storage bucket),
--   an author byline and a `published_at` date. `is_published` hides an article
--   from students without deleting it; `is_featured` flags the home hero card.
--   Categories are admin-managed (name + color), mirroring event_types/0026; news
--   references a category via `category_id` with ON DELETE RESTRICT so a category
--   still in use cannot be deleted.
-- Date: 2026-06-02

-- ---------------------------------------------------------------------------
-- news_categories (admin-managed lookup, mirrors event_types)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#2f80ed',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a few sensible medical-portal categories with distinct colors.
INSERT INTO news_categories (name, color, sort_order) VALUES
    ('Research', '#2f80ed', 1),
    ('Clinical', '#ef4444', 2),
    ('Campus', '#10b981', 3),
    ('Events', '#8b5cf6', 4),
    ('Academic', '#f59e0b', 5)
ON CONFLICT (name) DO NOTHING;

DROP TRIGGER IF EXISTS update_news_categories_updated_at ON news_categories;
CREATE TRIGGER update_news_categories_updated_at
    BEFORE UPDATE ON news_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- news (articles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    cover_image_url TEXT,
    author_name TEXT,
    category_id UUID REFERENCES news_categories(id) ON DELETE RESTRICT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the public listing (published, newest-first, featured hero, filter).
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS: authenticated read, admin-only write (mirrors team_members/0029)
-- ---------------------------------------------------------------------------
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS news_categories_select_authenticated ON public.news_categories;
CREATE POLICY news_categories_select_authenticated
ON public.news_categories FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS news_categories_insert_admin ON public.news_categories;
CREATE POLICY news_categories_insert_admin
ON public.news_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS news_categories_update_admin ON public.news_categories;
CREATE POLICY news_categories_update_admin
ON public.news_categories FOR UPDATE TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS news_categories_delete_admin ON public.news_categories;
CREATE POLICY news_categories_delete_admin
ON public.news_categories FOR DELETE TO authenticated USING (public.is_admin_user());

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS news_select_authenticated ON public.news;
CREATE POLICY news_select_authenticated
ON public.news FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS news_insert_admin ON public.news;
CREATE POLICY news_insert_admin
ON public.news FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS news_update_admin ON public.news;
CREATE POLICY news_update_admin
ON public.news FOR UPDATE TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS news_delete_admin ON public.news;
CREATE POLICY news_delete_admin
ON public.news FOR DELETE TO authenticated USING (public.is_admin_user());

COMMENT ON TABLE news_categories IS 'Admin-managed news categories with per-category color; news.category_id is a FK to news_categories(id).';
COMMENT ON TABLE news IS 'Hot News articles shown on the student home dashboard and public detail page; admin-managed CRUD.';

-- ---------------------------------------------------------------------------
-- Public bucket for news cover images. The service-api uploads with the
-- service-role key (bypasses RLS), so only a public-read policy is needed.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-covers', 'news-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS news_covers_public_read ON storage.objects;
CREATE POLICY news_covers_public_read
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'news-covers');
