import { createContext, useContext, type ReactNode } from 'react';
import type { Profile, AuthUser } from '@medical-portal/shared';

/**
 * Authentication context for SSR
 * This allows server-side authentication data to be passed to the client
 */

export interface SSRAuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const SSRAuthContext = createContext<SSRAuthContextValue>({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
});

export interface SSRAuthProviderProps {
  children: ReactNode;
  initialAuth?: SSRAuthContextValue;
}

/**
 * SSR Auth Provider
 * Wraps the application and provides initial authentication state from the server
 */
export function SSRAuthProvider({ children, initialAuth }: SSRAuthProviderProps) {
  const value: SSRAuthContextValue = initialAuth || {
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  };

  return <SSRAuthContext.Provider value={value}>{children}</SSRAuthContext.Provider>;
}

/**
 * Hook to access SSR auth context
 */
export function useSSRAuth() {
  return useContext(SSRAuthContext);
}
