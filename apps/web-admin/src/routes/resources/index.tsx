/**
 * All files (Brilliant: 04 Admin — All files): every link on every lecture,
 * searchable and filterable by type, with duplicates flagged. Read-only —
 * clicking a row opens its subject in the tree editor, where links are edited.
 * Filters live in the URL (?q=, ?type=, ?duplicates=true, ?page=) so the
 * dashboard can deep-link to "Duplicates only".
 */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useList } from '@refinedev/core';
import { AlertTriangle, Files, Search } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { ResourceWithHierarchy } from '@medical-portal/shared';
import { useDebouncedValue } from '../../utils/table-filters';
import { ResourceTypeTag } from '../../components/ResourceTypeTag';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

type FileRow = ResourceWithHierarchy & {
  lecture_title?: string | null;
  section_name?: string | null;
  subject_id?: string | null;
  subject_code?: string | null;
  is_duplicate?: boolean;
};

const PAGE_SIZE = 25;
const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'YouTube', value: ResourceType.YOUTUBE },
  { label: 'Drive video', value: ResourceType.GDRIVE_VIDEO },
  { label: 'Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: 'External', value: ResourceType.EXTERNAL },
];

/** "youtube.com/watch?v=…" — the URL without its scheme, for a dense column. */
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');

const ResourcesList = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(search, 350);
  const type = params.get('type') ?? 'all';
  const duplicatesOnly = params.get('duplicates') === 'true';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null || value === 'all') next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const filters = useMemo(() => {
    const list: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (debouncedSearch.trim()) list.push({ field: 'search', operator: 'contains', value: debouncedSearch.trim() });
    if (type !== 'all') list.push({ field: 'type', operator: 'eq', value: type });
    if (duplicatesOnly) list.push({ field: 'duplicates', operator: 'eq', value: 'true' });
    return list;
  }, [debouncedSearch, type, duplicatesOnly]);

  const { data, isLoading } = useList<FileRow>({
    resource: 'resources',
    filters,
    pagination: { current: page, pageSize: PAGE_SIZE },
  });
  // Header totals: every link, and how many are duplicates.
  const { data: allData } = useList<FileRow>({ resource: 'resources', pagination: { current: 1, pageSize: 1 } });
  const { data: dupData } = useList<FileRow>({
    resource: 'resources',
    filters: [{ field: 'duplicates', operator: 'eq', value: 'true' }],
    pagination: { current: 1, pageSize: 1 },
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const duplicateCount = dupData?.total ?? 0;

  const columns: ColumnDef<FileRow, unknown>[] = useMemo(
    () => [
      { id: 'type', header: 'Type', size: 70, cell: ({ row }) => <ResourceTypeTag type={row.original.type} compact /> },
      { accessorKey: 'label', header: 'Label', cell: ({ row }) => <span className="text-ink-1">{row.original.label}</span> },
      {
        id: 'lecture',
        header: 'Lecture',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink-1">{row.original.lecture_title ?? '—'}</p>
            <p className="truncate text-[11px] text-ink-3">
              {[row.original.subject_code, row.original.section_name].filter(Boolean).join(' · ')}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'url',
        header: 'URL',
        cell: ({ row }) => (
          <span className={cn('block max-w-[22rem] truncate text-xs', row.original.is_duplicate ? 'text-amber-700' : 'text-ink-2')} title={row.original.url}>
            {shortUrl(row.original.url)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) =>
          row.original.is_duplicate ? (
            <StatusPill tone="hidden">Duplicate</StatusPill>
          ) : row.original.is_active ? (
            <StatusPill tone="live">Live</StatusPill>
          ) : (
            <StatusPill tone="neutral">Hidden</StatusPill>
          ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="All files"
        description={`${(allData?.total ?? 0).toLocaleString()} links across every lecture · find broken or duplicate links fast`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setParam('q', event.target.value || null);
          }}
          placeholder="Search label, URL or lecture"
          aria-label="Search files"
          startContent={<Search className="size-4" />}
          wrapperClassName="h-9 w-full sm:w-64"
        />
        <Segmented aria-label="Type" value={type} onChange={(value) => setParam('type', value)} options={TYPE_OPTIONS} />
        <button
          type="button"
          onClick={() => setParam('duplicates', duplicatesOnly ? null : 'true')}
          aria-pressed={duplicatesOnly}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
            duplicatesOnly
              ? 'border-amber-400 bg-amber-100 text-amber-900'
              : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300',
          )}
        >
          <AlertTriangle className="size-3.5" aria-hidden />
          Duplicates only ({duplicateCount})
        </button>
      </div>

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
        onRowClick={(row) => row.subject_id && navigate(`/subjects/edit/${row.subject_id}`)}
        rowClassName={(row) => (row.is_duplicate ? 'bg-amber-50/60 hover:bg-amber-50' : undefined)}
        emptyState={
          duplicatesOnly && !debouncedSearch && type === 'all' ? (
            <AdminEmptyState icon={<Files />} title="No duplicate links" subtitle="Every recording is used by one lecture only." />
          ) : (
            <AdminEmptyState icon={<Search />} title="No matching files" subtitle="Try another search or type." />
          )
        }
      />
      <p className="mt-1 text-[11px] text-ink-3">Click a row to open it in its subject editor.</p>
    </div>
  );
};

export default ResourcesList;
