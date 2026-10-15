/**
 * Admin Entity
 * Represents an admin user in the admins table
 */

export interface Admin {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Admin without sensitive data (password_hash)
 */
export interface AdminWithoutSensitiveInfo extends Omit<Admin, 'password_hash'> {
  // Password hash is intentionally excluded
}

/**
 * Admin response for API
 */
export interface AdminResponse {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at?: string;
}

/**
 * Sanitize admin data for response
 */
export function sanitizeAdmin(admin: Admin): AdminResponse {
  return {
    id: admin.id,
    username: admin.username,
    full_name: admin.full_name,
    email: admin.email ?? undefined,
    is_active: admin.is_active,
    is_super_admin: admin.is_super_admin,
    last_login_at: admin.last_login_at ?? undefined,
  };
}

/**
 * Admin with credentials (for internal use only)
 */
export interface AdminWithCredentials extends Admin {
  password_hash: string;
}
