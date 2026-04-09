/**
 * Calendar Events Edit Page
 * Date-only event editing
 */

import { useList, useShow, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const CalendarEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<CalendarEvent>({ id });
  const { formProps, saveButtonProps } = useForm<CalendarEvent>({ id });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const record = queryResult?.data?.data;
  const subjects = subjectsData?.data || [];

  const eventTypeOptions = [
    { label: `🎯 ${t('pages.calendar.types.exam', {}, 'Exam')}`, value: EventType.EXAM },
    { label: `📚 ${t('pages.calendar.types.lecture', {}, 'Lecture')}`, value: EventType.LECTURE },
    { label: `🎉 ${t('pages.calendar.types.holiday', {}, 'Holiday')}`, value: EventType.HOLIDAY },
    { label: `📅 ${t('pages.calendar.types.event', {}, 'Event')}`, value: EventType.EVENT },
  ];

  const handleFinish = (values: Record<string, unknown>) => {
    return {
      ...values,
      start_date: (values.start_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      end_date: (values.end_date as dayjs.Dayjs)?.format('YYYY-MM-DD') || null,
    };
  };

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form
        {...formProps}
        layout="vertical"
        style={{ maxWidth: 600 }}
        initialValues={{
          ...record,
          start_date: record?.start_date ? dayjs(record.start_date) : undefined,
          end_date: record?.end_date ? dayjs(record.end_date) : undefined,
        }}
        onFinish={(values) => formProps.onFinish?.(handleFinish(values))}
      >
        <Form.Item
          label={t('pages.calendar.fields.title', {}, 'Title')}
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('pages.calendar.fields.type', {}, 'Type')}
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label={t('pages.calendar.fields.startDate', {}, 'Start Date')}
          name="start_date"
          rules={[{ required: true }]}
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
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.location', {}, 'Location')} name="location">
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.calendar.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default CalendarEdit;
