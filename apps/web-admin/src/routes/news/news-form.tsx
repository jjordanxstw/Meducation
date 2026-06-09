/**
 * Shared create/edit form for news articles.
 * Refine headless `useForm` + react-hook-form + zod, plus a cover uploader that
 * pushes the image to the service-api (Supabase Storage) and stores the returned
 * public URL in `cover_image_url`. The body is authored as Markdown (rendered on
 * the web-client detail page).
 */
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
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
  const categoryOptions = (categoriesData?.data ?? []).map((c) => ({
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

  const submit = form.handleSubmit(async (values) => {
    await onFinish({
      ...values,
      category_id: values.category_id && values.category_id !== NO_CATEGORY ? values.category_id : null,
      published_at: values.published_at ? values.published_at : undefined,
    });
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Article' : 'New Article'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/news">
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
              {/* Cover uploader */}
              <FormItem>
                <FormLabel>Cover image</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover preview" className="h-full w-full object-cover" />
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
                        {coverUrl ? 'Replace' : 'Upload'}
                      </Button>
                      {coverUrl ? (
                        <Button
                          type="button"
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => form.setValue('cover_image_url', '', { shouldDirty: true })}
                        >
                          <X />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <FormDescription>PNG, JPEG or WebP, up to 4 MB. Shown on the news card and article header.</FormDescription>
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
                      <Input placeholder="e.g. New simulation lab opens this semester" {...field} />
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
                      <Textarea rows={2} placeholder="Short excerpt shown on the news card" {...field} />
                    </FormControl>
                    <FormDescription>1–2 sentences shown on the home cards.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Body</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        className="font-mono text-xs leading-relaxed"
                        placeholder={'## Heading\n\nWrite the full article here.\n\n- Bullet points\n- **Bold** and [links](https://…) supported'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Markdown supported — headings, bold, lists, links and images.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="author_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Admissions Office" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
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
                          {categoryOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200"
                                  style={{ backgroundColor: o.color || '#2f80ed' }}
                                />
                                {o.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Defaults to today" />
                      </FormControl>
                      <FormDescription>Shown in the byline. Leave empty for today.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>Featured articles headline the home Hot News section.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Published</FormLabel>
                      <FormDescription>Unpublished articles are hidden from students.</FormDescription>
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
                <Link to="/news">Cancel</Link>
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
