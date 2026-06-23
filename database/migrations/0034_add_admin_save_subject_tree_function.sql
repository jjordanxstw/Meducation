-- Atomic "save the whole subject tree" workflow for the admin unified editor.
-- Accepts a subject + its full nested sections -> lectures -> resources as JSONB and
-- reconciles the database to match the payload in a single transaction.
--
-- Diff semantics per level (delete-first, then upsert):
--   * Items present with a non-null id  -> UPDATE (and un-delete / resurrect).
--   * Items present without an id        -> INSERT (resurrect a soft-deleted same-name
--                                           sibling on unique conflict, since the unique
--                                           indexes from 0005 are NOT partial and a
--                                           soft-deleted row still occupies its name slot).
--   * Existing rows absent from payload  -> sections/lectures SOFT-delete (deleted_at +
--                                           is_active=false), resources HARD-delete
--                                           (resources have no deleted_at column).
--
-- order_index at every level is derived from array position in the payload (the client
-- never sends order_index here), so move up/down in the UI persists ordering for free.

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

  -- Lock the subject row; it must exist and not be soft-deleted.
  SELECT * INTO v_subject FROM subjects WHERE id = v_subject_id AND deleted_at IS NULL FOR UPDATE;
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

  -- Hard-delete resources under sections being removed.
  DELETE FROM resources r
  USING lectures l, sections sec
  WHERE r.lecture_id = l.id
    AND l.section_id = sec.id
    AND sec.subject_id = v_subject_id
    AND sec.deleted_at IS NULL
    AND NOT (sec.id = ANY(v_kept_section_ids));
  GET DIAGNOSTICS v_tmp = ROW_COUNT; v_resources_deleted := v_resources_deleted + v_tmp;

  -- Soft-delete lectures under sections being removed.
  UPDATE lectures l SET deleted_at = now(), is_active = FALSE
  FROM sections sec
  WHERE l.section_id = sec.id
    AND sec.subject_id = v_subject_id
    AND sec.deleted_at IS NULL
    AND l.deleted_at IS NULL
    AND NOT (sec.id = ANY(v_kept_section_ids));
  GET DIAGNOSTICS v_tmp = ROW_COUNT; v_lectures_deleted := v_lectures_deleted + v_tmp;

  -- Soft-delete the removed sections themselves.
  UPDATE sections SET deleted_at = now(), is_active = FALSE
  WHERE subject_id = v_subject_id
    AND deleted_at IS NULL
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
        deleted_at = NULL,
        updated_at = now()
      WHERE id = v_section_id AND subject_id = v_subject_id
      RETURNING id INTO v_new_section_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid section_id %', v_section_id;
      END IF;
    ELSE
      BEGIN
        INSERT INTO sections (subject_id, name, description, order_index, is_active)
        VALUES (
          v_subject_id, v_name, NULLIF(BTRIM(v_section->>'description'), ''), v_section_idx,
          COALESCE(NULLIF(v_section->>'is_active', '')::BOOLEAN, TRUE)
        )
        RETURNING id INTO v_new_section_id;
      EXCEPTION WHEN unique_violation THEN
        -- Resurrect a soft-deleted section that still holds this name slot.
        UPDATE sections SET
          description = NULLIF(BTRIM(v_section->>'description'), ''),
          order_index = v_section_idx,
          is_active = COALESCE(NULLIF(v_section->>'is_active', '')::BOOLEAN, TRUE),
          deleted_at = NULL,
          updated_at = now()
        WHERE subject_id = v_subject_id AND lower(name) = lower(v_name) AND deleted_at IS NOT NULL
        RETURNING id INTO v_new_section_id;
        IF NOT FOUND THEN
          RAISE; -- genuine duplicate against an active section
        END IF;
      END;
    END IF;
    v_sections_upserted := v_sections_upserted + 1;

    -- ============================ LECTURES ============================
    SELECT COALESCE(array_agg((l->>'id')::UUID), ARRAY[]::UUID[])
    INTO v_kept_lecture_ids
    FROM jsonb_array_elements(COALESCE(v_section->'lectures', '[]'::jsonb)) l
    WHERE NULLIF(l->>'id', '') IS NOT NULL;

    DELETE FROM resources r
    USING lectures l
    WHERE r.lecture_id = l.id
      AND l.section_id = v_new_section_id
      AND l.deleted_at IS NULL
      AND NOT (l.id = ANY(v_kept_lecture_ids));
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_resources_deleted := v_resources_deleted + v_tmp;

    UPDATE lectures SET deleted_at = now(), is_active = FALSE
    WHERE section_id = v_new_section_id
      AND deleted_at IS NULL
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
          deleted_at = NULL,
          updated_at = now()
        WHERE id = v_lecture_id AND section_id = v_new_section_id
        RETURNING id INTO v_new_lecture_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Invalid lecture_id %', v_lecture_id;
        END IF;
      ELSE
        BEGIN
          INSERT INTO lectures (section_id, title, description, lecture_date, lecturer_name, order_index, is_active)
          VALUES (
            v_new_section_id, v_title, NULLIF(BTRIM(v_lecture->>'description'), ''),
            NULLIF(v_lecture->>'lecture_date', '')::DATE, NULLIF(BTRIM(v_lecture->>'lecturer_name'), ''),
            v_lecture_idx, COALESCE(NULLIF(v_lecture->>'is_active', '')::BOOLEAN, TRUE)
          )
          RETURNING id INTO v_new_lecture_id;
        EXCEPTION WHEN unique_violation THEN
          UPDATE lectures SET
            description = NULLIF(BTRIM(v_lecture->>'description'), ''),
            lecture_date = NULLIF(v_lecture->>'lecture_date', '')::DATE,
            lecturer_name = NULLIF(BTRIM(v_lecture->>'lecturer_name'), ''),
            order_index = v_lecture_idx,
            is_active = COALESCE(NULLIF(v_lecture->>'is_active', '')::BOOLEAN, TRUE),
            deleted_at = NULL,
            updated_at = now()
          WHERE section_id = v_new_section_id AND lower(title) = lower(v_title) AND deleted_at IS NOT NULL
          RETURNING id INTO v_new_lecture_id;
          IF NOT FOUND THEN
            RAISE;
          END IF;
        END;
      END IF;
      v_lectures_upserted := v_lectures_upserted + 1;

      -- ========================== RESOURCES ==========================
      SELECT COALESCE(array_agg((r->>'id')::UUID), ARRAY[]::UUID[])
      INTO v_kept_resource_ids
      FROM jsonb_array_elements(COALESCE(v_lecture->'resources', '[]'::jsonb)) r
      WHERE NULLIF(r->>'id', '') IS NOT NULL;

      -- Resources have no soft-delete column; remove the absent ones outright.
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
