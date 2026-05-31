/* eslint-disable react-refresh/only-export-components */

/**
 * Main Entry Point for Medical Portal Admin Panel
 * Vite + React + Refine.dev v4 — single light (blue/white) theme, English only.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Refine } from '@refinedev/core';

// Latin (English) UI face.
import '@fontsource/noto-sans/300.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import { RefineThemes, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import { HERO_TOKENS } from '@medical-portal/shared';
import './index.css';

// Import router and resources
import { router } from './routes';
import { buildResources } from './resources';

const resolvedApiUrl = '/api/v1';

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

const tokens = HERO_TOKENS.light;

const Root: React.FC = () => {
  const refineDataProvider = React.useMemo(
    () => dataProvider(resolvedApiUrl),
    []
  );

  const resources = buildResources();

  return (
    <ConfigProvider
      theme={{
        ...RefineThemes.Blue,
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1d4ed8',
          colorBgBase: tokens.bg.canvas,
          colorBgContainer: tokens.bg.surface,
          colorBgElevated: tokens.bg.surfaceElevated,
          colorBorder: tokens.border.default,
          colorBorderSecondary: tokens.border.subtle,
          colorTextBase: tokens.text.primary,
          colorText: tokens.text.primary,
          colorTextSecondary: tokens.text.secondary,
          colorTextTertiary: tokens.text.muted,
          colorLink: '#1d4ed8',
          colorLinkHover: '#1e40af',
          colorSuccess: tokens.state.success.fg,
          colorWarning: tokens.state.warning.fg,
          colorError: tokens.state.danger.fg,
          colorInfo: tokens.state.info.fg,
          fontFamily: "'Noto Sans', sans-serif",
          borderRadius: 12,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: tokens.admin.layoutBg,
            headerBg: tokens.admin.headerBg,
            // Dark-navy sidebar (web-admin only; shared tokens stay light).
            siderBg: '#0f2147',
            triggerBg: '#0f2147',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: 'rgba(255, 255, 255, 0.72)',
            itemHoverBg: 'rgba(255, 255, 255, 0.08)',
            itemHoverColor: '#ffffff',
            itemSelectedBg: 'rgba(255, 255, 255, 0.14)',
            itemSelectedColor: '#ffffff',
          },
          Card: {
            borderRadiusLG: 16,
            boxShadow: tokens.shadow.sm,
            borderRadius: 16,
          },
          Table: {
            borderRadius: 12,
            headerBg: tokens.bg.muted,
            headerColor: tokens.text.secondary,
          },
          Button: {
            borderRadius: 10,
            fontWeight: 500,
            boxShadow: 'none',
          },
          Input: {
            borderRadius: 10,
          },
          Select: {
            borderRadius: 10,
          },
        },
      }}
    >
      <AntdApp>
        <Refine
          dataProvider={refineDataProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          resources={resources}
          routerProvider={routerBindings}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            projectId: 'medical-portal-admin',
            disableTelemetry: true,
            // Deletes are optimistic with a 5s "Undo" window surfaced by the
            // notification provider (K.2 soft-delete UX).
            mutationMode: 'undoable',
            undoableTimeout: 5000,
            // Hardened React Query defaults (M.3). Admin data changes via the
            // admin's own actions, so a slightly longer staleTime is fine; we
            // still refetch on focus so multi-admin edits stay visible.
            reactQuery: {
              clientConfig: {
                defaultOptions: {
                  queries: {
                    staleTime: 60_000,
                    gcTime: 10 * 60_000,
                    refetchOnWindowFocus: true,
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
      </AntdApp>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
