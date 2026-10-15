/**
 * Announcements (Brilliant: 04 Admin — Announcements): short notices for the
 * student Today page, edited in a side panel with a live student preview.
 * ?new=1 / ?edit=id open the panel, so the old create/edit URLs redirect here.
 */
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDelete, useForm as useRefineForm, useList } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeOff, Megaphone, Pin, Plus, X } from 'lucide-react';
import type { Announcement } from '@medical-portal/shared';
import { formatUpdated } from '../../utils/relative-time';
import { AdminEmptyState } from '../../components/AdminEmptyState';
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

const TITLE_MAX = 120;

const schema = z.object({
  title: z.string().trim().min(1, 'Please enter a title').max(TITLE_MAX, `Keep it under ${TITLE_MAX} characters`),
  content: z.string().trim().min(1, 'Please enter a message'),
  is_pinned: z.boolean(),
});
type Values = z.infer<typeof schema>;

function AnnouncementEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  const { onFinish, queryResult, formLoading } = useRefineForm<Announcement>({
    resource: 'announcements',
    action: id ? 'edit' : 'create',
    id,
    redirect: false,
    onMutationSuccess: onClose,
    queryOptions: { enabled: Boolean(id) },
  });
  const { mutate: deleteOne } = useDelete();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '', content: '', is_pinned: false } });

  const record = id ? queryResult?.data?.data : undefined;
  const resetFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (record && resetFor.current !== record.id) {
      resetFor.current = record.id;
      form.reset({ title: record.title ?? '', content: record.content ?? '', is_pinned: Boolean(record.is_pinned) });
    }
  }, [record, form]);

  const [title, pinned] = form.watch(['title', 'is_pinned']);
  const save = (publish: boolean) => form.handleSubmit((values) => onFinish({ ...values, is_published: publish }));
  const published = record?.is_published ?? false;

  return (
    <Form {...form}>
      <form onSubmit={save(id ? published : true)} className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink-1">{id ? 'Edit announcement' : 'New announcement'}</h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close editor">
            <X />
          </Button>
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input autoFocus placeholder="e.g. GI 204 lecture 3 moved to Friday" {...field} />
              </FormControl>
              <p className="text-[11px] text-ink-3 tabular-nums">
                {title.length} / {TITLE_MAX}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="What changed, when, and where" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_pinned"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-[13px] font-medium text-ink-1">Pin to top</span>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Pin to top" />
            </label>
          )}
        />
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Student preview</p>
          <div className="flex items-start gap-2">
            {pinned ? <Pin className="mt-0.5 size-3.5 shrink-0 fill-brand text-brand" aria-hidden /> : <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink-1">{title || 'Your title'}</p>
              <p className="text-[11px] text-ink-3">{pinned ? 'Pinned · ' : ''}New · just now</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {id ? (
            <ConfirmButton
              title="Delete this announcement?"
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={() => {
                deleteOne({ resource: 'announcements', id });
                onClose();
              }}
              trigger={
                <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-700">
                  Delete
                </button>
              }
            />
          ) : null}
          <span className="flex-1" />
          <Button type="button" variant="secondary" size="sm" loading={formLoading} onClick={save(false)}>
            {published ? 'Unpublish' : 'Save draft'}
          </Button>
          <Button type="button" size="sm" loading={formLoading} onClick={save(true)}>
            {published ? 'Update' : 'Publish now'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const AnnouncementsList = () => {
  const [params, setParams] = useSearchParams();
  const editId = params.get('edit');
  const creating = params.get('new') === '1';
  const panelOpen = creating || Boolean(editId);
  const wide = useMediaQuery('(min-width: 1280px)');
  const { data, isLoading } = useList<Announcement>({
    resource: 'announcements',
    pagination: { mode: 'off' },
    sorters: [{ field: 'created_at', order: 'desc' }],
  });
  const items = [...(data?.data ?? [])].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

  const open = (updates: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('new');
        next.delete('edit');
        for (const [key, value] of Object.entries(updates)) if (value) next.set(key, value);
        return next;
      },
      { replace: true },
    );
  const close = () => open({});
  const editor = <AnnouncementEditor key={editId ?? 'new'} id={editId ?? undefined} onClose={close} />;

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Short, time-sensitive notices on the student Today page. Pinned ones stay on top."
        actions={
          panelOpen ? null : (
            <Button size="sm" onClick={() => open({ new: '1' })}>
              <Plus />
              New announcement
            </Button>
          )
        }
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle">
          {isLoading ? (
            <li className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </li>
          ) : items.length === 0 ? (
            <li>
              <AdminEmptyState icon={<Megaphone />} title="No announcements" subtitle="Post one when a room, time or recording changes." />
            </li>
          ) : (
            items.map((item) => {
              const Icon = !item.is_published ? EyeOff : item.is_pinned ? Pin : Megaphone;
              return (
                <li key={item.id} className="border-b border-slate-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => open({ edit: item.id })}
                    className={cn('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/70', editId === item.id && 'bg-brand/[0.07]')}
                  >
                    <Icon
                      className={cn('size-4 shrink-0', item.is_pinned && item.is_published ? 'fill-brand text-brand' : 'text-ink-3')}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-1">{item.title}</span>
                      <span className="block text-[11px] text-ink-3">
                        {!item.is_published
                          ? 'Draft · not visible to students'
                          : `${item.is_pinned ? 'Pinned · ' : ''}Published ${formatUpdated(item.created_at).toLowerCase()}`}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-brand">Edit</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {panelOpen && wide ? (
          <aside className="sticky top-6 rounded-xl border border-brand/40 bg-white shadow-soft" aria-label="Announcement editor">
            {editor}
          </aside>
        ) : null}
      </div>
      <Sheet open={panelOpen && !wide} onOpenChange={(next) => !next && close()}>
        <SheetContent side="right" className="p-0">
          <SheetTitle>Announcement editor</SheetTitle>
          {editor}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AnnouncementsList;
