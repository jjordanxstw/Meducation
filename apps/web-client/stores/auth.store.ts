/**
 * Auth Store using Zustand
 * Next.js-compatible implementation
 * Uses httpOnly cookies for secure authentication - no localStorage usage
 */

import { create } from 'zustand';
import type { Profile, AuthUser } from '@medical-portal/shared';
import { api } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: AuthUser, profile: Profile, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (profileData: Partial<Profile>) => void;
  initializeFromServer: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setAuth: (user, profile, token) => {
    set({
      user,
      profile,
      accessToken: token || null,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });
  },

  clearAuth: () => {
    set({
      user: null,
      profile: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  updateProfile: (profileData) => {
    const currentProfile = get().profile;
    if (currentProfile) {
      set({ profile: { ...currentProfile, ...profileData } });
    }
  },

  /**
   * Initialize auth state from server
   * This should be called on client-side after hydration
   * Uses the shared API client for consistent auth/session handling
   */
  initializeFromServer: async () => {
    // Only run on client
    if (typeof window === 'undefined') return;

    try {
      const response = await api.auth.me();
      const body = response.data;
      if (body?.success) {
        const { user } = body.data;
        const profile = user?.profile || null;
        get().setAuth(user, profile, '');
      } else {
        get().clearAuth();
      }
    } catch {
      get().clearAuth();
    } finally {
      get().setLoading(false);
    }
  },
}));
