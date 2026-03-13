/**
 * Server-side entry point for SSR
 * This file is responsible for rendering the React application on the server
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import type { Profile, AuthUser } from '@medical-portal/shared';
import App from '../app/App';
import { SSRAuthProvider } from '../contexts/AuthContext';

/**
 * Server-side render options
 */
export interface SSROptions {
  url: string;
  ssrUser?: AuthUser | null;
  ssrProfile?: Profile | null;
  isAuthenticated?: boolean;
}

/**
 * Server-side render result
 */
export interface SSRResult {
  html: string;
  dehydratedState: unknown;
  auth: {
    user: AuthUser | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  };
}

/**
 * Render the application to string on the server
 */
export function renderApp(options: SSROptions): SSRResult {
  const { url, ssrUser, ssrProfile, isAuthenticated = false } = options;

  // Create a fresh QueryClient for each request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: false, // Don't retry on server
      },
    },
  });

  // Prepare auth state for SSR
  const ssrAuth = {
    user: ssrUser || null,
    profile: ssrProfile || null,
    isAuthenticated,
    isLoading: false,
  };

  // Render the app to string
  const html = renderToString(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <SSRAuthProvider initialAuth={ssrAuth}>
            <StaticRouter location={url}>
              <App ssrAuth={ssrAuth} />
            </StaticRouter>
          </SSRAuthProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );

  // Dehydrate the QueryClient state
  const dehydratedState = dehydrate(queryClient);

  return {
    html,
    dehydratedState,
    auth: ssrAuth,
  };
}
