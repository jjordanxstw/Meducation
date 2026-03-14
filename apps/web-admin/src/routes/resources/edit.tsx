/**
 * Resources Edit Page
 * Migrated from src/app/resources/edit/[id]/page.tsx
 */

import { useList } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture } from '@medical-portal/shared';

const resourceTypeOptions = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const ResourcesEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Resource>({ id });

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
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

export default ResourcesEdit;
