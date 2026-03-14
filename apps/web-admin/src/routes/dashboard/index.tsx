/**
 * Admin Dashboard Page
 * Migrated from src/app/dashboard/page.tsx
 */

import { Card, Space, Typography } from 'antd';
import { useTranslate } from '@refinedev/core';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const t = useTranslate();
  return (
    <Card>
      <Space direction="vertical" size={4}>
        <Title level={3} style={{ margin: 0 }}>
          {t('pages.dashboard.title', {}, 'Dashboard')}
        </Title>
        <Text type="secondary">{t('pages.dashboard.subtitle', {}, 'Select a menu item to manage the system')}</Text>
      </Space>
    </Card>
  );
};

export default DashboardPage;
