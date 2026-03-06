/**
 * Calendar Events CRUD Pages
 */

import { useList } from '@refinedev/core';
import {
  List,
  useTable,
  EditButton,
  DeleteButton,
  Create,
  Edit,
  useForm,
} from '@refinedev/antd';
import { Table, Form, Input, Switch, Space, Select, DatePicker, Tag } from 'antd';
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

const eventTypeColors: Record<string, string> = {
  [EventType.EXAM]: 'red',
  [EventType.LECTURE]: 'blue',
  [EventType.HOLIDAY]: 'green',
  [EventType.EVENT]: 'purple',
};

// Calendar Event List
export const CalendarEventList = () => {
  const { tableProps } = useTable<CalendarEvent>({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table 
        {...tableProps} 
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="title" title="Title" ellipsis />
        <Table.Column
          dataIndex="type"
          title="Type"
          width={130}
          render={(value) => (
            <Tag color={eventTypeColors[value] || 'default'}>
              {eventTypeOptions.find((o) => o.value === value)?.label?.split(' ')[0] || value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="start_time"
          title="Start"
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="end_time"
          title="End"
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="is_all_day"
          title="All Day"
          width={80}
          render={(value) => (value ? '✓' : '-')}
        />
        <Table.Column
          title="Actions"
          fixed="right"
          width={120}
          render={(_, record: CalendarEvent) => (
            <Space size="small">
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

// Calendar Event Create
export const CalendarEventCreate = () => {
  const { formProps, saveButtonProps } = useForm<CalendarEvent>();

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
};

// Calendar Event Edit
export const CalendarEventEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm<CalendarEvent>();

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];
  const record = queryResult?.data?.data;

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
};
