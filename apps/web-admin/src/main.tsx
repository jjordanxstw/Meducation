/* eslint-disable react-refresh/only-export-components */

/**
 * Main Entry Point for Medical Portal Admin Panel
 * Vite + React + Refine.dev v4 (headless core) — single light (blue/white)
 * theme, English only. UI is Tailwind + Radix; no Ant Design.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Refine } from '@refinedev/core';
import routerBindings from '@refinedev/react-router-v6';
import { Toaster } from 'sonner';

// Two-font system: Lato for Latin, IBM Plex Sans Thai Looped for Thai.
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import '@fontsource/ibm-plex-sans-thai-looped/400.css';
import '@fontsource/ibm-plex-sans-thai-looped/500.css';
import '@fontsource/ibm-plex-sans-thai-looped/600.css';
import '@fontsource/ibm-plex-sans-thai-looped/700.css';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { notificationProvider } from './providers/notification-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './index.css';

// Import router and resources
import { router } from './routes';
import { buildResources } from './resources';

const resolvedApiUrl = '/api/v1';

/**
 * True while the admin is on a create/edit form route. Used to suppress all
 * window-focus refetching there (see refetchOnWindowFocus below): a focus
 * re-check would refetch the record + the session, and an expired access token
 * would cascade into a silent /refresh — any of which can disrupt unsaved
 * input. Lists/dashboard keep refetching on focus for multi-admin freshness.
 */
function isOnFormRoute(): boolean {
  return /\/(create|edit)(\/|$)/.test(window.location.pathname);
}

function assertValidApiUrl(apiUrl: string): void {
  if (apiUrl.startsWith('/')) {
    return;
  }

  try {
    const parsedUrl = new URL(apiUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
  } catch {
    throw new Error('Invalid VITE_API_URL. Use a relative path (/api/v1) or absolute http(s) URL.');
  }
}

assertValidApiUrl(resolvedApiUrl);

const Root: React.FC = () => {
  const refineDataProvider = React.useMemo(() => dataProvider(resolvedApiUrl), []);
  const resources = buildResources();

  return (
    <TooltipProvider delayDuration={200}>
      <Refine
        dataProvider={refineDataProvider}
        authProvider={authProvider}
        notificationProvider={notificationProvider}
        resources={resources}
        routerProvider={routerBindings}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          projectId: 'medical-portal-admin',
          disableTelemetry: true,
          // Deletes are optimistic with a 5s "Undo" window surfaced by the
          // sonner-backed notification provider (K.2 soft-delete UX).
          mutationMode: 'undoable',
          undoableTimeout: 5000,
          // Hardened React Query defaults (M.3). Admin data changes via the
          // admin's own actions, so a slightly longer staleTime is fine; we
          // still refetch on focus so multi-admin edits stay visible — except
          // on create/edit form routes, where focus refetching (and the session
          // re-check / token refresh it can trigger) is suppressed so unsaved
          // input is never disrupted.
          reactQuery: {
            clientConfig: {
              defaultOptions: {
                queries: {
                  staleTime: 60_000,
                  gcTime: 10 * 60_000,
                  refetchOnWindowFocus: () => !isOnFormRoute(),
                  retry: (count: number, error: unknown) => {
                    const status = (error as { statusCode?: number } | null)?.statusCode;
                    if (status && [401, 403, 404, 422].includes(status)) {
                      return false;
                    }
                    return count < 1;
                  },
                },
              },
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </Refine>
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
