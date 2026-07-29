-- Migration: Remove soft delete entirely
-- Description: Reverses 0023. DELETE now means the row is gone. The deleted_at
--   columns on subjects/sections/lectures are purged and dropped, the objects
--   that depend on them (RLS policies, view_lecture_hierarchy, partial indexes)
--   are rewritten first, admin_soft_delete_subject is retired in favour of a
--   plain DELETE in the service, and admin_save_subject_tree is rewritten to
--   hard-delete at every level.
--
--   Child cleanup is handled by the FKs that were already in place since 0001:
--     sections.subject_id  -> subjects(id)  ON DELETE CASCADE   (0001:85)
--     lectures.section_id  -> sections(id)  ON DELETE CASCADE   (0001:103)
--     resources.lecture_id -> lectures(id)  ON DELETE CASCADE   (0001:124)
--   Known side effect, intentional: calendar_events.subject_id is ON DELETE
--   SET NULL (0001:151), so events on a deleted subject survive un-linked.
--
--   is_active is NOT touched — it stays the publish/hide toggle it always was.
--
-- Date: 2026-07-29

-- =====================================================
-- 1. Purge every soft-deleted row.
--    Top-down, so each cascade absorbs everything beneath it. This is the same
--    purge as database/scripts/purge-soft-deleted.sql; whichever runs first
--    wins and the other finds nothing.
-- =====================================================
DELETE FROM subjects WHERE deleted_at IS NOT NULL;
DELETE FROM sections WHERE deleted_at IS NOT NULL;
DELETE FROM lectures WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 2. Drop the deleted_at reference out of the student-facing SELECT policies.
--    Postgres refuses to drop a column a policy depends on, so this must come
--    before step 7. Restores the pre-0023 form from 0016:69-74, 101-106, 133-138.
-- =====================================================
DROP POLICY IF EXISTS subjects_select_authenticated ON public.subjects;
CREATE POLICY subjects_select_authenticated
ON public.subjects
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS sections_select_authenticated ON public.sections;
CREATE POLICY sections_select_authenticated
ON public.sections
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS lectures_select_authenticated ON public.lectures;
CREATE POLICY lectures_select_authenticated
ON public.lectures
FOR SELECT
TO authenticated
USING (TRUE);

-- =====================================================
-- 3. Rebuild the hierarchy view without the deleted_at predicates (same output
--    columns as 0023:18-41, so CREATE OR REPLACE is legal). is_active stays.
-- =====================================================
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
LEFT JOIN sections sec ON sec.subject_id = s.id AND sec.is_active = TRUE
LEFT JOIN lectures l ON l.section_id = sec.id AND l.is_active = TRUE
LEFT JOIN resources r ON r.lecture_id = l.id AND r.is_active = TRUE
WHERE s.is_active = TRUE
ORDER BY s.order_index, sec.order_index, l.order_index, r.order_index;

-- =====================================================
-- 4. Retire the cascade soft-delete RPC. SubjectsService.delete() now issues a
--    plain DELETE and lets the FK cascade do the work.
-- =====================================================
DROP FUNCTION IF EXISTS admin_soft_delete_subject(UUID);

-- =====================================================
-- 5. Rewrite the unified tree save for hard delete.
--
--    Replaces 0034. Diff semantics per level (delete-first, then upsert):
--      * Items present with a non-null id -> UPDATE.
--      * Items present without an id      -> INSERT. A duplicate name is now a
--                                            genuine conflict and propagates as
--                                            23505; there is no soft-deleted row
--                                            left to squat the name slot, so the
--                                            "resurrect on unique violation"
--                                            branches from 0034 are gone.
--      * Existing rows absent from payload -> DELETE. One statement per level;
--                                            the FK cascade removes descendants.
--
--    Cascade row counts are invisible to GET DIAGNOSTICS, so descendant totals
--    are counted with SELECT before each delete to keep the returned JSON honest.
--
--    order_index at every level is derived from array position in the payload
--    (the client never sends order_index), so move up/down persists for free.
-- =====================================================
CREATE OR REPLACE FUNCTION admin_save_subject_tree(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_subject_id UUID;
  v_subject subjects%ROWTYPE;
  v_subject_obj JSONB;

  v_section JSONB;
  v_lecture JSONB;
  v_resource JSONB;

  v_section_id UUID;
  v_lecture_id UUID;
  v_resource_id UUID;
  v_new_section_id UUID;
  v_new_lecture_id UUID;

  v_kept_section_ids UUID[];
  v_kept_lecture_ids UUID[];
  v_kept_resource_ids UUID[];

  v_section_idx INTEGER := 0;
  v_lecture_idx INTEGER := 0;
  v_resource_idx INTEGER := 0;

  v_name TEXT;
  v_title TEXT;
  v_label TEXT;
  v_url TEXT;
  v_type resource_type;

  v_tmp INTEGER;
  v_sections_upserted INTEGER := 0;
  v_lectures_upserted INTEGER := 0;
  v_resources_upserted INTEGER := 0;
  v_sections_deleted INTEGER := 0;
  v_lectures_deleted INTEGER := 0;
  v_resources_deleted INTEGER := 0;
BEGIN
  v_subject_id := NULLIF(payload->>'subject_id', '')::UUID;
  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'subject_id is required';
  END IF;

  -- Lock the subject row; it must exist.
  SELECT * INTO v_subject FROM subjects WHERE id = v_subject_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid subject_id';
  END IF;

  -- Update subject scalar fields when provided (keeps the whole save atomic).
  v_subject_obj := payload->'subject';
  IF v_subject_obj IS NOT NULL AND jsonb_typeof(v_subject_obj) = 'object' THEN
    UPDATE subjects SET
      code = COALESCE(NULLIF(BTRIM(v_subject_obj->>'code'), ''), code),
      name = COALESCE(NULLIF(BTRIM(v_subject_obj->>'name'), ''), name),
      year_level = COALESCE(NULLIF(v_subject_obj->>'year_level', '')::INTEGER, year_level),
      description = CASE WHEN v_subject_obj ? 'description'
                        THEN NULLIF(BTRIM(v_subject_obj->>'description'), '') ELSE description END,
      thumbnail_url = CASE WHEN v_subject_obj ? 'thumbnail_url'
                        THEN NULLIF(BTRIM(v_subject_obj->>'thumbnail_url'), '') ELSE thumbnail_url END,
      order_index = COALESCE(NULLIF(v_subject_obj->>'order_index', '')::INTEGER, order_index),
      is_active = COALESCE(NULLIF(v_subject_obj->>'is_active', '')::BOOLEAN, is_active),
      updated_at = now()
    WHERE id = v_subject_id;
  END IF;

  -- ============================== SECTIONS ==============================
  SELECT COALESCE(array_agg((s->>'id')::UUID), ARRAY[]::UUID[])
  INTO v_kept_section_ids
  FROM jsonb_array_elements(COALESCE(payload->'sections', '[]'::jsonb)) s
  WHERE NULLIF(s->>'id', '') IS NOT NULL;

  -- Count what the cascade is about to take with the removed sections.
  SELECT count(*) INTO v_tmp
  FROM lectures l
  JOIN sections sec ON sec.id = l.section_id
  WHERE sec.subject_id = v_subject_id
    AND NOT (sec.id = ANY(v_kept_section_ids));
  v_lectures_deleted := v_lectures_deleted + v_tmp;

  SELECT count(*) INTO v_tmp
  FROM resources r
  JOIN lectures l ON l.id = r.lecture_id
  JOIN sections sec ON sec.id = l.section_id
  WHERE sec.subject_id = v_subject_id
    AND NOT (sec.id = ANY(v_kept_section_ids));
  v_resources_deleted := v_resources_deleted + v_tmp;

  -- Remove the sections absent from the payload; lectures and resources under
  -- them go with the cascade.
  DELETE FROM sections
  WHERE subject_id = v_subject_id
    AND NOT (id = ANY(v_kept_section_ids));
  GET DIAGNOSTICS v_tmp = ROW_COUNT; v_sections_deleted := v_sections_deleted + v_tmp;

  v_section_idx := 0;
  FOR v_section IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'sections', '[]'::jsonb))
  LOOP
    v_section_id := NULLIF(v_section->>'id', '')::UUID;
    v_name := NULLIF(BTRIM(v_section->>'name'), '');
    IF v_name IS NULL THEN
      RAISE EXCEPTION 'section name is required';
    END IF;

    IF v_section_id IS NOT NULL THEN
      UPDATE sections SET
        name = v_name,
        description = NULLIF(BTRIM(v_section->>'description'), ''),
        order_index = v_section_idx,
        is_active = COALESCE(NULLIF(v_section->>'is_active', '')::BOOLEAN, TRUE),
        updated_at = now()
      WHERE id = v_section_id AND subject_id = v_subject_id
      RETURNING id INTO v_new_section_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid section_id %', v_section_id;
      END IF;
    ELSE
      INSERT INTO sections (subject_id, name, description, order_index, is_active)
      VALUES (
        v_subject_id, v_name, NULLIF(BTRIM(v_section->>'description'), ''), v_section_idx,
        COALESCE(NULLIF(v_section->>'is_active', '')::BOOLEAN, TRUE)
      )
      RETURNING id INTO v_new_section_id;
    END IF;
    v_sections_upserted := v_sections_upserted + 1;

    -- ============================ LECTURES ============================
    SELECT COALESCE(array_agg((l->>'id')::UUID), ARRAY[]::UUID[])
    INTO v_kept_lecture_ids
    FROM jsonb_array_elements(COALESCE(v_section->'lectures', '[]'::jsonb)) l
    WHERE NULLIF(l->>'id', '') IS NOT NULL;

    SELECT count(*) INTO v_tmp
    FROM resources r
    JOIN lectures l ON l.id = r.lecture_id
    WHERE l.section_id = v_new_section_id
      AND NOT (l.id = ANY(v_kept_lecture_ids));
    v_resources_deleted := v_resources_deleted + v_tmp;

    DELETE FROM lectures
    WHERE section_id = v_new_section_id
      AND NOT (id = ANY(v_kept_lecture_ids));
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_lectures_deleted := v_lectures_deleted + v_tmp;

    v_lecture_idx := 0;
    FOR v_lecture IN SELECT * FROM jsonb_array_elements(COALESCE(v_section->'lectures', '[]'::jsonb))
    LOOP
      v_lecture_id := NULLIF(v_lecture->>'id', '')::UUID;
      v_title := NULLIF(BTRIM(v_lecture->>'title'), '');
      IF v_title IS NULL THEN
        RAISE EXCEPTION 'lecture title is required';
      END IF;

      IF v_lecture_id IS NOT NULL THEN
        UPDATE lectures SET
          title = v_title,
          description = NULLIF(BTRIM(v_lecture->>'description'), ''),
          lecture_date = NULLIF(v_lecture->>'lecture_date', '')::DATE,
          lecturer_name = NULLIF(BTRIM(v_lecture->>'lecturer_name'), ''),
          order_index = v_lecture_idx,
          is_active = COALESCE(NULLIF(v_lecture->>'is_active', '')::BOOLEAN, TRUE),
          updated_at = now()
        WHERE id = v_lecture_id AND section_id = v_new_section_id
        RETURNING id INTO v_new_lecture_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Invalid lecture_id %', v_lecture_id;
        END IF;
      ELSE
        INSERT INTO lectures (section_id, title, description, lecture_date, lecturer_name, order_index, is_active)
        VALUES (
          v_new_section_id, v_title, NULLIF(BTRIM(v_lecture->>'description'), ''),
          NULLIF(v_lecture->>'lecture_date', '')::DATE, NULLIF(BTRIM(v_lecture->>'lecturer_name'), ''),
          v_lecture_idx, COALESCE(NULLIF(v_lecture->>'is_active', '')::BOOLEAN, TRUE)
        )
        RETURNING id INTO v_new_lecture_id;
      END IF;
      v_lectures_upserted := v_lectures_upserted + 1;

      -- ========================== RESOURCES ==========================
      SELECT COALESCE(array_agg((r->>'id')::UUID), ARRAY[]::UUID[])
      INTO v_kept_resource_ids
      FROM jsonb_array_elements(COALESCE(v_lecture->'resources', '[]'::jsonb)) r
      WHERE NULLIF(r->>'id', '') IS NOT NULL;

      DELETE FROM resources
      WHERE lecture_id = v_new_lecture_id
        AND NOT (id = ANY(v_kept_resource_ids));
      GET DIAGNOSTICS v_tmp = ROW_COUNT; v_resources_deleted := v_resources_deleted + v_tmp;

      v_resource_idx := 0;
      FOR v_resource IN SELECT * FROM jsonb_array_elements(COALESCE(v_lecture->'resources', '[]'::jsonb))
      LOOP
        v_resource_id := NULLIF(v_resource->>'id', '')::UUID;
        v_label := NULLIF(BTRIM(v_resource->>'label'), '');
        v_url := NULLIF(BTRIM(v_resource->>'url'), '');
        IF v_label IS NULL THEN
          RAISE EXCEPTION 'resource label is required';
        END IF;
        IF v_url IS NULL THEN
          RAISE EXCEPTION 'resource url is required';
        END IF;
        v_type := (v_resource->>'type')::resource_type;

        IF v_resource_id IS NOT NULL THEN
          UPDATE resources SET
            label = v_label,
            url = v_url,
            type = v_type,
            file_size_bytes = NULLIF(v_resource->>'file_size_bytes', '')::BIGINT,
            duration_seconds = NULLIF(v_resource->>'duration_seconds', '')::INTEGER,
            order_index = v_resource_idx,
            is_active = COALESCE(NULLIF(v_resource->>'is_active', '')::BOOLEAN, TRUE),
            updated_at = now()
          WHERE id = v_resource_id AND lecture_id = v_new_lecture_id;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid resource_id %', v_resource_id;
          END IF;
        ELSE
          INSERT INTO resources (lecture_id, label, url, type, file_size_bytes, duration_seconds, order_index, is_active)
          VALUES (
            v_new_lecture_id, v_label, v_url, v_type,
            NULLIF(v_resource->>'file_size_bytes', '')::BIGINT,
            NULLIF(v_resource->>'duration_seconds', '')::INTEGER,
            v_resource_idx, COALESCE(NULLIF(v_resource->>'is_active', '')::BOOLEAN, TRUE)
          );
        END IF;
        v_resources_upserted := v_resources_upserted + 1;
        v_resource_idx := v_resource_idx + 1;
      END LOOP;

      v_lecture_idx := v_lecture_idx + 1;
    END LOOP;

    v_section_idx := v_section_idx + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'subject_id', v_subject_id,
    'sections_upserted', v_sections_upserted,
    'lectures_upserted', v_lectures_upserted,
    'resources_upserted', v_resources_upserted,
    'sections_deleted', v_sections_deleted,
    'lectures_deleted', v_lectures_deleted,
    'resources_deleted', v_resources_deleted
  );
END;
$$;

-- =====================================================
-- 6. Drop the partial indexes that exist only to serve the soft-delete filter.
--    (They would drop with the column anyway; explicit is clearer.)
-- =====================================================
DROP INDEX IF EXISTS idx_subjects_not_deleted;
DROP INDEX IF EXISTS idx_sections_not_deleted;
DROP INDEX IF EXISTS idx_lectures_not_deleted;

-- =====================================================
-- 7. Drop the columns.
-- =====================================================
ALTER TABLE subjects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sections DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE lectures DROP COLUMN IF EXISTS deleted_at;
