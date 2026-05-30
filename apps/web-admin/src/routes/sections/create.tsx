/**
 * Sections Create Page
 * Migrated from src/app/sections/create/page.tsx
 */import { useList } from '@refinedev/core';import { Create, useForm } from '@refinedev/antd';import { Form, Input, InputNumber, Switch, Select } from 'antd';import type { Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const SectionsCreate = () => {
  const { formProps, saveButtonProps } = useForm<Section>();

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={'Subject'}
          name="subject_id"
          rules={[{ required: true, message: 'Please select a subject' }]}
        >
          <Select
            placeholder={'Select subject'}
            options={subjects.map((s) => ({
              label: `${s.code} - ${s.name}`,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={'Section Name'}
          name="name"
          rules={[{ required: true, message: 'Please enter section name' }]}
        >
          <Input placeholder={'e.g. Orientation, Block 1, Midterm'} />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={3} />
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

export default SectionsCreate;
