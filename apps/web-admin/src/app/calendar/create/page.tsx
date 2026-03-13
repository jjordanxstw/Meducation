'use client';

/**
 * Calendar Events Create Page
 */

import { useList } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
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

export default function CalendarCreatePage() {
  const { formProps, saveButtonProps } = useForm<CalendarEvent>();

  const { result: subjectsResult } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsResult?.data || [];

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
          label="ชื่อกิจกรรม"
          name="title"
          rules={[{ required: true, message: 'กรุณากรอกชื่อกิจกรรม' }]}
        >
          <Input placeholder="เช่น Anatomy I - Midterm Examination" />
        </Form.Item>

        <Form.Item
          label="ประเภท"
          name="type"
          rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}
        >
          <Select options={eventTypeOptions} />
        </Form.Item>

        <Form.Item
          label="ช่วงเวลา"
          name="dateRange"
          rules={[{ required: true, message: 'กรุณาเลือกช่วงเวลา' }]}
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
            placeholder="เลือกรายวิชา (ถ้ามี)"
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="สถานที่" name="location">
          <Input placeholder="เช่น ห้องสอบ 1-2" />
        </Form.Item>

        <Form.Item label="รายละเอียด" name="description">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Create>
  );
}
