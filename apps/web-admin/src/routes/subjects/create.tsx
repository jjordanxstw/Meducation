/**
 * Subjects Create Page
 * Migrated from src/app/subjects/create/page.tsx
 */

import { Create, useForm } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Form, Input, InputNumber, Switch } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SubjectsCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<Subject>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.subjects.fields.code', {}, 'Subject Code')}
          name="code"
          rules={[{ required: true, message: t('pages.subjects.validation.codeRequired', {}, 'Please enter subject code') }]}
        >
          <Input placeholder={t('pages.subjects.placeholders.code', {}, 'e.g. SCID101')} />
        </Form.Item>

        <Form.Item
          label={t('pages.subjects.fields.name', {}, 'Subject Name')}
          name="name"
          rules={[{ required: true, message: t('pages.subjects.validation.nameRequired', {}, 'Please enter subject name') }]}
        >
          <Input placeholder={t('pages.subjects.placeholders.name', {}, 'e.g. Anatomy I')} />
        </Form.Item>

        <Form.Item
          label={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}
          name="year_level"
          rules={[{ required: true, message: t('pages.subjects.validation.yearLevelRequired', {}, 'Please specify year level') }]}
        >
          <InputNumber min={1} max={6} placeholder={t('pages.subjects.placeholders.yearLevel', {}, '1-6')} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.description', {}, 'Description')} name="description">
          <TextArea rows={4} placeholder={t('pages.subjects.placeholders.description', {}, 'Subject description')} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.thumbnailUrl', {}, 'Cover Image URL')} name="thumbnail_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.orderIndex', {}, 'Display Order')} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default SubjectsCreate;
