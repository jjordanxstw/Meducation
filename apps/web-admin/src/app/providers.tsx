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
import { usePathname, useRouter } from 'next/navigation';
import {
  Authenticated,
  Refine,
  useIsAuthenticated,
  useIsExistAuthentication,
  useLink,
  useLogout,
  useMenu,
  useTranslate,
  useWarnAboutChange,
} from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import {
  RefineThemes,
  ThemedLayout,
  ThemedTitle,
  useNotificationProvider,
} from '@refinedev/antd';
import routerBindings from '@refinedev/nextjs-router';
import { ConfigProvider, App as AntdApp, Button, Layout, Menu, Spin } from 'antd';
import type { MenuProps } from 'antd';
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
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';

// Types for children
interface ProvidersProps {
  children: React.ReactNode;
}

const REFINE_RESOURCES = [
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
];

// Loading component for auth state
const AuthLoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f8fafc',
    }}
  >
    <Spin size="large" />
  </div>
);

const PublicRouteAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { data, isLoading, isFetching } = useIsAuthenticated();
  const isAuthenticated = data?.authenticated === true;

  React.useEffect(() => {
    if (!isLoading && !isFetching && isAuthenticated) {
      // replace prevents the root/login URL from staying in browser history
      // when user is already authenticated.
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isFetching, isLoading, router]);

  if (isLoading || isFetching || isAuthenticated) {
    return <AuthLoadingFallback />;
  }

  return <>{children}</>;
};

const AdminSider: React.FC<{
  Title?: React.FC<{ collapsed: boolean }>;
  meta?: Record<string, unknown>;
}> = ({ Title, meta }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta });
  const { mutate: logout } = useLogout();
  const isAuthenticated = useIsExistAuthentication();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const translate = useTranslate();
  const Link = useLink();

  const RenderTitle = Title ?? ThemedTitle;

  const handleLogout = () => {
    if (warnWhen) {
      const confirmed = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.'
        )
      );

      if (!confirmed) {
        return;
      }

      setWarnWhen(false);
    }

    logout();
  };

  const mapToMenuItems = React.useCallback(
    (tree: typeof menuItems): MenuProps['items'] => {
      return tree.map((item) => {
        const label = item.label ?? item.meta?.label ?? item.name;

        if (item.children.length > 0) {
          return {
            key: item.key,
            icon: item.meta?.icon,
            label,
            children: mapToMenuItems(item.children) as NonNullable<MenuProps['items']>,
          };
        }

        return {
          key: item.key,
          icon: item.meta?.icon,
          label: <Link to={item.list ?? ''}>{label}</Link>,
        };
      });
    },
    [Link, menuItems]
  );

  const items = React.useMemo<NonNullable<MenuProps['items']>>(() => {
    const mapped = (mapToMenuItems(menuItems) ?? []) as NonNullable<MenuProps['items']>;

    if (isAuthenticated) {
      mapped.push({
        type: 'divider',
      });
      mapped.push({
        key: 'logout',
        icon: <LogoutOutlined />,
        label: translate('buttons.logout', 'Logout'),
        onClick: handleLogout,
      });
    }

    return mapped;
  }, [handleLogout, isAuthenticated, mapToMenuItems, menuItems, translate]);

  const collapseIcon = collapsed ? <RightOutlined /> : <LeftOutlined />;

  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      collapsedWidth={80}
      breakpoint="lg"
      style={{
        backgroundColor: '#fff',
        borderRight: '1px solid #f0f0f0',
        position: 'relative',
      }}
      trigger={
        <Button
          type="text"
          style={{
            borderRadius: 0,
            height: '100%',
            width: '100%',
            position: 'relative',
            zIndex: 1,
            backgroundColor: '#fff',
            borderTop: '1px solid #f0f0f0',
          }}
          className="sidebar-collapse-trigger"
        >
          {collapseIcon}
        </Button>
      }
    >
      <div
        style={{
          width: collapsed ? '80px' : '200px',
          padding: collapsed ? '0' : '0 16px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
          alignItems: 'center',
          height: '64px',
        }}
      >
        <RenderTitle collapsed={collapsed} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        defaultOpenKeys={defaultOpenKeys}
        items={items}
        style={{
          border: 'none',
          height: 'calc(100% - 64px)',
          overflow: 'auto',
        }}
      />
    </Layout.Sider>
  );
};

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const pathname = usePathname();
  const refineDataProvider = React.useMemo(
    () => dataProvider(process.env.NEXT_PUBLIC_API_URL || '/api/v1'),
    []
  );

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
              dataProvider={refineDataProvider}
              authProvider={authProvider}
              i18nProvider={i18nProvider}
              routerProvider={routerBindings}
              notificationProvider={useNotificationProvider}
              resources={REFINE_RESOURCES}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: 'medical-portal-admin',
                title: {
                  text: 'Medical Admin',
                },
              }}
            >
              {pathname === '/' || pathname.startsWith('/login') ? (
                <PublicRouteAuthGate>{children}</PublicRouteAuthGate>
              ) : (
                <Authenticated
                  key="protected-auth"
                  redirectOnFail="/"
                  loading={<AuthLoadingFallback />}
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
