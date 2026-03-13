/**
 * API Client Configuration
 * SSR-compatible implementation
 */

import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { isClient } from './ssr';

/**
 * Get the API base URL based on the environment
 */
function getApiBaseUrl(): string {
  if (isClient) {
    // Client-side: use environment variable or fallback
    return (import.meta.env.VITE_API_URL || '') + '/api/v1';
  }
  // Server-side: use internal URL or default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as { process?: { env?: { API_URL?: string } } };
  return g.process?.env?.API_URL || 'http://localhost:3001/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Handle redirect safely (SSR-compatible)
 */
function safeRedirect(url: string) {
  if (isClient) {
    window.location.href = url;
  }
  // On server, we can't redirect - the response will be handled by the server
}

/**
 * Create API client with SSR support
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      useAuthStore.getState().clearAuth();
      safeRedirect('/login');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  auth: {
    verify: (credential: string) => apiClient.post('/auth/verify', { credential }),
    me: () => apiClient.get('/auth/me'),
    watermark: () => apiClient.get('/auth/watermark'),
    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        useAuthStore.getState().clearAuth();
        safeRedirect('/login');
      }
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
