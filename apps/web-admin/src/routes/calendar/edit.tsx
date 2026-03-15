/**
 * Calendar Events Edit Page
 * Migrated from src/app/calendar/edit/[id]/page.tsx
 */

import { useList, useShow, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, Switch, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

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
    const dateRange = values.dateRange as [dayjs.Dayjs, dayjs.Dayjs];
    return {
      ...values,
      start_time: dateRange[0].toISOString(),
      end_time: dateRange[1].toISOString(),
      dateRange: undefined,
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
          dateRange: record ? [dayjs(record.start_time), dayjs(record.end_time)] : undefined,
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
          label={t('pages.calendar.fields.timeRange', {}, 'Time Range')}
          name="dateRange"
          rules={[{ required: true }]}
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
