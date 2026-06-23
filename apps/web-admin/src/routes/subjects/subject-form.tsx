/**
 * Shared create/edit form for subjects.
 * Refine headless `useForm` + react-hook-form + zod, plus a cover-image uploader
 * that pushes the image to the service-api (Supabase Storage) and stores the
 * returned public URL in `thumbnail_url`.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiUrl, useForm as useRefineForm } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import type { Subject } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

const schema = z.object({
  code: z.string().trim().min(1, 'Please enter a code'),
  name: z.string().trim().min(1, 'Please enter a name'),
  year_level: z.number().int().min(1, 'Year must be 1–6').max(6, 'Year must be 1–6'),
  description: z.string().trim().optional(),
  thumbnail_url: z.string().trim().optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean(),
});

type Values = z.infer<typeof schema>;

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function SubjectForm({ id }: { id?: string }) {
  const apiUrl = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { onFinish, queryResult, formLoading } = useRefineForm<Subject>({
    resource: 'subjects',
    action: id ? 'edit' : 'create',
    id,
    // After creating, jump straight to the edit screen where the full tree editor
    // (sections / lectures / resources) lives.
    redirect: id ? 'list' : 'edit',
  });

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
    },
  });

  const record = queryResult?.data?.data;
  const resetForId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (record && resetForId.current !== record.id) {
      resetForId.current = record.id;
      form.reset({
        code: record.code ?? '',
        name: record.name ?? '',
        year_level: record.year_level ?? 1,
        description: record.description ?? '',
        thumbnail_url: record.thumbnail_url ?? '',
        order_index: record.order_index ?? 0,
        is_active: record.is_active ?? true,
      });
    }
  }, [record, form]);

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
      // authAxios defaults to Content-Type: application/json; override to multipart
      // so axios passes the FormData through (otherwise it JSON-serializes it and
      // the file is dropped) and the browser sets the boundary.
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

  const submit = form.handleSubmit(async (values) => {
    const thumb = values.thumbnail_url?.trim() ?? '';
    const description = values.description?.trim() ?? '';

    const payload: Record<string, unknown> = {
      code: values.code.trim(),
      name: values.name.trim(),
      year_level: values.year_level,
      order_index: values.order_index,
    };
    if (description) payload.description = description;

    if (id) {
      // Edit: send null to clear an image (the update body is unvalidated), and
      // allow toggling is_active.
      payload.thumbnail_url = thumb || null;
      payload.is_active = values.is_active;
    } else if (thumb) {
      // Create is validated by createSubjectSchema (thumbnail_url is .url()), so
      // only include it when set — an empty string would fail validation.
      payload.thumbnail_url = thumb;
    }

    await onFinish(payload);
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Subject' : 'New Subject'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/subjects">
              <ArrowLeft />
              Back
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={submit}>
            <CardContent className="flex flex-col gap-5 p-6">
              {/* Cover image uploader */}
              <FormItem>
                <FormLabel>Cover image</FormLabel>
                <div className="flex flex-col gap-3">
                  <div className="aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
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
              </FormItem>

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
                name="year_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Year level</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-40">
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
                        className="w-40"
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
                      <FormDescription>Inactive subjects are hidden from the student portal.</FormDescription>
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
                <Link to="/subjects">Cancel</Link>
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
