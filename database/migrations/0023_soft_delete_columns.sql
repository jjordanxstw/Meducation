-- Migration: Soft delete columns for subjects / sections / lectures
-- Description: Replace destructive CASCADE deletes with soft delete. is_active
--   already exists on all three tables (0001); add deleted_at, refresh the
--   lecture-hierarchy view, and make student-facing RLS reads hide soft-deleted
--   rows (admins still see them).
-- Date: 2026-05-30

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes so the common "not deleted" filter stays cheap.
CREATE INDEX IF NOT EXISTS idx_subjects_not_deleted ON subjects(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sections_not_deleted ON sections(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lectures_not_deleted ON lectures(id) WHERE deleted_at IS NULL;

-- Refresh the hierarchy view to exclude soft-deleted rows.
CREATE OR REPLACE VIEW view_lecture_hierarchy AS
SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    s.code AS subject_code,
    s.year_level,
    sec.id AS section_id,
    sec.name AS section_name,
    sec.order_index AS section_order,
    l.id AS lecture_id,
    l.title AS lecture_title,
    l.lecture_date,
    l.order_index AS lecture_order,
    r.id AS resource_id,
    r.label AS resource_label,
    r.url AS resource_url,
    r.type AS resource_type,
    r.order_index AS resource_order
FROM subjects s
LEFT JOIN sections sec ON sec.subject_id = s.id AND sec.is_active = TRUE AND sec.deleted_at IS NULL
LEFT JOIN lectures l ON l.section_id = sec.id AND l.is_active = TRUE AND l.deleted_at IS NULL
LEFT JOIN resources r ON r.lecture_id = l.id AND r.is_active = TRUE
WHERE s.is_active = TRUE AND s.deleted_at IS NULL
ORDER BY s.order_index, sec.order_index, l.order_index, r.order_index;

-- Tighten student-facing SELECT policies: students never see soft-deleted rows,
-- admins still can (for restore / audit).
DROP POLICY IF EXISTS subjects_select_authenticated ON public.subjects;
CREATE POLICY subjects_select_authenticated
ON public.subjects
FOR SELECT
TO authenticated
USING (deleted_at IS NULL OR public.is_admin_user());

DROP POLICY IF EXISTS sections_select_authenticated ON public.sections;
CREATE POLICY sections_select_authenticated
ON public.sections
FOR SELECT
TO authenticated
USING (deleted_at IS NULL OR public.is_admin_user());

DROP POLICY IF EXISTS lectures_select_authenticated ON public.lectures;
CREATE POLICY lectures_select_authenticated
ON public.lectures
FOR SELECT
TO authenticated
USING (deleted_at IS NULL OR public.is_admin_user());

COMMENT ON COLUMN subjects.deleted_at IS 'Soft-delete timestamp; NULL = active. Preserves child data instead of CASCADE delete.';
COMMENT ON COLUMN sections.deleted_at IS 'Soft-delete timestamp; NULL = active.';
COMMENT ON COLUMN lectures.deleted_at IS 'Soft-delete timestamp; NULL = active.';
