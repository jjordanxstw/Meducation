/**
 * Shared create/edit form for "Learning Hub" cards.
 * Refine headless `useForm` + react-hook-form + zod, plus an image uploader that
 * pushes the image to the service-api (Supabase Storage) and stores the returned
 * public URL in `image_url`. `technologies` is a chip-style tag input and
 * `categories` is a nested editor (categories -> links) persisted inline as JSON.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApiUrl, useForm as useRefineForm } from '@refinedev/core';
import { useForm, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

const linkSchema = z.object({
  label: z.string().trim().optional(),
  url: z.string().trim().min(1, 'Enter a URL'),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name'),
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

/** Nested links editor for a single category (react-hook-form nested field array). */
function CategoryLinks({ control, categoryIndex }: { control: Control<Values>; categoryIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `categories.${categoryIndex}.links` as const,
  });

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 ? (
        <p className="text-xs text-slate-400">No links yet.</p>
      ) : (
        fields.map((field, linkIndex) => (
          <div key={field.id} className="flex items-start gap-2">
            <FormField
              control={control}
              name={`categories.${categoryIndex}.links.${linkIndex}.label`}
              render={({ field: f }) => (
                <FormItem className="w-40 shrink-0">
                  <FormControl>
                    <Input placeholder="Label" {...f} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`categories.${categoryIndex}.links.${linkIndex}.url`}
              render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="https://…" {...f} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="danger-ghost"
              size="icon-sm"
              className="mt-0.5"
              onClick={() => remove(linkIndex)}
              aria-label="Remove link"
            >
              <X />
            </Button>
          </div>
        ))
      )}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ label: '', url: '' })}>
          <Plus />
          Add link
        </Button>
      </div>
    </div>
  );
}

export function LearningResourceForm({ id }: { id?: string }) {
  const apiUrl = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [techDraft, setTechDraft] = useState('');

  const { onFinish, queryResult, formLoading } = useRefineForm<LearningResource>({
    resource: 'learning-resources',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      author_name: '',
      technologies: [],
      categories: [],
      is_published: true,
    },
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
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

  const addTechnology = () => {
    const value = techDraft.trim();
    if (!value) return;
    const current = form.getValues('technologies');
    if (!current.includes(value)) {
      form.setValue('technologies', [...current, value], { shouldDirty: true });
    }
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

  const removeTechnology = (tag: string) => {
    form.setValue(
      'technologies',
      form.getValues('technologies').filter((t) => t !== tag),
      { shouldDirty: true },
    );
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change.
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('Image must be a PNG, JPEG or WebP image');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify.error('Image must be 4 MB or smaller');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // authAxios defaults to Content-Type: application/json. Left as-is, axios's
      // transformRequest would JSON-serialize the FormData and drop the file, so
      // we override to a multipart type — axios then passes the FormData through
      // and the browser fills in the multipart boundary.
      const { data } = await authAxios.post(`${apiUrl}/admin/learning-resources/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('image_url', url, { shouldDirty: true });
      notify.success('Image uploaded');
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    await onFinish({
      ...values,
      // Drop links without a URL, then drop empty categories.
      categories: values.categories
        .map((c) => ({
          name: c.name,
          links: c.links.filter((l) => l.url.trim() !== ''),
        }))
        .filter((c) => c.name.trim() !== '' || c.links.length > 0),
    });
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Learning Resource' : 'New Learning Resource'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/learning-resources">
              <ArrowLeft />
              Back
            </Link>
          </Button>
        }
      />
      <Card className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={submit}>
            <CardContent className="flex flex-col gap-5 p-6">
              {/* Image uploader */}
              <FormItem>
                <FormLabel>Cover image</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Cover preview" className="h-full w-full object-cover" />
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
                        {imageUrl ? 'Replace' : 'Upload'}
                      </Button>
                      {imageUrl ? (
                        <Button
                          type="button"
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => form.setValue('image_url', '', { shouldDirty: true })}
                        >
                          <X />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <FormDescription>PNG, JPEG or WebP, up to 4 MB. Shown on the Learning Hub card.</FormDescription>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ChatGPT — Prompts & Tips" {...field} />
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
                      <Textarea rows={3} placeholder="Short description shown on the card and detail header" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kiattisak Phothawimoncharat" {...field} />
                    </FormControl>
                    <FormDescription>Shown as the "by" byline on the card.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Technologies tag input */}
              <FormItem>
                <FormLabel>Technologies</FormLabel>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-2">
                  {technologies.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tag)}
                        className="text-brand/70 hover:text-brand"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={techDraft}
                    onChange={(e) => setTechDraft(e.target.value)}
                    onKeyDown={handleTechKeyDown}
                    onBlur={addTechnology}
                    placeholder={technologies.length === 0 ? 'Type a tag and press Enter' : 'Add…'}
                    className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <FormDescription>Press Enter or comma to add a tag.</FormDescription>
              </FormItem>

              {/* Categories editor */}
              <FormItem>
                <FormLabel>Categories &amp; links</FormLabel>
                <FormDescription>
                  Group links into categories. Each category becomes a collapsible section on the card detail page.
                </FormDescription>
                <div className="mt-2 flex flex-col gap-4">
                  {categoryFields.map((category, categoryIndex) => (
                    <div key={category.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`categories.${categoryIndex}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Category name (e.g. Prompts)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="danger-ghost"
                          size="icon-sm"
                          className="mt-0.5"
                          onClick={() => removeCategory(categoryIndex)}
                          aria-label="Remove category"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-3 pl-1">
                        <CategoryLinks control={form.control} categoryIndex={categoryIndex} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => appendCategory({ name: '', links: [{ label: '', url: '' }] })}
                    >
                      <Plus />
                      Add category
                    </Button>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Published</FormLabel>
                      <FormDescription>Unpublished cards are hidden from students.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/learning-resources">Cancel</Link>
              </Button>
              <Button type="submit" loading={formLoading} disabled={uploading}>
                {id ? 'Save changes' : 'Create'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
