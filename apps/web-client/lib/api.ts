/**
 * API Client Configuration
 * Next.js-compatible implementation
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

type RequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _skipSessionCheck?: boolean;
};

/**
 * Get the API base URL based on the environment
 * - If NEXT_PUBLIC_API_URL is set (production), use it
 * - Otherwise, use relative path to leverage Next.js rewrites (development)
 */
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Production: Use the specified API URL directly
  if (apiUrl) {
    // Remove trailing slash if present and append /api/v1
    return apiUrl.replace(/\/$/, '') + '/api/v1';
  }

  // Development: Use relative path for Next.js rewrites
  // Next.js rewrites /api/* to http://localhost:3001/api/*
  // So we just need to specify /api/v1
  return '/api/v1';
}

const API_BASE_URL = getApiBaseUrl();
const AUTH_CHECK_TTL_MS = 15000;
let lastAuthCheckAt = 0;
let sessionCheckPromise: Promise<void> | null = null;
let refreshPromise: Promise<boolean> | null = null;
let isAuthRedirectInProgress = false;

/**
 * Handle redirect safely
 */
function safeRedirect(url: string) {
  if (typeof window !== 'undefined') {
    if (isAuthRedirectInProgress) {
      return;
    }

    if (window.location.pathname + window.location.search === url) {
      return;
    }

    isAuthRedirectInProgress = true;

    window.location.href = url;
  }
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/verify') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

function buildLoginRedirectTarget(): string {
  if (typeof window === 'undefined') return '/login';
  const target = `${window.location.pathname}${window.location.search}`;
  const encodedTarget = encodeURIComponent(target || '/');
  return `/login?to=${encodedTarget}`;
}

function buildSyncRedirectTarget(): string {
  if (typeof window === 'undefined') return '/auth/sync';
  const target = `${window.location.pathname}${window.location.search}`;
  const encodedTarget = encodeURIComponent(target || '/');
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
});

apiClient.interceptors.request.use(async (config) => {
  const requestConfig = config as typeof config & RequestConfig;
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
        lastAuthCheckAt = Date.now();
        isAuthRedirectInProgress = false;
        return apiClient(error.config);
      }

      safeRedirect(buildSyncRedirectTarget());
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

  // Profile
  profile: {
    get: (id: string) => apiClient.get(`/profiles/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiClient.patch(`/profiles/${id}`, data),
  },
};
