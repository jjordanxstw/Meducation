/**
 * Resources List Page
 * Single-page workflow for hierarchy-aware resource management.
 * Refine headless core + Tailwind/Radix UI (no Ant Design).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDataProvider, useDelete, useInvalidate, useList, useTable } from '@refinedev/core';
import { Database, Share2, ExternalLink, Plus, RotateCcw } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { ResourceWithHierarchy, Section, Subject, Lecture } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { ResourceTypeTag } from '../../components/ResourceTypeTag';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { notify } from '../../utils/notify';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable, type ColumnDef, type SortingState } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { cn } from '@/lib/utils';

const RESOURCE_TYPE_OPTIONS = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const TYPE_ACCENT: Record<string, string> = {
  [ResourceType.YOUTUBE]: '#dc2626',
  [ResourceType.GDRIVE_VIDEO]: '#1d4ed8',
  [ResourceType.GDRIVE_PDF]: '#16a34a',
  [ResourceType.EXTERNAL]: '#7c3aed',
};

type ResourceFormState = {
  subject_id?: string;
  section_id?: string;
  lecture_id?: string;
  label: string;
  type?: string;
  url: string;
  order_index: number;
  is_active: boolean;
};

const EMPTY_FORM: ResourceFormState = {
  subject_id: undefined,
  section_id: undefined,
  lecture_id: undefined,
  label: '',
  type: undefined,
  url: '',
  order_index: 0,
  is_active: true,
};

const ResourcesList = () => {
  const invalidate = useInvalidate();
  const dataProvider = useDataProvider();
  const { mutateAsync: deleteOne } = useDelete();

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

  // Create/edit modal state.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceWithHierarchy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formShake, setFormShake] = useState(false);
  const [form, setForm] = useState<ResourceFormState>(EMPTY_FORM);
  // Free-text names used when creating subject/section/lecture inline.
  const [subjectText, setSubjectText] = useState('');
  const [sectionText, setSectionText] = useState('');
  const [lectureText, setLectureText] = useState('');

  // Quick-create modal state.
  const [quickCreateType, setQuickCreateType] = useState<'subject' | 'section' | 'lecture' | null>(null);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const [qcCode, setQcCode] = useState('');
  const [qcName, setQcName] = useState('');
  const [qcYear, setQcYear] = useState('1');
  const [qcSubjectId, setQcSubjectId] = useState<string | undefined>(undefined);
  const [qcSectionName, setQcSectionName] = useState('');
  const [qcLectureTitle, setQcLectureTitle] = useState('');

  const setFormField = useCallback(
    <K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // Reference data for dropdowns.
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

  // Modal cascading reference data.
  const { data: modalSectionsData, isFetching: modalSectionsFetching } = useList<Section>({
    resource: 'sections',
    filters: form.subject_id ? [{ field: 'subject_id', operator: 'eq', value: form.subject_id }] : [],
    queryOptions: { enabled: !!form.subject_id },
  });
  const { data: modalLecturesData, isFetching: modalLecturesFetching } = useList<Lecture>({
    resource: 'lectures',
    filters: form.section_id ? [{ field: 'section_id', operator: 'eq', value: form.section_id }] : [],
    queryOptions: { enabled: !!form.section_id },
  });
  const { data: qcSectionsData } = useList<Section>({
    resource: 'sections',
    filters: qcSubjectId ? [{ field: 'subject_id', operator: 'eq', value: qcSubjectId }] : [],
    queryOptions: { enabled: !!qcSubjectId },
  });

  const modalSections = modalSectionsData?.data ?? [];
  const modalLectures = modalLecturesData?.data ?? [];
  const qcSections = qcSectionsData?.data ?? [];

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

  // --- Modal open/close ---
  const openCreateModal = () => {
    setEditingResource(null);
    setForm(EMPTY_FORM);
    setSubjectText('');
    setSectionText('');
    setLectureText('');
    setIsModalOpen(true);
  };

  const openEditModal = (record: ResourceWithHierarchy) => {
    setEditingResource(record);
    setSubjectText('');
    setSectionText('');
    setLectureText('');
    setForm({
      subject_id: record.subject_id || undefined,
      section_id: record.section_id || undefined,
      lecture_id: record.lecture_id || undefined,
      label: record.label,
      type: record.type,
      url: record.url,
      order_index: record.order_index,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteOne({
      resource: 'resources',
      id,
      successNotification: { message: 'Deleted successfully', type: 'success' },
      errorNotification: { message: 'Failed to delete', type: 'error' },
    });
    await invalidate({ resource: 'resources', invalidates: ['list'] });
  };

  const handleSubmit = async () => {
    // Validation: subject/section/lecture (selected or free text), label, type, url.
    const subjectOk = form.subject_id || subjectText.trim();
    const sectionOk = form.section_id || sectionText.trim();
    const lectureOk = form.lecture_id || lectureText.trim();
    if (!subjectOk || !sectionOk || !lectureOk || !form.label.trim() || !form.type || !form.url.trim()) {
      setFormShake(true);
      window.setTimeout(() => setFormShake(false), 400);
      return;
    }

    const payload = {
      resource_id: editingResource?.id,
      subject_id: form.subject_id || undefined,
      subject_name: form.subject_id ? undefined : subjectText.trim(),
      section_id: form.section_id || undefined,
      section_name: form.section_id ? undefined : sectionText.trim(),
      lecture_id: form.lecture_id || undefined,
      lecture_name: form.lecture_id ? undefined : lectureText.trim(),
      label: form.label,
      url: form.url,
      type: form.type,
      order_index: form.order_index,
      is_active: form.is_active,
    };

    setIsSubmitting(true);
    try {
      const provider = dataProvider();
      if (!provider?.custom) throw new Error('Data provider custom method is not available');
      await provider.custom({ url: '/api/v1/admin/resources/full-create', method: 'post', payload });
      notify.success(editingResource ? 'Updated successfully' : 'Created successfully');
      await Promise.all([
        invalidate({ resource: 'resources', invalidates: ['list'] }),
        invalidate({ resource: 'subjects', invalidates: ['list'] }),
        invalidate({ resource: 'sections', invalidates: ['list'] }),
        invalidate({ resource: 'lectures', invalidates: ['list'] }),
      ]);
      setIsModalOpen(false);
      setEditingResource(null);
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Could not save the resource. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openQuickCreate = (type: 'subject' | 'section' | 'lecture') => {
    setQcCode('');
    setQcName('');
    setQcYear('1');
    setQcSectionName('');
    setQcLectureTitle('');
    setQcSubjectId(type === 'subject' ? undefined : form.subject_id);
    setQuickCreateType(type);
  };

  const handleQuickCreate = async () => {
    // Validate before showing the submitting state.
    if (quickCreateType === 'subject' && (!qcCode.trim() || !qcName.trim())) return;
    if (quickCreateType === 'section' && (!qcSubjectId || !qcName.trim())) return;
    if (quickCreateType === 'lecture' && (!qcSubjectId || !qcSectionName || !qcLectureTitle.trim())) return;

    setIsQuickCreateSubmitting(true);
    try {
      const provider = dataProvider();
      if (!provider?.custom) throw new Error('Data provider custom method is not available');

      if (quickCreateType === 'subject') {
        await provider.custom({
          url: '/api/v1/admin/subjects',
          method: 'post',
          payload: { code: qcCode.trim(), name: qcName.trim(), year_level: Number(qcYear) },
        });
      } else if (quickCreateType === 'section') {
        await provider.custom({
          url: '/api/v1/admin/sections',
          method: 'post',
          payload: { subject_id: qcSubjectId, name: qcName.trim() },
        });
      } else if (quickCreateType === 'lecture') {
        await provider.custom({
          url: '/api/v1/admin/lectures',
          method: 'post',
          payload: { subject_id: qcSubjectId, section_id: qcSectionName, title: qcLectureTitle.trim() },
        });
      }
      notify.success('Created successfully');
      await Promise.all([
        invalidate({ resource: 'subjects', invalidates: ['list'] }),
        invalidate({ resource: 'sections', invalidates: ['list'] }),
        invalidate({ resource: 'lectures', invalidates: ['list'] }),
      ]);
      setQuickCreateType(null);
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Could not create the item. Please try again.'));
    } finally {
      setIsQuickCreateSubmitting(false);
    }
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
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEditModal(row.original)}>
              Edit
            </Button>
            <ConfirmButton
              title="Delete resource?"
              description="This will remove the resource. You can undo within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => void handleDelete(row.original.id)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Manage lecture resources across subjects, sections and lectures."
        actions={
          <Button onClick={openCreateModal}>
            <Plus />
            Create
          </Button>
        }
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
              subtitle="Adjust your filters or create a new resource."
              action={{ label: 'Create', onClick: openCreateModal }}
            />
          }
        />
      )}

      {/* Create / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle
              className="border-l-4 pl-3"
              style={{ borderColor: TYPE_ACCENT[form.type ?? ''] ?? '#2f80ed' }}
            >
              {editingResource ? 'Edit Resource' : 'Create Resource'}
            </DialogTitle>
          </DialogHeader>

          <div className={cn('flex flex-col gap-4', formShake && 'admin-shake')}>
            {/* Subject */}
            <div className="space-y-1.5">
              <Label required>Subject</Label>
              <div className="flex gap-2">
                <Combobox
                  className="flex-1"
                  options={subjectOptions}
                  value={form.subject_id}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, subject_id: v, section_id: undefined, lecture_id: undefined }));
                    setSectionText('');
                    setLectureText('');
                  }}
                  placeholder="Select subject"
                />
                <Button variant="secondary" onClick={() => openQuickCreate('subject')}>
                  <Plus />
                  New
                </Button>
              </div>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <Label required>Section</Label>
              <div className="flex gap-2">
                <Combobox
                  className="flex-1"
                  options={modalSections.map((s) => ({ value: s.id, label: s.name }))}
                  value={form.section_id}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, section_id: v, lecture_id: undefined }));
                    setLectureText('');
                  }}
                  placeholder={form.subject_id ? 'Select section' : 'Select a subject first'}
                  disabled={!form.subject_id}
                  loading={modalSectionsFetching}
                />
                <Button variant="secondary" disabled={!form.subject_id} onClick={() => openQuickCreate('section')}>
                  <Plus />
                  New
                </Button>
              </div>
            </div>

            {/* Lecture */}
            <div className="space-y-1.5">
              <Label required>Lecture</Label>
              <div className="flex gap-2">
                <Combobox
                  className="flex-1"
                  options={modalLectures.map((l) => ({ value: l.id, label: l.title }))}
                  value={form.lecture_id}
                  onChange={(v) => setFormField('lecture_id', v)}
                  placeholder={form.section_id ? 'Select lecture' : 'Select a section first'}
                  disabled={!form.section_id}
                  loading={modalLecturesFetching}
                />
                <Button variant="secondary" disabled={!form.section_id} onClick={() => openQuickCreate('lecture')}>
                  <Plus />
                  New
                </Button>
              </div>
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label required>Button Label</Label>
              <Input
                placeholder="e.g. Slide, Video, Summary"
                value={form.label}
                onChange={(e) => setFormField('label', e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label required>Resource Type</Label>
              <Select value={form.type} onValueChange={(v) => setFormField('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label required>URL / Video ID</Label>
              <Input
                placeholder="URL or Video ID"
                value={form.url}
                onChange={(e) => setFormField('url', e.target.value)}
                endContent={
                  <button
                    type="button"
                    className="text-brand"
                    onClick={() => {
                      const url = form.url.trim();
                      if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    aria-label="Test link"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.order_index}
                  onChange={(e) => setFormField('order_index', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Active</Label>
                <div className="flex h-10 items-center">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setFormField('is_active', v)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isSubmitting}>
              {editingResource ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick create modal */}
      <Dialog open={quickCreateType !== null} onOpenChange={(open) => !open && setQuickCreateType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quickCreateType === 'subject'
                ? 'Create Subject'
                : quickCreateType === 'section'
                  ? 'Create Section'
                  : 'Create Lecture'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {quickCreateType === 'subject' && (
              <>
                <div className="space-y-1.5">
                  <Label required>Code</Label>
                  <Input placeholder="e.g. CS101" value={qcCode} onChange={(e) => setQcCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label required>Name</Label>
                  <Input placeholder="Subject name" value={qcName} onChange={(e) => setQcName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label required>Year Level</Label>
                  <Input type="number" min={1} max={6} value={qcYear} onChange={(e) => setQcYear(e.target.value)} />
                </div>
              </>
            )}
            {quickCreateType === 'section' && (
              <>
                <div className="space-y-1.5">
                  <Label required>Subject</Label>
                  <Combobox
                    options={subjectOptions}
                    value={qcSubjectId}
                    onChange={setQcSubjectId}
                    placeholder="Select subject"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label required>Name</Label>
                  <Input placeholder="Section name" value={qcName} onChange={(e) => setQcName(e.target.value)} />
                </div>
              </>
            )}
            {quickCreateType === 'lecture' && (
              <>
                <div className="space-y-1.5">
                  <Label required>Subject</Label>
                  <Combobox
                    options={subjectOptions}
                    value={qcSubjectId}
                    onChange={(v) => {
                      setQcSubjectId(v);
                      setQcSectionName('');
                    }}
                    placeholder="Select subject"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label required>Section</Label>
                  <Combobox
                    options={qcSections.map((s) => ({ value: s.id, label: s.name }))}
                    value={qcSectionName || undefined}
                    onChange={(v) => setQcSectionName(v ?? '')}
                    placeholder="Select section"
                    disabled={!qcSubjectId}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label required>Title</Label>
                  <Input
                    placeholder="Lecture title"
                    value={qcLectureTitle}
                    onChange={(e) => setQcLectureTitle(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setQuickCreateType(null)}>
              Cancel
            </Button>
            <Button onClick={handleQuickCreate} loading={isQuickCreateSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesList;
