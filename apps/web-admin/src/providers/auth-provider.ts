/**
 * Auth Provider for Refine
 *
 * Refactor goals:
 * - Keep login UX/UI unchanged
 * - Align with service-api auth contracts
 * - Prevent redirect/spinner loops
 * - Add refresh-first behavior for expired access tokens
 */

import type { AuthProvider } from '@refinedev/core';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Sanitize error message to prevent XSS attacks
 */
function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error.replace(/[<>]/g, '');
  }
  if (error instanceof Error) {
    return error.message.replace(/[<>]/g, '');
  }
  return 'เกิดข้อผิดพลาด';
}

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const AUTH_REQUEST_TIMEOUT_MS = import.meta.env.MODE === 'production' ? 8000 : 15000;
const AUTH_CHECK_TIMEOUT_MS = 5000; // Shorter timeout for initial auth check
const CLEAR_AUTH_ROUTE = '/api/auth/clear';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Create axios instance with credentials enabled
const authAxios = axios.create({
  withCredentials: true,
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

type AdminLoginResponse = {
  accessToken?: string;
  admin?: {
    id: string;
    is_active: boolean;
    is_super_admin: boolean;
  };
};

let refreshPromise: Promise<boolean> | null = null;
let authCheckPromise: Promise<{ authenticated: boolean; redirectTo?: string }> | null = null;

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/admin/auth/login') ||
    url.includes('/admin/auth/me') ||
    url.includes('/admin/auth/refresh') ||
    url.includes('/admin/auth/logout')
  );
}

function isAuthFailureStatus(status?: number): boolean {
  return status === 401 || status === 403;
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      await authAxios.post(`${API_URL}/admin/auth/refresh`, {}, {
        ...authRequestConfig,
        headers: {
          ...authRequestConfig.headers,
          'X-Auth-Refresh': '1',
        },
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchCurrentAdmin(): Promise<AdminMeResponse> {
  const response = await authAxios.get<AdminMeResponse>(`${API_URL}/admin/auth/me`, {
    ...authRequestConfig,
    timeout: AUTH_CHECK_TIMEOUT_MS, // Use shorter timeout for auth check
  });
  return response.data;
}

// Response interceptor - refresh-first strategy for expired access token
authAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url;

    if (!originalRequest || !status || !isAuthFailureStatus(status)) {
      return Promise.reject(error);
    }

    const isRefreshRequest = url?.includes('/admin/auth/refresh') || originalRequest.headers?.['X-Auth-Refresh'] === '1';
    if (isRefreshRequest) {
      return Promise.reject(error);
    }

    // Retry once for non-auth API calls after attempting refresh
    if (!originalRequest._retry && !isAuthEndpoint(url)) {
      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return authAxios(originalRequest);
      }
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
  if (import.meta.env.DEV) {
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
      const response = await authAxios.post<AdminLoginResponse>(`${API_URL}/admin/auth/login`, {
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
    // Attempt backend logout (token revocation); if token is already invalid,
    // we still clear cookie server-side via local clear route.
    try {
      await authAxios.post(`${API_URL}/admin/auth/logout`, {}, {
        ...authRequestConfig,
      });
      logSecurityEvent('logout_success');
    } catch (error) {
      logSecurityEvent('logout_api_failed', { error: sanitizeErrorMessage(error) });
    }

    return {
      success: true,
      redirectTo: CLEAR_AUTH_ROUTE,
    };
  },

  check: async () => {
    // Deduplicate concurrent checks from route transitions and Refine hooks.
    if (authCheckPromise) {
      return authCheckPromise;
    }

    authCheckPromise = (async () => {
      try {
        const me = await fetchCurrentAdmin();

        if (!me.is_active) {
          return { authenticated: false, redirectTo: CLEAR_AUTH_ROUTE };
        }

        return { authenticated: true };
      } catch (error) {
        const err = error as AxiosError;
        const status = err.response?.status;

        if (isAuthFailureStatus(status)) {
          // Try refresh once before forcing logout.
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            try {
              const me = await fetchCurrentAdmin();
              if (me.is_active) {
                return { authenticated: true };
              }
            } catch {
              // Fall through to clear auth.
            }
          }

          logSecurityEvent('auth_check_failed', {
            status,
            error: sanitizeErrorMessage(error),
          });

          return { authenticated: false, redirectTo: CLEAR_AUTH_ROUTE };
        }

        // If API is completely unreachable (network error), treat as not authenticated
        // This ensures the login page shows immediately when API is down
        if (!status || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
          logSecurityEvent('auth_check_api_unreachable', {
            error: sanitizeErrorMessage(error),
          });
          return { authenticated: false };
        }

        // Keep session on other transient errors
        logSecurityEvent('auth_check_transient_error', {
          error: sanitizeErrorMessage(error),
        });

        return { authenticated: true };
      } finally {
        authCheckPromise = null;
      }
    })();

    return authCheckPromise;
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
        return { logout: true, redirectTo: CLEAR_AUTH_ROUTE };
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
