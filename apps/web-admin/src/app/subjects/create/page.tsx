'use client';

/**
 * Subjects Create Page
 */

import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;

export default function SubjectCreatePage() {
  const { formProps, saveButtonProps } = useForm<Subject>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="รหัสวิชา"
          name="code"
          rules={[{ required: true, message: 'กรุณากรอกรหัสวิชา' }]}
        >
          <Input placeholder="เช่น SCID101" />
        </Form.Item>

        <Form.Item
          label="ชื่อวิชา"
          name="name"
          rules={[{ required: true, message: 'กรุณากรอกชื่อวิชา' }]}
        >
          <Input placeholder="เช่น Anatomy I" />
        </Form.Item>

        <Form.Item
          label="ชั้นปี"
          name="year_level"
          rules={[{ required: true, message: 'กรุณาระบุชั้นปี' }]}
        >
          <InputNumber min={1} max={6} placeholder="1-6" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={4} placeholder="คำอธิบายรายวิชา" />
        </Form.Item>

        <Form.Item label="URL รูปภาพหน้าปก" name="thumbnail_url">
          <Input placeholder="https://..." />
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
}
