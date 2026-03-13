'use client';

/**
 * Client-side providers for the Refine admin panel
 * This component wraps all the client-side functionality including:
 * - HeroUI (UI component library)
 * - Refine (admin framework)
 * - Ant Design (UI library - being migrated)
 * - RefineKbar (command palette)
 */

import React, { Suspense } from 'react';
import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import {
  useNotificationProvider,
} from '@refinedev/antd';
import routerBindings from '@refinedev/nextjs-router';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import thTH from 'antd/locale/th_TH';

import { dataProvider } from '../providers/data-provider';
import { authProvider } from '../providers/auth-provider';
import { DashboardLayout } from '../components/DashboardLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Icons
import {
  BookOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileOutlined,
  CalendarOutlined,
  UserOutlined,
  AuditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

// Types for children
interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <RefineKbarProvider>
        <ConfigProvider
          locale={thTH}
          theme={{
            algorithm: theme.defaultAlgorithm,
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
              dataProvider={dataProvider(process.env.NEXT_PUBLIC_API_URL || '/api/v1')}
              authProvider={authProvider}
              routerProvider={routerBindings}
              notificationProvider={useNotificationProvider}
              resources={[
                {
                  name: 'dashboard',
                  list: '/dashboard',
                  meta: {
                    label: 'แดชบอร์ด',
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: 'subjects',
                  list: '/subjects',
                  create: '/subjects/create',
                  edit: '/subjects/edit/:id',
                  show: '/subjects/:id',
                  meta: {
                    label: 'รายวิชา',
                    icon: <BookOutlined />,
                  },
                },
                {
                  name: 'sections',
                  list: '/sections',
                  create: '/sections/create',
                  edit: '/sections/edit/:id',
                  meta: {
                    label: 'หมวดหมู่',
                    icon: <AppstoreOutlined />,
                  },
                },
                {
                  name: 'lectures',
                  list: '/lectures',
                  create: '/lectures/create',
                  edit: '/lectures/edit/:id',
                  meta: {
                    label: 'บทเรียน',
                    icon: <ReadOutlined />,
                  },
                },
                {
                  name: 'resources',
                  list: '/resources',
                  create: '/resources/create',
                  edit: '/resources/edit/:id',
                  meta: {
                    label: 'ไฟล์/สื่อ',
                    icon: <FileOutlined />,
                  },
                },
                {
                  name: 'calendar',
                  list: '/calendar',
                  create: '/calendar/create',
                  edit: '/calendar/edit/:id',
                  meta: {
                    label: 'ปฏิทิน',
                    icon: <CalendarOutlined />,
                  },
                },
                {
                  name: 'profiles',
                  list: '/profiles',
                  edit: '/profiles/edit/:id',
                  show: '/profiles/:id',
                  meta: {
                    label: 'ผู้ใช้งาน',
                    icon: <UserOutlined />,
                  },
                },
                {
                  name: 'audit-logs',
                  list: '/audit-logs',
                  meta: {
                    label: 'ประวัติการแก้ไข',
                    icon: <AuditOutlined />,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: 'medical-portal-admin',
              }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <DashboardLayout>{children}</DashboardLayout>
              </Suspense>

              <RefineKbar />
            </Refine>
          </AntdApp>
        </ConfigProvider>
      </RefineKbarProvider>
  );
};
