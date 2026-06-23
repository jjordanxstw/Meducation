/**
 * Unified Subject Tree editor.
 *
 * Edits a subject AND its full nested hierarchy (sections → lectures → resources)
 * in a single screen and saves it atomically via PUT /admin/subjects/:id/tree
 * (the admin_save_subject_tree RPC). Modeled on the Learning Hub form's nested
 * `useFieldArray` pattern. order_index is implied by array position — drag a row
 * by its handle to reorder and the server persists the new order.
 *
 * Only available in edit mode (the tree needs a subject id); the create flow uses
 * the plain SubjectForm and then redirects here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiUrl, useDataProvider, useInvalidate } from '@refinedev/core';
import { useForm, useFieldArray, type Control, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GripVertical,
  ImageIcon,
  Layers,
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
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { cn } from '@/lib/utils';

const RESOURCE_TYPE_OPTIONS = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, 'Enter a label'),
  url: z.string().trim().min(1, 'Enter a URL'),
  type: z.nativeEnum(ResourceType),
  is_active: z.boolean(),
});

const lectureSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim().optional(),
  lecture_date: z.string().optional(),
  lecturer_name: z.string().trim().optional(),
  is_active: z.boolean(),
  resources: z.array(resourceSchema),
});

const sectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Enter a section name'),
  description: z.string().trim().optional(),
  is_active: z.boolean(),
  lectures: z.array(lectureSchema),
});

const schema = z.object({
  code: z.string().trim().min(1, 'Please enter a code'),
  name: z.string().trim().min(1, 'Please enter a name'),
  year_level: z.number().int().min(1, 'Year must be 1–6').max(6, 'Year must be 1–6'),
  description: z.string().trim().optional(),
  thumbnail_url: z.string().trim().optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean(),
  sections: z.array(sectionSchema),
});

type Values = z.infer<typeof schema>;

const emptyResource = () => ({ label: '', url: '', type: ResourceType.YOUTUBE, is_active: true });
const emptyLecture = () => ({
  title: '',
  description: '',
  lecture_date: '',
  lecturer_name: '',
  is_active: true,
  resources: [],
});
const emptySection = () => ({ name: '', description: '', is_active: true, lectures: [] });

/** Shared pointer + keyboard sensors. The 6px activation distance keeps clicks on
 *  inputs and buttons working — a drag only starts once the handle is moved. */
function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/** A single resource row inside a lecture. */
function ResourceRow({
  control,
  sortableId,
  sectionIndex,
  lectureIndex,
  resourceIndex,
  onRemove,
}: {
  control: Control<Values>;
  sortableId: string;
  sectionIndex: number;
  lectureIndex: number;
  resourceIndex: number;
  onRemove: () => void;
}) {
  const base = `sections.${sectionIndex}.lectures.${lectureIndex}.resources.${resourceIndex}` as const;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/50 p-2',
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        aria-label="Drag to reorder resource"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <FormField
            control={control}
            name={`${base}.label`}
            render={({ field }) => (
              <FormItem className="sm:w-48 sm:shrink-0">
                <FormControl>
                  <Input placeholder="Button label (e.g. Slides)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${base}.type`}
            render={({ field }) => (
              <FormItem className="sm:w-48 sm:shrink-0">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RESOURCE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name={`${base}.url`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="URL or Video ID"
                  {...field}
                  endContent={
                    <button
                      type="button"
                      className="text-brand"
                      onClick={() => {
                        const url = field.value?.trim();
                        if (url) window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      aria-label="Test link"
                    >
                      <ExternalLink className="size-4" />
                    </button>
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={`${base}.is_active`}
        render={({ field }) => (
          <div className="flex h-9 items-center" title="Active">
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
      <Button type="button" variant="danger-ghost" size="icon-sm" onClick={onRemove} aria-label="Remove resource">
        <X />
      </Button>
    </div>
  );
}

/** A single lecture card, with its nested (sortable) resources. */
function LectureEditor({
  control,
  sortableId,
  sectionIndex,
  lectureIndex,
  onRemove,
}: {
  control: Control<Values>;
  sortableId: string;
  sectionIndex: number;
  lectureIndex: number;
  onRemove: () => void;
}) {
  const base = `sections.${sectionIndex}.lectures.${lectureIndex}` as const;
  const { fields, append, remove, move } = useFieldArray({ control, name: `${base}.resources` });
  const sensors = useDndSensors();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const onResourceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('rounded-lg border border-slate-200 bg-white p-3', isDragging && 'relative z-10 shadow-lg')}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder lecture"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormField
              control={control}
              name={`${base}.title`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Lecture title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${base}.lecture_date`}
              render={({ field }) => (
                <FormItem className="sm:w-44 sm:shrink-0">
                  <FormControl>
                    <DatePicker
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Lecture date"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name={`${base}.lecturer_name`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Lecturer name (optional)" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name={`${base}.is_active`}
          render={({ field }) => (
            <div className="flex h-9 items-center" title="Active">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        <ConfirmButton
          title="Remove this lecture?"
          description="The lecture and its resources will be removed when you save. Existing students lose access on save."
          confirmLabel="Remove"
          onConfirm={onRemove}
          trigger={
            <Button type="button" variant="danger-ghost" size="icon-sm" aria-label="Remove lecture">
              <Trash2 />
            </Button>
          }
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 pl-1">
        <p className="text-xs font-medium text-slate-400">Resources</p>
        {fields.length === 0 ? (
          <p className="text-xs text-slate-400">No resources yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onResourceDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {fields.map((field, resourceIndex) => (
                  <ResourceRow
                    key={field.id}
                    control={control}
                    sortableId={field.id}
                    sectionIndex={sectionIndex}
                    lectureIndex={lectureIndex}
                    resourceIndex={resourceIndex}
                    onRemove={() => remove(resourceIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => append(emptyResource())}>
            <Plus />
            Add resource
          </Button>
        </div>
      </div>
    </div>
  );
}

/** A collapsible section card, with its nested (sortable) lectures. */
function SectionEditor({
  control,
  form,
  sortableId,
  sectionIndex,
  open,
  onToggle,
  onRemove,
}: {
  control: Control<Values>;
  form: UseFormReturn<Values>;
  sortableId: string;
  sectionIndex: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const base = `sections.${sectionIndex}` as const;
  const { fields, append, remove, move } = useFieldArray({ control, name: `${base}.lectures` });
  const sensors = useDndSensors();
  const name = form.watch(`${base}.name`);
  const isActive = form.watch(`${base}.is_active`);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const onLectureDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-subtle',
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder section"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
          <span className="font-medium text-slate-900">{name?.trim() || 'Untitled section'}</span>
          <Badge variant="neutral">{fields.length} {fields.length === 1 ? 'lecture' : 'lectures'}</Badge>
          {!isActive && <Badge variant="danger">Hidden</Badge>}
        </button>
        <ConfirmButton
          title="Remove this section?"
          description="The section, its lectures and their resources will be removed when you save."
          confirmLabel="Remove"
          onConfirm={onRemove}
          trigger={
            <Button type="button" variant="danger-ghost" size="icon-sm" aria-label="Remove section">
              <Trash2 />
            </Button>
          }
        />
      </div>

      {open && (
        <div className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <FormField
              control={control}
              name={`${base}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel required>Section name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Block 1 — Foundations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${base}.is_active`}
              render={({ field }) => (
                <FormItem className="sm:w-40">
                  <FormLabel>Active</FormLabel>
                  <div className="flex h-10 items-center">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name={`${base}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Short description (optional)" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
            <p className="text-sm font-semibold text-slate-700">Lectures</p>
            {fields.length === 0 ? (
              <p className="text-sm text-slate-400">No lectures yet. Add one below.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLectureDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3">
                    {fields.map((field, lectureIndex) => (
                      <LectureEditor
                        key={field.id}
                        control={control}
                        sortableId={field.id}
                        sectionIndex={sectionIndex}
                        lectureIndex={lectureIndex}
                        onRemove={() => remove(lectureIndex)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyLecture())}>
                <Plus />
                Add lecture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubjectTreeForm({ id }: { id: string }) {
  const apiUrl = useApiUrl();
  const dataProvider = useDataProvider();
  const invalidate = useInvalidate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const sensors = useDndSensors();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      year_level: 1,
      description: '',
      thumbnail_url: '',
      order_index: 0,
      is_active: true,
      sections: [],
    },
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const loadTree = useCallback(async () => {
    const provider = dataProvider();
    if (!provider?.custom) return;
    const res = await provider.custom<{ data?: SubjectEditableTree }>({
      url: `${apiUrl}/admin/subjects/${id}/tree`,
      method: 'get',
    });
    const tree = res?.data?.data;
    if (!tree) return;
    form.reset({
      code: tree.code ?? '',
      name: tree.name ?? '',
      year_level: tree.year_level ?? 1,
      description: tree.description ?? '',
      thumbnail_url: tree.thumbnail_url ?? '',
      order_index: tree.order_index ?? 0,
      is_active: tree.is_active ?? true,
      sections: (tree.sections ?? []).map((s) => ({
        id: s.id,
        name: s.name ?? '',
        description: s.description ?? '',
        is_active: s.is_active ?? true,
        lectures: (s.lectures ?? []).map((l) => ({
          id: l.id,
          title: l.title ?? '',
          description: l.description ?? '',
          lecture_date: l.lecture_date ?? '',
          lecturer_name: l.lecturer_name ?? '',
          is_active: l.is_active ?? true,
          resources: (l.resources ?? []).map((r) => ({
            id: r.id,
            label: r.label ?? '',
            url: r.url ?? '',
            type: r.type,
            is_active: r.is_active ?? true,
          })),
        })),
      })),
    });
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

  const thumbnailUrl = form.watch('thumbnail_url');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('Image must be a PNG, JPEG or WebP file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify.error('Image must be 1 MB or smaller');
      return;
    }

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
      notify.success('Image uploaded');
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  // Auto-open a section the moment it is appended (array grows by exactly one).
  const prevSectionCount = useRef(0);
  useEffect(() => {
    if (sectionFields.length === prevSectionCount.current + 1) {
      const last = sectionFields[sectionFields.length - 1];
      if (last) setOpenSections((prev) => ({ ...prev, [last.id]: true }));
    }
    prevSectionCount.current = sectionFields.length;
  }, [sectionFields]);

  const onSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionFields.findIndex((f) => f.id === active.id);
    const newIndex = sectionFields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) moveSection(oldIndex, newIndex);
  };

  const submit = form.handleSubmit(
    async (values) => {
      const provider = dataProvider();
      if (!provider?.custom) return;
      setSaving(true);
      try {
        await provider.custom({
          url: `${apiUrl}/admin/subjects/${id}/tree`,
          method: 'put',
          payload: {
            subject_id: id,
            subject: {
              code: values.code.trim(),
              name: values.name.trim(),
              year_level: values.year_level,
              description: values.description?.trim() || null,
              thumbnail_url: values.thumbnail_url?.trim() || null,
              order_index: values.order_index,
              is_active: values.is_active,
            },
            sections: values.sections.map((s) => ({
              id: s.id,
              name: s.name.trim(),
              description: s.description?.trim() || null,
              is_active: s.is_active,
              lectures: s.lectures.map((l) => ({
                id: l.id,
                title: l.title.trim(),
                description: l.description?.trim() || null,
                lecture_date: l.lecture_date || null,
                lecturer_name: l.lecturer_name?.trim() || null,
                is_active: l.is_active,
                resources: l.resources.map((r) => ({
                  id: r.id,
                  label: r.label.trim(),
                  url: r.url.trim(),
                  type: r.type,
                  is_active: r.is_active,
                })),
              })),
            })),
          },
        });
        notify.success('Saved successfully');
        await Promise.all([
          invalidate({ resource: 'subjects', invalidates: ['list', 'detail'], id }),
          invalidate({ resource: 'resources', invalidates: ['list'] }),
          invalidate({ resource: 'sections', invalidates: ['list'] }),
          invalidate({ resource: 'lectures', invalidates: ['list'] }),
        ]);
        await loadTree();
      } catch (error) {
        notify.error(resolveApiErrorMessage(error, 'Could not save the subject. Please try again.'));
      } finally {
        setSaving(false);
      }
    },
    (errors) => {
      // Expand any section that contains a validation error so the user can see it.
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

  return (
    <div>
      <PageHeader
        title="Edit Subject"
        description="Manage the subject and its sections, lectures and resources, then save it all at once."
        actions={
          <Button asChild variant="ghost">
            <Link to="/subjects">
              <ArrowLeft />
              Back
            </Link>
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={submit} className="flex flex-col gap-6">
          {/* Subject details */}
          <Card className="max-w-3xl">
            <CardContent className="flex flex-col gap-5 p-6">
              <FormItem>
                <FormLabel>Cover image</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                        {thumbnailUrl ? 'Replace' : 'Upload'}
                      </Button>
                      {thumbnailUrl ? (
                        <Button
                          type="button"
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => form.setValue('thumbnail_url', '', { shouldDirty: true })}
                        >
                          <X />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <FormDescription>PNG, JPEG or WebP, up to 1 MB. Shown on the student subject card.</FormDescription>
                  </div>
                </div>
              </FormItem>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SCID222" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Year level</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              Year {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Human Biology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Short description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-5 sm:grid-cols-2">
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
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Lower numbers appear first.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Inactive subjects are hidden from students.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Curriculum tree */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">Curriculum</h2>
                  <p className="text-sm text-slate-500">
                    Sections hold lectures, and lectures hold resources. Drag the handle to reorder.
                  </p>
                </div>
                <Button type="button" onClick={() => appendSection(emptySection())}>
                  <Plus />
                  Add section
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : sectionFields.length === 0 ? (
                <AdminEmptyState
                  icon={<Layers />}
                  title="No sections yet"
                  subtitle="Add a section to start building this subject's curriculum."
                  action={{ label: 'Add section', onClick: () => appendSection(emptySection()) }}
                />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                  <SortableContext items={sectionFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                      {sectionFields.map((field, sectionIndex) => (
                        <SectionEditor
                          key={field.id}
                          control={form.control}
                          form={form}
                          sortableId={field.id}
                          sectionIndex={sectionIndex}
                          open={openSections[field.id] ?? false}
                          onToggle={() => setOpenSections((prev) => ({ ...prev, [field.id]: !(prev[field.id] ?? false) }))}
                          onRemove={() => removeSection(sectionIndex)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/subjects">Cancel</Link>
              </Button>
              <Button type="submit" loading={saving} disabled={uploading || loading}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
