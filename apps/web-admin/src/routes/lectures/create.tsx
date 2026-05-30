/**
 * Lectures Create Page
 * Migrated from src/app/lectures/create/page.tsx
 */import { useList } from '@refinedev/core';import { Create, useForm } from '@refinedev/antd';import { useMemo } from 'react';import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';import type { Lecture, Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const LecturesCreate = () => {
  const { formProps, saveButtonProps } = useForm<Lecture>();
  const selectedSubjectId = Form.useWatch('subject_id', formProps.form);

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const sections = useMemo(() => sectionsData?.data || [], [sectionsData?.data]);
  const subjects = subjectsData?.data || [];
  const sectionOptions = useMemo(() => {
    if (!selectedSubjectId) {
      return [];
    }

    return sections
      .filter((section) => section.subject_id === selectedSubjectId)
      .map((section) => ({
        label: section.name,
        value: section.id,
      }));
  }, [sections, selectedSubjectId]);

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
            options={subjects.map((subject) => ({
              label: `${subject.code} - ${subject.name}`,
              value: subject.id,
            }))}
            onChange={() => formProps.form?.setFieldValue('section_id', undefined)}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={'Section'}
          name="section_id"
          rules={[{ required: true, message: 'Please select a section' }]}
        >
          <Select
            placeholder={'Select section'}
            options={sectionOptions}
            disabled={!selectedSubjectId}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={'Lecture Title'}
          name="title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input placeholder={'e.g. Lecture 1: Heart Anatomy'} />
        </Form.Item>

        <Form.Item label={'Description'} name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label={'Lecture Date'} name="lecture_date">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Lecturer'} name="lecturer_name">
          <Input placeholder={'Lecturer full name'} />
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

export default LecturesCreate;
