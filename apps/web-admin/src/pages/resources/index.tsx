/**
 * Resources CRUD Pages (The Dynamic Buttons)
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
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture } from '@medical-portal/shared';

const resourceTypeOptions = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const resourceTypeColors: Record<string, string> = {
  [ResourceType.YOUTUBE]: 'red',
  [ResourceType.GDRIVE_VIDEO]: 'blue',
  [ResourceType.GDRIVE_PDF]: 'green',
  [ResourceType.EXTERNAL]: 'purple',
};

// Resource List
export const ResourceList = () => {
  const { tableProps } = useTable<Resource>({
    syncWithLocation: true,
  });

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesData?.data || [];
  const lectureMap = new Map(lectures.map((l) => [l.id, l]));

  return (
    <List>
      <Table 
        {...tableProps} 
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="lecture_id"
          title="บทเรียน"
          ellipsis
          render={(value) => lectureMap.get(value)?.title || value}
        />
        <Table.Column dataIndex="label" title="ชื่อปุ่ม" ellipsis />
        <Table.Column
          dataIndex="type"
          title="ประเภท"
          width={150}
          render={(value) => (
            <Tag color={resourceTypeColors[value] || 'default'}>
              {resourceTypeOptions.find((o) => o.value === value)?.label || value}
            </Tag>
          )}
        />
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
          render={(_, record: Resource) => (
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

// Resource Create
export const ResourceCreate = () => {
  const { formProps, saveButtonProps } = useForm<Resource>();

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="บทเรียน"
          name="lecture_id"
          rules={[{ required: true, message: 'กรุณาเลือกบทเรียน' }]}
        >
          <Select
            placeholder="เลือกบทเรียน"
            options={lectures.map((l) => ({
              label: l.title,
              value: l.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="ชื่อปุ่ม (Label)"
          name="label"
          rules={[{ required: true, message: 'กรุณากรอกชื่อปุ่ม' }]}
          extra="ชื่อที่จะแสดงบนปุ่ม เช่น Slide, Video, Summary, Exercise"
        >
          <Input placeholder="เช่น Slide, Video, Summary" />
        </Form.Item>

        <Form.Item
          label="ประเภทไฟล์"
          name="type"
          rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item
          label="URL / Video ID"
          name="url"
          rules={[{ required: true, message: 'กรุณากรอก URL' }]}
          extra="สำหรับ YouTube ใส่ Video ID เช่น dQw4w9WgXcQ, สำหรับ Google Drive ใส่ URL เต็ม"
        >
          <Input placeholder="URL หรือ Video ID" />
        </Form.Item>

        <Form.Item label="ลำดับการแสดงผล (ซ้ายไปขวา)" name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

// Resource Edit
export const ResourceEdit = () => {
  const { formProps, saveButtonProps } = useForm<Resource>();

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="บทเรียน"
          name="lecture_id"
          rules={[{ required: true }]}
        >
          <Select
            options={lectures.map((l) => ({
              label: l.title,
              value: l.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="ชื่อปุ่ม (Label)"
          name="label"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="ประเภทไฟล์"
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item
          label="URL / Video ID"
          name="url"
          rules={[{ required: true }]}
        >
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
