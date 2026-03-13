'use client';

/**
 * Custom Sider component using the new Ant Design Menu items API
 * This replaces the deprecated children prop with items prop
 */

import React, { useMemo } from 'react';
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
} from '@ant-design/icons';
import { useNavigation, useTranslate } from '@refinedev/core';
import { useMenu } from '@refinedev/core';
import type { ItemType } from 'antd/es/menu/hooks/useItems';

const { Sider } = Layout;

export const CustomSider: React.FC = () => {
  const { menuItems, selectedKey } = useMenu();
  const { push } = useNavigation();
  const t = useTranslate();

  const menuItemsWithIcons: ItemType[] = useMemo(() => {
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
      label: item.label,
      onClick: () => {
        if (item.route) {
          push(item.route);
        }
      },
    }));
  }, [menuItems, push]);

  return (
    <Sider
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f0f0f0',
      }}
      theme="light"
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #0070F3 0%, #1d4ed8 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          M
        </div>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItemsWithIcons}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default CustomSider;
