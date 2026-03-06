/**
 * API Client Configuration
 */

import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Cookies (httpOnly session) are sent automatically via `withCredentials`.

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
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
        window.location.href = '/login';
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
