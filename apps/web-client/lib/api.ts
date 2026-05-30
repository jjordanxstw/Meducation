/**
 * API Client Configuration
 * Next.js-compatible implementation
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { notify } from './notify';

type RequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _skipSessionCheck?: boolean;
};

/**
 * Get the API base URL based on the environment
 * - Browser: always use same-origin /api/v1 to keep cookie auth first-party
 * - Server: use NEXT_PUBLIC_API_URL when available (fallback to local API)
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    return apiUrl.replace(/\/$/, '') + '/api/v1';
  }

  return 'http://localhost:3000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();
// Keep lightweight session validation, but avoid per-request chatter bursts.
const AUTH_CHECK_TTL_MS = 60000;
/**
 * Allowlist of dashboard routes that are safe to use as the post-login `to`
 * redirect target. Anything outside this list is coerced back to the home
 * page to defend against open-redirect abuse.
 */
const SAFE_REDIRECT_EXACT_PATHS = new Set([
  '/',
  '/subjects',
  '/calendar',
  '/profile',
  '/acdm',
  '/learning-hub',
  '/about-me',
  '/about-us',
]);

const SAFE_REDIRECT_PREFIXES = ['/subjects/'];

let lastAuthCheckAt = 0;
let sessionCheckPromise: Promise<void> | null = null;
let refreshPromise: Promise<boolean> | null = null;
let isAuthRedirectInProgress = false;
let authRedirectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Build a safe relative `to` target for the login flow. We strictly only
 * accept paths that begin with a single forward slash and resolve to a
 * known dashboard route. Anything else (full URLs, protocol-relative URLs,
 * unknown paths, etc.) is coerced to '/' to prevent open-redirect bugs.
 */
function sanitizeReturnPath(rawPath: string): string {
  if (!rawPath) {
    return '/';
  }

  // Reject protocol-relative ('//evil.com') and absolute URLs.
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) {
    return '/';
  }

  // Reject control characters.
  if (/[\u0000-\u001f\u007f]/.test(rawPath)) {
    return '/';
  }

  // Reject backslashes which some browsers normalize as forward slashes.
  if (rawPath.includes('\\')) {
    return '/';
  }

  const [pathOnly] = rawPath.split('?');

  if (SAFE_REDIRECT_EXACT_PATHS.has(pathOnly)) {
    return rawPath;
  }

  if (SAFE_REDIRECT_PREFIXES.some((prefix) => pathOnly.startsWith(prefix))) {
    return rawPath;
  }

  return '/';
}

/**
 * Performs a hard navigation to an internal URL while guarding against
 * concurrent in-flight redirects. The lock auto-releases after a short
 * timeout so a failed navigation does not permanently freeze the client.
 */
function safeRedirect(url: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isAuthRedirectInProgress) {
    return;
  }

  if (window.location.pathname + window.location.search === url) {
    return;
  }

  isAuthRedirectInProgress = true;

  if (authRedirectTimer) {
    clearTimeout(authRedirectTimer);
  }

  // Auto-release the lock if the navigation is somehow cancelled (e.g. the
  // browser back-button restores us to the original page) so subsequent
  // 401s can still trigger a redirect.
  authRedirectTimer = setTimeout(() => {
    isAuthRedirectInProgress = false;
    authRedirectTimer = null;
  }, 5000);

  window.location.href = url;
}

/**
 * Read the non-httpOnly `_csrf` cookie set by the backend on login. Same-origin
 * (the app proxies /api/v1) so document.cookie can see it.
 */
export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const CSRF_SAFE_METHODS = new Set(['get', 'head', 'options']);

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/verify') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

function buildCurrentReturnPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const target = `${window.location.pathname}${window.location.search}`;
  return sanitizeReturnPath(target || '/');
}

function buildLoginRedirectTarget(): string {
  const target = buildCurrentReturnPath();
  const encodedTarget = encodeURIComponent(target);
  return `/login?to=${encodedTarget}`;
}

function buildSyncRedirectTarget(): string {
  const target = buildCurrentReturnPath();
  const encodedTarget = encodeURIComponent(target);
  return `/auth/sync?to=${encodedTarget}`;
}

async function ensureNextAuthSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastAuthCheckAt <= AUTH_CHECK_TTL_MS) {
    return;
  }

  if (!sessionCheckPromise) {
    sessionCheckPromise = (async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to read auth session');
      }

      const session = await response.json();
      if (!session?.user) {
        throw new Error('No active NextAuth session');
      }

      lastAuthCheckAt = Date.now();
    })().finally(() => {
      sessionCheckPromise = null;
    });
  }

  await sessionCheckPromise;
}

async function refreshBackendSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await apiClient.post('/auth/refresh', undefined, {
          _skipSessionCheck: true,
        } as RequestConfig);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/**
 * Create API client with Next.js support
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  // Hard timeout so a hung backend never leaves a request (and its skeleton)
  // spinning indefinitely.
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const requestConfig = config as typeof config & RequestConfig;

  // CSRF double-submit: attach the token on every state-changing request so it
  // matches the _csrf cookie the backend compares against.
  const method = (config.method ?? 'get').toLowerCase();
  if (!CSRF_SAFE_METHODS.has(method)) {
    const csrf = readCsrfToken();
    if (csrf) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['x-csrf-token'] = csrf;
    }
  }

  if (requestConfig._skipSessionCheck || isAuthEndpoint(config.url)) {
    return config;
  }

  try {
    await ensureNextAuthSession();
    return config;
  } catch {
    safeRedirect(buildLoginRedirectTarget());
    return Promise.reject(new axios.CanceledError('No active session'));
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalConfig = error.config as RequestConfig | undefined;

    if (status === 401 && originalConfig && !originalConfig._retry && !isAuthEndpoint(error.config?.url)) {
      originalConfig._retry = true;
      const refreshed = await refreshBackendSession();

      if (refreshed) {
        // Refresh succeeded — release any pending redirect lock and retry
        // the original request with the new cookie.
        lastAuthCheckAt = Date.now();
        isAuthRedirectInProgress = false;
        if (authRedirectTimer) {
          clearTimeout(authRedirectTimer);
          authRedirectTimer = null;
        }
        return apiClient(error.config);
      }

      safeRedirect(buildSyncRedirectTarget());
    }

    // User-facing feedback for transient conditions. We still rethrow so React
    // Query (and any explicit error handlers) continue to observe the error.
    if (typeof window !== 'undefined' && !(error instanceof axios.CanceledError)) {
      if (status === 429) {
        notify.error('Too many requests — please wait a moment');
      } else if (!error.response) {
        // No response object => network failure / timeout / DNS, etc.
        notify.error('Connection failed');
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  auth: {
    verify: (idToken: string) => apiClient.post('/auth/verify', { idToken }),
    me: () => apiClient.get('/auth/me'),
    watermark: () => apiClient.get('/auth/watermark'),
    refresh: () =>
      apiClient.post('/auth/refresh', undefined, {
        _skipSessionCheck: true,
      } as RequestConfig),
    logout: async () => {
      try {
        await apiClient.post('/auth/logout', undefined, {
          _skipSessionCheck: true,
        } as RequestConfig);
      } catch {
        // Ignore logout failures and continue local sign-out flow
      }
      lastAuthCheckAt = 0;
    },
  },

  // Subjects
  subjects: {
    list: (yearLevel?: number) =>
      apiClient.get('/subjects', { params: { year_level: yearLevel } }),
    get: (id: string) => apiClient.get(`/subjects/${id}`),
  },

  // Calendar
  calendar: {
    list: (params?: { start_date?: string; end_date?: string; type?: string }) =>
      apiClient.get('/calendar', { params }),
    getMonth: (year: number, month: number) =>
      apiClient.get(`/calendar/month/${year}/${month}`),
    upcoming: (limit?: number) =>
      apiClient.get('/calendar/upcoming', { params: { limit } }),
  },

  // Announcements
  announcements: {
    list: (params?: { page?: number; pageSize?: number }) =>
      apiClient.get('/announcements', { params }),
    get: (id: string) =>
      apiClient.get(`/announcements/${id}`),
  },

  // Profile
  profile: {
    get: (id: string) => apiClient.get(`/profiles/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiClient.patch(`/profiles/${id}`, data),
  },
};

export const __testables__ = {
  sanitizeReturnPath,
  buildLoginRedirectTarget,
  buildSyncRedirectTarget,
};
