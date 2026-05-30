/**
 * Subjects Create Page
 * Migrated from src/app/subjects/create/page.tsx
 */import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch } from 'antd';import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SubjectsCreate = () => {
  const { formProps, saveButtonProps } = useForm<Subject>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={'Subject Code'}
          name="code"
          rules={[{ required: true, message: 'Please enter subject code' }]}
        >
          <Input placeholder={'e.g. SCID101'} />
        </Form.Item>

        <Form.Item
          label={'Subject Name'}
          name="name"
          rules={[{ required: true, message: 'Please enter subject name' }]}
        >
          <Input placeholder={'e.g. Anatomy I'} />
        </Form.Item>

        <Form.Item
          label={'Year Level'}
          name="year_level"
          rules={[{ required: true, message: 'Please specify year level' }]}
        >
          <InputNumber min={1} max={6} placeholder={'1-6'} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={4} placeholder={'Subject description'} />
        </Form.Item>

        <Form.Item label={'Cover Image URL'} name="thumbnail_url">
          <Input placeholder={'https://...'} />
        </Form.Item>

        <Form.Item label={'Display Order'} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Active'} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default SubjectsCreate;
