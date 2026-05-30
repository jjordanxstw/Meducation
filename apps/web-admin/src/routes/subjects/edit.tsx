/**
 * Subjects Edit Page
 * Migrated from src/app/subjects/edit/[id]/page.tsx
 */import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';import { Form, Input, InputNumber, Switch } from 'antd';import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SubjectsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Subject>({
    id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={'Subject Code'}
          name="code"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={'Subject Name'}
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={'Year Level'}
          name="year_level"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={6} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label={'Cover Image URL'} name="thumbnail_url">
          <Input />
        </Form.Item>

        <Form.Item label={'Display Order'} name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Active'} name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default SubjectsEdit;
