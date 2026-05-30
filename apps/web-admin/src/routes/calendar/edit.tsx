/**
 * Calendar Events Edit Page
 * Date-only event editing
 */import { useList, useShow } from '@refinedev/core';import { Edit, useForm } from '@refinedev/antd';import { useParams } from 'react-router-dom';import { Form, Input, Select, DatePicker } from 'antd';import dayjs from 'dayjs';import { EventType } from '@medical-portal/shared';import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const CalendarEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<CalendarEvent>({ id });
  const { formProps, saveButtonProps } = useForm<CalendarEvent>({ id });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const record = queryResult?.data?.data;
  const subjects = subjectsData?.data || [];

  const eventTypeOptions = [
    { label: `🎯 ${'Exam'}`, value: EventType.EXAM },
    { label: `📚 ${'Lecture'}`, value: EventType.LECTURE },
    { label: `🎉 ${'Holiday'}`, value: EventType.HOLIDAY },
    { label: `📅 ${'Event'}`, value: EventType.EVENT },
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
          label={'Title'}
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={'Type'}
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label={'Start Date'}
          name="start_date"
          rules={[{ required: true }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label={'End Date'}
          name="end_date"
          extra={'Leave empty for single-day events'}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Related Subject'} name="subject_id">
          <Select
            allowClear
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label={'Location'} name="location">
          <Input />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default CalendarEdit;
