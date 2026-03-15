/**
 * Auth Store using Zustand
 * Next.js-compatible implementation
 * Uses httpOnly cookies for secure authentication - no localStorage usage
 */

import { create } from 'zustand';
import type { Profile, AuthUser } from '@medical-portal/shared';

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
   * Uses relative URLs to leverage Next.js API rewrites in development
   */
  initializeFromServer: async () => {
    // Only run on client
    if (typeof window === 'undefined') return;

    try {
      // Use relative URL for Next.js rewrites (development)
      // In production, NEXT_PUBLIC_API_URL will be set and api.ts handles it
      const resp = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });

      if (!resp.ok) {
        get().clearAuth();
        return;
      }

      const body = await resp.json();
      if (body?.success) {
        const { user } = body.data;
        const profile = body.data.user?.profile || null;
        get().setAuth(user, profile, '');
      } else {
        get().clearAuth();
      }
    } catch (error) {
      get().clearAuth();
    } finally {
      get().setLoading(false);
    }
  },
}));
