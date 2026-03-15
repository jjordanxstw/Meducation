/**
 * Admin Entity
 * Represents an admin user in the admins table
 */

export interface Admin {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at?: Date;
  password_changed_at: Date;
  created_at: Date;
  updated_at: Date;
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
    email: admin.email,
    is_active: admin.is_active,
    is_super_admin: admin.is_super_admin,
    last_login_at: admin.last_login_at
      ? typeof admin.last_login_at === 'string'
        ? admin.last_login_at
        : admin.last_login_at.toISOString()
      : undefined,
  };
}

/**
 * Admin with credentials (for internal use only)
 */
export interface AdminWithCredentials extends Admin {
  password_hash: string;
}
