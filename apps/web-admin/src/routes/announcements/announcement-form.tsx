/**
 * Shared create/edit form for announcements.
 * Refine headless `useForm` + react-hook-form + zod.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm as useRefineForm } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import type { Announcement } from '@medical-portal/shared';
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

const schema = z.object({
  title: z.string().trim().min(1, 'Please enter a title'),
  content: z.string().trim().min(1, 'Please enter content'),
  is_pinned: z.boolean(),
  is_published: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function AnnouncementForm({ id }: { id?: string }) {
  const { onFinish, queryResult, formLoading } = useRefineForm<Announcement>({
    resource: 'announcements',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '', is_pinned: false, is_published: true },
  });

  const record = queryResult?.data?.data;
  useEffect(() => {
    if (record) {
      form.reset({
        title: record.title ?? '',
        content: record.content ?? '',
        is_pinned: !!record.is_pinned,
        is_published: !!record.is_published,
      });
    }
  }, [record, form]);

  const submit = form.handleSubmit(async (values) => {
    await onFinish(values);
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Announcement' : 'New Announcement'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/announcements">
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Announcement content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_pinned"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Pinned</FormLabel>
                      <FormDescription>Pinned announcements appear first for students.</FormDescription>
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
                      <FormDescription>Drafts are hidden from students until published.</FormDescription>
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
                <Link to="/announcements">Cancel</Link>
              </Button>
              <Button type="submit" loading={formLoading}>
                {id ? 'Save changes' : 'Create'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
