/**
 * Auth Store using Zustand
 */
import { create } from 'zustand';
export const useAuthStore = create()((set, get) => ({
    user: null,
    profile: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    setAuth: (user, profile, token) => {
        set({ user, profile, accessToken: token || null, isAuthenticated: true, isLoading: false });
    },
    clearAuth: () => {
        set({ user: null, profile: null, accessToken: null, isAuthenticated: false, isLoading: false });
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
}));
// After store creation, perform safe rehydration: call `/api/v1/auth/me`
// to populate `user` and `profile` in-memory using the httpOnly session cookie.
// This keeps sensitive profile data out of persistent storage while restoring session on reload.
// sensitive profile data out of persistent storage while restoring session on reload.
;
(async () => {
    try {
        if (typeof window === 'undefined')
            return;
        const apiUrl = import.meta.env.VITE_API_URL + '/api/v1/auth/me';
        const resp = await fetch(apiUrl, { credentials: 'include' });
        if (!resp.ok) {
            useAuthStore.getState().clearAuth();
            return;
        }
        const body = await resp.json();
        if (body?.success) {
            const { user, profile } = body.data;
            useAuthStore.getState().setAuth(user, profile, '');
        }
        else {
            useAuthStore.getState().clearAuth();
        }
    }
    catch (error) {
        useAuthStore.getState().clearAuth();
    }
    finally {
        useAuthStore.getState().setLoading(false);
    }
})();
//# sourceMappingURL=auth.store.js.map