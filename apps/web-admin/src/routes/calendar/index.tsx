/**
 * Calendar Events List Page
 * Displays date-only calendar events.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useList, useTable } from '@refinedev/core';
import dayjs from 'dayjs';
import { Plus, Pencil, CalendarDays } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, Subject } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { useTableSorting } from '../../utils/use-table-sorting';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const CalendarList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount, setFilters, filters, sorters, setSorters } =
    useTable<CalendarEvent>({ resource: 'calendar', syncWithLocation: true });
  const { sorting, onSortingChange } = useTableSorting(sorters, setSorters);
  const { mutate: deleteOne } = useDelete();
  const { data: subjectsData } = useList<Subject>({ resource: 'subjects', pagination: { mode: 'off' } });
  const subjects = subjectsData?.data ?? [];
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));

  const { data: eventTypesData } = useList<CalendarEventType>({ resource: 'event-types', pagination: { mode: 'off' } });
  const eventTypes = useMemo(() => eventTypesData?.data ?? [], [eventTypesData]);
  const typeColor = useMemo(() => {
    const map: Record<string, string> = {};
    eventTypes.forEach((t) => {
      map[t.name] = t.color;
    });
    return map;
  }, [eventTypes]);

  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback(
    (searchValue: string) => {
      const next: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
      if (searchValue.trim()) next.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
      if (eventType) next.push({ field: 'type', operator: 'eq', value: eventType });
      if (subjectId) next.push({ field: 'subject_id', operator: 'eq', value: subjectId });
      if (startDate) next.push({ field: 'start_date', operator: 'eq', value: startDate });
      if (endDate) next.push({ field: 'end_date', operator: 'eq', value: endDate });
      return next;
    },
    [eventType, subjectId, startDate, endDate],
  );

  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    setSearch(typeof getFilterValue(filters, 'search') === 'string' ? (getFilterValue(filters, 'search') as string) : '');
    setEventType(typeof getFilterValue(filters, 'type') === 'string' ? (getFilterValue(filters, 'type') as string) : undefined);
    setSubjectId(typeof getFilterValue(filters, 'subject_id') === 'string' ? (getFilterValue(filters, 'subject_id') as string) : undefined);
    setStartDate(typeof getFilterValue(filters, 'start_date') === 'string' ? (getFilterValue(filters, 'start_date') as string) : undefined);
    setEndDate(typeof getFilterValue(filters, 'end_date') === 'string' ? (getFilterValue(filters, 'end_date') as string) : undefined);
    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setEventType(undefined);
    setSubjectId(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setFilters([], 'replace');
  };

  const columns: ColumnDef<CalendarEvent, unknown>[] = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: typeColor[value] || '#2f80ed' }}
              />
              <span className="text-slate-700">{value}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'start_date',
        header: 'Start',
        cell: ({ row }) => {
          const { start_date, start_time } = row.original;
          if (!start_date) return '-';
          return (
            <span>
              {dayjs(start_date).format('DD/MM/YYYY')}
              {start_time ? <span className="text-slate-400"> · {start_time.slice(0, 5)}</span> : null}
            </span>
          );
        },
      },
      {
        accessorKey: 'end_date',
        header: 'End',
        cell: ({ row }) => {
          const { end_date, end_time } = row.original;
          if (!end_date && !end_time) return '-';
          return (
            <span>
              {end_date ? dayjs(end_date).format('DD/MM/YYYY') : '—'}
              {end_time ? <span className="text-slate-400"> · {end_time.slice(0, 5)}</span> : null}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/calendar/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete event?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'calendar', id: row.original.id })}
              trigger={
                <Button size="sm" variant="danger-ghost">
                  Delete
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [deleteOne, typeColor],
  );

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Exam schedules, lectures, holidays and events."
        actions={
          <Button asChild>
            <Link to="/calendar/create">
              <Plus />
              Create
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
        <Input
          className="w-full sm:w-56"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-44">
          <Select value={eventType ?? '__all'} onValueChange={(v) => setEventType(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All types</SelectItem>
              {eventTypes.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200"
                      style={{ backgroundColor: t.color || '#2f80ed' }}
                    />
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Combobox
            options={subjectOptions}
            value={subjectId}
            onChange={setSubjectId}
            placeholder="All subjects"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <DatePicker
            className="w-full sm:w-40"
            value={startDate}
            onChange={(v) => setStartDate(v || undefined)}
            max={endDate}
            placeholder="From date"
          />
          <span className="text-slate-400">–</span>
          <DatePicker
            className="w-full sm:w-40"
            value={endDate}
            onChange={(v) => setEndDate(v || undefined)}
            min={startDate}
            placeholder="To date"
          />
        </div>
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
        emptyState={
          <AdminEmptyState
            icon={<CalendarDays />}
            title="No events found"
            subtitle="Adjust your filters or create a new event."
          />
        }
      />
    </div>
  );
};

export default CalendarList;
