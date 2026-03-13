/**
 * App Providers
 * Wraps the application with all necessary providers
 * SSR-compatible implementation
 */

import type { ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { BrowserRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { SSRAuthProvider } from '../contexts/AuthContext';
import { createQueryClient } from '../lib/queryClient';
import type { Profile, AuthUser } from '@medical-portal/shared';

interface AppProvidersProps {
  children: ReactNode;
  location?: string;
  ssrAuth?: {
    user: AuthUser | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  };
}

/**
 * Create a QueryClient instance
 * In production, this would be a singleton
 */
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

/**
 * Router component - SSR-compatible
 * Uses StaticRouter on server, BrowserRouter on client
 */
function Router({ children, location = '/' }: { children: ReactNode; location?: string }) {
  // Check if we're on the server
  const isServer = typeof window === 'undefined';

  if (isServer) {
    return <StaticRouter location={location}>{children}</StaticRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * App Providers Component
 * Wraps the application with all necessary providers
 */
export function AppProviders({ children, location, ssrAuth }: AppProvidersProps) {
  const queryClient = getQueryClient();

  // Add missing isLoading property for SSR auth
  const authValue = ssrAuth ? {
    user: ssrAuth.user,
    profile: ssrAuth.profile,
    isAuthenticated: ssrAuth.isAuthenticated,
    isLoading: false,
  } : undefined;

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <SSRAuthProvider initialAuth={authValue}>
          <Router location={location}>
            {children}
          </Router>
        </SSRAuthProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
