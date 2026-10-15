/**
 * Calendar (Brilliant: 04 Admin — Calendar): one month of events as a table,
 * filterable by type and subject. Events open in the editor modal. The month,
 * filters and open event live in the URL (?month=2026-10&type=&subject=&edit=id
 * or ?new=1), so /calendar/create and /calendar/edit/:id redirect here.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useList } from '@refinedev/core';
import dayjs from 'dayjs';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, Subject } from '@medical-portal/shared';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EventDialog } from './EventDialog';

type EventRow = CalendarEvent & { subjects?: { code: string; name: string; year_level?: number } | null };

const timeRange = (event: EventRow) => {
  if (!event.start_time) return 'All day';
  const start = event.start_time.slice(0, 5);
  return event.end_time ? `${start}–${event.end_time.slice(0, 5)}` : start;
};

const CalendarList = () => {
  const [params, setParams] = useSearchParams();
  const month = dayjs(`${params.get('month') ?? dayjs().format('YYYY-MM')}-01`);
  const type = params.get('type') ?? 'all';
  const subject = params.get('subject') ?? 'all';
  const editId = params.get('edit');
  const creating = params.get('new') === '1';

  const setParam = (updates: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === 'all') next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  const monthStart = month.startOf('month').format('YYYY-MM-DD');
  const monthEnd = month.endOf('month').format('YYYY-MM-DD');
  const filters = useMemo(() => {
    const list: Array<{ field: string; operator: 'eq'; value: unknown }> = [
      { field: 'start_date', operator: 'eq', value: monthStart },
      { field: 'end_date', operator: 'eq', value: monthEnd },
    ];
    if (type !== 'all') list.push({ field: 'type', operator: 'eq', value: type });
    if (subject !== 'all') list.push({ field: 'subject_id', operator: 'eq', value: subject });
    return list;
  }, [monthStart, monthEnd, type, subject]);

  const { data, isLoading } = useList<EventRow>({
    resource: 'calendar',
    filters,
    sorters: [{ field: 'start_date', order: 'asc' }],
    pagination: { mode: 'off' },
  });
  const { data: everything } = useList<EventRow>({ resource: 'calendar', pagination: { current: 1, pageSize: 1 } });
  const { data: typesData } = useList<CalendarEventType>({ resource: 'event-types', pagination: { mode: 'off' } });
  const { data: subjectsData } = useList<Subject>({ resource: 'subjects', pagination: { mode: 'off' } });
  const eventTypes = useMemo(() => typesData?.data ?? [], [typesData]);
  const subjects = subjectsData?.data ?? [];

  const rows = useMemo(
    () =>
      [...(data?.data ?? [])].sort(
        (a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time ?? '').localeCompare(b.start_time ?? ''),
      ),
    [data],
  );

  const columns: ColumnDef<EventRow, unknown>[] = useMemo(() => {
    const colorOf = (name: string) => eventTypes.find((t) => t.name === name)?.color ?? '#94a3b8';
    return [
      {
        id: 'date',
        header: 'Date',
        size: 120,
        cell: ({ row }) => {
          const start = dayjs(row.original.start_date);
          const end = row.original.end_date && row.original.end_date !== row.original.start_date ? dayjs(row.original.end_date) : null;
          return (
            <span className={`whitespace-nowrap font-semibold ${row.original.type.toLowerCase() === 'exam' ? 'text-red-700' : 'text-ink-1'}`}>
              {start.format('ddd D MMM')}
              {end ? <span className="block text-[11px] font-normal text-ink-3">to {end.format('ddd D MMM')}</span> : null}
            </span>
          );
        },
      },
      { id: 'time', header: 'Time', size: 110, cell: ({ row }) => <span className="whitespace-nowrap tabular-nums text-ink-2">{timeRange(row.original)}</span> },
      {
        id: 'event',
        header: 'Event',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-1">{row.original.title}</p>
            <p className="truncate text-[11px] text-ink-3">
              {row.original.subjects
                ? [row.original.subjects.code, row.original.subjects.year_level ? `Year ${row.original.subjects.year_level}` : null].filter(Boolean).join(' · ')
                : 'All years'}
            </p>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        size: 120,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap capitalize">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(row.original.type) }} />
            {row.original.type}
          </span>
        ),
      },
      { accessorKey: 'location', header: 'Location', size: 150, cell: ({ row }) => <span className="text-ink-2">{row.original.location || '—'}</span> },
      {
        id: 'edit',
        header: '',
        size: 60,
        cell: () => <span className="text-xs font-semibold text-brand">Edit</span>,
      },
    ];
  }, [eventTypes]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={`${everything?.total ?? 0} events · ${month.format('MMMM YYYY')}`}
        actions={
          <Button size="sm" onClick={() => setParam({ new: '1' })}>
            <Plus />
            New event
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon-sm" aria-label="Previous month" onClick={() => setParam({ month: month.subtract(1, 'month').format('YYYY-MM') })}>
            <ChevronLeft />
          </Button>
          <button
            type="button"
            onClick={() => setParam({ month: null })}
            title="Back to this month"
            className="h-8 min-w-32 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-ink-1 shadow-subtle"
          >
            {month.format('MMMM YYYY')}
          </button>
          <Button variant="secondary" size="icon-sm" aria-label="Next month" onClick={() => setParam({ month: month.add(1, 'month').format('YYYY-MM') })}>
            <ChevronRight />
          </Button>
        </div>
        <Select value={type} onValueChange={(value) => setParam({ type: value })}>
          <SelectTrigger className="h-8 w-auto gap-2" aria-label="Type">
            <SelectValue>{type === 'all' ? 'Type: All' : `Type: ${type}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {eventTypes.map((option) => (
              <SelectItem key={option.id} value={option.name}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subject} onValueChange={(value) => setParam({ subject: value })}>
          <SelectTrigger className="h-8 w-auto gap-2" aria-label="Subject">
            <SelectValue>{subject === 'all' ? 'Subject: All' : `Subject: ${subjects.find((s) => s.id === subject)?.code ?? '…'}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.code} · {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(row) => row.id}
        pageIndex={0}
        pageSize={rows.length || 1}
        pageCount={1}
        total={rows.length}
        onPageChange={() => undefined}
        onRowClick={(row) => setParam({ edit: row.id })}
        rowClassName={(row) => (row.type.toLowerCase() === 'exam' ? 'bg-red-50/60 hover:bg-red-50' : undefined)}
        emptyState={
          <AdminEmptyState
            icon={<CalendarDays />}
            title={`Nothing on the calendar in ${month.format('MMMM')}`}
            subtitle="Students see an empty “Coming up” for this month."
            action={{ label: 'New event', onClick: () => setParam({ new: '1' }) }}
          />
        }
      />

      <EventDialog
        open={creating || Boolean(editId)}
        id={editId ?? undefined}
        defaultDate={month.isSame(dayjs(), 'month') ? dayjs().format('YYYY-MM-DD') : month.format('YYYY-MM-DD')}
        onOpenChange={(open) => !open && setParam({ new: null, edit: null })}
      />
    </div>
  );
};

export default CalendarList;
