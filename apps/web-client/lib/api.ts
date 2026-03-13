/**
 * API Client Configuration
 * Next.js-compatible implementation
 */

import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/auth.store';

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

/**
 * Handle redirect safely
 */
function safeRedirect(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
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
