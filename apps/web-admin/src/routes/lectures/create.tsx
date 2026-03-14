/**
 * Lectures Create Page
 * Migrated from src/app/lectures/create/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';
import type { Lecture, Section } from '@medical-portal/shared';

const { TextArea } = Input;

const LecturesCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<Lecture>();

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.lectures.fields.section', {}, 'Section')}
          name="section_id"
          rules={[{ required: true, message: t('pages.lectures.validation.sectionRequired', {}, 'Please select a section') }]}
        >
          <Select
            placeholder={t('pages.lectures.placeholders.section', {}, 'Select section')}
            options={sections.map((s) => ({
              label: s.name,
              value: s.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.lectures.fields.title', {}, 'Lecture Title')}
          name="title"
          rules={[{ required: true, message: t('pages.lectures.validation.titleRequired', {}, 'Please enter title') }]}
        >
          <Input placeholder={t('pages.lectures.placeholders.title', {}, 'e.g. Lecture 1: Heart Anatomy')} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.lectureDate', {}, 'Lecture Date')} name="lecture_date">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.lecturerName', {}, 'Lecturer')} name="lecturer_name">
          <Input placeholder={t('pages.lectures.placeholders.lecturerName', {}, 'Lecturer full name')} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.orderIndex', {}, 'Display Order')} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default LecturesCreate;
