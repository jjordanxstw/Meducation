'use client';

/**
 * Admin Dashboard Page
 * Lightweight landing page to avoid extra initialization requests.
 */

import { Card, Space, Typography } from 'antd';

const { Title, Text } = Typography;

export default function DashboardPage() {
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
}
