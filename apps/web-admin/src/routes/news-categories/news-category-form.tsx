/**
 * Shared create/edit form for news categories (name + color).
 * Renaming/recoloring a category changes how articles render server-side.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm as useRefineForm } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import type { NewsCategory } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  name: z.string().trim().min(1, 'Please enter a category name'),
  color: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex value like #2f80ed'),
});

type Values = z.infer<typeof schema>;

export function NewsCategoryForm({ id }: { id?: string }) {
  const { onFinish, queryResult, formLoading } = useRefineForm<NewsCategory>({
    resource: 'news-categories',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: '#2f80ed' },
  });

  const record = queryResult?.data?.data;
  useEffect(() => {
    if (record) {
      form.reset({ name: record.name ?? '', color: record.color ?? '#2f80ed' });
    }
  }, [record, form]);

  const submit = form.handleSubmit(async (values) => {
    await onFinish(values);
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit News Category' : 'New News Category'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/news-categories">
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Research" {...field} />
                    </FormControl>
                    <FormDescription>
                      Renaming a category updates every article that uses it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label="Pick color"
                        value={field.value || '#2f80ed'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                      />
                      <FormControl>
                        <Input className="w-40" placeholder="#2f80ed" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>Used to color this category's tag on news cards.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/news-categories">Cancel</Link>
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
