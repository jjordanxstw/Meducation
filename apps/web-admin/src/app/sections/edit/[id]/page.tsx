'use client';

/**
 * Sections Edit Page
 */

import { useList } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

interface SectionEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function SectionEditPage({ params }: SectionEditPageProps) {
  const { id } = await params;
  const { formProps, saveButtonProps } = useForm<Section>({ id });

  const { result: subjectsDataResult } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsDataResult?.data || [];

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
}
