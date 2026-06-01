/**
 * Admin Dashboard Page — light blue/white theme, English only.
 * Tailwind + Radix UI + Recharts (no Ant Design).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  Bell,
  Book,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  List,
  Plus,
  RefreshCw,
  ScrollText,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useGetIdentity, useGo } from '@refinedev/core';
import dayjs, { type Dayjs } from 'dayjs';
import { authAxios } from '../../providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  buckets: Array<{ bucket: string; newProfiles: number; newLectures: number; newAuditEvents: number }>;
  totals: { newProfiles: number; newLectures: number; newAuditEvents: number };
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

const PRESET_RANGES: Record<Exclude<RangePreset, 'custom'>, number> = { '7d': 6, '30d': 29, '90d': 89 };

function defaultRangeFor(preset: Exclude<RangePreset, 'custom'>): [Dayjs, Dayjs] {
  const end = dayjs().startOf('day');
  return [end.subtract(PRESET_RANGES[preset], 'day'), end];
}

const KPI_DEFINITIONS = [
  { key: 'subjects' as const, icon: Book, label: 'Subjects' },
  { key: 'sections' as const, icon: List, label: 'Sections' },
  { key: 'lectures' as const, icon: BookOpen, label: 'Lectures' },
  { key: 'resources' as const, icon: FileText, label: 'Resources' },
  { key: 'profiles' as const, icon: Users, label: 'Profiles' },
  { key: 'calendarEvents' as const, icon: CalendarDays, label: 'Calendar events' },
];

const EVENT_COLORS: Record<string, string> = {
  exam: '#dc2626',
  lecture: '#2f80ed',
  holiday: '#d97706',
  event: '#16a34a',
};

const ACTION_BADGE: Record<string, 'success' | 'brand' | 'danger'> = {
  INSERT: 'success',
  UPDATE: 'brand',
  DELETE: 'danger',
};

const CHART_COLORS = ['#2f80ed', '#7c3aed', '#16a34a'];

function formatRelativeTime(target: dayjs.Dayjs, now: dayjs.Dayjs): string {
  const diffMs = target.diff(now);
  const absMs = Math.abs(diffMs);
  if (absMs < 60_000) return 'happening now';
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const value = days >= 1 ? `${days}d` : hours >= 1 ? `${hours}h` : `${minutes}m`;
  return diffMs >= 0 ? `in ${value}` : `${value} ago`;
}

// Small inline segmented control.
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === option.value ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  extra,
  children,
  className,
}: {
  title: string;
  icon?: typeof Book;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-brand" /> : null}
          <h2 className="font-serif text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
        {extra}
      </div>
      <CardContent className="p-5 pt-5">{children}</CardContent>
    </Card>
  );
}

const DashboardPage = () => {
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

  // Auto-refresh stats every 60s while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setRefreshTick((tick) => tick + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Live "last updated X ago" counter — ticks every 10s.
  useEffect(() => {
    const id = setInterval(() => setNowTick(dayjs()), 10_000);
    return () => clearInterval(id);
  }, []);

  const effectiveRange = useMemo<[Dayjs, Dayjs]>(
    () => (rangePreset === 'custom' ? customRange : defaultRangeFor(rangePreset)),
    [rangePreset, customRange],
  );

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const response = await authAxios.get('/api/v1/admin/statistics/overview');
        if (!mounted) return;
        setOverview(response.data?.data ?? null);
        setLastUpdated(dayjs());
      } catch {
        if (!mounted) return;
        setOverviewError('Dashboard data is unavailable');
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    };
    void loadOverview();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    let mounted = true;
    const [from, to] = effectiveRange;
    const loadActivity = async () => {
      setActivityLoading(true);
      setActivityError(null);
      try {
        const response = await authAxios.get('/api/v1/admin/statistics/activity', {
          params: { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD'), granularity },
        });
        if (!mounted) return;
        setActivity(response.data?.data ?? null);
      } catch {
        if (!mounted) return;
        setActivityError('No activity in the selected range');
        setActivity(null);
      } finally {
        if (mounted) setActivityLoading(false);
      }
    };
    void loadActivity();
    return () => {
      mounted = false;
    };
  }, [effectiveRange, granularity, refreshTick]);

  const handleRefresh = useCallback(() => setRefreshTick((tick) => tick + 1), []);

  const handleRangePresetChange = useCallback((preset: RangePreset) => {
    setRangePreset(preset);
    if (preset !== 'custom') setCustomRange(defaultRangeFor(preset));
  }, []);

  const activityChartData = useMemo(() => {
    if (!activity) return [];
    return activity.buckets.map((point) => ({
      bucket: point.bucket,
      'New users': point.newProfiles,
      'New lectures': point.newLectures,
      'Audit events': point.newAuditEvents,
    }));
  }, [activity]);

  const studentsChartData = useMemo(() => {
    if (!overview?.studentsByYear) return [];
    return overview.studentsByYear.map((row) => ({ year: `Year ${row.yearLevel}`, count: row.count }));
  }, [overview]);

  const filteredAuditLogs = useMemo(() => {
    if (!overview?.recentAuditLogs) return [];
    if (!actionFilter) return overview.recentAuditLogs;
    return overview.recentAuditLogs.filter((log) => log.action === actionFilter);
  }, [overview, actionFilter]);

  const welcomeName = identity?.name ?? identity?.username ?? '';
  const welcomeMessage = welcomeName ? `Welcome back, ${welcomeName}` : 'Welcome to the admin console';
  const isLoadingOverview = overviewLoading && !overview;

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome / refresh banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-brand to-brand-hover p-6 text-white shadow-soft">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{welcomeMessage}</h1>
          <p className="mt-1 text-sm text-white/85">Select a menu item to manage the system</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/75">
              Last updated: {Math.max(0, nowTick.diff(lastUpdated, 'second'))}s ago
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={handleRefresh}
            disabled={overviewLoading && activityLoading}
          >
            <RefreshCw className={cn(overviewLoading || activityLoading ? 'animate-spin' : '')} />
            Refresh
          </Button>
        </div>
      </div>

      {overviewError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="size-4 shrink-0" />
          {overviewError}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {KPI_DEFINITIONS.map((definition) => {
          const pair = overview?.kpis[definition.key];
          const total = pair?.total ?? 0;
          const active = pair?.active ?? 0;
          const ratio = total > 0 ? Math.round((active / total) * 100) : 0;
          const Icon = definition.icon;
          return (
            <Card key={definition.key} className="p-4">
              {isLoadingOverview ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        {definition.label}
                      </p>
                      <p className="mt-1 font-serif text-2xl font-semibold text-slate-900">
                        {overviewError ? '—' : total.toLocaleString()}
                      </p>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${ratio}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{`${active}/${total} active`}</p>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <SectionCard title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => go({ to: { resource: 'resources', action: 'list' } })}>
            <Plus />
            New resource
          </Button>
          <Button variant="secondary" onClick={() => go({ to: { resource: 'calendar', action: 'create' } })}>
            <Plus />
            New calendar event
          </Button>
          <Button variant="secondary" onClick={() => go({ to: { resource: 'announcements', action: 'create' } })}>
            <Plus />
            New announcement
          </Button>
        </div>
      </SectionCard>

      {/* Activity over time */}
      <SectionCard
        title="Activity over time"
        icon={Clock}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={granularity}
              onChange={setGranularity}
              options={[
                { label: 'Daily', value: 'day' },
                { label: 'Weekly', value: 'week' },
                { label: 'Monthly', value: 'month' },
              ]}
            />
            <Segmented
              value={rangePreset}
              onChange={handleRangePresetChange}
              options={[
                { label: '7d', value: '7d' },
                { label: '30d', value: '30d' },
                { label: '90d', value: '90d' },
                { label: 'Custom', value: 'custom' },
              ]}
            />
            {rangePreset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <DatePicker
                  className="h-9 w-36"
                  value={customRange[0].format('YYYY-MM-DD')}
                  max={customRange[1].format('YYYY-MM-DD')}
                  onChange={(v) => v && setCustomRange([dayjs(v).startOf('day'), customRange[1]])}
                />
                <span className="text-slate-400">–</span>
                <DatePicker
                  className="h-9 w-36"
                  value={customRange[1].format('YYYY-MM-DD')}
                  max={dayjs().format('YYYY-MM-DD')}
                  onChange={(v) => v && setCustomRange([customRange[0], dayjs(v).startOf('day')])}
                />
              </div>
            )}
          </div>
        }
      >
        <p className="-mt-1 mb-3 text-xs text-slate-400">
          New users, lectures, and audit events across the selected period
        </p>
        {activityLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : activityError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertTriangle className="size-8 text-amber-500" />
            <span className="text-sm text-slate-500">Chart data unavailable</span>
            <Button variant="link" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        ) : !activity || activity.buckets.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No activity in the selected range</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
              <RechartsTooltip
                contentStyle={{ borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {['New users', 'New lectures', 'Audit events'].map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Students by year */}
        <SectionCard title="Students by Year" className="lg:col-span-5">
          {isLoadingOverview ? (
            <Skeleton className="h-72 w-full" />
          ) : studentsChartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={studentsChartData} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(47,128,237,0.06)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Profiles" fill="#2f80ed" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Upcoming events */}
        <SectionCard title="Upcoming Events" icon={Bell} className="lg:col-span-7">
          {isLoadingOverview ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !overview?.upcomingEvents || overview.upcomingEvents.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No upcoming events</p>
          ) : (
            <ol className="space-y-3">
              {overview.upcomingEvents.map((event) => {
                const start = dayjs(event.start_date ?? event.start_time ?? '');
                const now = dayjs();
                const color = EVENT_COLORS[event.type?.toLowerCase()] ?? '#94a3b8';
                const hoursUntil = start.diff(now, 'hour');
                const urgencyColor = hoursUntil < 24 ? '#dc2626' : hoursUntil < 72 ? '#d97706' : '#94a3b8';
                return (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-end pt-0.5 text-right">
                      <span className="text-sm font-semibold text-slate-900">{start.format('DD MMM')}</span>
                      <span className="text-xs text-slate-400">{start.format('HH:mm')}</span>
                    </div>
                    <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{event.title}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: `${color}1a`, color }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <p className="text-xs">
                        <span style={{ color: urgencyColor, fontWeight: 500 }}>{formatRelativeTime(start, now)}</span>
                        {event.location ? <span className="text-slate-400"> · {event.location}</span> : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>
      </div>

      {/* Audit logs */}
      <SectionCard
        title="Recent Audit Logs"
        icon={ScrollText}
        extra={
          <Segmented
            value={actionFilter ?? 'all'}
            onChange={(value) => setActionFilter(value === 'all' ? null : value)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'INSERT', value: 'INSERT' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
          />
        }
      >
        {isLoadingOverview ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : filteredAuditLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No recent audit logs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Table</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Badge variant={ACTION_BADGE[log.action] ?? 'neutral'}>{log.action}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{log.table_name}</td>
                    <td className="py-2.5 pr-4">
                      {log.user_email ? (
                        <span className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-brand-subtle text-[11px] font-semibold text-brand">
                            {log.user_email.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="text-slate-700">{log.user_email}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-500" title={dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}>
                      {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default DashboardPage;
