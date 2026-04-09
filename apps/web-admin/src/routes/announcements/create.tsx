/**
 * Announcements Create Page
 */

import { useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Switch } from 'antd';
import type { Announcement } from '@medical-portal/shared';

const { TextArea } = Input;

const AnnouncementsCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<Announcement>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        style={{ maxWidth: 600 }}
        initialValues={{ is_published: true, is_pinned: false }}
      >
        <Form.Item
          label={t('pages.announcements.fields.title', {}, 'Title')}
          name="title"
          rules={[{ required: true, message: t('pages.announcements.validation.titleRequired', {}, 'Please enter title') }]}
        >
          <Input placeholder={t('pages.announcements.placeholders.title', {}, 'Announcement title')} />
        </Form.Item>

        <Form.Item
          label={t('pages.announcements.fields.content', {}, 'Content')}
          name="content"
          rules={[{ required: true, message: t('pages.announcements.validation.contentRequired', {}, 'Please enter content') }]}
        >
          <TextArea rows={5} placeholder={t('pages.announcements.placeholders.content', {}, 'Announcement content')} />
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
    </Create>
  );
};

export default AnnouncementsCreate;
