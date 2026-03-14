/**
 * Sections Create Page
 * Migrated from src/app/sections/create/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SectionsCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<Section>();

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.sections.fields.subject', {}, 'Subject')}
          name="subject_id"
          rules={[{ required: true, message: t('pages.sections.validation.subjectRequired', {}, 'Please select a subject') }]}
        >
          <Select
            placeholder={t('pages.sections.placeholders.subject', {}, 'Select subject')}
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
          rules={[{ required: true, message: t('pages.sections.validation.nameRequired', {}, 'Please enter section name') }]}
        >
          <Input placeholder={t('pages.sections.placeholders.name', {}, 'e.g. Orientation, Block 1, Midterm')} />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.orderIndex', {}, 'Display Order')} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.sections.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default SectionsCreate;
