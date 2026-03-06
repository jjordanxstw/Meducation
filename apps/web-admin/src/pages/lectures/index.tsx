/**
 * Lectures CRUD Pages
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
import { Table, Form, Input, InputNumber, Switch, Space, Select, DatePicker, Tag } from 'antd';
import dayjs from 'dayjs';
import type { Lecture, Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

// Lecture List
export const LectureList = () => {
  const { tableProps } = useTable<Lecture>({
    syncWithLocation: true,
  });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  return (
    <List>
      <Table 
        {...tableProps} 
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="section_id"
          title="หมวดหมู่"
          ellipsis
          render={(value) => sectionMap.get(value)?.name || value}
        />
        <Table.Column dataIndex="title" title="หัวข้อ" ellipsis />
        <Table.Column
          dataIndex="lecture_date"
          title="วันที่"
          width={120}
          render={(value) => value ? dayjs(value).format('DD/MM/YYYY') : '-'}
        />
        <Table.Column dataIndex="lecturer_name" title="ผู้บรรยาย" ellipsis />
        <Table.Column
          dataIndex="order_index"
          title="ลำดับ"
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title="สถานะ"
          width={100}
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? 'เปิด' : 'ปิด'}
            </Tag>
          )}
        />
        <Table.Column
          title="การจัดการ"
          fixed="right"
          width={120}
          render={(_, record: Lecture) => (
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

// Lecture Create
export const LectureCreate = () => {
  const { formProps, saveButtonProps } = useForm<Lecture>();

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="หมวดหมู่"
          name="section_id"
          rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
        >
          <Select
            placeholder="เลือกหมวดหมู่"
            options={sections.map((s) => ({
              label: s.name,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="หัวข้อบทเรียน"
          name="title"
          rules={[{ required: true, message: 'กรุณากรอกหัวข้อ' }]}
        >
          <Input placeholder="เช่น Lecture 1: Heart Anatomy" />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="วันที่บรรยาย" name="lecture_date">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="ผู้บรรยาย" name="lecturer_name">
          <Input placeholder="ชื่อ-นามสกุลผู้บรรยาย" />
        </Form.Item>

        <Form.Item label="ลำดับการแสดงผล" name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

// Lecture Edit
export const LectureEdit = () => {
  const { formProps, saveButtonProps } = useForm<Lecture>({
    queryOptions: {
      select: (data) => ({
        data: {
          ...data.data,
          lecture_date: data.data.lecture_date ? dayjs(data.data.lecture_date) : null,
        },
      }),
    },
  });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="หมวดหมู่"
          name="section_id"
          rules={[{ required: true }]}
        >
          <Select
            options={sections.map((s) => ({
              label: s.name,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="หัวข้อบทเรียน"
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="วันที่บรรยาย" name="lecture_date">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="ผู้บรรยาย" name="lecturer_name">
          <Input />
        </Form.Item>

        <Form.Item label="ลำดับการแสดงผล" name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
