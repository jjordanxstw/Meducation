'use client';

/**
 * Custom Sider component with collapse functionality
 * Uses the new Ant Design Menu items API
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Menu } from 'antd';
import {
  BookOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileOutlined,
  CalendarOutlined,
  UserOutlined,
  AuditOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useMenu, useLogout } from '@refinedev/core';

const { Sider } = Layout;

// Define a simple type for menu items instead of importing from antd
interface MenuItemType {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const CustomSider: React.FC = () => {
  const { menuItems, selectedKey } = useMenu();
  const { mutate: logout } = useLogout();
  const router = useRouter();

  // Collapse state with localStorage persistence
  // Start with default false to prevent hydration mismatch
  const [collapsed, setCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize from localStorage on client side
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Calculate sidebar width based on collapse state
  const siderWidth = collapsed ? 80 : 200;

  // Emit event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('sidebar-changed', {
      detail: { width: siderWidth, collapsed }
    });
    window.dispatchEvent(event);
  }, [siderWidth, collapsed]);

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newCollapsed));
    }
  };

  const handleLogout = () => {
    logout();
  };

  const menuItemsWithIcons: MenuItemType[] = useMemo(() => {
    const iconMap: Record<string, React.ReactNode> = {
      dashboard: <DashboardOutlined />,
      subjects: <BookOutlined />,
      sections: <AppstoreOutlined />,
      lectures: <ReadOutlined />,
      resources: <FileOutlined />,
      calendar: <CalendarOutlined />,
      profiles: <UserOutlined />,
      'audit-logs': <AuditOutlined />,
    };

    return menuItems.map((item) => ({
      key: item.key,
      icon: iconMap[item.key || ''],
      label: collapsed ? '' : (item.label || item.key), // Hide text when collapsed
      onClick: () => {
        if (item.route) {
          router.push(item.route);
        }
      },
    }));
  }, [menuItems, router, collapsed]);

  // Add collapse and logout items
  const allMenuItems = [
    ...menuItemsWithIcons,
    {
      key: 'collapse',
      icon: collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />,
      label: collapsed ? 'ขยาย' : 'ย่อ',
      onClick: toggleCollapse,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: collapsed ? '' : 'ออกจากระบบ',
      onClick: handleLogout,
    },
  ];

  return (
    <Sider
      width={siderWidth}
      collapsedWidth={80}
      collapsed={collapsed}
      onCollapse={(collapsed) => {
        setCollapsed(collapsed);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebar-collapsed', String(collapsed));
        }
      }}
      style={{
        overflow: 'hidden',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f0f0f0',
      }}
      theme="light"
      trigger={null} // Disable default trigger
    >
      {/* Logo/Header */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: collapsed ? 0 : '16px',
        }}
      >
        <div
          style={{
            width: collapsed ? 32 : 40,
            height: collapsed ? 32 : 40,
            background: 'linear-gradient(135deg, #0070F3 0%, #1d4ed8 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: collapsed ? 14 : 18,
          }}
        >
          M
        </div>
      </div>

      {/* Menu */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={allMenuItems as any}
        style={{ borderRight: 0, flex: 1 }}
        inlineCollapsed={collapsed}
      />
    </Sider>
  );
};

export default CustomSider;
