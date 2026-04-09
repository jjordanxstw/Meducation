/**
 * Calendar Events Create Page
 * Date-only event creation
 */

import { useList, useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

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
    return {
      ...values,
      start_date: (values.start_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      end_date: (values.end_date as dayjs.Dayjs)?.format('YYYY-MM-DD') || null,
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
          label={t('pages.calendar.fields.startDate', {}, 'Start Date')}
          name="start_date"
          rules={[{ required: true, message: t('pages.calendar.validation.startDateRequired', {}, 'Please select start date') }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label={t('pages.calendar.fields.endDate', {}, 'End Date')}
          name="end_date"
          extra={t('pages.calendar.hints.endDate', {}, 'Leave empty for single-day events')}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
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
