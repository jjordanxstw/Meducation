/**
 * Event editor modal (Brilliant: 04 Admin — Event editor). Creates or edits a
 * calendar event without leaving the Calendar list.
 */
import { useEffect, useRef } from 'react';
import { useDelete, useForm as useRefineForm, useList } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, Subject } from '@medical-portal/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input, Textarea } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ConfirmButton } from '@/components/ui/confirm-button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
    all_day: z.boolean(),
    start_time: timeField,
    end_time: timeField,
    daily_schedule: z.boolean().optional(),
    subject_id: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(v => v.all_day || !!v.start_time, {
    message: 'Set a start time or tick All day',
    path: ['start_time'],
  })
  .refine(
    v => {
      if (v.all_day || !v.start_time || !v.end_time) return true;
      const singleDay = !v.end_date || v.end_date === v.start_date;
      return singleDay || v.daily_schedule ? v.end_time >= v.start_time : true;
    },
    { message: 'Ends before it starts', path: ['end_time'] }
  )
  .refine(v => !v.end_date || v.end_date >= v.start_date, {
    message: 'Ends before it starts',
    path: ['end_date'],
  });

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  title: '',
  type: '',
  start_date: '',
  end_date: '',
  all_day: false,
  start_time: '',
  end_time: '',
  daily_schedule: false,
  subject_id: '',
  location: '',
  description: '',
};

export function EventDialog({
  id,
  open,
  onOpenChange,
  defaultDate,
}: {
  /** Edit this event; omit to create. */
  id?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}) {
  const close = () => onOpenChange(false);
  const { onFinish, queryResult, formLoading } = useRefineForm<CalendarEvent>({
    resource: 'calendar',
    action: id ? 'edit' : 'create',
    id,
    redirect: false,
    onMutationSuccess: close,
    queryOptions: { enabled: Boolean(id) },
  });
  const { mutate: deleteOne } = useDelete();
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
    pagination: { mode: 'off' },
  });
  const subjects = subjectsData?.data ?? [];
  const { data: eventTypesData } = useList<CalendarEventType>({
    resource: 'event-types',
    pagination: { mode: 'off' },
  });
  const eventTypes = eventTypesData?.data ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, start_date: defaultDate ?? '' },
  });

  const record = id ? queryResult?.data?.data : undefined;
  const resetFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!open) {
      resetFor.current = undefined;
      return;
    }
    if (!id && resetFor.current !== 'new') {
      resetFor.current = 'new';
      form.reset({ ...EMPTY, start_date: defaultDate ?? '' });
    } else if (record && resetFor.current !== record.id) {
      resetFor.current = record.id;
      form.reset({
        title: record.title ?? '',
        type: record.type ?? '',
        start_date: record.start_date?.slice(0, 10) ?? '',
        end_date: record.end_date?.slice(0, 10) ?? '',
        all_day: !record.start_time,
        start_time: record.start_time?.slice(0, 5) ?? '',
        end_time: record.end_time?.slice(0, 5) ?? '',
        daily_schedule: record.daily_schedule ?? false,
        subject_id: record.subject_id ?? '',
        location: record.location ?? '',
        description: record.description ?? '',
      });
    }
  }, [open, id, record, form, defaultDate]);

  const [allDay, endDate, startDate, type, subjectId] = form.watch([
    'all_day',
    'end_date',
    'start_date',
    'type',
    'subject_id',
  ]);
  const multiDay = Boolean(endDate) && endDate !== startDate;
  const subject = subjects.find(s => s.id === subjectId);
  const isExam = type.toLowerCase() === 'exam';

  const submit = form.handleSubmit(async ({ all_day, ...values }) => {
    await onFinish({
      ...values,
      end_date: values.end_date || null,
      start_time: all_day ? null : values.start_time || null,
      end_time: all_day ? null : values.end_time || null,
      daily_schedule: !all_day && multiDay ? Boolean(values.daily_schedule) : false,
      subject_id: values.subject_id || null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <DialogTitle className="text-base">{id ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription className="sr-only">Calendar event details</DialogDescription>
        </div>
        <Form {...form}>
          <form onSubmit={submit}>
            <div className="flex flex-col gap-4 px-6 py-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cardiovascular midterm" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      {/* Radix Select drops a value whose option isn't rendered yet, so wait for the list. */}
                      {!eventTypesData ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypes.map(option => (
                              <SelectItem key={option.id} value={option.name}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: option.color || '#2f80ed' }}
                                  />
                                  {option.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject (optional)</FormLabel>
                      <FormControl>
                        <Combobox
                          options={subjects.map(s => ({
                            value: s.id,
                            label: `${s.code} ${s.name}`,
                          }))}
                          value={field.value || undefined}
                          onChange={value => field.onChange(value ?? '')}
                          placeholder="All years"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
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
                      <FormLabel>Ends</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Same day"
                          min={startDate || undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={allDay}
                          placeholder="--:--"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={allDay}
                          placeholder="--:--"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="all_day"
                  render={({ field }) => (
                    <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-ink-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={value => field.onChange(value === true)}
                      />
                      All day
                    </label>
                  )}
                />
              </div>
              {multiDay && !allDay ? (
                <FormField
                  control={form.control}
                  name="daily_schedule"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                      <span>
                        <span className="block text-[13px] font-medium text-ink-1">
                          Repeat these times each day
                        </span>
                        <span className="block text-[11px] text-ink-3">
                          Off: one block from the first day’s start to the last day’s end
                        </span>
                      </span>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        aria-label="Repeat these times each day"
                      />
                    </label>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Auditorium 2" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for students</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        placeholder="What to bring, what it covers…"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {isExam ? (
                <p className="flex items-center gap-2 rounded-lg bg-brand-subtle px-3 py-2 text-xs text-brand-hover">
                  <GraduationCap className="size-4 shrink-0" aria-hidden />
                  Exams appear as a countdown on{' '}
                  {subject ? `Year ${subject.year_level} students’` : 'every student’s'} Today page.
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-b-2xl border-t border-slate-200/70 bg-slate-50/70 px-6 py-3">
              {id ? (
                <ConfirmButton
                  title="Delete this event?"
                  description="You can undo this within a few seconds."
                  confirmLabel="Delete"
                  onConfirm={() => {
                    deleteOne({ resource: 'calendar', id });
                    close();
                  }}
                  trigger={
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Delete event
                    </button>
                  }
                />
              ) : null}
              <span className="flex-1" />
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={formLoading}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
