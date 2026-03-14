/**
 * Auth Store using Zustand
 */
import type { Profile, AuthUser } from '@medical-portal/shared';
interface AuthState {
    user: AuthUser | null;
    profile: Profile | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: AuthUser, profile: Profile, token: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    updateProfile: (profile: Partial<Profile>) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=auth.store.d.ts.map