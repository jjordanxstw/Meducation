/**
 * "New subject" modal (Brilliant: 04 Admin — New subject). Collects the subject
 * card details, creates it, then opens the tree editor to add sections and
 * lectures.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiUrl, useCreate } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const DESCRIPTION_MAX = 160;
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const schema = z.object({
  code: z.string().trim().min(1, 'Enter a code'),
  name: z.string().trim().min(1, 'Enter a name'),
  year_level: z.number().int().min(1).max(6),
  description: z.string().trim().max(DESCRIPTION_MAX, `Keep it under ${DESCRIPTION_MAX} characters`).optional(),
  thumbnail_url: z.string().optional(),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function NewSubjectDialog({
  open,
  onOpenChange,
  defaultYear = 1,
  nextOrderIndex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultYear?: number;
  /** Where the subject lands in its year; defaults to first. */
  nextOrderIndex?: (year: number) => number;
}) {
  const apiUrl = useApiUrl();
  const navigate = useNavigate();
  const { mutateAsync: create, isLoading: creating } = useCreate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', year_level: defaultYear, description: '', thumbnail_url: '', is_active: false },
  });
  const description = form.watch('description') ?? '';
  const thumbnail = form.watch('thumbnail_url');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return notify.error('Image must be a PNG, JPEG or WebP file');
    if (file.size > MAX_IMAGE_BYTES) return notify.error('Image must be 1 MB or smaller');
    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    try {
      const { data } = await authAxios.post(`${apiUrl}/admin/subjects/image`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('thumbnail_url', url);
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await create({
        resource: 'subjects',
        values: {
          code: values.code.trim(),
          name: values.name.trim(),
          year_level: values.year_level,
          description: values.description?.trim() || null,
          thumbnail_url: values.thumbnail_url || null,
          is_active: values.is_active,
          order_index: nextOrderIndex?.(values.year_level) ?? 0,
        },
        successNotification: false,
      });
      const id = (result?.data as { id?: string } | undefined)?.id;
      onOpenChange(false);
      form.reset();
      if (id) navigate(`/subjects/edit/${id}`);
    } catch {
      // The notification provider already surfaced the error.
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <DialogTitle className="text-base">New subject</DialogTitle>
          <DialogDescription className="text-xs">You’ll add sections and lectures on the next screen</DialogDescription>
        </div>
        <Form {...form}>
          <form onSubmit={submit}>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CVS 201" autoFocus {...field} />
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
                      <FormLabel>Name</FormLabel>
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
                    <FormLabel>Year</FormLabel>
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
                      <Textarea rows={2} className="min-h-0" placeholder="What the subject covers, in one line" {...field} />
                    </FormControl>
                    <p className="text-[11px] text-ink-3">
                      Shown on the subject card. {description.length} / {DESCRIPTION_MAX} characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Cover image (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  className="hidden"
                  onChange={(event) => {
                    void upload(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                {thumbnail ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                    <img src={thumbnail} alt="Cover preview" className="h-14 w-24 rounded-lg object-cover" />
                    <span className="flex-1 text-sm text-ink-2">Cover uploaded</span>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove cover" onClick={() => form.setValue('thumbnail_url', '')}>
                      <X />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOver(false);
                      void upload(event.dataTransfer.files?.[0]);
                    }}
                    className={`flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-xs text-ink-3 transition-colors ${
                      dragOver ? 'border-brand bg-brand-subtle' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Drop PNG, JPG or WebP · max 1 MB
                  </button>
                )}
              </div>
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <span>
                      <span className="block text-sm font-medium text-ink-1">Visible to students</span>
                      <span className="block text-[11px] text-ink-3">Keep off until lectures are added</span>
                    </span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Visible to students" />
                  </label>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-200/70 bg-slate-50/70 px-6 py-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={creating} disabled={uploading}>
                Create and add lectures
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
