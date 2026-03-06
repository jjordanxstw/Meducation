-- =====================================================
-- Medical Learning Portal - Complete Database Schema
-- PostgreSQL / Supabase
-- Version: 1.1.0
-- Author: Senior Fullstack Architect
-- Note: Uses Google OAuth (not Supabase Auth)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Resource types
CREATE TYPE resource_type AS ENUM ('youtube', 'gdrive_video', 'gdrive_pdf', 'external');

-- Calendar event types
CREATE TYPE event_type AS ENUM ('exam', 'lecture', 'holiday', 'event');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- =====================================================
-- TABLE 1: profiles (User Management)
-- =====================================================
-- Stores basic information of students and administrators
-- Uses Google ID as primary key (TEXT, not UUID)

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,  -- Google user ID (payload.sub)
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 6),
    avatar_url TEXT,
    student_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: Only allow Mahidol student emails (both .ac.th and .edu)
    CONSTRAINT valid_mahidol_email CHECK (
        email ~ '^[a-zA-Z0-9._%+-]+@student\.mahidol\.(ac\.th|edu)$'
        OR role = 'admin'
    )
);

-- Index for faster email lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_year_level ON profiles(year_level);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- TABLE 2: subjects (Course Metadata)
-- =====================================================
-- Stores main course information

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 6),
    description TEXT,
    thumbnail_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subject queries
CREATE INDEX idx_subjects_year_level ON subjects(year_level);
CREATE INDEX idx_subjects_order ON subjects(order_index);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- =====================================================
-- TABLE 3: sections (Dynamic Grouping)
-- =====================================================
-- Flexible grouping within subjects
-- Solves the problem: "Subject A has 3 sections, Subject B has 5 sections"

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for section queries
CREATE INDEX idx_sections_subject ON sections(subject_id);
CREATE INDEX idx_sections_order ON sections(subject_id, order_index);

-- =====================================================
-- TABLE 4: lectures (Daily Topics)
-- =====================================================
-- Individual lecture/topic entries within sections

CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lecture_date DATE,
    lecturer_name TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lecture queries
CREATE INDEX idx_lectures_section ON lectures(section_id);
CREATE INDEX idx_lectures_date ON lectures(lecture_date);
CREATE INDEX idx_lectures_order ON lectures(section_id, order_index);

-- =====================================================
-- TABLE 5: resources (The Dynamic Buttons)
-- =====================================================
-- Stores all files/clips - buttons in each lecture are generated from this
-- Each lecture can have different number of resources (dynamic)

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    type resource_type NOT NULL,
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for resource queries
CREATE INDEX idx_resources_lecture ON resources(lecture_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_order ON resources(lecture_id, order_index);

-- =====================================================
-- TABLE 6: calendar_events (Custom Academic Calendar)
-- =====================================================
-- The calendar system that students requested

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type event_type NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    location TEXT,
    color TEXT,
    created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end time is after start time
    CONSTRAINT valid_event_time CHECK (end_time >= start_time)
);

-- Indexes for calendar queries
CREATE INDEX idx_calendar_start ON calendar_events(start_time);
CREATE INDEX idx_calendar_end ON calendar_events(end_time);
CREATE INDEX idx_calendar_type ON calendar_events(type);
CREATE INDEX idx_calendar_subject ON calendar_events(subject_id);
CREATE INDEX idx_calendar_range ON calendar_events(start_time, end_time);

-- =====================================================
-- TABLE 7: audit_logs (Data Integrity & Tracking)
-- =====================================================
-- Records all data modification history

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =====================================================
-- VIEWS
-- =====================================================

-- Full lecture hierarchy view for efficient queries
CREATE VIEW view_lecture_hierarchy AS
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
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at
    BEFORE UPDATE ON lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTE: RLS DISABLED
-- =====================================================
-- Since we use Google OAuth (not Supabase Auth), 
-- RLS policies based on auth.uid() won't work.
-- Security is handled at API level instead.
-- 
-- If you need RLS in the future with service_role key bypass:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service role" ON profiles FOR ALL USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles using Google ID, storing student and admin information';
COMMENT ON TABLE subjects IS 'Academic subjects/courses organized by year level';
COMMENT ON TABLE sections IS 'Dynamic groupings within subjects (e.g., Orientation, Midterm, Blocks)';
COMMENT ON TABLE lectures IS 'Individual lecture topics within sections';
COMMENT ON TABLE resources IS 'Learning materials (slides, videos, PDFs) with dynamic button labels';
COMMENT ON TABLE calendar_events IS 'Academic calendar for exams, lectures, holidays, and events';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for all data modifications';
