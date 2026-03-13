/**
 * Auth Store using Zustand
 * SSR-compatible implementation
 */

import { create } from 'zustand';
import type { Profile, AuthUser } from '@medical-portal/shared';
import { getInitialData, clearInitialData } from '../lib/ssr';

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
  updateProfile: (profile: Partial<Profile>) => void;
  initializeFromServer: () => Promise<void>;
}

interface SSRAuthData {
  user: AuthUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
}

/**
 * Get initial auth state from server-side data
 */
function getInitialAuthState(): {
  user: AuthUser | null;
  profile: Profile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
} {
  // Check if we have SSR data
  const initialData = getInitialData<SSRAuthData>('auth');

  if (initialData) {
    return {
      user: initialData.user,
      profile: initialData.profile,
      accessToken: null,
      isAuthenticated: initialData.isAuthenticated,
      isLoading: false,
      isInitialized: true,
    };
  }

  return {
    user: null,
    profile: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...getInitialAuthState(),

  setAuth: (user, profile, token) => {
    set({ user, profile, accessToken: token || null, isAuthenticated: true, isLoading: false, isInitialized: true });
  },

  clearAuth: () => {
    set({ user: null, profile: null, accessToken: null, isAuthenticated: false, isLoading: false, isInitialized: true });
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
   * This should be called on client-side after SSR hydration
   */
  initializeFromServer: async () => {
    // If already initialized from SSR, skip
    if (get().isInitialized) {
      clearInitialData('auth');
      return;
    }

    // Only run on client
    if (typeof window === 'undefined') return;

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || '') + '/api/v1/auth/me';
      const resp = await fetch(apiUrl, { credentials: 'include' });
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
