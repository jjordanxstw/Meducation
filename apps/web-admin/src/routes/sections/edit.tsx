/**
 * Sections Edit Page
 * Migrated from src/app/sections/edit/[id]/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SectionsEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Section>({ id });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.sections.fields.subject', {}, 'Subject')}
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
          label={t('pages.sections.fields.name', {}, 'Section Name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.orderIndex', {}, 'Display Order')} name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default SectionsEdit;
