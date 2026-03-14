/**
 * Main Entry Point for Medical Portal Admin Panel
 * Vite + React + Refine.dev v4
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Refine } from '@refinedev/core';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './providers/i18n-provider';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RefineThemes, useNotificationProvider } from '@refinedev/antd';
import thTH from 'antd/locale/th_TH';
import './index.css';

// Import router and resources
import { router } from './routes';
import { resources } from './resources';

const Root: React.FC = () => {
  const refineDataProvider = React.useMemo(
    () => dataProvider(import.meta.env.VITE_API_URL || '/api/v1'),
    []
  );

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
          dataProvider={refineDataProvider}
          authProvider={authProvider}
          i18nProvider={i18nProvider}
          notificationProvider={useNotificationProvider}
          resources={resources}
          routerProvider={{
            type: 'react-router-v6',
            router,
          }}
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
