/**
 * Shared create/edit form for calendar events (date-only).
 * Refine headless `useForm` + react-hook-form + zod.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm as useRefineForm, useList } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, Subject } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Combobox } from '@/components/ui/combobox';
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

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Use a time like 09:00')
  .optional()
  .or(z.literal(''));

const schema = z
  .object({
    title: z.string().trim().min(1, 'Please enter a title'),
    type: z.string().min(1, 'Please select a type'),
    start_date: z.string().min(1, 'Please select a start date'),
    end_date: z.string().optional(),
    start_time: timeField,
    end_time: timeField,
    subject_id: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((v) => !v.end_time || !!v.start_time, {
    message: 'Set a start time first',
    path: ['end_time'],
  })
  .refine(
    // On a single day, end time must be on/after start time.
    (v) => !(v.start_time && v.end_time && (!v.end_date || v.end_date === v.start_date)) || v.end_time >= v.start_time,
    { message: 'End time must be after start time', path: ['end_time'] },
  );

type Values = z.infer<typeof schema>;

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');
const toTimeInput = (value?: string | null) => (value ? value.slice(0, 5) : '');

export function CalendarForm({ id }: { id?: string }) {
  const { onFinish, queryResult, formLoading } = useRefineForm<CalendarEvent>({
    resource: 'calendar',
    action: id ? 'edit' : 'create',
    id,
    redirect: 'list',
  });
  const { data: subjectsData } = useList<Subject>({ resource: 'subjects', pagination: { mode: 'off' } });
  const subjects = subjectsData?.data ?? [];
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));

  const { data: eventTypesData } = useList<CalendarEventType>({ resource: 'event-types', pagination: { mode: 'off' } });
  const eventTypeOptions = (eventTypesData?.data ?? []).map((t) => ({ value: t.name, label: t.name, color: t.color }));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      type: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      subject_id: '',
      location: '',
      description: '',
    },
  });

  const record = queryResult?.data?.data;
  useEffect(() => {
    if (record) {
      form.reset({
        title: record.title ?? '',
        type: record.type ?? '',
        start_date: toDateInput(record.start_date),
        end_date: toDateInput(record.end_date),
        start_time: toTimeInput(record.start_time),
        end_time: toTimeInput(record.end_time),
        subject_id: record.subject_id ?? '',
        location: record.location ?? '',
        description: record.description ?? '',
      });
    }
  }, [record, form]);

  const submit = form.handleSubmit(async (values) => {
    await onFinish({
      ...values,
      end_date: values.end_date ? values.end_date : null,
      start_time: values.start_time ? values.start_time : null,
      end_time: values.end_time ? values.end_time : null,
      subject_id: values.subject_id ? values.subject_id : null,
    });
  });

  return (
    <div>
      <PageHeader
        title={id ? 'Edit Event' : 'New Event'}
        actions={
          <Button asChild variant="ghost">
            <Link to="/calendar">
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
                      <Input placeholder="e.g. Anatomy I — Midterm Examination" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypeOptions.map((o) => (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Optional" />
                      </FormControl>
                      <FormDescription>Leave empty for single-day events.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} placeholder="All day" />
                      </FormControl>
                      <FormDescription>Leave empty for an all-day event.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} placeholder="Optional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Subject</FormLabel>
                    <FormControl>
                      <Combobox
                        options={subjectOptions}
                        value={field.value || undefined}
                        onChange={(v) => field.onChange(v ?? '')}
                        placeholder="Select subject (optional)"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Room 1-2" {...field} />
                    </FormControl>
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/calendar">Cancel</Link>
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
