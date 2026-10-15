/**
 * Learning Hub editor (Brilliant: 04 Admin — LH editor): card details on the
 * left, link groups on the right. Groups and links are stored inline as JSON
 * (`categories`); groups can be dragged into order and collapsed.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiUrl, useDelete, useForm as useRefineForm } from '@refinedev/core';
import { useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, BookOpenText, ChevronDown, ChevronRight, Ellipsis, Eye, GripVertical, Loader2, Trash2, X } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { onSortEnd, useDndSensors } from '../subjects/tree/dnd';

const linkSchema = z.object({
  label: z.string().trim().optional(),
  url: z.string().trim().min(1, 'Enter a URL'),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a group name'),
  links: z.array(linkSchema),
});

const schema = z.object({
  title: z.string().trim().min(1, 'Please enter a title'),
  description: z.string().trim().optional(),
  image_url: z.string().trim().optional(),
  author_name: z.string().trim().optional(),
  technologies: z.array(z.string().trim().min(1)),
  categories: z.array(categorySchema),
  is_published: z.boolean(),
});

type Values = z.infer<typeof schema>;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const STUDENT_SITE_URL = import.meta.env.VITE_STUDENT_SITE_URL || 'http://localhost:3001';

const cellInput =
  'h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] text-ink-1 outline-none transition-colors placeholder:text-ink-4 hover:border-slate-300 focus:border-brand aria-[invalid=true]:border-red-400';

/** One collapsible link group with its links. */
function LinkGroup({
  control,
  sortableId,
  index,
  open,
  onToggle,
  onRemove,
}: {
  control: Control<Values>;
  sortableId: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `categories.${index}.links` as const });
  const name = useWatch({ control, name: `categories.${index}.name` });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle', isDragging && 'relative z-10 shadow-lg')}
    >
      <div className={cn('flex items-center gap-2 px-3 py-2', open && 'border-b border-slate-100 bg-slate-50/70')}>
        <button
          type="button"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder group"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Collapse group' : 'Expand group'}
          className="flex size-6 items-center justify-center rounded text-ink-3 hover:bg-slate-100"
        >
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        {open ? (
          <FormField
            control={control}
            name={`categories.${index}.name`}
            render={({ field, fieldState }) => (
              <input
                {...field}
                aria-label="Group name"
                aria-invalid={Boolean(fieldState.error)}
                placeholder="Group name (e.g. Cardiovascular)"
                className={cn(cellInput, 'max-w-xs font-semibold')}
              />
            )}
          />
        ) : (
          <button type="button" onClick={onToggle} className="truncate text-[13px] font-semibold text-ink-1">
            {name || 'Untitled group'}
          </button>
        )}
        <span className="shrink-0 text-xs text-ink-3">
          {fields.length} {fields.length === 1 ? 'link' : 'links'}
        </span>
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove group" className="text-ink-4 hover:text-red-600">
          <Trash2 />
        </Button>
      </div>
      {open ? (
        <div className="flex flex-col gap-1.5 px-3 py-2.5 pl-11">
          {fields.map((field, linkIndex) => (
            <div key={field.id} className="flex items-start gap-2">
              <FormField
                control={control}
                name={`categories.${index}.links.${linkIndex}.label`}
                render={({ field: f }) => <input {...f} aria-label="Link label" placeholder="Label" className={cn(cellInput, 'w-44 shrink-0')} />}
              />
              <FormField
                control={control}
                name={`categories.${index}.links.${linkIndex}.url`}
                render={({ field: f, fieldState }) => (
                  <div className="flex-1">
                    <input {...f} aria-label="Link URL" aria-invalid={Boolean(fieldState.error)} placeholder="https://…" className={cellInput} />
                    {fieldState.error ? <p className="mt-0.5 text-[11px] text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(linkIndex)} aria-label="Remove link" className="text-ink-4 hover:text-red-600">
                <Trash2 />
              </Button>
            </div>
          ))}
          <button type="button" onClick={() => append({ label: '', url: '' })} className="self-start text-xs font-semibold text-brand hover:text-brand-hover">
            + Add link
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LearningResourceForm({ id }: { id?: string }) {
  const apiUrl = useApiUrl();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [techDraft, setTechDraft] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const sensors = useDndSensors();
  const { mutate: deleteOne } = useDelete();

  const { onFinish, queryResult, formLoading } = useRefineForm<LearningResource>({
    resource: 'learning-resources',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', image_url: '', author_name: '', technologies: [], categories: [], is_published: true },
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup, move: moveGroup } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const record = queryResult?.data?.data;
  const resetForId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (record && resetForId.current !== record.id) {
      resetForId.current = record.id;
      form.reset({
        title: record.title ?? '',
        description: record.description ?? '',
        image_url: record.image_url ?? '',
        author_name: record.author_name ?? '',
        technologies: record.technologies ?? [],
        categories: (record.categories ?? []).map((c) => ({
          name: c.name ?? '',
          links: (c.links ?? []).map((l) => ({ label: l.label ?? '', url: l.url ?? '' })),
        })),
        is_published: record.is_published ?? true,
      });
    }
  }, [record, form]);

  const imageUrl = form.watch('image_url');
  const technologies = form.watch('technologies');
  const title = form.watch('title');

  const addTechnology = () => {
    const value = techDraft.trim().replace(/,$/, '');
    if (!value) return;
    const current = form.getValues('technologies');
    if (!current.includes(value)) form.setValue('technologies', [...current, value], { shouldDirty: true });
    setTechDraft('');
  };

  const handleTechKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTechnology();
    } else if (event.key === 'Backspace' && techDraft === '' && technologies.length > 0) {
      form.setValue('technologies', technologies.slice(0, -1), { shouldDirty: true });
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return notify.error('Image must be a PNG, JPEG or WebP image');
    if (file.size > MAX_IMAGE_BYTES) return notify.error('Image must be 4 MB or smaller');
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      // authAxios defaults to JSON; multipart must be explicit or the file is dropped.
      const { data } = await authAxios.post(`${apiUrl}/admin/learning-resources/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('image_url', url, { shouldDirty: true });
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit(
    async (values) => {
      await onFinish({
        ...values,
        // Drop links without a URL, then empty groups.
        categories: values.categories
          .map((c) => ({ name: c.name, links: c.links.filter((l) => l.url.trim() !== '') }))
          .filter((c) => c.name.trim() !== '' || c.links.length > 0),
      });
    },
    (errors) => {
      const groupErrors = errors.categories as unknown as Array<unknown> | undefined;
      if (Array.isArray(groupErrors)) {
        setOpenGroups((prev) => {
          const next = { ...prev };
          groupErrors.forEach((err, i) => {
            if (err && groupFields[i]) next[groupFields[i].id] = true;
          });
          return next;
        });
      }
    },
  );

  return (
    <div>
      <Link to="/learning-resources" className="mb-1 inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink-1">
        <ArrowLeft className="size-3.5" />
        Learning Hub
      </Link>
      <Form {...form}>
        <form onSubmit={submit}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink-1">{title || (id ? 'Edit resource' : 'New resource')}</h1>
            <div className="flex items-center gap-2">
              {id ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={`${STUDENT_SITE_URL}/learning-hub/${id}`} target="_blank" rel="noopener noreferrer">
                    <Eye />
                    Preview
                  </a>
                </Button>
              ) : null}
              <Button type="submit" size="sm" loading={formLoading} disabled={uploading}>
                Save
              </Button>
              {id ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ConfirmButton
                      title="Delete this resource?"
                      description="You can undo this within a few seconds."
                      confirmLabel="Delete"
                      onConfirm={() => {
                        deleteOne({ resource: 'learning-resources', id });
                        navigate('/learning-resources');
                      }}
                      trigger={
                        <DropdownMenuItem variant="danger" onSelect={(event) => event.preventDefault()}>
                          <Trash2 />
                          Delete resource
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5">
                <p className="text-[13px] font-semibold text-ink-1">Details</p>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Year 2 Anki deck pack" {...field} />
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
                        <Textarea rows={3} className="min-h-0" placeholder="What students get from it" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curated by</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Year 3 Anki team" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 focus-within:border-slate-300">
                    {technologies.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-ink-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => form.setValue('technologies', technologies.filter((t) => t !== tag), { shouldDirty: true })}
                          className="text-ink-4 hover:text-ink-1"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={techDraft}
                      onChange={(event) => setTechDraft(event.target.value)}
                      onKeyDown={handleTechKeyDown}
                      onBlur={addTechnology}
                      aria-label="Add tag"
                      placeholder="Add tag…"
                      className="min-w-[6rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-ink-4"
                    />
                  </div>
                </FormItem>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={handleFileSelected} />
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-subtle text-brand">
                    {uploading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="Card image" className="size-full object-cover" />
                    ) : (
                      <BookOpenText className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex gap-3">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[13px] font-semibold text-brand hover:text-brand-hover">
                        {imageUrl ? 'Replace image' : 'Upload image'}
                      </button>
                      {imageUrl ? (
                        <button type="button" onClick={() => form.setValue('image_url', '', { shouldDirty: true })} className="text-[13px] text-ink-3 hover:text-red-600">
                          Remove
                        </button>
                      ) : null}
                    </span>
                    <span className="block text-[11px] text-ink-3">PNG, JPG or WebP · max 4 MB</span>
                  </span>
                </div>
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[13px] font-medium text-ink-1">Published</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
                    </label>
                  )}
                />
              </CardContent>
            </Card>

            <section aria-label="Link groups">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink-1">Link groups</h2>
                <button
                  type="button"
                  onClick={() => appendGroup({ name: '', links: [{ label: '', url: '' }] })}
                  className="text-xs font-semibold text-brand hover:text-brand-hover"
                >
                  + Add group
                </button>
              </div>
              {groupFields.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-ink-3">
                  No groups yet. Groups become collapsible sections on the student page.
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSortEnd(groupFields, moveGroup)}>
                  <SortableContext items={groupFields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {groupFields.map((field, index) => (
                        <LinkGroup
                          key={field.id}
                          control={form.control}
                          sortableId={field.id}
                          index={index}
                          open={openGroups[field.id] ?? index === 0}
                          onToggle={() => setOpenGroups((prev) => ({ ...prev, [field.id]: !(prev[field.id] ?? index === 0) }))}
                          onRemove={() => removeGroup(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </section>
          </div>
        </form>
      </Form>
    </div>
  );
}
