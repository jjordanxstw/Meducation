/* eslint-disable react-refresh/only-export-components */

/**
 * Main Entry Point for Medical Portal Admin Panel
 * Vite + React + Refine.dev v4
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Refine } from '@refinedev/core';

// Latin (English) primary face. Browser falls through to Sarabun for Thai glyphs.
import '@fontsource/noto-sans/300.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';
// Thai primary face (Designed by Suppakit Chalermlarp). Includes Thai subset.
import '@fontsource/sarabun/300.css';
import '@fontsource/sarabun/400.css';
import '@fontsource/sarabun/500.css';
import '@fontsource/sarabun/600.css';
import '@fontsource/sarabun/700.css';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider, LOCALE_CHANGED_EVENT } from './providers/i18n-provider';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import { RefineThemes, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import thTH from 'antd/locale/th_TH';
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

const Root: React.FC = () => {
  const [locale, setLocale] = React.useState(i18nProvider.getLocale() ?? 'th');
  const tokens = HERO_TOKENS.dark;

  React.useEffect(() => {
    const onLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setLocale(customEvent.detail || (i18nProvider.getLocale() ?? 'th'));
    };

    window.addEventListener(LOCALE_CHANGED_EVENT, onLocaleChange);
    return () => {
      window.removeEventListener(LOCALE_CHANGED_EVENT, onLocaleChange);
    };
  }, []);

  const refineDataProvider = React.useMemo(
    () => dataProvider(resolvedApiUrl),
    []
  );

  const resources = buildResources((key: string, fallback: string) => i18nProvider.translate(key, {}, fallback));

  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        ...RefineThemes.Blue,
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: tokens.brand.primary,
          colorBgBase: tokens.bg.canvas,
          colorBgContainer: tokens.bg.surface,
          colorBgElevated: tokens.bg.surfaceElevated,
          colorBorder: tokens.border.default,
          colorBorderSecondary: tokens.border.subtle,
          colorTextBase: tokens.text.primary,
          colorText: tokens.text.primary,
          colorTextSecondary: tokens.text.secondary,
          colorTextTertiary: tokens.text.muted,
          colorLink: tokens.text.link,
          colorLinkHover: tokens.text.linkHover,
          colorSuccess: tokens.state.success.fg,
          colorWarning: tokens.state.warning.fg,
          colorError: tokens.state.danger.fg,
          colorInfo: tokens.state.info.fg,
          // Latin first (Noto Sans), Thai second (Sarabun). Browser handles
          // per-glyph fallback so mixed-language text renders cleanly in both
          // scripts without manual <span lang="..."> wrappers.
          fontFamily: "'Noto Sans', 'Sarabun', sans-serif",
          borderRadius: 12,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: '#07131f',
            headerBg: '#0a1628',
            siderBg: '#070f1a',
          },
          Card: {
            borderRadiusLG: 16,
            boxShadow: tokens.shadow.md,
            borderRadius: 16,
          },
          Table: {
            borderRadius: 12,
            headerBg: tokens.bg.muted,
            headerColor: tokens.text.primary,
          },
          Button: {
            borderRadius: 12,
            fontWeight: 500,
            boxShadow: tokens.shadow.sm,
          },
          Input: {
            borderRadius: 12,
          },
          Select: {
            borderRadius: 12,
          },
        },
      }}
    >
      <AntdApp>
        <Refine
          key={locale}
          dataProvider={refineDataProvider}
          authProvider={authProvider}
          i18nProvider={i18nProvider}
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

// Admin panel uses the dark premium aesthetic.
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
