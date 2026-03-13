'use client';

/**
 * Admin Dashboard Page
 */

import { useList } from '@refinedev/core';
import { Card, Col, Row, Statistic, Table, Typography, Tag } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  FileOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DashboardPage() {
  // Get counts
  const { result: subjectsResult } = useList({ resource: 'subjects' });
  const { result: profilesResult } = useList({ resource: 'profiles' });
  const { result: calendarResult } = useList({ resource: 'calendar' });
  const { result: auditResult } = useList({
    resource: 'audit-logs',
  });

  const stats = [
    {
      title: 'รายวิชา',
      value: subjectsResult?.total || 0,
      icon: <BookOutlined style={{ fontSize: 24, color: '#0070F3' }} />,
      color: '#e6f4ff',
    },
    {
      title: 'ผู้ใช้งาน',
      value: profilesResult?.total || 0,
      icon: <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: 'กิจกรรม',
      value: calendarResult?.total || 0,
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      color: '#f9f0ff',
    },
    {
      title: 'ไฟล์/สื่อ',
      value: 0,
      icon: <FileOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
  ];

  const auditColumns = [
    {
      title: 'ตาราง',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'การกระทำ',
      dataIndex: 'action',
      key: 'action',
      render: (value: string) => {
        const colors: Record<string, string> = {
          INSERT: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
        };
        return <Tag color={colors[value] || 'default'}>{value}</Tag>;
      },
    },
    {
      title: 'วันที่',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) =>
        new Date(value).toLocaleString('th-TH', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in', padding: '0 8px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontFamily: 'Kanit', marginBottom: 8, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
          แดชบอร์ด
        </Title>
        <Text type="secondary" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
          ภาพรวมระบบและสถิติสำคัญ
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{
                background: stat.color,
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{
                  fontFamily: 'Kanit',
                  fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: 'Kanit', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 600 }}>
                กิจกรรมล่าสุด
              </span>
            }
            style={{ borderRadius: 16, border: 'none' }}
          >
            <Table
              dataSource={auditResult?.data?.slice(0, 5) || []}
              columns={auditColumns}
              pagination={false}
              size="small"
              rowKey="id"
              style={{ borderRadius: 12 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: 'Kanit', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 600 }}>
                รายวิชาล่าสุด
              </span>
            }
            style={{ borderRadius: 16, border: 'none' }}
          >
            <Table
              dataSource={subjectsResult?.data?.slice(0, 5) || []}
              columns={[
                {
                  title: 'รหัส',
                  dataIndex: 'code',
                  key: 'code',
                  render: (text: string) => (
                    <Tag color="blue" style={{ borderRadius: 6, fontSize: '0.75rem' }}>
                      {text}
                    </Tag>
                  ),
                },
                {
                  title: 'ชื่อวิชา',
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true,
                },
                {
                  title: 'ชั้นปี',
                  dataIndex: 'year_level',
                  key: 'year_level',
                  render: (v: number) => (
                    <Tag color="cyan" style={{ borderRadius: 6, fontSize: '0.75rem' }}>
                      ปี {v}
                    </Tag>
                  ),
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
              style={{ borderRadius: 12 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
