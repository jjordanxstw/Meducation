/**
 * Client-side entry point for hydration
 * This file is responsible for hydrating the React application on the client
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import App, { AppProviders } from '../App';
import type { Profile, AuthUser } from '@medical-portal/shared';
import './index.css';

interface InitialData {
  dehydratedState?: DehydratedState;
  auth?: {
    user: AuthUser | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  };
}

/**
 * Get initial state from window.__INITIAL_DATA__
 * This is populated by the server during SSR
 */
function getInitialState(): InitialData | undefined {
  if (typeof window === 'undefined') return undefined;

  const win = window as unknown as { __INITIAL_DATA__?: InitialData };
  return win.__INITIAL_DATA__;
}

/**
 * Clear initial state after hydration
 */
function clearInitialState() {
  if (typeof window === 'undefined') return;

  const win = window as unknown as { __INITIAL_DATA__?: InitialData };
  delete win.__INITIAL_DATA__;
}

/**
 * Hydrate the application
 */
function hydrate() {
  const initialState = getInitialState();
  const dehydratedState = initialState?.dehydratedState;
  const ssrAuth = initialState?.auth;

  // Render the application
  const root = ReactDOM.createRoot(document.getElementById('root')!);

  root.render(
    <React.StrictMode>
      <HydrationBoundary state={dehydratedState}>
        <AppProviders ssrAuth={ssrAuth}>
          <App ssrAuth={ssrAuth} />
        </AppProviders>
      </HydrationBoundary>
    </React.StrictMode>,
  );

  // Clear initial state after hydration
  clearInitialState();
}

// Start hydration
hydrate();
