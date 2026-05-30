/**
 * Calendar Events Create Page
 * Date-only event creation
 */import { useList } from '@refinedev/core';import { Create, useForm } from '@refinedev/antd';import { Form, Input, Select, DatePicker } from 'antd';import dayjs from 'dayjs';import { EventType } from '@medical-portal/shared';import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const CalendarCreate = () => {
  const { formProps, saveButtonProps } = useForm<CalendarEvent>();

  const eventTypeOptions = [
    { label: `🎯 ${'Exam'}`, value: EventType.EXAM },
    { label: `📚 ${'Lecture'}`, value: EventType.LECTURE },
    { label: `🎉 ${'Holiday'}`, value: EventType.HOLIDAY },
    { label: `📅 ${'Event'}`, value: EventType.EVENT },
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
          label={'Title'}
          name="title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input placeholder={'e.g. Anatomy I - Midterm Examination'} />
        </Form.Item>

        <Form.Item
          label={'Type'}
          name="type"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label={'Start Date'}
          name="start_date"
          rules={[{ required: true, message: 'Please select start date' }]}
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
            placeholder={'Select subject (optional)'}
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label={'Location'} name="location">
          <Input placeholder={'e.g. Room 1-2'} />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default CalendarCreate;
