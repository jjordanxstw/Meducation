/**
 * Admin Dashboard Page
 *
 * UX goals:
 * - Show both total and active counts on every KPI card with a progress bar.
 * - Replace the plain "Students by Year" rows with an interactive bar chart.
 * - Add an "Activity over time" line chart with a granularity (day/week/month)
 *   and date-range picker, backed by /admin/statistics/activity.
 * - Render upcoming events as a colour-coded Timeline with relative times.
 * - Render audit logs as a filterable, paginated Table with action chips.
 * - Add a welcome banner, last-updated timestamp + manual refresh, and a
 *   quick-actions row that deep-links into the most common create flows.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Progress,
  Radio,
  Row,
  Segmented,
  Skeleton,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Column, Line } from '@ant-design/charts';
import {
  AuditOutlined,
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useGetIdentity, useGo, useTranslate } from '@refinedev/core';
import dayjs, { type Dayjs } from 'dayjs';
import { authAxios } from '../../providers/auth-provider';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

type CountPair = { total: number; active: number };

type DashboardOverview = {
  kpis: {
    subjects: CountPair;
    sections: CountPair;
    lectures: CountPair;
    resources: CountPair;
    profiles: CountPair;
    calendarEvents: CountPair;
  };
  studentsByYear: Array<{ yearLevel: number; count: number }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    type: string;
    start_date?: string;
    end_date?: string | null;
    start_time?: string;
    location?: string | null;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    table_name: string;
    record_id?: string | null;
    user_email: string | null;
    created_at: string;
  }>;
};

type ActivityResponse = {
  granularity: 'day' | 'week' | 'month';
  from: string;
  to: string;
  buckets: Array<{
    bucket: string;
    newProfiles: number;
    newLectures: number;
    newAuditEvents: number;
  }>;
  totals: {
    newProfiles: number;
    newLectures: number;
    newAuditEvents: number;
  };
};

type AdminIdentity = {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  isSuperAdmin?: boolean;
};

type RangePreset = '7d' | '30d' | '90d' | 'custom';
type Granularity = 'day' | 'week' | 'month';

const PRESET_RANGES: Record<Exclude<RangePreset, 'custom'>, number> = {
  '7d': 6,
  '30d': 29,
  '90d': 89,
};

function defaultRangeFor(preset: Exclude<RangePreset, 'custom'>): [Dayjs, Dayjs] {
  const end = dayjs().startOf('day');
  const start = end.subtract(PRESET_RANGES[preset], 'day');
  return [start, end];
}

const KPI_DEFINITIONS = [
  {
    key: 'subjects' as const,
    accent: '#1677ff',
    icon: <BookOutlined />,
    labelKey: 'pages.dashboard.kpi.subjects',
    fallback: 'Subjects',
  },
  {
    key: 'sections' as const,
    accent: '#722ed1',
    icon: <UnorderedListOutlined />,
    labelKey: 'pages.dashboard.kpi.sections',
    fallback: 'Sections',
  },
  {
    key: 'lectures' as const,
    accent: '#13c2c2',
    icon: <ReadOutlined />,
    labelKey: 'pages.dashboard.kpi.lectures',
    fallback: 'Lectures',
  },
  {
    key: 'resources' as const,
    accent: '#fa8c16',
    icon: <FileTextOutlined />,
    labelKey: 'pages.dashboard.kpi.resources',
    fallback: 'Resources',
  },
  {
    key: 'profiles' as const,
    accent: '#52c41a',
    icon: <TeamOutlined />,
    labelKey: 'pages.dashboard.kpi.profiles',
    fallback: 'Profiles',
  },
  {
    key: 'calendarEvents' as const,
    accent: '#eb2f96',
    icon: <CalendarOutlined />,
    labelKey: 'pages.dashboard.kpi.calendarEvents',
    fallback: 'Calendar events',
  },
];

const EVENT_COLORS: Record<string, string> = {
  exam: '#cf1322',
  lecture: '#1677ff',
  holiday: '#faad14',
  event: '#52c41a',
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

function formatRelativeTime(target: dayjs.Dayjs, now: dayjs.Dayjs, t: ReturnType<typeof useTranslate>): string {
  const diffMs = target.diff(now);
  const absMs = Math.abs(diffMs);

  if (absMs < 60_000) {
    return t('pages.dashboard.timeline.now', {}, 'happening now');
  }

  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  let value: string;
  if (days >= 1) {
    value = `${days}d`;
  } else if (hours >= 1) {
    value = `${hours}h`;
  } else {
    value = `${minutes}m`;
  }

  if (diffMs >= 0) {
    return t('pages.dashboard.timeline.relativeIn', { value }, `in ${value}`);
  }

  return t('pages.dashboard.timeline.relativeAgo', { value }, `${value} ago`);
}

const DashboardPage = () => {
  const t = useTranslate();
  const go = useGo();
  const { data: identity } = useGetIdentity<AdminIdentity>();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [granularity, setGranularity] = useState<Granularity>('day');
  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs]>(() => defaultRangeFor('30d'));
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Dayjs | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [nowTick, setNowTick] = useState<Dayjs>(() => dayjs());

  // M.10: auto-refresh stats every 60s while the tab is visible so an admin
  // sees changes made by others without manually refreshing.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefreshTick((tick) => tick + 1);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Live "last updated X ago" counter — ticks every 10s.
  useEffect(() => {
    const id = setInterval(() => setNowTick(dayjs()), 10_000);
    return () => clearInterval(id);
  }, []);

  const effectiveRange = useMemo<[Dayjs, Dayjs]>(() => {
    if (rangePreset === 'custom') {
      return customRange;
    }
    return defaultRangeFor(rangePreset);
  }, [rangePreset, customRange]);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const response = await authAxios.get('/api/v1/admin/statistics/overview');
        if (!mounted) {
          return;
        }
        setOverview(response.data?.data ?? null);
        setLastUpdated(dayjs());
      } catch (error) {
        if (!mounted) {
          return;
        }
        setOverviewError(t('pages.dashboard.noData', {}, 'Dashboard data is unavailable'));
      } finally {
        if (mounted) {
          setOverviewLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, [refreshTick, t]);

  useEffect(() => {
    let mounted = true;
    const [from, to] = effectiveRange;

    const loadActivity = async () => {
      setActivityLoading(true);
      setActivityError(null);
      try {
        const response = await authAxios.get('/api/v1/admin/statistics/activity', {
          params: {
            from: from.format('YYYY-MM-DD'),
            to: to.format('YYYY-MM-DD'),
            granularity,
          },
        });
        if (!mounted) {
          return;
        }
        setActivity(response.data?.data ?? null);
      } catch {
        if (!mounted) {
          return;
        }
        setActivityError(t('pages.dashboard.activity.empty', {}, 'No activity in the selected range'));
        setActivity(null);
      } finally {
        if (mounted) {
          setActivityLoading(false);
        }
      }
    };

    void loadActivity();

    return () => {
      mounted = false;
    };
  }, [effectiveRange, granularity, refreshTick, t]);

  const handleRefresh = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  const handleRangePresetChange = useCallback((value: string | number) => {
    const preset = value as RangePreset;
    setRangePreset(preset);
    if (preset !== 'custom') {
      setCustomRange(defaultRangeFor(preset));
    }
  }, []);

  const handleCustomRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      return;
    }
    setRangePreset('custom');
    setCustomRange([dates[0].startOf('day'), dates[1].startOf('day')]);
  }, []);

  // Charts use a normalized long-form dataset so that legends, tooltips, and
  // colour mapping stay consistent.
  const activityChartData = useMemo(() => {
    if (!activity) {
      return [];
    }

    const series: Array<{ bucket: string; series: string; value: number }> = [];
    for (const point of activity.buckets) {
      series.push({
        bucket: point.bucket,
        series: t('pages.dashboard.activity.newProfiles', {}, 'New users'),
        value: point.newProfiles,
      });
      series.push({
        bucket: point.bucket,
        series: t('pages.dashboard.activity.newLectures', {}, 'New lectures'),
        value: point.newLectures,
      });
      series.push({
        bucket: point.bucket,
        series: t('pages.dashboard.activity.newAuditEvents', {}, 'Audit events'),
        value: point.newAuditEvents,
      });
    }
    return series;
  }, [activity, t]);

  const studentsChartData = useMemo(() => {
    if (!overview?.studentsByYear) {
      return [];
    }
    return overview.studentsByYear.map((row) => ({
      year: `${t('common.yearPrefix', {}, 'Year')} ${row.yearLevel}`,
      count: row.count,
      yearLevel: row.yearLevel,
    }));
  }, [overview, t]);

  const filteredAuditLogs = useMemo(() => {
    if (!overview?.recentAuditLogs) {
      return [];
    }
    if (!actionFilter) {
      return overview.recentAuditLogs;
    }
    return overview.recentAuditLogs.filter((log) => log.action === actionFilter);
  }, [overview, actionFilter]);

  const auditColumns = useMemo<ColumnsType<DashboardOverview['recentAuditLogs'][number]>>(
    () => [
      {
        title: t('pages.dashboard.audit.action', {}, 'Action'),
        dataIndex: 'action',
        key: 'action',
        width: 110,
        render: (action: string) => (
          <Tag color={ACTION_COLORS[action] ?? 'default'} style={{ fontWeight: 500 }}>
            {action}
          </Tag>
        ),
      },
      {
        title: t('pages.dashboard.audit.table', {}, 'Table'),
        dataIndex: 'table_name',
        key: 'table_name',
        ellipsis: true,
      },
      {
        title: t('pages.dashboard.audit.user', {}, 'User'),
        dataIndex: 'user_email',
        key: 'user_email',
        ellipsis: true,
        render: (email: string | null) =>
          email ? (
            <Space size={6} align="center">
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(22, 119, 255, 0.12)',
                  color: '#1677ff',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {email.slice(0, 1).toUpperCase()}
              </span>
              <Text>{email}</Text>
            </Space>
          ) : (
            <Text type="secondary">{t('common.notAvailable', {}, '-')}</Text>
          ),
      },
      {
        title: t('pages.dashboard.audit.time', {}, 'Time'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (createdAt: string) => (
          <Tooltip title={dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}>
            <Text type="secondary">{dayjs(createdAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Tooltip>
        ),
      },
    ],
    [t],
  );

  const welcomeName = identity?.name ?? identity?.username ?? '';
  const welcomeMessage = welcomeName
    ? t('pages.dashboard.welcome', { name: welcomeName }, `Welcome back, ${welcomeName}`)
    : t('pages.dashboard.welcomeFallback', {}, 'Welcome to the admin console');

  const isLoadingOverview = overviewLoading && !overview;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Welcome / refresh banner */}
      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #1b2d48 0%, #21385a 100%)', color: '#fff' }}>
        <Row align="middle" justify="space-between" gutter={[12, 12]} wrap>
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#fff', marginBottom: 4 }}>
              {welcomeMessage}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.78)', margin: 0 }}>
              {t('pages.dashboard.subtitle', {}, 'Select a menu item to manage the system')}
            </Paragraph>
          </Col>
          <Col xs={24} md="auto">
            <Space size={8} wrap>
              {lastUpdated && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {t('pages.dashboard.lastUpdated', {}, 'Last updated')}:{' '}
                  {Math.max(0, nowTick.diff(lastUpdated, 'second'))}s {t('pages.dashboard.ago', {}, 'ago')}
                </Text>
              )}
              <Button
                ghost
                icon={<ReloadOutlined spin={overviewLoading || activityLoading} />}
                onClick={handleRefresh}
                disabled={overviewLoading && activityLoading}
              >
                {t('buttons.refresh', {}, 'Refresh')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {overviewError && (
        <Alert type="error" showIcon message={overviewError} />
      )}

      {/* KPI cards */}
      <Row gutter={[12, 12]}>
        {KPI_DEFINITIONS.map((definition) => {
          const pair = overview?.kpis[definition.key];
          const total = pair?.total ?? 0;
          const active = pair?.active ?? 0;
          const ratio = total > 0 ? Math.round((active / total) * 100) : 0;

          return (
            <Col key={definition.key} xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card
                size="small"
                style={{
                  borderTop: `3px solid ${definition.accent}`,
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                bodyStyle={{ padding: 14 }}
                hoverable
              >
                {isLoadingOverview ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <Row align="middle" justify="space-between" wrap={false}>
                      <Col flex="auto" style={{ minWidth: 0 }}>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {t(definition.labelKey, {}, definition.fallback)}
                        </Text>
                        <Title level={3} style={{ margin: '4px 0 0', color: definition.accent }}>
                          {overviewError ? '—' : total.toLocaleString()}
                        </Title>
                      </Col>
                      <Col>
                        <span
                          aria-hidden
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: `${definition.accent}1a`,
                            color: definition.accent,
                            fontSize: 16,
                          }}
                        >
                          {definition.icon}
                        </span>
                      </Col>
                    </Row>
                    <div style={{ marginTop: 10 }}>
                      <Progress
                        percent={ratio}
                        size="small"
                        showInfo={false}
                        strokeColor={definition.accent}
                        trailColor="rgba(255,255,255,0.08)"
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('pages.dashboard.kpi.activeRatio', { active, total }, `${active}/${total} active`)}
                      </Text>
                    </div>
                  </>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Quick actions */}
      <Card title={t('pages.dashboard.quickActions', {}, 'Quick actions')} size="small">
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => go({ to: { resource: 'subjects', action: 'create' } })}
          >
            {t('pages.dashboard.quickActions.newSubject', {}, 'New subject')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => go({ to: { resource: 'lectures', action: 'create' } })}
          >
            {t('pages.dashboard.quickActions.newLecture', {}, 'New lecture')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => go({ to: { resource: 'calendar', action: 'create' } })}
          >
            {t('pages.dashboard.quickActions.newEvent', {}, 'New calendar event')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => go({ to: { resource: 'announcements', action: 'create' } })}
          >
            {t('pages.dashboard.quickActions.newAnnouncement', {}, 'New announcement')}
          </Button>
        </Space>
      </Card>

      {/* Activity over time */}
      <Card
        title={
          <Space size={8}>
            <ClockCircleOutlined />
            {t('pages.dashboard.activityTitle', {}, 'Activity over time')}
          </Space>
        }
        extra={
          <Space size={8} wrap>
            <Segmented
              value={granularity}
              onChange={(value) => setGranularity(value as Granularity)}
              options={[
                { label: t('pages.dashboard.granularity.day', {}, 'Daily'), value: 'day' },
                { label: t('pages.dashboard.granularity.week', {}, 'Weekly'), value: 'week' },
                { label: t('pages.dashboard.granularity.month', {}, 'Monthly'), value: 'month' },
              ]}
            />
            <Radio.Group
              value={rangePreset}
              onChange={(event) => handleRangePresetChange(event.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="7d">{t('pages.dashboard.range.7d', {}, 'Last 7 days')}</Radio.Button>
              <Radio.Button value="30d">{t('pages.dashboard.range.30d', {}, 'Last 30 days')}</Radio.Button>
              <Radio.Button value="90d">{t('pages.dashboard.range.90d', {}, 'Last 90 days')}</Radio.Button>
              <Radio.Button value="custom">{t('pages.dashboard.range.custom', {}, 'Custom')}</Radio.Button>
            </Radio.Group>
            {rangePreset === 'custom' && (
              <RangePicker
                value={customRange}
                onChange={(dates) => handleCustomRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
                allowClear={false}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            )}
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginTop: -4, marginBottom: 12, fontSize: 12 }}>
          {t(
            'pages.dashboard.activitySubtitle',
            {},
            'New users, lectures, and audit events across the selected period',
          )}
        </Paragraph>
        {activityLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : activityError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 0' }}>
            <WarningOutlined style={{ fontSize: 32, color: '#fbbf24' }} />
            <Text type="secondary">{t('pages.dashboard.chartUnavailable', {}, 'Chart data unavailable')}</Text>
            <Button type="link" size="small" onClick={handleRefresh}>
              {t('buttons.retry', {}, 'Retry')}
            </Button>
          </div>
        ) : !activity || activity.buckets.length === 0 ? (
          <Empty description={t('pages.dashboard.activity.empty', {}, 'No activity in the selected range')} />
        ) : (
          <Line
            data={activityChartData}
            theme="classicDark"
            autoFit
            xField="bucket"
            yField="value"
            seriesField="series"
            smooth
            height={260}
            color={['#0070F3', '#7c3aed', '#10b981']}
            point={{ size: 3, shape: 'circle' }}
            xAxis={{ tickCount: 6 }}
            yAxis={{ minInterval: 1 }}
            legend={{ position: 'top-right' }}
          />
        )}
      </Card>

      <Row gutter={[12, 12]}>
        {/* Students by year (bar chart) */}
        <Col xs={24} lg={10}>
          <Card title={t('pages.dashboard.studentsByYear', {}, 'Students By Year')} style={{ height: '100%' }}>
            {isLoadingOverview ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : studentsChartData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Column
                data={studentsChartData}
                theme="classicDark"
                autoFit
                xField="year"
                yField="count"
                height={280}
                color="#0070F3"
                columnStyle={{ radius: [6, 6, 0, 0] }}
                label={{
                  position: 'top',
                  style: { fill: 'rgba(255,255,255,0.6)', fontSize: 12 },
                }}
                tooltip={{
                  formatter: (datum: { count?: number }) => ({
                    name: t('pages.dashboard.kpi.profiles', {}, 'Profiles'),
                    value: datum?.count ?? 0,
                  }),
                }}
                xAxis={{ label: { autoRotate: false } }}
                yAxis={{ minInterval: 1 }}
              />
            )}
          </Card>
        </Col>

        {/* Upcoming events (timeline) */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space size={8}>
                <BellOutlined />
                {t('pages.dashboard.upcomingEvents', {}, 'Upcoming Events')}
              </Space>
            }
            style={{ height: '100%' }}
          >
            {isLoadingOverview ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : !overview?.upcomingEvents || overview.upcomingEvents.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('pages.dashboard.noUpcomingEvents', {}, 'No upcoming events')}
              />
            ) : (
              <Timeline
                mode="left"
                items={overview.upcomingEvents.map((event) => {
                  const startSource = event.start_date ?? event.start_time ?? '';
                  const start = dayjs(startSource);
                  const now = dayjs();
                  const color = EVENT_COLORS[event.type?.toLowerCase()] ?? '#8c8c8c';
                  const hoursUntil = start.diff(now, 'hour');
                  const urgencyColor =
                    hoursUntil < 24
                      ? '#f87171'
                      : hoursUntil < 72
                        ? '#fbbf24'
                        : 'rgba(255,255,255,0.3)';
                  return {
                    color,
                    label: (
                      <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
                        <Text strong>{start.format('DD MMM')}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {start.format('HH:mm')}
                        </Text>
                      </Space>
                    ),
                    children: (
                      <Space direction="vertical" size={2}>
                        <Space size={6} wrap>
                          <Text strong>{event.title}</Text>
                          <Tag color={color}>{event.type}</Tag>
                        </Space>
                        <Text style={{ fontSize: 12 }}>
                          <span style={{ color: urgencyColor, fontWeight: 500 }}>
                            {formatRelativeTime(start, now, t)}
                          </span>
                          {event.location ? (
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {event.location}</span>
                          ) : null}
                        </Text>
                      </Space>
                    ),
                  };
                })}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Audit logs table */}
      <Card
        title={
          <Space size={8}>
            <AuditOutlined />
            {t('pages.dashboard.recentAuditLogs', {}, 'Recent Audit Logs')}
          </Space>
        }
        extra={
          <Radio.Group
            value={actionFilter ?? 'all'}
            onChange={(event) => setActionFilter(event.target.value === 'all' ? null : event.target.value)}
            optionType="button"
            size="small"
          >
            <Radio.Button value="all">
              {t('pages.dashboard.audit.allActions', {}, 'All actions')}
            </Radio.Button>
            <Radio.Button value="INSERT">INSERT</Radio.Button>
            <Radio.Button value="UPDATE">UPDATE</Radio.Button>
            <Radio.Button value="DELETE">DELETE</Radio.Button>
          </Radio.Group>
        }
      >
        <Table
          rowKey="id"
          size="small"
          columns={auditColumns}
          dataSource={filteredAuditLogs}
          loading={isLoadingOverview}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('pages.dashboard.noAuditLogs', {}, 'No recent audit logs')} />,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </Space>
  );
};

export default DashboardPage;
