-- Migration: Admin-managed calendar event types
-- Description: Replace the hardcoded `event_type` enum with an `event_types`
--   table (admin CRUD, per-type color). calendar_events.type becomes a TEXT FK
--   to event_types(name) with ON UPDATE CASCADE (renaming a type propagates to
--   every event) and ON DELETE RESTRICT (a type that still has events cannot be
--   deleted).
-- Date: 2026-06-01

CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#2f80ed',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed from the previous enum values with their established colors.
INSERT INTO event_types (name, color, sort_order) VALUES
    ('exam', '#ef4444', 1),
    ('lecture', '#2f80ed', 2),
    ('holiday', '#10b981', 3),
    ('event', '#8b5cf6', 4)
ON CONFLICT (name) DO NOTHING;

-- Keep updated_at fresh on rename / recolor.
DROP TRIGGER IF EXISTS update_event_types_updated_at ON event_types;
CREATE TRIGGER update_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Convert calendar_events.type from the enum to TEXT, then bind it to the new
-- table. The cascade makes a type rename rewrite every referencing event; the
-- restrict makes a delete fail while events still reference the type.
ALTER TABLE calendar_events ALTER COLUMN type TYPE TEXT USING type::text;

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_type_fkey;
ALTER TABLE calendar_events
    ADD CONSTRAINT calendar_events_type_fkey
    FOREIGN KEY (type) REFERENCES event_types(name)
    ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- The enum is no longer referenced by any column.
DROP TYPE IF EXISTS event_type;

-- RLS: authenticated read, admin-only write (mirrors announcements/0016).
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_types_select_authenticated ON public.event_types;
CREATE POLICY event_types_select_authenticated
ON public.event_types FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS event_types_insert_admin ON public.event_types;
CREATE POLICY event_types_insert_admin
ON public.event_types FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS event_types_update_admin ON public.event_types;
CREATE POLICY event_types_update_admin
ON public.event_types FOR UPDATE TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS event_types_delete_admin ON public.event_types;
CREATE POLICY event_types_delete_admin
ON public.event_types FOR DELETE TO authenticated USING (public.is_admin_user());

COMMENT ON TABLE event_types IS 'Admin-managed calendar event types with per-type color. calendar_events.type is a FK to event_types(name).';
