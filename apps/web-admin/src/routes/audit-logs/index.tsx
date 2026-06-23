/**
 * Audit Logs List Page (read-only).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTable } from '@refinedev/core';
import { ScrollText } from 'lucide-react';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { useTableSorting } from '../../utils/use-table-sorting';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_BADGE: Record<string, 'success' | 'brand' | 'danger'> = {
  INSERT: 'success',
  UPDATE: 'brand',
  DELETE: 'danger',
};

const TABLE_OPTIONS = ['profiles', 'subjects', 'sections', 'lectures', 'resources', 'calendar_events'];

function previewJson(value: unknown): string {
  if (!value || typeof value !== 'object') return '-';
  try {
    const text = JSON.stringify(value);
    return text.length > 50 ? `${text.slice(0, 50)}…` : text;
  } catch {
    return '-';
  }
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Keys whose value changed between old and new (for UPDATE entries). */
function changedKeys(oldData: unknown, newData: unknown): string[] {
  if (!oldData || !newData || typeof oldData !== 'object' || typeof newData !== 'object') return [];
  const a = oldData as Record<string, unknown>;
  const b = newData as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort();
}

const AuditLogsList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount, setFilters, filters, sorters, setSorters } =
    useTable<AuditLog>({ resource: 'audit-logs', syncWithLocation: true });
  const { sorting, onSortingChange } = useTableSorting(sorters, setSorters);

  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string | undefined>(undefined);
  const [tableName, setTableName] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback(
    (searchValue: string) => {
      const next: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
      if (searchValue.trim()) next.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
      if (action) next.push({ field: 'action', operator: 'eq', value: action });
      if (tableName) next.push({ field: 'table_name', operator: 'eq', value: tableName });
      if (startDate && endDate) {
        next.push({ field: 'start_date', operator: 'eq', value: new Date(`${startDate}T00:00:00`).toISOString() });
        next.push({ field: 'end_date', operator: 'eq', value: new Date(`${endDate}T23:59:59`).toISOString() });
      }
      return next;
    },
    [action, tableName, startDate, endDate],
  );

  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    setSearch(typeof getFilterValue(filters, 'search') === 'string' ? (getFilterValue(filters, 'search') as string) : '');
    setAction(typeof getFilterValue(filters, 'action') === 'string' ? (getFilterValue(filters, 'action') as string) : undefined);
    setTableName(typeof getFilterValue(filters, 'table_name') === 'string' ? (getFilterValue(filters, 'table_name') as string) : undefined);
    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setAction(undefined);
    setTableName(undefined);
    setStartDate('');
    setEndDate('');
    setFilters([], 'replace');
  };

  const columns: ColumnDef<AuditLog, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'user_email',
        header: 'Admin',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600">{(getValue() as string | null) ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'table_name',
        header: 'Table',
        cell: ({ getValue }) => <Badge variant="neutral">{getValue() as string}</Badge>,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <Badge variant={ACTION_BADGE[value] ?? 'neutral'}>{value}</Badge>;
        },
      },
      { accessorKey: 'record_id', header: 'Record ID' },
      {
        accessorKey: 'old_data',
        header: 'Old Values',
        enableSorting: false,
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{previewJson(getValue())}</span>,
      },
      {
        accessorKey: 'new_data',
        header: 'New Values',
        enableSorting: false,
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{previewJson(getValue())}</span>,
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ getValue }) =>
          new Date(getValue() as string).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => setSelected(row.original)}>
            View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable record of administrative changes." />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
        <Input
          className="w-full sm:w-56"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-40">
          <Select value={action ?? '__all'} onValueChange={(v) => setAction(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All actions</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select value={tableName ?? '__all'} onValueChange={(v) => setTableName(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All tables</SelectItem>
              {TABLE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DatePicker
          className="w-full sm:w-40"
          value={startDate}
          onChange={setStartDate}
          placeholder="Start date"
        />
        <DatePicker
          className="w-full sm:w-40"
          value={endDate}
          onChange={setEndDate}
          placeholder="End date"
        />
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Clear
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableQueryResult?.data?.data ?? []}
        loading={tableQueryResult?.isLoading}
        getRowId={(row) => row.id}
        pageIndex={current - 1}
        pageSize={pageSize}
        pageCount={pageCount}
        total={tableQueryResult?.data?.total}
        onPageChange={(idx) => setCurrent(idx + 1)}
        sorting={sorting}
        onSortingChange={onSortingChange}
        emptyState={<AdminEmptyState icon={<ScrollText />} title="No audit logs found" subtitle="Adjust your filters." />}
      />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit entry</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Admin</dt>
                  <dd className="text-slate-700">{selected.user_email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Action</dt>
                  <dd>
                    <Badge variant={ACTION_BADGE[selected.action] ?? 'neutral'}>{selected.action}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Table</dt>
                  <dd className="text-slate-700">{selected.table_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Record ID</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{selected.record_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">IP address</dt>
                  <dd className="text-slate-700">{selected.ip_address ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">When</dt>
                  <dd className="text-slate-700">{new Date(selected.created_at).toLocaleString()}</dd>
                </div>
              </dl>

              {selected.action === 'UPDATE' && changedKeys(selected.old_data, selected.new_data).length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-400">Changed fields</p>
                  <div className="flex flex-wrap gap-1">
                    {changedKeys(selected.old_data, selected.new_data).map((k) => (
                      <Badge key={k} variant="brand">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {selected.old_data && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Old values</p>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                      {formatJson(selected.old_data)}
                    </pre>
                  </div>
                )}
                {selected.new_data && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">New values</p>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                      {formatJson(selected.new_data)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsList;
