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

import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/prompt/300.css';
import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/600.css';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider, LOCALE_CHANGED_EVENT } from './providers/i18n-provider';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RefineThemes, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import thTH from 'antd/locale/th_TH';
import './index.css';

// Import router and resources
import { router } from './routes';
import { buildResources } from './resources';

const resolvedApiUrl = import.meta.env.VITE_API_URL || '/api/v1';

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
        token: {
          colorPrimary: '#0070F3',
          fontFamily: 'Prompt, sans-serif',
          borderRadius: 12,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: '#f8fafc',
            headerBg: '#ffffff',
            siderBg: '#ffffff',
          },
          Card: {
            borderRadiusLG: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
            borderRadius: 16,
          },
          Table: {
            borderRadius: 12,
            headerBg: '#f8fafc',
            headerColor: '#0f172a',
          },
          Button: {
            borderRadius: 12,
            fontWeight: 500,
            boxShadow: '0 2px 4px rgba(0, 112, 243, 0.2)',
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
