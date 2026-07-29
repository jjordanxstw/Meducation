-- ============================================================================
-- One-off purge of every soft-deleted row (subjects / sections / lectures).
--
-- Run this in the Supabase SQL editor. It is the standalone twin of the purge
-- embedded at the top of migration 0037_remove_soft_delete.sql — running either
-- one is enough; running both is harmless (the second finds nothing).
--
-- !! IRREVERSIBLE. Take a snapshot / pg_dump first. !!
--
-- Schema facts that make this safe to run top-down:
--   * sections.subject_id  -> subjects(id)  ON DELETE CASCADE   (0001:85)
--   * lectures.section_id  -> sections(id)  ON DELETE CASCADE   (0001:103)
--   * resources.lecture_id -> lectures(id)  ON DELETE CASCADE   (0001:124)
--     ...so deleting a subject clears its whole tree in one statement.
--   * calendar_events.subject_id -> subjects(id) ON DELETE SET NULL (0001:151)
--     ...so calendar events pointing at a purged subject SURVIVE but lose their
--     subject link. That is expected — Part A counts them so there are no
--     surprises.
--   * audit_logs.record_id has no FK, so the audit trail of these deletions is
--     preserved (the table is append-only by trigger, 0024:82-90).
--
-- Deliberately NOT touched: resources that a past subject soft-delete only
-- flipped to is_active = FALSE (admin_soft_delete_subject, 0035:27-33) while
-- their lecture stayed live. is_active is a legitimate "hidden by an admin"
-- flag and there is no way to tell the two causes apart after the fact, so
-- those rows are left alone rather than guessed at. This is intentional, not
-- an oversight.
-- ============================================================================


-- ============================================================================
-- PART A — DRY RUN (read-only). Run this first and read the numbers.
-- ============================================================================

SELECT 'subjects to delete' AS what,
       count(*) AS rows
FROM subjects
WHERE deleted_at IS NOT NULL

UNION ALL
SELECT 'sections to delete (incl. cascade from subjects)',
       count(*)
FROM sections sec
LEFT JOIN subjects s ON s.id = sec.subject_id
WHERE sec.deleted_at IS NOT NULL
   OR s.deleted_at IS NOT NULL

UNION ALL
SELECT 'lectures to delete (incl. cascade)',
       count(*)
FROM lectures l
JOIN sections sec ON sec.id = l.section_id
LEFT JOIN subjects s ON s.id = sec.subject_id
WHERE l.deleted_at IS NOT NULL
   OR sec.deleted_at IS NOT NULL
   OR s.deleted_at IS NOT NULL

UNION ALL
SELECT 'resources to delete (cascade only)',
       count(*)
FROM resources r
JOIN lectures l ON l.id = r.lecture_id
JOIN sections sec ON sec.id = l.section_id
LEFT JOIN subjects s ON s.id = sec.subject_id
WHERE l.deleted_at IS NOT NULL
   OR sec.deleted_at IS NOT NULL
   OR s.deleted_at IS NOT NULL

UNION ALL
SELECT 'calendar_events that will have subject_id set to NULL',
       count(*)
FROM calendar_events ce
JOIN subjects s ON s.id = ce.subject_id
WHERE s.deleted_at IS NOT NULL

UNION ALL
SELECT 'resources left hidden (is_active=false, live lecture) — NOT touched',
       count(*)
FROM resources r
JOIN lectures l ON l.id = r.lecture_id
JOIN sections sec ON sec.id = l.section_id
JOIN subjects s ON s.id = sec.subject_id
WHERE r.is_active = FALSE
  AND l.deleted_at IS NULL
  AND sec.deleted_at IS NULL
  AND s.deleted_at IS NULL;


-- ============================================================================
-- PART B — THE PURGE. Run only after reviewing Part A.
-- Single transaction: either every row goes or none does.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_events_unlinked INTEGER;
  v_subjects INTEGER;
  v_sections INTEGER;
  v_lectures INTEGER;
BEGIN
  -- Count the SET NULL side effect before it happens (afterwards it is
  -- indistinguishable from events that never had a subject).
  SELECT count(*) INTO v_events_unlinked
  FROM calendar_events ce
  JOIN subjects s ON s.id = ce.subject_id
  WHERE s.deleted_at IS NOT NULL;

  -- Top-down: each delete's cascade absorbs everything beneath it.
  DELETE FROM subjects WHERE deleted_at IS NOT NULL;
  GET DIAGNOSTICS v_subjects = ROW_COUNT;

  -- Soft-deleted sections that hung under a still-live subject.
  DELETE FROM sections WHERE deleted_at IS NOT NULL;
  GET DIAGNOSTICS v_sections = ROW_COUNT;

  -- Soft-deleted lectures that hung under a still-live section.
  DELETE FROM lectures WHERE deleted_at IS NOT NULL;
  GET DIAGNOSTICS v_lectures = ROW_COUNT;

  RAISE NOTICE 'purged % subject(s), % section(s), % lecture(s); % calendar event(s) un-linked. Descendant sections/lectures/resources were removed by ON DELETE CASCADE and are not counted here.',
    v_subjects, v_sections, v_lectures, v_events_unlinked;
END $$;

COMMIT;


-- ============================================================================
-- PART C — VERIFY. Every count must be 0.
-- ============================================================================

SELECT 'subjects'  AS table_name, count(*) AS remaining FROM subjects WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'sections',  count(*) FROM sections WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'lectures',  count(*) FROM lectures WHERE deleted_at IS NOT NULL;
