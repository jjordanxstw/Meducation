-- Atomic cascade soft-delete for a subject.
-- Deleting a subject should hide everything beneath it. This marks the subject and
-- all of its sections/lectures as soft-deleted (deleted_at + is_active=false) and
-- deactivates every resource under it (resources have no deleted_at column, so
-- is_active=false is their "hidden" state) — all in one transaction.
--
-- The subject's pre-delete row is returned as `subject` so the caller can write an
-- audit log entry.

CREATE OR REPLACE FUNCTION admin_soft_delete_subject(p_subject_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_subject subjects%ROWTYPE;
  v_sections_deleted INTEGER := 0;
  v_lectures_deleted INTEGER := 0;
  v_resources_deactivated INTEGER := 0;
BEGIN
  -- Lock + capture the subject; it must exist and not already be soft-deleted.
  SELECT * INTO v_subject FROM subjects WHERE id = p_subject_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid subject_id';
  END IF;

  -- Deactivate resources under the subject (resources have no deleted_at).
  UPDATE resources r SET is_active = FALSE, updated_at = now()
  FROM lectures l, sections s
  WHERE r.lecture_id = l.id
    AND l.section_id = s.id
    AND s.subject_id = p_subject_id
    AND r.is_active = TRUE;
  GET DIAGNOSTICS v_resources_deactivated = ROW_COUNT;

  -- Soft-delete lectures under the subject.
  UPDATE lectures l SET deleted_at = now(), is_active = FALSE
  FROM sections s
  WHERE l.section_id = s.id
    AND s.subject_id = p_subject_id
    AND l.deleted_at IS NULL;
  GET DIAGNOSTICS v_lectures_deleted = ROW_COUNT;

  -- Soft-delete sections under the subject.
  UPDATE sections SET deleted_at = now(), is_active = FALSE
  WHERE subject_id = p_subject_id
    AND deleted_at IS NULL;
  GET DIAGNOSTICS v_sections_deleted = ROW_COUNT;

  -- Soft-delete the subject itself.
  UPDATE subjects SET deleted_at = now(), is_active = FALSE WHERE id = p_subject_id;

  RETURN jsonb_build_object(
    'subject', to_jsonb(v_subject),
    'sections_deleted', v_sections_deleted,
    'lectures_deleted', v_lectures_deleted,
    'resources_deactivated', v_resources_deactivated
  );
END;
$$;
