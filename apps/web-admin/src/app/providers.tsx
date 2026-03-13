'use client';

/**
 * Client-side providers for the Refine admin panel
 * This component wraps all the client-side functionality including:
 * - HeroUI (UI component library)
 * - Refine (admin framework)
 * - Ant Design (UI library - being migrated)
 * - RefineKbar (command palette)
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import { Authenticated, Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import {
  RefineThemes,
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
} from '@refinedev/antd';
import routerBindings from '@refinedev/nextjs-router';
import { ConfigProvider, App as AntdApp } from 'antd';
import thTH from 'antd/locale/th_TH';

import { dataProvider } from '../providers/data-provider';
import { authProvider } from '../providers/auth-provider';
import { i18nProvider } from '../providers/i18n-provider';

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

const AdminSider: React.FC<{
  Title?: React.FC<{ collapsed: boolean }>;
  render?: (props: {
    items: React.JSX.Element[];
    logout: React.ReactNode;
    collapsed: boolean;
  }) => React.ReactNode;
  meta?: Record<string, unknown>;
}> = ({ render, ...props }) => {
  return (
    <ThemedSider
      {...props}
      render={({ items, logout, collapsed }) => {
        const logoutWithClass = React.isValidElement(logout)
          ? React.cloneElement(
              logout as React.ReactElement<{ className?: string }>,
              {
                className: [
                  (logout.props as { className?: string })?.className,
                  'admin-sider-logout',
                ]
                  .filter(Boolean)
                  .join(' '),
              }
            )
          : logout;

        if (render) {
          return render({ items, logout: logoutWithClass, collapsed });
        }

        return [...items, logoutWithClass].filter(Boolean);
      }}
    />
  );
};

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/' || pathname === '/login';

  return (
    <RefineKbarProvider>
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
              dataProvider={dataProvider(process.env.NEXT_PUBLIC_API_URL || '/api/v1')}
              authProvider={authProvider}
              i18nProvider={i18nProvider}
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
                title: {
                  text: 'Medical Admin',
                },
              }}
            >
              {isAuthRoute ? (
                children
              ) : (
                <Authenticated
                  key={`protected:${pathname}`}
                  redirectOnFail="/"
                >
                  <ThemedLayout Sider={AdminSider}>{children}</ThemedLayout>
                </Authenticated>
              )}

              <RefineKbar />
            </Refine>
          </AntdApp>
        </ConfigProvider>
      </RefineKbarProvider>
  );
};
