/**
 * Calendar Events Create Page
 * Migrated from src/app/calendar/create/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Switch, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CalendarCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<CalendarEvent>();

  const eventTypeOptions = [
    { label: `🎯 ${t('pages.calendar.types.exam', {}, 'Exam')}`, value: EventType.EXAM },
    { label: `📚 ${t('pages.calendar.types.lecture', {}, 'Lecture')}`, value: EventType.LECTURE },
    { label: `🎉 ${t('pages.calendar.types.holiday', {}, 'Holiday')}`, value: EventType.HOLIDAY },
    { label: `📅 ${t('pages.calendar.types.event', {}, 'Event')}`, value: EventType.EVENT },
  ];

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  const handleFinish = (values: Record<string, unknown>) => {
    const dateRange = values.dateRange as [dayjs.Dayjs, dayjs.Dayjs];
    return {
      ...values,
      start_time: dateRange[0].toISOString(),
      end_time: dateRange[1].toISOString(),
      dateRange: undefined,
    };
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }} onFinish={(values) => formProps.onFinish?.(handleFinish(values))}>
        <Form.Item
          label={t('pages.calendar.fields.title', {}, 'Title')}
          name="title"
          rules={[{ required: true, message: t('pages.calendar.validation.titleRequired', {}, 'Please enter title') }]}
        >
          <Input placeholder={t('pages.calendar.placeholders.title', {}, 'e.g. Anatomy I - Midterm Examination')} />
        </Form.Item>

        <Form.Item
          label={t('pages.calendar.fields.type', {}, 'Type')}
          name="type"
          rules={[{ required: true, message: t('pages.calendar.validation.typeRequired', {}, 'Please select type') }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label={t('pages.calendar.fields.timeRange', {}, 'Time Range')}
          name="dateRange"
          rules={[{ required: true, message: t('pages.calendar.validation.timeRangeRequired', {}, 'Please select time range') }]}
        >
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.allDay', {}, 'All Day')} name="is_all_day" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.subject', {}, 'Related Subject')} name="subject_id">
          <Select
            allowClear
            placeholder={t('pages.calendar.placeholders.subject', {}, 'Select subject (optional)')}
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.location', {}, 'Location')} name="location">
          <Input placeholder={t('pages.calendar.placeholders.location', {}, 'e.g. Room 1-2')} />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default CalendarCreate;
