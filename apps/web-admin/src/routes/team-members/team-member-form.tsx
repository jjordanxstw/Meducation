/**
 * Shared create/edit form for team members.
 * Refine headless `useForm` + react-hook-form + zod, plus an avatar uploader
 * that pushes the image to the service-api (Supabase Storage) and stores the
 * returned public URL in `avatar_url`.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiUrl, useForm as useRefineForm } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import type { TeamMember } from '@medical-portal/shared';
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

const optionalUrl = z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]);

const schema = z.object({
  full_name: z.string().trim().min(1, 'Please enter a name'),
  role: z.string().trim().min(1, 'Please enter a role'),
  bio: z.string().trim().optional(),
  avatar_url: z.string().trim().optional(),
  email: z.union([z.string().trim().email('Enter a valid email'), z.literal('')]).optional(),
  linkedin_url: optionalUrl.optional(),
  github_url: optionalUrl.optional(),
  instagram_url: optionalUrl.optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean(),
});

type Values = z.infer<typeof schema>;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TeamMemberForm({ id }: { id?: string }) {
  const apiUrl = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { onFinish, queryResult, formLoading } = useRefineForm<TeamMember>({
    resource: 'team-members',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      role: '',
      bio: '',
      avatar_url: '',
      email: '',
      linkedin_url: '',
      github_url: '',
      instagram_url: '',
      order_index: 0,
      is_active: true,
    },
  });

  const record = queryResult?.data?.data;
  useEffect(() => {
    if (record) {
      form.reset({
        full_name: record.full_name ?? '',
        role: record.role ?? '',
        bio: record.bio ?? '',
        avatar_url: record.avatar_url ?? '',
        email: record.email ?? '',
        linkedin_url: record.linkedin_url ?? '',
        github_url: record.github_url ?? '',
        instagram_url: record.instagram_url ?? '',
        order_index: record.order_index ?? 0,
        is_active: record.is_active ?? true,
      });
    }
  }, [record, form]);

  const avatarUrl = form.watch('avatar_url');
  const fullName = form.watch('full_name');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change.
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error('Avatar must be a PNG, JPEG or WebP image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      notify.error('Avatar must be 2 MB or smaller');
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
      const { data } = await authAxios.post(`${apiUrl}/admin/team-members/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('avatar_url', url, { shouldDirty: true });
      notify.success('Avatar uploaded');
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload avatar'));
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    await onFinish(values);
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Team Member' : 'New Team Member'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/team-members">
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
              {/* Avatar uploader */}
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300">
                        {fullName ? initialsOf(fullName) : '—'}
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
                        {avatarUrl ? 'Replace' : 'Upload'}
                      </Button>
                      {avatarUrl ? (
                        <Button
                          type="button"
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => form.setValue('avatar_url', '', { shouldDirty: true })}
                        >
                          <X />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <FormDescription>PNG, JPEG or WebP, up to 2 MB. Empty shows the initials.</FormDescription>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Robert Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Product Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Short description shown on the card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="github_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/…" {...field} />
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
                    <FormDescription>Lower numbers appear first on the About Us page.</FormDescription>
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
                      <FormDescription>Inactive members are hidden from the About Us page.</FormDescription>
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
                <Link to="/team-members">Cancel</Link>
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
