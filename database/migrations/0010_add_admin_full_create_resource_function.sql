-- Atomic full-create / full-update resource workflow.
-- Accepts hierarchy identifiers or names and preserves subject -> section -> lecture -> resource relations.

CREATE OR REPLACE FUNCTION admin_full_create_resource(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_subject subjects%ROWTYPE;
  v_section sections%ROWTYPE;
  v_lecture lectures%ROWTYPE;
  v_resource resources%ROWTYPE;

  v_subject_id UUID;
  v_section_id UUID;
  v_lecture_id UUID;
  v_resource_id UUID;

  v_subject_name TEXT;
  v_subject_code TEXT;
  v_section_name TEXT;
  v_lecture_name TEXT;

  v_subject_year_level INTEGER;
  v_label TEXT;
  v_url TEXT;
  v_type resource_type;
  v_file_size BIGINT;
  v_duration_seconds INTEGER;
  v_order_index INTEGER;
  v_is_active BOOLEAN;
BEGIN
  v_subject_id := NULLIF(payload->>'subject_id', '')::UUID;
  v_section_id := NULLIF(payload->>'section_id', '')::UUID;
  v_lecture_id := NULLIF(payload->>'lecture_id', '')::UUID;
  v_resource_id := NULLIF(payload->>'resource_id', '')::UUID;

  v_subject_name := NULLIF(BTRIM(payload->>'subject_name'), '');
  v_subject_code := NULLIF(BTRIM(payload->>'subject_code'), '');
  v_section_name := NULLIF(BTRIM(payload->>'section_name'), '');
  v_lecture_name := NULLIF(BTRIM(payload->>'lecture_name'), '');

  v_subject_year_level := COALESCE(NULLIF(payload->>'subject_year_level', '')::INTEGER, 1);
  v_label := NULLIF(BTRIM(payload->>'label'), '');
  v_url := NULLIF(BTRIM(payload->>'url'), '');
  v_type := (payload->>'type')::resource_type;
  v_file_size := NULLIF(payload->>'file_size_bytes', '')::BIGINT;
  v_duration_seconds := NULLIF(payload->>'duration_seconds', '')::INTEGER;
  v_order_index := COALESCE(NULLIF(payload->>'order_index', '')::INTEGER, 0);
  v_is_active := COALESCE(NULLIF(payload->>'is_active', '')::BOOLEAN, TRUE);

  IF v_label IS NULL THEN
    RAISE EXCEPTION 'label is required';
  END IF;

  IF v_url IS NULL THEN
    RAISE EXCEPTION 'url is required';
  END IF;

  -- Resolve subject.
  IF v_subject_id IS NOT NULL THEN
    SELECT * INTO v_subject FROM subjects WHERE id = v_subject_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid subject_id';
    END IF;
  ELSE
    IF v_subject_name IS NULL THEN
      RAISE EXCEPTION 'subject_id or subject_name is required';
    END IF;

    SELECT *
    INTO v_subject
    FROM subjects
    WHERE lower(name) = lower(v_subject_name)
    LIMIT 1;

    IF NOT FOUND THEN
      IF v_subject_code IS NULL THEN
        v_subject_code := 'SUBJ-' || upper(substr(md5(clock_timestamp()::TEXT || random()::TEXT), 1, 8));
      END IF;

      LOOP
        BEGIN
          INSERT INTO subjects (
            name,
            code,
            year_level,
            order_index,
            is_active
          )
          VALUES (
            v_subject_name,
            v_subject_code,
            v_subject_year_level,
            0,
            TRUE
          )
          RETURNING * INTO v_subject;
          EXIT;
        EXCEPTION WHEN unique_violation THEN
          SELECT *
          INTO v_subject
          FROM subjects
          WHERE lower(name) = lower(v_subject_name)
          LIMIT 1;

          IF FOUND THEN
            EXIT;
          END IF;

          v_subject_code := 'SUBJ-' || upper(substr(md5(clock_timestamp()::TEXT || random()::TEXT), 1, 8));
        END;
      END LOOP;
    END IF;
  END IF;

  -- Resolve section.
  IF v_section_id IS NOT NULL THEN
    SELECT * INTO v_section FROM sections WHERE id = v_section_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid section_id';
    END IF;

    IF v_section.subject_id <> v_subject.id THEN
      RAISE EXCEPTION 'Section does not belong to subject';
    END IF;
  ELSE
    IF v_section_name IS NULL THEN
      RAISE EXCEPTION 'section_id or section_name is required';
    END IF;

    SELECT *
    INTO v_section
    FROM sections
    WHERE subject_id = v_subject.id
      AND lower(name) = lower(v_section_name)
    LIMIT 1;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO sections (
          subject_id,
          name,
          order_index,
          is_active
        )
        VALUES (
          v_subject.id,
          v_section_name,
          0,
          TRUE
        )
        RETURNING * INTO v_section;
      EXCEPTION WHEN unique_violation THEN
        SELECT *
        INTO v_section
        FROM sections
        WHERE subject_id = v_subject.id
          AND lower(name) = lower(v_section_name)
        LIMIT 1;
      END;
    END IF;
  END IF;

  -- Resolve lecture (lecture_name maps to lectures.title).
  IF v_lecture_id IS NOT NULL THEN
    SELECT * INTO v_lecture FROM lectures WHERE id = v_lecture_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid lecture_id';
    END IF;

    IF v_lecture.section_id <> v_section.id THEN
      RAISE EXCEPTION 'Lecture does not belong to section';
    END IF;
  ELSE
    IF v_lecture_name IS NULL THEN
      RAISE EXCEPTION 'lecture_id or lecture_name is required';
    END IF;

    SELECT *
    INTO v_lecture
    FROM lectures
    WHERE section_id = v_section.id
      AND lower(title) = lower(v_lecture_name)
    LIMIT 1;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO lectures (
          section_id,
          title,
          order_index,
          is_active
        )
        VALUES (
          v_section.id,
          v_lecture_name,
          0,
          TRUE
        )
        RETURNING * INTO v_lecture;
      EXCEPTION WHEN unique_violation THEN
        SELECT *
        INTO v_lecture
        FROM lectures
        WHERE section_id = v_section.id
          AND lower(title) = lower(v_lecture_name)
        LIMIT 1;
      END;
    END IF;
  END IF;

  -- Create or update resource.
  IF v_resource_id IS NOT NULL THEN
    UPDATE resources
    SET
      lecture_id = v_lecture.id,
      label = v_label,
      url = v_url,
      type = v_type,
      file_size_bytes = v_file_size,
      duration_seconds = v_duration_seconds,
      order_index = v_order_index,
      is_active = v_is_active,
      updated_at = now()
    WHERE id = v_resource_id
    RETURNING * INTO v_resource;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid resource_id';
    END IF;
  ELSE
    INSERT INTO resources (
      lecture_id,
      label,
      url,
      type,
      file_size_bytes,
      duration_seconds,
      order_index,
      is_active
    )
    VALUES (
      v_lecture.id,
      v_label,
      v_url,
      v_type,
      v_file_size,
      v_duration_seconds,
      v_order_index,
      v_is_active
    )
    RETURNING * INTO v_resource;
  END IF;

  RETURN jsonb_build_object(
    'subject', to_jsonb(v_subject),
    'section', to_jsonb(v_section),
    'lecture', to_jsonb(v_lecture),
    'resource', to_jsonb(v_resource)
  );
END;
$$;
