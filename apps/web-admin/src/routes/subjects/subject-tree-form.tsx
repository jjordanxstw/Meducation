/**
 * Subject tree editor (Brilliant: 04 Admin — Tree editor).
 *
 * Edits a subject AND its nested hierarchy (sections → lectures → links) on one
 * screen and saves it atomically via PUT /admin/subjects/:id/tree (the
 * admin_save_subject_tree RPC). order_index is implied by array position —
 * drag a row by its handle to reorder.
 *
 * Saving is guarded by the tree's version: the editor polls
 * /tree/version and shows a banner when someone else saved in the meantime;
 * saving after that banner deliberately overwrites their version.
 */
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { useApiUrl, useDataProvider, useDelete, useInvalidate } from '@refinedev/core';
import { FormProvider, useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  Eye,
  ImageIcon,
  Layers,
  ListVideo,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { SubjectEditableTree } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { actorName, formatAgo } from '../../utils/relative-time';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { PlaylistImportDialog, type ImportedVideo } from './PlaylistImportDialog';
import { describeChanges, youtubeVideoId, emptyLecture, emptySection, EMPTY_TREE, toFormValues, toPayload, treeSchema, type TreeValues } from './tree/model';
import { SectionEditor } from './tree/rows';
import { onSortEnd, useDndSensors } from './tree/dnd';

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const VERSION_POLL_MS = 30_000;
const STUDENT_SITE_URL = import.meta.env.VITE_STUDENT_SITE_URL || 'http://localhost:3001';

type RemoteChange = { version: string; by: string | null; at: string | null };

/** Sticky "N unsaved changes" bar. Watches the whole form, so it lives in its own component. */
function UnsavedBar({
  control,
  original,
  saving,
  onDiscard,
}: {
  control: Control<TreeValues>;
  original: TreeValues;
  saving: boolean;
  onDiscard: () => void;
}) {
  const values = useWatch({ control }) as TreeValues;
  const { count, summary } = describeChanges(original, values);
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 sm:-mx-8">
      <div className="flex flex-wrap items-center gap-3 bg-ink-1 px-4 py-3 text-white shadow-lift sm:px-8">
        <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-semibold tabular-nums">
          {count} unsaved {count === 1 ? 'change' : 'changes'}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{summary}</span>
        <ConfirmButton
          title="Discard your changes?"
          description="Everything since the last save goes back to how it was."
          confirmLabel="Discard"
          onConfirm={onDiscard}
          trigger={
            <Button type="button" size="sm" variant="ghost" className="border border-slate-600 text-white hover:bg-slate-800 hover:text-white">
              Discard
            </Button>
          }
        />
        <Button type="submit" size="sm" loading={saving}>
          Save subject
        </Button>
      </div>
    </div>
  );
}

/** Lecture counts per section; re-renders the parent only when a count changes. */
function useLectureCounts(form: ReturnType<typeof useForm<TreeValues>>) {
  const [counts, setCounts] = useState<number[]>([]);
  useEffect(() => {
    const read = (values: Partial<TreeValues>) => (values.sections ?? []).map((section) => section?.lectures?.length ?? 0);
    const sync = (next: number[]) => setCounts((prev) => (prev.length === next.length && prev.every((n, i) => n === next[i]) ? prev : next));
    sync(read(form.getValues()));
    const subscription = form.watch((values) => sync(read(values as Partial<TreeValues>)));
    return () => subscription.unsubscribe();
  }, [form]);
  return counts;
}

export function SubjectTreeForm({ id }: { id: string }) {
  const apiUrl = useApiUrl();
  const dataProvider = useDataProvider();
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { mutate: deleteSubject } = useDelete();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [importFor, setImportFor] = useState<number | 'header' | null>(null);
  const [original, setOriginal] = useState<TreeValues>(EMPTY_TREE);
  const [remote, setRemote] = useState<RemoteChange | null>(null);
  const sensors = useDndSensors();
  // Version of the tree as loaded; the save is rejected (409) if it changed since.
  const treeVersion = useRef<string | undefined>(undefined);

  const form = useForm<TreeValues>({ resolver: zodResolver(treeSchema), defaultValues: EMPTY_TREE });
  const { fields: sectionFields, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
    control: form.control,
    name: 'sections',
  });
  const lectureCounts = useLectureCounts(form);

  const loadTree = useCallback(async () => {
    const provider = dataProvider();
    if (!provider?.custom) return;
    const res = await provider.custom<{ data?: SubjectEditableTree }>({ url: `${apiUrl}/admin/subjects/${id}/tree`, method: 'get' });
    const tree = res?.data?.data as (SubjectEditableTree & { tree_version?: string }) | undefined;
    if (!tree) return;
    treeVersion.current = tree.tree_version;
    const values = toFormValues(tree);
    setOriginal(values);
    setRemote(null);
    form.reset(values);
  }, [apiUrl, dataProvider, form, id]);

  const loadedFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setLoading(true);
    loadTree()
      .catch((error) => notify.error(resolveApiErrorMessage(error, 'Failed to load subject')))
      .finally(() => setLoading(false));
  }, [id, loadTree]);

  // ?import=1 (from the dashboard / subjects list) opens the importer once loaded.
  useEffect(() => {
    if (loading || params.get('import') !== '1') return;
    setImportFor('header');
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('import');
        return next;
      },
      { replace: true },
    );
  }, [loading, params, setParams]);

  const isDirty = form.formState.isDirty;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  /** Set right before a deliberate navigation away (e.g. after deleting). */
  const allowLeave = useRef(false);

  // Has someone else saved this subject since we loaded it?
  const checkRemote = useCallback(async () => {
    if (!treeVersion.current) return null;
    const { data } = await authAxios.get(`${apiUrl}/admin/subjects/${id}/tree/version`);
    const info = data?.data as { tree_version: string; last_saved_by: string | null; last_saved_at: string | null } | undefined;
    if (!info || info.tree_version === treeVersion.current) return null;
    return { version: info.tree_version, by: info.last_saved_by, at: info.last_saved_at };
  }, [apiUrl, id]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== 'visible' || saving) return;
      try {
        const change = await checkRemote();
        if (cancelled || !change) return;
        if (!isDirtyRef.current) {
          // Nothing local to lose — just take their version.
          await loadTree();
          notify.success(`Updated with ${actorName(change.by)}’s latest changes`);
        } else {
          setRemote((current) => (current?.version === change.version ? current : change));
        }
      } catch {
        // Polling is best effort.
      }
    };
    const interval = window.setInterval(() => void tick(), VERSION_POLL_MS);
    window.addEventListener('focus', tick);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, [checkRemote, loadTree, loading, saving]);

  const thumbnailUrl = form.watch('thumbnail_url');
  const subjectName = form.watch('name');
  const subjectCode = form.watch('code');
  const yearLevel = form.watch('year_level');
  const subjectActive = form.watch('is_active');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return notify.error('Image must be a PNG, JPEG or WebP file');
    if (file.size > MAX_IMAGE_BYTES) return notify.error('Image must be 1 MB or smaller');
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await authAxios.post(`${apiUrl}/admin/subjects/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('thumbnail_url', url, { shouldDirty: true });
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  // Auto-open a section the moment it is appended (array grows by exactly one).
  const prevSectionCount = useRef(0);
  useEffect(() => {
    if (sectionFields.length === prevSectionCount.current + 1 && !loading) {
      const last = sectionFields[sectionFields.length - 1];
      if (last) setOpenSections((prev) => ({ ...prev, [last.id]: true }));
    }
    prevSectionCount.current = sectionFields.length;
  }, [sectionFields, loading]);

  // Unsaved-changes guard: in-app navigation asks first; closing the tab or
  // reloading triggers the browser's own prompt.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeave.current && isDirty && !saving && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const importVideos = (videos: ImportedVideo[], sectionIndex: number) => {
    const lectures = videos.map((video) => ({
      ...emptyLecture(),
      title: video.title,
      resources: [{ label: 'Lecture recording', url: video.url, type: ResourceType.YOUTUBE, is_active: true }],
    }));
    if (sectionIndex < 0) {
      appendSection({ ...emptySection(`Section ${sectionFields.length + 1}`), lectures });
    } else {
      const path = `sections.${sectionIndex}.lectures` as const;
      form.setValue(path, [...form.getValues(path), ...lectures], { shouldDirty: true });
      const key = sectionFields[sectionIndex]?.id;
      if (key) setOpenSections((prev) => ({ ...prev, [key]: true }));
    }
    notify.success(`Added ${videos.length} ${videos.length === 1 ? 'lecture' : 'lectures'} — save the subject to publish`);
  };

  /** videoId → "Section N" for every YouTube link already in the subject. */
  const existingVideos = () => {
    const map = new Map<string, string>();
    form.getValues('sections').forEach((section, index) =>
      section.lectures.forEach((lecture) =>
        lecture.resources.forEach((resource) => {
          const videoId = youtubeVideoId(resource.url);
          if (videoId && !map.has(videoId)) map.set(videoId, `Section ${index + 1}`);
        }),
      ),
    );
    return map;
  };

  const submit = form.handleSubmit(
    async (values) => {
      const provider = dataProvider();
      if (!provider?.custom) return;
      setSaving(true);
      try {
        // After the conflict banner the admin has chosen to overwrite: save
        // against the version they were warned about.
        await provider.custom({
          url: `${apiUrl}/admin/subjects/${id}/tree`,
          method: 'put',
          payload: toPayload(id, values, remote?.version ?? treeVersion.current),
        });
        notify.success('Subject saved');
        await Promise.all([
          invalidate({ resource: 'subjects', invalidates: ['list', 'detail'], id }),
          invalidate({ resource: 'resources', invalidates: ['list'] }),
        ]);
        await loadTree();
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        // 409 is either a version conflict or a duplicate name/title; only the
        // former changes the tree version.
        const change = status === 409 ? await checkRemote().catch(() => null) : null;
        if (change) {
          setRemote(change);
          notify.error('Someone else saved this subject — review the banner before saving.');
        } else {
          notify.error(resolveApiErrorMessage(error, 'Could not save the subject. Please try again.'));
        }
      } finally {
        setSaving(false);
      }
    },
    (errors) => {
      // Open whatever holds a validation error so the admin can see it.
      if (errors.code || errors.name || errors.year_level || errors.description) setDetailsOpen(true);
      const sectionErrors = errors.sections as unknown as Array<unknown> | undefined;
      if (Array.isArray(sectionErrors)) {
        setOpenSections((prev) => {
          const next = { ...prev };
          sectionErrors.forEach((err, i) => {
            if (err && sectionFields[i]) next[sectionFields[i].id] = true;
          });
          return next;
        });
      }
      notify.error('Please fix the highlighted fields.');
    },
  );

  const sectionOptions = sectionFields.map((_, index) => ({
    index,
    label: `${subjectCode || 'Subject'} · Section ${index + 1}${form.getValues(`sections.${index}.name`) ? ` — ${form.getValues(`sections.${index}.name`)}` : ''}`,
  }));
  const offsets = lectureCounts.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + lectureCounts[i - 1]], []);

  return (
    <div>
      {/* Header */}
      <nav className="mb-1 flex items-center gap-1 text-xs text-ink-3" aria-label="Breadcrumb">
        <Link to="/subjects" className="hover:text-ink-1">
          Subjects
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-ink-2">{subjectCode || '…'}</span>
      </nav>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink-1">{subjectName || 'Subject'}</h1>
          {!loading ? (
            <StatusPill tone={subjectActive ? 'live' : 'hidden'}>
              {subjectActive ? 'Live' : 'Hidden'} · Year {yearLevel}
            </StatusPill>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`${STUDENT_SITE_URL}/subjects/${id}`} target="_blank" rel="noopener noreferrer" title={subjectActive ? undefined : 'Hidden subjects are not visible to students'}>
              <Eye />
              Preview as student
            </a>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setImportFor('header')} disabled={loading}>
            <ListVideo />
            Import playlist
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="More subject actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ConfirmButton
                title="Delete this subject?"
                description="This permanently deletes the subject and every section, lecture and file under it. Calendar events keep their details but lose the subject link. You can undo within a few seconds."
                confirmLabel="Delete subject"
                onConfirm={() => {
                  allowLeave.current = true;
                  deleteSubject({ resource: 'subjects', id });
                  navigate('/subjects');
                }}
                trigger={
                  <DropdownMenuItem variant="danger" onSelect={(event) => event.preventDefault()}>
                    <Trash2 />
                    Delete subject
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {remote ? (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden />
          <span className="min-w-0 flex-1">
            Another admin{remote.by ? ` (${actorName(remote.by)})` : ''} saved this subject{remote.at ? ` ${formatAgo(remote.at)}` : ''}. Saving now
            would overwrite their changes.
          </span>
          <ConfirmButton
            title="Reload their version?"
            description="Your unsaved changes on this page will be lost."
            confirmLabel="Reload"
            onConfirm={() => void loadTree()}
            trigger={
              <button type="button" className="shrink-0 font-semibold text-amber-800 hover:text-amber-950">
                Reload their version
              </button>
            }
          />
        </div>
      ) : null}

      <FormProvider {...form}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* Subject details (collapsed by default — the tree is the main job) */}
          <section className="rounded-xl border border-slate-200/70 bg-white shadow-subtle">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              aria-expanded={detailsOpen}
              className="flex w-full items-center gap-2 px-4 py-3 text-left"
            >
              {detailsOpen ? <ChevronDown className="size-4 text-ink-3" /> : <ChevronRight className="size-4 text-ink-3" />}
              <span className="text-[13px] font-semibold text-ink-1">Subject details</span>
              <span className="hidden truncate text-xs text-ink-3 sm:inline">Code, name, year, description, cover and visibility</span>
            </button>
            {detailsOpen ? (
              <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-[1fr_240px]">
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CVS 201" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Cardiovascular System" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="year_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Year</FormLabel>
                        <Segmented
                          variant="tiles"
                          aria-label="Year"
                          value={String(field.value)}
                          onChange={(value) => field.onChange(Number(value))}
                          options={[1, 2, 3, 4, 5, 6].map((year) => ({ label: year, value: String(year), title: `Year ${year}` }))}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short description</FormLabel>
                        <FormControl>
                          <Textarea rows={2} className="min-h-0" placeholder="Shown on the subject card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                          <span>
                            <span className="block text-sm font-medium text-ink-1">Visible to students</span>
                            <span className="block text-[11px] text-ink-3">Hidden subjects don’t appear anywhere</span>
                          </span>
                          <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Visible to students" />
                        </label>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="order_index"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Lower numbers come first within the year.</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Cover image</p>
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={handleFileSelected} />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                      {thumbnailUrl ? 'Replace' : 'Upload'}
                    </Button>
                    {thumbnailUrl ? (
                      <Button type="button" variant="danger-ghost" size="sm" onClick={() => form.setValue('thumbnail_url', '', { shouldDirty: true })}>
                        <X />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-ink-3">PNG, JPEG or WebP, up to 1 MB.</p>
                </div>
              </div>
            ) : null}
          </section>

          {/* Curriculum tree */}
          <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle" aria-label="Sections and lectures">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-ink-3">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : sectionFields.length === 0 ? (
              <AdminEmptyState
                icon={<Layers />}
                title="No sections yet"
                subtitle="Add a section, or import a YouTube playlist to start this subject."
                action={{ label: 'Add section', onClick: () => appendSection(emptySection()) }}
              />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSortEnd(sectionFields, moveSection)}>
                <SortableContext items={sectionFields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                  {sectionFields.map((field, sectionIndex) => {
                    const realId = form.getValues(`sections.${sectionIndex}.id`);
                    const before = realId ? original.sections.find((section) => section.id === realId) : undefined;
                    const nowIds = (form.getValues(`sections.${sectionIndex}.lectures`) ?? []).map((lecture) => lecture.id).filter((lectureId) => lectureId && before?.lectures.some((l) => l.id === lectureId));
                    const beforeIds = (before?.lectures ?? []).map((lecture) => lecture.id).filter((lectureId) => nowIds.includes(lectureId));
                    const reordered = Boolean(before) && nowIds.some((lectureId, i) => lectureId !== beforeIds[i]);
                    return (
                      <SectionEditor
                        key={field.id}
                        sortableId={field.id}
                        sectionIndex={sectionIndex}
                        numberOffset={offsets[sectionIndex] ?? 0}
                        open={openSections[field.id] ?? false}
                        reordered={reordered}
                        onToggle={() => setOpenSections((prev) => ({ ...prev, [field.id]: !(prev[field.id] ?? false) }))}
                        onRemove={() => removeSection(sectionIndex)}
                        onImport={() => setImportFor(sectionIndex)}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
            {!loading && sectionFields.length > 0 ? (
              <div className="border-t border-slate-200/70 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => appendSection(emptySection())}
                  className={cn('inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover')}
                >
                  <Plus className="size-3.5" />
                  Add section
                </button>
              </div>
            ) : null}
          </section>

          <UnsavedBar control={form.control} original={original} saving={saving} onDiscard={() => form.reset(original)} />
        </form>
      </FormProvider>

      <PlaylistImportDialog
        open={importFor !== null}
        onOpenChange={(next) => !next && setImportFor(null)}
        sections={sectionOptions.length > 0 ? sectionOptions : [{ index: -1, label: `${subjectCode || 'Subject'} · New section` }]}
        defaultSectionIndex={typeof importFor === 'number' ? importFor : sectionOptions.length > 0 ? sectionOptions.length - 1 : -1}
        existing={importFor !== null ? existingVideos() : new Map()}
        onImport={importVideos}
      />

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>Your changes to this subject haven’t been saved. If you leave now they will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
