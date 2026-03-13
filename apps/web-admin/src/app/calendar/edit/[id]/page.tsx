'use client';

/**
 * Calendar Events Edit Page
 */

import { useList, useShow } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, Switch, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent, Subject } from '@medical-portal/shared';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const eventTypeOptions = [
  { label: '🎯 Exam', value: EventType.EXAM },
  { label: '📚 Lecture', value: EventType.LECTURE },
  { label: '🎉 Holiday', value: EventType.HOLIDAY },
  { label: '📅 Event', value: EventType.EVENT },
];

interface CalendarEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CalendarEditPage({ params }: CalendarEditPageProps) {
  const { id } = await params;
  const { formProps, saveButtonProps } = useForm<CalendarEvent>({ id });

  const { result: subjectsDataResult } = useList<Subject>({
    resource: 'subjects',
  });

  const { result: showResult } = useShow<CalendarEvent>({ id });
  const record = showResult;

  const subjects = subjectsDataResult?.data || [];

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
    <Edit saveButtonProps={saveButtonProps}>
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
          label="ชื่อกิจกรรม"
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="ประเภท"
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label="ช่วงเวลา"
          name="dateRange"
          rules={[{ required: true }]}
        >
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="ทั้งวัน" name="is_all_day" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="รายวิชาที่เกี่ยวข้อง" name="subject_id">
          <Select
            allowClear
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="สถานที่" name="location">
          <Input />
        </Form.Item>

        <Form.Item label="รายละเอียด" name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
