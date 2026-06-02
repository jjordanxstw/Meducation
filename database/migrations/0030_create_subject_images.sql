-- Migration: Create subject-images storage bucket
-- Description: Public bucket for subject cover images. The subjects table already
--   has a `thumbnail_url` column (0001_initial_schema.sql); this only adds the
--   Storage bucket the admin uploads to. The service-api uploads with the
--   service-role key (which bypasses RLS), so only a public-read policy on the
--   objects is needed for the browser to render the images.
-- Date: 2026-06-02

INSERT INTO storage.buckets (id, name, public)
VALUES ('subject-images', 'subject-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS subject_images_public_read ON storage.objects;
CREATE POLICY subject_images_public_read
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'subject-images');
