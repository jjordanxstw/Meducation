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
import { resolveApiErrorMessage } from '../utils/api-error';

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

type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  username: string;
  isSuperAdmin: boolean;
  isActive: boolean;
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
let permissionsPromise: Promise<string | null> | null = null;
let identityPromise: Promise<AdminIdentity | null> | null = null;

// Short-term cache for identity and permissions (30 seconds)
let cachedIdentity: AdminMeResponse | null = null;
let cachedPermissions: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

// Flag to prevent auth checks after token failure
let hasTokenFailed = false;
let tokenFailureTime = 0;
const TOKEN_FAILURE_BLOCK_MS = 5000; // Block auth checks for 5 seconds after token failure

function resetAuthFailureState(): void {
  hasTokenFailed = false;
  tokenFailureTime = 0;
  isRedirecting = false;
  authCheckPromise = null;
  permissionsPromise = null;
  identityPromise = null;
}

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

function clearCache(): void {
  cachedIdentity = null;
  cachedPermissions = null;
  cacheTimestamp = 0;
}

function markTokenFailed(): void {
  hasTokenFailed = true;
  tokenFailureTime = Date.now();
}

function isTokenFailedRecently(): boolean {
  if (!hasTokenFailed) return false;
  const elapsed = Date.now() - tokenFailureTime;
  if (elapsed > TOKEN_FAILURE_BLOCK_MS) {
    hasTokenFailed = false;
    return false;
  }
  return true;
}

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

// Flag to prevent multiple simultaneous redirects
let isRedirecting = false;

// Response interceptor - simplified error handling
authAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url;

    if (!originalRequest || !status || !isAuthFailureStatus(status)) {
      return Promise.reject(error);
    }

    // Check if already on login page to prevent infinite loop
    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath === '/login';

    // Silent handling for 401 errors - no console logs needed
    const isAuthRequest = url?.includes('/admin/auth/');
    const isMeRequest = url?.includes('/admin/auth/me');
    const isRefreshRequest = url?.includes('/admin/auth/refresh');

    // Mark token as failed to prevent further auth checks
    markTokenFailed();

    // For /auth/me with 401, clear cookies and redirect to login
    if (isMeRequest && status === 401 && !isRedirecting && !isOnLoginPage) {
      isRedirecting = true;
      clearCache();
      // Clear cookies immediately
      try {
        await authAxios.post(CLEAR_AUTH_ROUTE, {}, { withCredentials: true });
      } catch {
        // Ignore clear errors
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // For refresh token failure, redirect to login
    if (isRefreshRequest && status === 401 && !isRedirecting && !isOnLoginPage) {
      isRedirecting = true;
      clearCache();
      // Clear cookies immediately
      try {
        await authAxios.post(CLEAR_AUTH_ROUTE, {}, { withCredentials: true });
      } catch {
        // Ignore clear errors
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Don't retry for auth endpoints - just reject silently
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // For non-auth endpoints, try refresh once
    if (!originalRequest._retry && !isAuthEndpoint(url)) {
      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return authAxios(originalRequest);
      }
      // Refresh failed - redirect to login (unless already there)
      if (!isRedirecting && !isOnLoginPage) {
        isRedirecting = true;
        clearCache();
        window.location.href = '/login';
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
  // Logging disabled by request.
  void event;
  void details;
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

      // Clear stale unauthenticated state from pre-login checks.
      // Without this, check() can immediately return unauthenticated and bounce back to /login?to=/dashboard.
      resetAuthFailureState();
      clearCache();

      return {
        success: true,
        redirectTo: '/dashboard',
      };
    } catch (error: unknown) {
      const errorMessage = resolveApiErrorMessage(error, 'errors.auth.invalidCredentials');

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
    // Clear cached data
    clearCache();

    // Attempt backend logout (token revocation)
    try {
      await authAxios.post(`${API_URL}/admin/auth/logout`, {}, {
        ...authRequestConfig,
      });
      logSecurityEvent('logout_success');
    } catch (error) {
      logSecurityEvent('logout_api_failed', { error: sanitizeErrorMessage(error) });
    }

    // Also call clear auth endpoint to ensure cookies are cleared
    try {
      await authAxios.post(CLEAR_AUTH_ROUTE, {}, {
        withCredentials: true,
      });
    } catch (error) {
      // Ignore errors from clear endpoint
    }

    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    // If token failed recently, immediately return not authenticated
    if (isTokenFailedRecently()) {
      return { authenticated: false, redirectTo: '/login' };
    }

    // Deduplicate concurrent checks from route transitions and Refine hooks.
    if (authCheckPromise) {
      return authCheckPromise;
    }

    authCheckPromise = (async () => {
      try {
        const me = await fetchCurrentAdmin();

        if (!me.is_active) {
          return { authenticated: false, redirectTo: '/login' };
        }

        // Reset token failure flag on successful auth
        hasTokenFailed = false;

        return { authenticated: true };
      } catch (error) {
        const err = error as AxiosError;
        const status = err.response?.status;

        // For auth failures (401/403), mark token as failed and return not authenticated
        if (isAuthFailureStatus(status)) {
          markTokenFailed();
          logSecurityEvent('auth_check_failed', {
            status,
            error: sanitizeErrorMessage(error),
          });

          return { authenticated: false, redirectTo: '/login' };
        }

        // If API is completely unreachable (network error), treat as not authenticated
        // This ensures the login page shows immediately when API is down
        if (!status || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
          logSecurityEvent('auth_check_api_unreachable', {
            error: sanitizeErrorMessage(error),
          });
          return { authenticated: false, redirectTo: '/login' };
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
    if (permissionsPromise) {
      return permissionsPromise;
    }

    // Return cached result if still valid
    if (cachedPermissions !== null && isCacheValid()) {
      return cachedPermissions;
    }

    permissionsPromise = (async () => {
      try {
        const me = await fetchCurrentAdmin();
        const permissions = me.is_super_admin ? 'super-admin' : 'admin';

        // Cache the result
        cachedIdentity = me;
        cachedPermissions = permissions;
        cacheTimestamp = Date.now();

        return permissions;
      } catch (error) {
        logSecurityEvent('get_permissions_failed', { error: sanitizeErrorMessage(error) });
        return null;
      } finally {
        permissionsPromise = null;
      }
    })();

    return permissionsPromise;
  },

  getIdentity: async () => {
    if (identityPromise) {
      return identityPromise;
    }

    // Return cached result if still valid
    if (cachedIdentity !== null && isCacheValid()) {
      return {
        id: cachedIdentity.id,
        name: cachedIdentity.full_name,
        email: cachedIdentity.email,
        username: cachedIdentity.username,
        isSuperAdmin: cachedIdentity.is_super_admin,
        isActive: cachedIdentity.is_active,
      };
    }

    identityPromise = (async () => {
      try {
        const me = await fetchCurrentAdmin();

        if (me) {
          // Cache the result
          cachedIdentity = me;
          cacheTimestamp = Date.now();

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
      } finally {
        identityPromise = null;
      }

      return null;
    })();

    return identityPromise;
  },

  onError: async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        logSecurityEvent('unauthorized_access', { url: error.config?.url });
        return {
          logout: true,
          redirectTo: '/login',
          error: {
            name: 'Unauthorized',
            message: resolveApiErrorMessage(error, 'errors.auth.tokenInvalid'),
          },
        };
      }
      if (error.response?.status === 403) {
        logSecurityEvent('forbidden_access', { url: error.config?.url });
        return {
          error: {
            name: 'Forbidden',
            message: resolveApiErrorMessage(error, 'errors.authorization.forbidden'),
          },
        };
      }
    }
    return { error };
  },
};

// Export auth axios instance for use in data provider
export { authAxios };
