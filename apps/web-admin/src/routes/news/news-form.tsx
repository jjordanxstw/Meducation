/**
 * Shared create/edit form for news articles.
 * Refine headless `useForm` + react-hook-form + zod, plus a cover uploader that
 * pushes the image to the service-api (Supabase Storage) and stores the returned
 * public URL in `cover_image_url`. The body is authored as Markdown (rendered on
 * the web-client detail page).
 */
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiUrl, useForm as useRefineForm, useList } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import type { News, NewsCategory } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { formatAgo } from '../../utils/relative-time';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

// Radix Select items require a non-empty value, so an explicit "none" sentinel
// stands in for "no category" and is mapped back to null on submit.
const NO_CATEGORY = '__none__';

const schema = z.object({
  title: z.string().trim().min(1, 'Please enter a title'),
  summary: z.string().trim().optional(),
  body: z.string().trim().min(1, 'Please enter the article body'),
  cover_image_url: z.string().trim().optional(),
  author_name: z.string().trim().optional(),
  category_id: z.string().optional(),
  published_at: z.string().optional(),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

type Values = z.infer<typeof schema>;

const MAX_COVER_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export function NewsForm({ id }: { id?: string }) {
  const apiUrl = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { onFinish, queryResult, formLoading } = useRefineForm<News>({
    resource: 'news',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const { data: categoriesData } = useList<NewsCategory>({
    resource: 'news-categories',
    pagination: { mode: 'off' },
  });
  const categoryOptions = (categoriesData?.data ?? []).map(c => ({
    value: c.id,
    label: c.name,
    color: c.color,
  }));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      summary: '',
      body: '',
      cover_image_url: '',
      author_name: '',
      category_id: NO_CATEGORY,
      published_at: '',
      is_featured: false,
      is_published: true,
    },
  });

  const record = queryResult?.data?.data;
  const resetForId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (record && resetForId.current !== record.id) {
      resetForId.current = record.id;
      form.reset({
        title: record.title ?? '',
        summary: record.summary ?? '',
        body: record.body ?? '',
        cover_image_url: record.cover_image_url ?? '',
        author_name: record.author_name ?? '',
        category_id: record.category_id ?? NO_CATEGORY,
        published_at: toDateInput(record.published_at),
        is_featured: record.is_featured ?? false,
        is_published: record.is_published ?? true,
      });
    }
  }, [record, form]);

  const coverUrl = form.watch('cover_image_url');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change.
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('Cover must be a PNG, JPEG or WebP image');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      notify.error('Cover must be 4 MB or smaller');
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
      const { data } = await authAxios.post(`${apiUrl}/admin/news/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('cover_image_url', url, { shouldDirty: true });
      notify.success('Cover uploaded');
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload cover'));
    } finally {
      setUploading(false);
    }
  };

  const isPublished = record?.is_published ?? false;
  const submit = (publish: boolean) =>
    form.handleSubmit(async values => {
      await onFinish({
        ...values,
        is_published: publish,
        category_id:
          values.category_id && values.category_id !== NO_CATEGORY ? values.category_id : null,
        published_at: values.published_at ? values.published_at : undefined,
      });
    });

  return (
    <div>
      <Link
        to="/news"
        className="mb-1 inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink-1"
      >
        <ArrowLeft className="size-3.5" />
        News
      </Link>
      <Form {...form}>
        <form onSubmit={submit(id ? isPublished : true)}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-1">
              {id ? 'Edit article' : 'Write article'}
            </h1>
            <div className="flex items-center gap-2">
              {record?.updated_at ? (
                <span className="hidden text-xs text-ink-3 sm:inline">
                  {isPublished ? 'Published' : 'Draft'} · saved {formatAgo(record.updated_at)}
                </span>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={formLoading}
                disabled={uploading}
                onClick={submit(false)}
              >
                {isPublished ? 'Unpublish' : 'Save draft'}
              </Button>
              <Button
                type="button"
                size="sm"
                loading={formLoading}
                disabled={uploading}
                onClick={submit(true)}
              >
                {isPublished ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. New simulation lab opens this semester"
                          className="font-semibold"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          className="min-h-0"
                          placeholder="One or two sentences"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Shown on cards and the Today page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel required>Body</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={Boolean(fieldState.error)}
                          placeholder={
                            'Write the full article here.\n\n## Headings, **bold**, lists and [links](https://…) work.'
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                  <p className="text-[13px] font-semibold text-ink-1">Settings</p>
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        {/* Radix Select drops a value whose option isn't rendered yet, so wait for the list. */}
                        {!categoriesData ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select value={field.value || NO_CATEGORY} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NO_CATEGORY}>
                                <span className="text-slate-500">No category</span>
                              </SelectItem>
                              {categoryOptions.map(o => (
                                <SelectItem key={o.value} value={o.value}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-2 shrink-0 rounded-full"
                                      style={{ backgroundColor: o.color || '#2f80ed' }}
                                    />
                                    {o.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                          <Input placeholder="e.g. Faculty Office" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publish date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Today"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span>
                          <span className="block text-[13px] font-medium text-ink-1">
                            Feature on Today
                          </span>
                          <span className="block text-[11px] text-ink-3">
                            Replaces the current featured article
                          </span>
                        </span>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Feature on Today"
                        />
                      </label>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <p className="text-[13px] font-semibold text-ink-1">Cover image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt="Cover preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-ink-3 hover:text-ink-1"
                      >
                        {uploading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <ImageIcon className="size-5" />
                        )}
                        Upload a cover
                      </button>
                    )}
                    {coverUrl ? (
                      <div className="absolute bottom-2 right-2 flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                          Replace
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="size-7"
                          aria-label="Remove cover"
                          onClick={() =>
                            form.setValue('cover_image_url', '', { shouldDirty: true })
                          }
                        >
                          <X />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-ink-3">
                    1600×900 recommended · PNG, JPEG or WebP · max 4 MB
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
