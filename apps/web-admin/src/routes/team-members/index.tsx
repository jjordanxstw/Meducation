/**
 * Team members (Brilliant: 04 Admin — Team): the people on the student About
 * page, in display order (drag to reorder), edited in a side panel.
 * ?new=1 / ?edit=id open the panel; the old create/edit URLs redirect here.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiUrl, useDelete, useForm as useRefineForm, useList, useUpdate } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Contact, GripVertical, Loader2, Mail, Plus, X } from 'lucide-react';
import type { TeamMember } from '@medical-portal/shared';
import { authAxios } from '../../providers/auth-provider';
import { notify } from '../../utils/notify';
import { resolveApiErrorMessage } from '../../utils/api-error';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { GithubIcon, InstagramIcon, LinkedinIcon } from '../../components/brand-icons';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useDndSensors } from '../subjects/tree/dnd';

const optionalUrl = z.union([z.string().trim().url('Enter a full https:// link'), z.literal('')]);
const schema = z.object({
  full_name: z.string().trim().min(1, 'Please enter a name'),
  role: z.string().trim().min(1, 'Please enter a role'),
  bio: z.string().trim().optional(),
  avatar_url: z.string().trim().optional(),
  email: z.union([z.string().trim().email('Enter a valid email'), z.literal('')]).optional(),
  linkedin_url: optionalUrl.optional(),
  github_url: optionalUrl.optional(),
  instagram_url: optionalUrl.optional(),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

function Avatar({ name, url, size = 'sm' }: { name: string; url?: string | null; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle font-semibold text-brand-hover',
        size === 'lg' ? 'size-12 text-sm' : 'size-8 text-[11px]',
      )}
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : initialsOf(name)}
    </span>
  );
}

function MemberEditor({ id, nextOrder, onClose }: { id?: string; nextOrder: number; onClose: () => void }) {
  const apiUrl = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { mutate: deleteOne } = useDelete();
  const { onFinish, queryResult, formLoading } = useRefineForm<TeamMember>({
    resource: 'team-members',
    action: id ? 'edit' : 'create',
    id,
    redirect: false,
    onMutationSuccess: onClose,
    queryOptions: { enabled: Boolean(id) },
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', role: '', bio: '', avatar_url: '', email: '', linkedin_url: '', github_url: '', instagram_url: '', is_active: true },
  });
  const record = id ? queryResult?.data?.data : undefined;
  const resetFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (record && resetFor.current !== record.id) {
      resetFor.current = record.id;
      form.reset({
        full_name: record.full_name ?? '',
        role: record.role ?? '',
        bio: record.bio ?? '',
        avatar_url: record.avatar_url ?? '',
        email: record.email ?? '',
        linkedin_url: record.linkedin_url ?? '',
        github_url: record.github_url ?? '',
        instagram_url: record.instagram_url ?? '',
        is_active: record.is_active ?? true,
      });
    }
  }, [record, form]);
  const [fullName, avatarUrl] = form.watch(['full_name', 'avatar_url']);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return notify.error('Photo must be a PNG, JPEG or WebP image');
    if (file.size > MAX_AVATAR_BYTES) return notify.error('Photo must be 2 MB or smaller');
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      // authAxios defaults to JSON; multipart must be explicit or the file is dropped.
      const { data } = await authAxios.post(`${apiUrl}/admin/team-members/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error('Upload did not return a URL');
      form.setValue('avatar_url', url, { shouldDirty: true });
    } catch (error) {
      notify.error(resolveApiErrorMessage(error, 'Failed to upload photo'));
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit((values) => onFinish(id ? values : { ...values, order_index: nextOrder }));

  const linkFields = [
    { name: 'email' as const, icon: <Mail className="size-4" />, placeholder: 'name@example.com', label: 'Email' },
    { name: 'github_url' as const, icon: <GithubIcon />, placeholder: 'https://github.com/…', label: 'GitHub' },
    { name: 'linkedin_url' as const, icon: <LinkedinIcon />, placeholder: 'https://linkedin.com/in/…', label: 'LinkedIn' },
    { name: 'instagram_url' as const, icon: <InstagramIcon />, placeholder: 'https://instagram.com/…', label: 'Instagram' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink-1">{id ? 'Edit member' : 'Add member'}</h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close editor">
            <X />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={fullName} url={avatarUrl} size="lg" />
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={upload} />
          <span>
            <span className="flex gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-hover">
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {avatarUrl ? 'Replace photo' : 'Upload photo'}
              </button>
              {avatarUrl ? (
                <button type="button" onClick={() => form.setValue('avatar_url', '', { shouldDirty: true })} className="text-[13px] text-ink-3 hover:text-red-600">
                  Remove
                </button>
              ) : null}
            </span>
            <span className="block text-[11px] text-ink-3">Square, at least 256 px · max 2 MB</span>
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} />
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
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Content lead" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short bio</FormLabel>
              <FormControl>
                <Textarea rows={2} className="min-h-0" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Links</p>
          {linkFields.map((link) => (
            <FormField
              key={link.name}
              control={form.control}
              name={link.name}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input aria-label={link.label} placeholder={link.placeholder} startContent={link.icon} wrapperClassName="h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-1">
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Shown on About" />
                Shown on About
              </label>
            )}
          />
          <span className="flex-1" />
          {id ? (
            <ConfirmButton
              title="Remove this member?"
              description="You can undo this within a few seconds."
              confirmLabel="Remove"
              onConfirm={() => {
                deleteOne({ resource: 'team-members', id });
                onClose();
              }}
              trigger={
                <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-700">
                  Remove
                </button>
              }
            />
          ) : null}
          <Button type="submit" size="sm" loading={formLoading} disabled={uploading}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MemberRow({ member, selected, onOpen }: { member: TeamMember; selected: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0', selected && 'bg-brand/[0.07]', isDragging && 'relative z-10 bg-white shadow-lg')}
    >
      <button type="button" className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing" aria-label={`Drag to reorder ${member.full_name}`} {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar name={member.full_name} url={member.avatar_url} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink-1">{member.full_name}</span>
          <span className="block truncate text-[11px] text-ink-3">{member.role}</span>
        </span>
        {member.is_active ? <StatusPill tone="live">Shown</StatusPill> : <StatusPill tone="neutral">Hidden</StatusPill>}
      </button>
    </li>
  );
}

const TeamMembersList = () => {
  const [params, setParams] = useSearchParams();
  const editId = params.get('edit');
  const creating = params.get('new') === '1';
  const panelOpen = creating || Boolean(editId);
  const wide = useMediaQuery('(min-width: 1280px)');
  const sensors = useDndSensors();
  const { mutateAsync: update } = useUpdate();
  const [order, setOrder] = useState<string[] | null>(null);
  const { data, isLoading } = useList<TeamMember>({ resource: 'team-members', pagination: { mode: 'off' }, sorters: [{ field: 'order_index', order: 'asc' }] });

  const members = useMemo(() => {
    const list = [...(data?.data ?? [])].sort((a, b) => a.order_index - b.order_index);
    if (!order) return list;
    const byId = new Map(list.map((member) => [member.id, member]));
    return order.map((id) => byId.get(id)).filter((member): member is TeamMember => Boolean(member));
  }, [data, order]);

  const open = (updates: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('new');
        next.delete('edit');
        for (const [key, value] of Object.entries(updates)) next.set(key, value);
        return next;
      },
      { replace: true },
    );
  const close = () => open({});

  const onDragEnd = async ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (!over || active.id === over.id) return;
    const ids = members.map((member) => member.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrder(next);
    try {
      await Promise.all(
        next
          .map((id, index) => ({ id, index }))
          .filter(({ id, index }) => members.find((member) => member.id === id)?.order_index !== index)
          .map(({ id, index }) => update({ resource: 'team-members', id, values: { order_index: index }, mutationMode: 'pessimistic', successNotification: false })),
      );
      notify.success('Order saved');
    } catch {
      notify.error('Could not save the new order.');
    } finally {
      setOrder(null);
    }
  };

  const editor = <MemberEditor key={editId ?? 'new'} id={editId ?? undefined} nextOrder={members.length} onClose={close} />;

  return (
    <div>
      <PageHeader
        title="Team members"
        description="Shown on the student About page, in this order"
        actions={
          <Button size="sm" onClick={() => open({ new: '1' })}>
            <Plus />
            Add member
          </Button>
        }
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : members.length === 0 ? (
            <AdminEmptyState icon={<Contact />} title="No team members yet" subtitle="Add the people behind MedPi to the About page." />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
              <SortableContext items={members.map((member) => member.id)} strategy={verticalListSortingStrategy}>
                <ul>
                  {members.map((member) => (
                    <MemberRow key={member.id} member={member} selected={editId === member.id} onOpen={() => open({ edit: member.id })} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
        {panelOpen && wide ? (
          <aside className="sticky top-6 rounded-xl border border-brand/40 bg-white shadow-soft" aria-label="Team member editor">
            {editor}
          </aside>
        ) : null}
      </div>
      <Sheet open={panelOpen && !wide} onOpenChange={(next) => !next && close()}>
        <SheetContent side="right" className="overflow-y-auto p-0">
          <SheetTitle>Team member editor</SheetTitle>
          {editor}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TeamMembersList;
