/**
 * Announcements Create Page
 */

import { Create, useForm } from '@refinedev/antd';import { Form, Input, Switch } from 'antd';import type { Announcement } from '@medical-portal/shared';

const { TextArea } = Input;

const AnnouncementsCreate = () => {
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
          label={'Title'}
          name="title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input placeholder={'Announcement title'} />
        </Form.Item>

        <Form.Item
          label={'Content'}
          name="content"
          rules={[{ required: true, message: 'Please enter content' }]}
        >
          <TextArea rows={5} placeholder={'Announcement content'} />
        </Form.Item>

        <Form.Item
          label={'Pinned'}
          name="is_pinned"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={'Published'}
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
