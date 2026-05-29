-- Migration: created_by foreign key consistency
-- Description: Ensure admin-creator columns are FK-constrained to admins(id) with
--   ON DELETE SET NULL so deactivating/removing an admin cannot leave orphaned
--   references. In this codebase the constraints already exist
--   (calendar_events.created_by_admin from 0008, announcements.created_by_admin
--   from 0015); this migration adds them idempotently as a safety net for
--   environments provisioned differently.
-- Date: 2026-05-30

-- calendar_events.created_by_admin -> admins(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'created_by_admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calendar_events_created_by_admin_fkey'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_created_by_admin_fkey
      FOREIGN KEY (created_by_admin) REFERENCES public.admins(id) ON DELETE SET NULL;
  END IF;
END $$;

-- announcements.created_by_admin -> admins(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'created_by_admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'announcements_created_by_admin_fkey'
  ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT announcements_created_by_admin_fkey
      FOREIGN KEY (created_by_admin) REFERENCES public.admins(id) ON DELETE SET NULL;
  END IF;
END $$;
