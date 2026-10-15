/**
 * Audit log (Brilliant: 04 Admin — Audit log): every admin change, newest
 * first, with a "What changed" panel for the selected entry. Filters live in
 * the URL (?admin=, ?action=, ?area=, ?range=, ?page=, ?id=).
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useList } from '@refinedev/core';
import dayjs from 'dayjs';
import { CalendarRange, History, X } from 'lucide-react';
import { actorName, formatUpdated } from '../../utils/relative-time';
import { NOUNS } from '../../utils/describe-change';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill, type StatusTone } from '../../components/StatusPill';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { useMediaQuery } from '@/lib/use-media-query';
import { useSubjectsHealth } from '../subjects/subjects-health';

interface AuditLog {
  id: string;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;
const ACTIONS: Record<string, { label: string; tone: StatusTone }> = {
  INSERT: { label: 'Create', tone: 'live' },
  UPDATE: { label: 'Update', tone: 'brand' },
  DELETE: { label: 'Delete', tone: 'danger' },
};
const AREAS = Object.keys(NOUNS);
const RANGES: Record<string, { label: string; days: number | null }> = {
  '7': { label: 'Last 7 days', days: 7 },
  '30': { label: 'Last 30 days', days: 30 },
  '90': { label: 'Last 90 days', days: 90 },
  all: { label: 'All time', days: null },
};
const HIDDEN_KEYS = new Set(['id', 'created_at', 'updated_at', 'tree_version']);

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function labelOf(data: Record<string, unknown> | null): string | null {
  const value = data?.title ?? data?.name ?? data?.code ?? data?.label ?? data?.full_name;
  return typeof value === 'string' ? value : null;
}

const show = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
};

/** "Chrome on Windows" from a user agent string. */
function deviceOf(agent: string | null): string | null {
  if (!agent) return null;
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : null;
  const os = /Windows/.test(agent) ? 'Windows' : /Mac OS X|Macintosh/.test(agent) ? 'macOS' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Linux/.test(agent) ? 'Linux' : null;
  return [browser, os].filter(Boolean).join(' on ') || null;
}

/** "203.150.x.x" — enough to recognise, without printing the full address. */
const maskIp = (ip: string | null) => (ip ? ip.replace(/^(\d+\.\d+)\.\d+\.\d+$/, '$1.x.x') : null);

type Line = { sign: '+' | '−' | '·'; text: string };

function changeLines(log: AuditLog): Line[] {
  const before = log.old_data ?? {};
  const after = log.new_data ?? {};
  if (log.action === 'INSERT') return [{ sign: '+', text: `Created ${labelOf(log.new_data) ?? 'record'}` }];
  if (log.action === 'DELETE') return [{ sign: '−', text: `Deleted ${labelOf(log.old_data) ?? 'record'}` }];
  if (!log.old_data) {
    // Tree saves and session revokes log a compact summary only.
    return Object.entries(after)
      .filter(([key]) => !HIDDEN_KEYS.has(key))
      .map(([key, value]) => ({ sign: '·' as const, text: `${key.replace(/_/g, ' ')}: ${show(value)}` }));
  }
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (key) => !HIDDEN_KEYS.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return keys.flatMap((key) => [
    { sign: '−' as const, text: `${key.replace(/_/g, ' ')}: ${show(before[key])}` },
    { sign: '+' as const, text: `${key.replace(/_/g, ' ')}: ${show(after[key])}` },
  ]);
}

function ChangePanel({ log, title, onClose }: { log: AuditLog; title: string; onClose: () => void }) {
  const [raw, setRaw] = useState(false);
  const lines = changeLines(log);
  const device = deviceOf(log.user_agent);
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-ink-1">What changed · {title}</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
          <X />
        </Button>
      </div>
      {raw ? (
        <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-ink-2">
          {JSON.stringify({ old_data: log.old_data, new_data: log.new_data }, null, 2)}
        </pre>
      ) : (
        <ul className="space-y-1 rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 font-mono text-[11px] leading-relaxed">
          {lines.length === 0 ? <li className="text-ink-3">No field changes recorded.</li> : null}
          {lines.map((line, i) => (
            <li key={i} className={line.sign === '+' ? 'text-emerald-700' : line.sign === '−' ? 'text-red-700' : 'text-ink-2'}>
              {line.sign} {line.text}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-3">
        <span className="truncate">
          {[maskIp(log.ip_address) && `IP ${maskIp(log.ip_address)}`, device, dayjs(log.created_at).format('D MMM YYYY HH:mm')].filter(Boolean).join(' · ')}
        </span>
        <button type="button" onClick={() => setRaw(!raw)} className="shrink-0 font-semibold text-brand hover:text-brand-hover">
          {raw ? 'Summary' : 'Raw JSON'}
        </button>
      </div>
    </div>
  );
}

const AuditLogsList = () => {
  const [params, setParams] = useSearchParams();
  const admin = params.get('admin') ?? 'all';
  const action = params.get('action') ?? 'all';
  const area = params.get('area') ?? 'all';
  const range = params.get('range') ?? '30';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const selectedId = params.get('id');
  const wide = useMediaQuery('(min-width: 1280px)');
  const { subjects } = useSubjectsHealth();

  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null || (value === 'all' && key !== 'range')) next.delete(key);
        else next.set(key, value);
        if (key !== 'page' && key !== 'id') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const days = RANGES[range]?.days ?? null;
  const since = days ? dayjs().subtract(days, 'day').startOf('day').toISOString() : null;
  const filters = useMemo(() => {
    const list: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (admin !== 'all') list.push({ field: 'search', operator: 'contains', value: admin });
    if (action !== 'all') list.push({ field: 'action', operator: 'eq', value: action });
    if (area !== 'all') list.push({ field: 'table_name', operator: 'eq', value: area });
    if (since) list.push({ field: 'start_date', operator: 'eq', value: since });
    return list;
  }, [admin, action, area, since]);

  const { data, isLoading } = useList<AuditLog>({
    resource: 'audit-logs',
    filters,
    sorters: [{ field: 'created_at', order: 'desc' }],
    pagination: { current: page, pageSize: PAGE_SIZE },
  });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  // Admin filter options: everyone seen recently (admins aren't listed anywhere else).
  const { data: recent } = useList<AuditLog>({ resource: 'audit-logs', pagination: { current: 1, pageSize: 100 }, sorters: [{ field: 'created_at', order: 'desc' }] });
  const admins = useMemo(
    () => [...new Set([...(recent?.data ?? []).map((log) => log.user_email).filter((email): email is string => Boolean(email)), ...(admin !== 'all' ? [admin] : [])])].sort(),
    [recent, admin],
  );

  const codeById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject.code])), [subjects]);
  const titleOf = (log: AuditLog) => {
    const noun = capitalise(NOUNS[log.table_name] ?? log.table_name.replace(/_/g, ' '));
    if (log.table_name === 'subjects' && log.action === 'UPDATE' && !labelOf(log.new_data)) {
      return `${log.record_id ? codeById.get(log.record_id) ?? 'Subject' : 'Subject'} subject tree`;
    }
    if (log.table_name === 'refresh_tokens') return 'Signed a student out of all devices';
    const label = labelOf(log.new_data) ?? labelOf(log.old_data);
    return label ? `${noun}: ${label}` : noun;
  };

  const columns: ColumnDef<AuditLog, unknown>[] = [
    {
      id: 'action',
      header: 'Action',
      size: 90,
      cell: ({ row }) => {
        const meta = ACTIONS[row.original.action] ?? { label: row.original.action, tone: 'neutral' as const };
        return <StatusPill tone={meta.tone} className="uppercase tracking-wide">{meta.label}</StatusPill>;
      },
    },
    {
      id: 'what',
      header: 'Change',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{titleOf(row.original)}</p>
          <p className="truncate text-[11px] text-ink-3">
            {row.original.table_name} · {actorName(row.original.user_email)}
          </p>
        </div>
      ),
    },
    {
      id: 'when',
      header: 'When',
      size: 110,
      cell: ({ row }) => <span className="whitespace-nowrap text-ink-3" title={dayjs(row.original.created_at).format('D MMM YYYY HH:mm:ss')}>{formatUpdated(row.original.created_at)}</span>,
    },
  ];

  const selected = rows.find((log) => log.id === selectedId) ?? null;
  const panel = selected ? <ChangePanel key={selected.id} log={selected} title={titleOf(selected)} onClose={() => setParam('id', null)} /> : null;

  const filterSelect = (key: string, value: string, label: string, options: Array<{ value: string; label: string }>, allLabel: string) => (
    <Select value={value} onValueChange={(next) => setParam(key, next)}>
      <SelectTrigger className="h-8 w-auto gap-2" aria-label={label}>
        <SelectValue>
          {label}: {value === 'all' ? 'All' : options.find((option) => option.value === value)?.label ?? value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader title="Audit log" description="Every admin change, newest first · kept permanently" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {filterSelect('admin', admin, 'Admin', admins.map((email) => ({ value: email, label: actorName(email) })), 'All admins')}
        {filterSelect('action', action, 'Action', Object.entries(ACTIONS).map(([value, meta]) => ({ value, label: meta.label })), 'All actions')}
        {filterSelect('area', area, 'Area', AREAS.map((value) => ({ value, label: capitalise(NOUNS[value]) })), 'All areas')}
        <Select value={range} onValueChange={(next) => setParam('range', next)}>
          <SelectTrigger className="h-8 w-auto gap-2" aria-label="Date range">
            <CalendarRange className="size-3.5 text-ink-3" />
            <SelectValue>{RANGES[range]?.label ?? 'Last 30 days'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGES).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(row) => row.id}
          pageIndex={page - 1}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          onPageChange={(index) => setParam('page', index === 0 ? null : String(index + 1))}
          onRowClick={(row) => setParam('id', row.id)}
          selectedRowId={selectedId}
          emptyState={<AdminEmptyState icon={<History />} title="No changes in this range" subtitle="Try a longer date range or another filter." />}
        />
        {panel && wide ? <aside className="sticky top-6 rounded-xl border border-slate-200/70 bg-white shadow-subtle">{panel}</aside> : null}
      </div>
      <Sheet open={Boolean(panel) && !wide} onOpenChange={(open) => !open && setParam('id', null)}>
        <SheetContent side="right" className="p-0">
          <SheetTitle>What changed</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AuditLogsList;
