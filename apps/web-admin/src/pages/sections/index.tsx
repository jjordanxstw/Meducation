/**
 * Sections CRUD Pages with Drag & Drop Reordering
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
import { Table, Form, Input, InputNumber, Switch, Space, Select, Tag } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

// Section List
export const SectionList = () => {
  const { tableProps } = useTable<Section>({
    syncWithLocation: true,
  });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <List>
      <Table 
        {...tableProps} 
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="subject_id"
          title="รายวิชา"
          ellipsis
          render={(value) => {
            const subject = subjectMap.get(value);
            return subject ? `${subject.code} - ${subject.name}` : value;
          }}
        />
        <Table.Column dataIndex="name" title="ชื่อหมวดหมู่" ellipsis />
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
          render={(_, record: Section) => (
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

// Section Create
export const SectionCreate = () => {
  const { formProps, saveButtonProps } = useForm<Section>();

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="รายวิชา"
          name="subject_id"
          rules={[{ required: true, message: 'กรุณาเลือกรายวิชา' }]}
        >
          <Select
            placeholder="เลือกรายวิชา"
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="ชื่อหมวดหมู่"
          name="name"
          rules={[{ required: true, message: 'กรุณากรอกชื่อหมวดหมู่' }]}
        >
          <Input placeholder="เช่น Orientation, Block 1, Midterm" />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={3} />
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

// Section Edit
export const SectionEdit = () => {
  const { formProps, saveButtonProps } = useForm<Section>();

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="รายวิชา"
          name="subject_id"
          rules={[{ required: true }]}
        >
          <Select
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="ชื่อหมวดหมู่"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={3} />
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
