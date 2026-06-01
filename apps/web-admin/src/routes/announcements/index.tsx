/**
 * Announcements List Page
 * Admin management of system announcements.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDelete, useTable } from '@refinedev/core';
import { Plus, Pencil, Megaphone } from 'lucide-react';
import type { Announcement } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { useTableSorting } from '../../utils/use-table-sorting';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const AnnouncementsList = () => {
  const { tableQueryResult, current, setCurrent, pageSize, pageCount, setFilters, filters, sorters, setSorters } =
    useTable<Announcement>({ resource: 'announcements', syncWithLocation: true });
  const { sorting, onSortingChange } = useTableSorting(sorters, setSorters);
  const { mutate: deleteOne } = useDelete();

  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState<string | undefined>(undefined);
  const [isPinned, setIsPinned] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback(
    (searchValue: string) => {
      const next: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
      if (searchValue.trim()) next.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
      if (isPublished !== undefined) next.push({ field: 'is_published', operator: 'eq', value: isPublished });
      if (isPinned !== undefined) next.push({ field: 'is_pinned', operator: 'eq', value: isPinned });
      return next;
    },
    [isPublished, isPinned],
  );

  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    const searchValue = getFilterValue(filters, 'search');
    const publishedValue = getFilterValue(filters, 'is_published');
    const pinnedValue = getFilterValue(filters, 'is_pinned');
    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setIsPublished(typeof publishedValue === 'string' ? publishedValue : undefined);
    setIsPinned(typeof pinnedValue === 'string' ? pinnedValue : undefined);
    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setIsPublished(undefined);
    setIsPinned(undefined);
    setFilters([], 'replace');
  };

  const columns: ColumnDef<Announcement, unknown>[] = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'is_published',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Published</Badge> : <Badge variant="neutral">Draft</Badge>,
      },
      {
        accessorKey: 'is_pinned',
        header: 'Pinned',
        cell: ({ getValue }) => (getValue() ? <Badge variant="warning">📌 Pinned</Badge> : <span className="text-slate-400">—</span>),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/announcements/edit/${row.original.id}`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ConfirmButton
              title="Delete announcement?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => deleteOne({ resource: 'announcements', id: row.original.id })}
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
    [deleteOne],
  );

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Publish and pin announcements for students."
        actions={
          <Button asChild>
            <Link to="/announcements/create">
              <Plus />
              Create
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
        <Input
          className="w-full sm:w-60"
          placeholder="Search announcements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-40">
          <Select value={isPublished ?? '__all'} onValueChange={(v) => setIsPublished(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All status</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Select value={isPinned ?? '__all'} onValueChange={(v) => setIsPinned(v === '__all' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pinned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All</SelectItem>
              <SelectItem value="true">Pinned</SelectItem>
              <SelectItem value="false">Not pinned</SelectItem>
            </SelectContent>
          </Select>
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
            icon={<Megaphone />}
            title="No announcements yet"
            subtitle="Create your first announcement to reach students."
          />
        }
      />
    </div>
  );
};

export default AnnouncementsList;
