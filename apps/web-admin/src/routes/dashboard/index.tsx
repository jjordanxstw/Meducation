/**
 * Admin Dashboard Page
 * Migrated from src/app/dashboard/page.tsx
 */

import { Card, Space, Typography } from 'antd';

const { Title, Text } = Typography;

const DashboardPage = () => {
  return (
    <Card>
      <Space direction="vertical" size={4}>
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">เลือกเมนูทางซ้ายเพื่อเริ่มจัดการข้อมูลระบบ</Text>
      </Space>
    </Card>
  );
};

export default DashboardPage;
