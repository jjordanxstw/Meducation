/**
 * Admin Dashboard Page
 * Migrated from src/app/dashboard/page.tsx
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, List, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import { useTranslate } from '@refinedev/core';
import dayjs from 'dayjs';
import { authAxios } from '../../providers/auth-provider';

const { Title, Text } = Typography;

type DashboardOverview = {
  kpis: {
    subjects: { total: number; active: number };
    sections: { total: number; active: number };
    lectures: { total: number; active: number };
    resources: { total: number; active: number };
    profiles: { total: number; active: number };
    calendarEvents: { total: number; active: number };
  };
  studentsByYear: Array<{ yearLevel: number; count: number }>;
  upcomingEvents: Array<{ id: string; title: string; type: string; start_time: string }>;
  recentAuditLogs: Array<{ id: string; action: string; table_name: string; user_email: string | null; created_at: string }>;
};

const DashboardPage = () => {
  const t = useTranslate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      try {
        const response = await authAxios.get('/api/v1/admin/statistics/overview');
        if (!mounted) {
          return;
        }
        setOverview(response.data?.data ?? null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { key: 'subjects', label: t('menu.subjects', {}, 'Subjects'), value: overview?.kpis.subjects.total ?? 0 },
      { key: 'sections', label: t('menu.sections', {}, 'Sections'), value: overview?.kpis.sections.total ?? 0 },
      { key: 'lectures', label: t('menu.lectures', {}, 'Lectures'), value: overview?.kpis.lectures.total ?? 0 },
      { key: 'resources', label: t('menu.resources', {}, 'Resources'), value: overview?.kpis.resources.total ?? 0 },
      { key: 'profiles', label: t('menu.profiles', {}, 'Profiles'), value: overview?.kpis.profiles.total ?? 0 },
      { key: 'calendar', label: t('menu.calendar', {}, 'Calendar'), value: overview?.kpis.calendarEvents.total ?? 0 },
    ],
    [overview, t],
  );

  if (loading) {
    return (
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', alignItems: 'center' }}>
          <Spin size="large" />
          <Text type="secondary">{t('common.loading', {}, 'Loading dashboard...')}</Text>
        </Space>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card>
        <Empty description={t('pages.dashboard.noData', {}, 'Dashboard data is unavailable')} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={4}>
          <Title level={3} style={{ margin: 0 }}>
            {t('pages.dashboard.title', {}, 'Dashboard')}
          </Title>
          <Text type="secondary">{t('pages.dashboard.subtitle', {}, 'Select a menu item to manage the system')}</Text>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        {cards.map((card) => (
          <Col key={card.key} xs={24} sm={12} lg={8} xl={4}>
            <Card>
              <Statistic title={card.label} value={card.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={10}>
          <Card title={t('pages.dashboard.studentsByYear', {}, 'Students By Year')}>
            {overview.studentsByYear.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {overview.studentsByYear.map((item) => (
                  <Row key={item.yearLevel} justify="space-between">
                    <Text>{`${t('common.yearPrefix', {}, 'Year')} ${item.yearLevel}`}</Text>
                    <Text strong>{item.count}</Text>
                  </Row>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={t('pages.dashboard.upcomingEvents', {}, 'Upcoming Events')}>
            <List
              size="small"
              locale={{ emptyText: t('pages.dashboard.noUpcomingEvents', {}, 'No upcoming events') }}
              dataSource={overview.upcomingEvents}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Space>
                      <Text strong>{item.title}</Text>
                      <Tag>{item.type}</Tag>
                    </Space>
                    <Text type="secondary">{dayjs(item.start_time).format('DD/MM/YYYY HH:mm')}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('pages.dashboard.recentAuditLogs', {}, 'Recent Audit Logs')}>
        <List
          size="small"
          locale={{ emptyText: t('pages.dashboard.noAuditLogs', {}, 'No recent audit logs') }}
          dataSource={overview.recentAuditLogs}
          renderItem={(item) => (
            <List.Item>
              <Row style={{ width: '100%' }} justify="space-between" wrap>
                <Col>
                  <Space>
                    <Tag color={item.action === 'DELETE' ? 'red' : item.action === 'INSERT' ? 'green' : 'blue'}>{item.action}</Tag>
                    <Text>{item.table_name}</Text>
                    <Text type="secondary">{item.user_email ?? t('common.notAvailable', {}, '-')}</Text>
                  </Space>
                </Col>
                <Col>
                  <Text type="secondary">{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
              </Row>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default DashboardPage;
