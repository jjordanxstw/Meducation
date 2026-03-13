/**
 * Auth Provider for Refine
 * Handles secure cookie-based authentication for admin users
 *
 * Security improvements:
 * - Uses httpOnly cookies (set by backend) as primary auth method
 * - Proper token validation and cleanup
 * - Secure error handling
 *
 * Note: Cookies are set by the backend as httpOnly for security.
 */

import type { AuthProvider } from '@refinedev/core';
import axios, { AxiosError } from 'axios';
import { removeAuthCookie, sanitizeErrorMessage } from '@/lib/security';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const AUTH_REQUEST_TIMEOUT_MS = 5000;

// Create axios instance with credentials enabled
const authAxios = axios.create({
  withCredentials: true, // Send httpOnly cookies
  timeout: AUTH_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authRequestConfig = {
  withCredentials: true,
  timeout: AUTH_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
};

type AdminMeResponse = {
  id: string;
  full_name: string;
  email: string;
  username: string;
  is_super_admin: boolean;
  is_active: boolean;
};

async function fetchCurrentAdmin(): Promise<AdminMeResponse> {
  const response = await axios.get<AdminMeResponse>(`${API_URL}/admin/auth/me`, authRequestConfig);
  return response.data;
}

// Response interceptor - handle authentication failures
authAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Clear invalid cookie
      removeAuthCookie();

      // Don't retry - force logout
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[Security] Access forbidden:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

/**
 * Validate token structure
 */
function isValidTokenStructure(token: unknown): token is string {
  return typeof token === 'string' && token.split('.').length === 3;
}

/**
 * Log security events (for audit purposes)
 */
function logSecurityEvent(event: string, details?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Security Audit] ${event}`, details);
  }
  // In production, send to audit logging service
  // await auditService.logSecurityEvent(event, details);
}

export const authProvider: AuthProvider = {
  login: async (params) => {
    const username = (params as { username?: string } | undefined)?.username;
    const password = (params as { password?: string } | undefined)?.password;

    // Input validation
    if (!username || !password) {
      return {
        success: false,
        error: {
          name: 'ValidationError',
          message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน'
        }
      };
    }

    // Sanitize username to prevent injection
    const sanitizedUsername = username.trim().slice(0, 100);

    // Username must be a normal user id, not an email address
    if (sanitizedUsername.includes('@')) {
      return {
        success: false,
        error: {
          name: 'ValidationError',
          message: 'กรุณาเข้าสู่ระบบด้วยรหัสผู้ใช้ (ห้ามใช้อีเมล)'
        }
      };
    }

    try {
      // Username/password login for admin
      const response = await axios.post(`${API_URL}/admin/auth/login`, {
        username: sanitizedUsername,
        password,
      }, {
        ...authRequestConfig,
      });

      // Validate response structure
      if (!response.data?.accessToken) {
        logSecurityEvent('login_failed', { reason: 'invalid_response_structure' });
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'Invalid response from server'
          }
        };
      }

      // Validate token structure
      if (!isValidTokenStructure(response.data.accessToken)) {
        logSecurityEvent('login_failed', { reason: 'invalid_token_structure' });
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'Invalid authentication token received'
          }
        };
      }

      // Check admin status safely
      const admin = response.data.admin;
      if (!admin) {
        logSecurityEvent('login_failed', { reason: 'no_admin_data', username: sanitizedUsername });
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'ไม่พบข้อมูลผู้ใช้'
          },
        };
      }

      if (!admin.is_active) {
        logSecurityEvent('login_blocked', {
          reason: 'account_inactive',
          username: sanitizedUsername,
          adminId: admin.id
        });
        return {
          success: false,
          error: {
            name: 'AccessDenied',
            message: 'บัญชีผู้ใช้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ'
          },
        };
      }

      logSecurityEvent('login_success', {
        username: sanitizedUsername,
        adminId: admin.id,
        isSuperAdmin: admin.is_super_admin,
      });

      return {
        success: true,
        redirectTo: '/dashboard',
      };
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';

      logSecurityEvent('login_failed', {
        reason: 'authentication_failed',
        username: sanitizedUsername,
        error: errorMessage,
      });

      return {
        success: false,
        error: {
          name: 'LoginError',
          message: sanitizeErrorMessage(errorMessage),
        },
      };
    }
  },

  logout: async () => {
    // Call logout endpoint (backend clears httpOnly cookie)
    try {
      await axios.post(`${API_URL}/admin/auth/logout`, {}, {
        ...authRequestConfig,
      });
      logSecurityEvent('logout_success');
    } catch (error) {
      // Log but don't fail logout on API error
      logSecurityEvent('logout_api_failed', { error: sanitizeErrorMessage(error) });
      console.warn('[Auth] Logout API call failed:', error);
    }

    // Also clear client-side cookie for middleware compatibility
    removeAuthCookie();

    // Clear any session storage
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.clear();
      } catch {
        // Ignore sessionStorage errors
      }
    }

    return {
      success: true,
      redirectTo: '/',
    };
  },

  check: async () => {
    // Verify authentication with server because access token cookie is httpOnly
    // and cannot be read via document.cookie in the browser.
    try {
      const me = await fetchCurrentAdmin();

      if (me.is_active === false) {
        removeAuthCookie();
        return { authenticated: false, redirectTo: '/' };
      }

      return { authenticated: true };
    } catch (error) {
      // Auth check failed - clear invalid token
      removeAuthCookie();
      logSecurityEvent('auth_check_failed', { error: sanitizeErrorMessage(error) });
      return { authenticated: false, redirectTo: '/' };
    }
  },

  getPermissions: async () => {
    try {
      const me = await fetchCurrentAdmin();

      return me.is_super_admin ? 'super-admin' : 'admin';
    } catch (error) {
      logSecurityEvent('get_permissions_failed', { error: sanitizeErrorMessage(error) });
      return null;
    }
  },

  getIdentity: async () => {
    try {
      const me = await fetchCurrentAdmin();

      if (me) {
        return {
          id: me.id,
          name: me.full_name,
          email: me.email,
          username: me.username,
          isSuperAdmin: me.is_super_admin,
          isActive: me.is_active,
        };
      }
    } catch (error) {
      logSecurityEvent('get_identity_failed', { error: sanitizeErrorMessage(error) });
    }

    return null;
  },

  onError: async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        logSecurityEvent('unauthorized_access', { url: error.config?.url });
        return { logout: true, redirectTo: '/' };
      }
      if (error.response?.status === 403) {
        logSecurityEvent('forbidden_access', { url: error.config?.url });
      }
    }
    return { error };
  },
};

// Export auth axios instance for use in data provider
export { authAxios };
