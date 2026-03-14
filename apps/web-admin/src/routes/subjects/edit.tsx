/**
 * Subjects Edit Page
 * Migrated from src/app/subjects/edit/[id]/page.tsx
 */

import { Edit, useForm } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Switch } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SubjectsEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Subject>({
    id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.subjects.fields.code', {}, 'Subject Code')}
          name="code"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('pages.subjects.fields.name', {}, 'Subject Name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}
          name="year_level"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={6} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.description', {}, 'Description')} name="description">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.thumbnailUrl', {}, 'Cover Image URL')} name="thumbnail_url">
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.orderIndex', {}, 'Display Order')} name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.subjects.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default SubjectsEdit;
