/**
 * Resources List Page — read-only cross-subject search view.
 *
 * Lets admins find any lecture resource across every subject/section/lecture and
 * jump to the subject's unified tree editor to change it. All create/edit/delete
 * now lives in the subject tree editor (Subjects → edit), so this page is purely
 * for searching and navigation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useList, useTable } from '@refinedev/core';
import { Database, Share2, RotateCcw, SquarePen } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { ResourceWithHierarchy, Section, Subject, Lecture } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { ResourceTypeTag } from '../../components/ResourceTypeTag';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { notify } from '../../utils/notify';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable, type ColumnDef, type SortingState } from '@/components/ui/data-table';

const RESOURCE_TYPE_OPTIONS = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const ResourcesList = () => {
  const {
    tableQueryResult,
    current,
    setCurrent,
    pageSize,
    pageCount,
    sorters,
    setSorters,
    filters,
    setFilters,
  } = useTable<ResourceWithHierarchy>({ resource: 'resources', syncWithLocation: true });

  const rows = tableQueryResult?.data?.data ?? [];
  const total = tableQueryResult?.data?.total ?? 0;

  // Filter bar state.
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [lectureId, setLectureId] = useState<string | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  // Reference data for the cascading filter dropdowns.
  const { data: subjectsData } = useList<Subject>({ resource: 'subjects', pagination: { mode: 'off' } });
  const { data: filterSectionsData } = useList<Section>({
    resource: 'sections',
    filters: subjectId ? [{ field: 'subject_id', operator: 'eq', value: subjectId }] : [],
    queryOptions: { enabled: !!subjectId },
  });
  const { data: filterLecturesData } = useList<Lecture>({
    resource: 'lectures',
    filters: sectionId ? [{ field: 'section_id', operator: 'eq', value: sectionId }] : [],
    queryOptions: { enabled: !!sectionId },
  });

  const subjects = subjectsData?.data ?? [];
  const filterSections = filterSectionsData?.data ?? [];
  const filterLectures = filterLecturesData?.data ?? [];
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));

  // --- Filters → Refine ---
  const buildFilters = useCallback(
    (searchValue: string) => {
      const next: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
      if (searchValue.trim()) next.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
      if (subjectId) next.push({ field: 'subject_id', operator: 'eq', value: subjectId });
      if (sectionId) next.push({ field: 'section_id', operator: 'eq', value: sectionId });
      if (lectureId) next.push({ field: 'lecture_id', operator: 'eq', value: lectureId });
      if (resourceType) next.push({ field: 'type', operator: 'eq', value: resourceType });
      if (typeof isActive === 'boolean') next.push({ field: 'is_active', operator: 'eq', value: isActive });
      return next;
    },
    [isActive, lectureId, resourceType, sectionId, subjectId],
  );

  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    setSearch(typeof getFilterValue(filters, 'search') === 'string' ? (getFilterValue(filters, 'search') as string) : '');
    setSubjectId(typeof getFilterValue(filters, 'subject_id') === 'string' ? (getFilterValue(filters, 'subject_id') as string) : undefined);
    setSectionId(typeof getFilterValue(filters, 'section_id') === 'string' ? (getFilterValue(filters, 'section_id') as string) : undefined);
    setLectureId(typeof getFilterValue(filters, 'lecture_id') === 'string' ? (getFilterValue(filters, 'lecture_id') as string) : undefined);
    setResourceType(typeof getFilterValue(filters, 'type') === 'string' ? (getFilterValue(filters, 'type') as string) : undefined);
    const activeValue = getFilterValue(filters, 'is_active');
    setIsActive(typeof activeValue === 'boolean' ? activeValue : undefined);
    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const hasActiveFilters = Boolean(
    search || subjectId || sectionId || lectureId || resourceType || typeof isActive === 'boolean',
  );

  const resetFilters = () => {
    setSearch('');
    setSubjectId(undefined);
    setSectionId(undefined);
    setLectureId(undefined);
    setResourceType(undefined);
    setIsActive(undefined);
    setFilters([], 'replace');
  };

  // --- Sorting ---
  const sorting: SortingState = useMemo(
    () => sorters.filter((s) => s.order).map((s) => ({ id: s.field, desc: s.order === 'desc' })),
    [sorters],
  );
  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    setSorters(next.map((s) => ({ field: s.id, order: s.desc ? 'desc' : 'asc' })));
  };

  // --- Columns ---
  const columns: ColumnDef<ResourceWithHierarchy, unknown>[] = useMemo(
    () => [
      {
        id: 'subject_name',
        header: 'Subject',
        enableSorting: true,
        cell: ({ row }) =>
          row.original.subject_code && row.original.subject_name
            ? `${row.original.subject_code} - ${row.original.subject_name}`
            : '-',
      },
      { accessorKey: 'section_name', header: 'Section', enableSorting: true },
      { accessorKey: 'lecture_title', header: 'Lecture', enableSorting: true },
      { accessorKey: 'label', header: 'Button Label', enableSorting: true },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: true,
        cell: ({ getValue }) => <ResourceTypeTag type={getValue() as string} />,
      },
      { accessorKey: 'url', header: 'URL / Video ID', enableSorting: true },
      { accessorKey: 'order_index', header: 'Order', enableSorting: true },
      {
        accessorKey: 'is_active',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) =>
          row.original.subject_id ? (
            <Button asChild size="sm" variant="secondary">
              <Link to={`/subjects/edit/${row.original.subject_id}`}>
                <SquarePen />
                Edit in subject
              </Link>
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Search lecture resources across every subject. Editing happens in the subject's tree editor."
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
        <Input
          className="w-full sm:w-60"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-full sm:w-64">
          <Combobox
            options={subjectOptions}
            value={subjectId}
            onChange={(v) => {
              setSubjectId(v);
              setSectionId(undefined);
              setLectureId(undefined);
            }}
            placeholder="All subjects"
          />
        </div>
        <div className="w-full sm:w-56">
          <Combobox
            options={filterSections.map((s) => ({ value: s.id, label: s.name }))}
            value={sectionId}
            onChange={(v) => {
              setSectionId(v);
              setLectureId(undefined);
            }}
            placeholder="All sections"
            disabled={!subjectId}
          />
        </div>
        <div className="w-full sm:w-56">
          <Combobox
            options={filterLectures.map((l) => ({ value: l.id, label: l.title }))}
            value={lectureId}
            onChange={setLectureId}
            placeholder="All lectures"
            disabled={!sectionId}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={resourceType ?? '__all'}
            onValueChange={(v) => setResourceType(v === '__all' ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All types</SelectItem>
              {RESOURCE_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-36">
          <Select
            value={isActive === undefined ? '__all' : isActive ? 'active' : 'inactive'}
            onValueChange={(v) => setIsActive(v === '__all' ? undefined : v === 'active')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw />
            Clear all
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(window.location.href)
              .then(() => notify.success('Filter URL copied'))
              .catch(() => notify.error('Could not copy link'));
          }}
        >
          <Share2 />
          Share filters
        </Button>
      </div>

      {tableQueryResult?.isError ? (
        <AdminEmptyState
          icon={<Database />}
          title="Failed to load resources"
          subtitle={(tableQueryResult.error as { message?: string } | undefined)?.message || 'Something went wrong'}
          action={{ label: 'Retry', onClick: () => void tableQueryResult.refetch() }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={tableQueryResult?.isLoading}
          getRowId={(row) => row.id}
          pageIndex={current - 1}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
          onPageChange={(idx) => setCurrent(idx + 1)}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          emptyState={
            <AdminEmptyState
              icon={<Database />}
              title="No resources found"
              subtitle="Adjust your filters, or add resources from a subject's tree editor."
            />
          }
        />
      )}
    </div>
  );
};

export default ResourcesList;
