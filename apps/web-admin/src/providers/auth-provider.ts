/**
 * Auth Provider for Refine
 */

import type { AuthProvider } from '@refinedev/core';
import axios from 'axios';

const API_URL = '/api/v1';

export const authProvider: AuthProvider = {
  login: async ({ credential }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify`, { credential }, { withCredentials: true });

      if (response.data.success) {
        const { user, profile } = response.data.data;

        // Check if user is admin
        if (profile.role !== 'admin') {
          return {
            success: false,
            error: {
              name: 'AccessDenied',
              message: 'คุณไม่มีสิทธิ์เข้าถึงหน้า Admin',
            },
          };
        }

        // Server sets httpOnly cookie; do not persist tokens client-side.
        return {
          success: true,
          redirectTo: '/',
        };
      }

      return { success: false, error: { name: 'LoginError', message: 'เข้าสู่ระบบไม่สำเร็จ' } };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return { success: false, error: { name: 'LoginError', message: err.response?.data?.error?.message || 'เข้าสู่ระบบไม่สำเร็จ' } };
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      if (response.data?.success) {
        const { profile } = response.data.data;
        if (profile?.role === 'admin') return { authenticated: true };
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
    }
    return { authenticated: false, redirectTo: '/login' };
  },

  getPermissions: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      return response.data?.data?.profile?.role || null;
    } catch (error) {
      console.warn('getPermissions failed:', error);
      return null;
    }
  },

  getIdentity: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      if (response.data?.success) {
        const { user, profile } = response.data.data;
        return {
          id: user.id,
          name: profile?.full_name || user.name,
          email: user.email,
          avatar: user.picture,
          role: profile?.role,
        };
      }
    } catch (error) {
      console.warn('getIdentity failed:', error);
    }

    return null;
  },

  onError: async (error) => {
    if (error.response?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};
