/**
 * Lectures Create Page
 * Migrated from src/app/lectures/create/page.tsx
 */

import { useList } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';
import type { Lecture, Section } from '@medical-portal/shared';

const { TextArea } = Input;

const LecturesCreate = () => {
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

export default LecturesCreate;
