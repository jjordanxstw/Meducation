-- =====================================================
-- Migration: Create Admins Table
-- Description: Separate authentication system for admin panel
-- =====================================================

-- Create admins table (no constraints, BE handles validation)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE admins IS 'Admin users with username/password authentication for admin panel';
COMMENT ON COLUMN admins.username IS 'Unique username';
COMMENT ON COLUMN admins.password_hash IS 'Bcrypt hash of the password';
COMMENT ON COLUMN admins.is_super_admin IS 'Super admin has all permissions, can create other admins';
COMMENT ON COLUMN admins.password_changed_at IS 'Track when password was last changed for security policies';
