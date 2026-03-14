/**
 * Resources Create Page
 * Migrated from src/app/resources/create/page.tsx
 */

import { useList } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture } from '@medical-portal/shared';

const resourceTypeOptions = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const ResourcesCreate = () => {
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

export default ResourcesCreate;
