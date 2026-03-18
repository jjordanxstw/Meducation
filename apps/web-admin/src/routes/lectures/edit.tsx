/**
 * Lectures Edit Page
 * Migrated from src/app/lectures/edit/[id]/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Lecture, Section, Subject } from '@medical-portal/shared';

const { TextArea } = Input;

const LecturesEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Lecture>({ id });
  const selectedSubjectId = Form.useWatch('subject_id', formProps.form);
  const selectedSectionId = Form.useWatch('section_id', formProps.form);

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const sections = useMemo(() => sectionsData?.data || [], [sectionsData?.data]);
  const subjects = subjectsData?.data || [];
  const sectionMap = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
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

  useEffect(() => {
    if (!selectedSectionId || selectedSubjectId) {
      return;
    }

    const section = sectionMap.get(selectedSectionId);
    if (section?.subject_id) {
      formProps.form?.setFieldValue('subject_id', section.subject_id);
    }
  }, [formProps.form, sectionMap, selectedSectionId, selectedSubjectId]);

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.lectures.fields.subject', {}, 'Subject')}
          name="subject_id"
          rules={[{ required: true, message: t('pages.lectures.validation.subjectRequired', {}, 'Please select a subject') }]}
        >
          <Select
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
          label={t('pages.lectures.fields.section', {}, 'Section')}
          name="section_id"
          rules={[{ required: true, message: t('pages.lectures.validation.sectionRequired', {}, 'Please select a section') }]}
        >
          <Select
            options={sectionOptions}
            disabled={!selectedSubjectId}
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
