/**
 * Announcements Edit Page
 */

import { useShow, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, Switch } from 'antd';
import type { Announcement } from '@medical-portal/shared';

const { TextArea } = Input;

const AnnouncementsEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Announcement>({ id });
  const { formProps, saveButtonProps } = useForm<Announcement>({ id });

  const record = queryResult?.data?.data;

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form
        {...formProps}
        layout="vertical"
        style={{ maxWidth: 600 }}
        initialValues={{
          ...record,
        }}
      >
        <Form.Item
          label={t('pages.announcements.fields.title', {}, 'Title')}
          name="title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('pages.announcements.fields.content', {}, 'Content')}
          name="content"
          rules={[{ required: true }]}
        >
          <TextArea rows={5} />
        </Form.Item>

        <Form.Item
          label={t('pages.announcements.fields.pinned', {}, 'Pinned')}
          name="is_pinned"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t('pages.announcements.fields.published', {}, 'Published')}
          name="is_published"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default AnnouncementsEdit;
