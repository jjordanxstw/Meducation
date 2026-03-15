/**
 * Lectures Edit Page
 * Migrated from src/app/lectures/edit/[id]/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Lecture, Section } from '@medical-portal/shared';

const { TextArea } = Input;

const LecturesEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Lecture>({ id });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.lectures.fields.section', {}, 'Section')}
          name="section_id"
          rules={[{ required: true }]}
        >
          <Select
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
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.description', {}, 'Description')} name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          label={t('pages.lectures.fields.lectureDate', {}, 'Lecture Date')}
          name="lecture_date"
          getValueProps={(value) => ({
            value: value ? dayjs(value) : null,
          })}
          getValueFromEvent={(val) => val?.toISOString()}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.lecturerName', {}, 'Lecturer')} name="lecturer_name">
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.orderIndex', {}, 'Display Order')} name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.lectures.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default LecturesEdit;
