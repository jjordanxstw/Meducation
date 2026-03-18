/**
 * Resources Edit Page
 * Migrated from src/app/resources/edit/[id]/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture, Section, Subject } from '@medical-portal/shared';

const ResourcesEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Resource>({ id });
  const selectedSubjectId = Form.useWatch('subject_id', formProps.form);
  const selectedSectionId = Form.useWatch('section_id', formProps.form);
  const selectedLectureId = Form.useWatch('lecture_id', formProps.form);

  const resourceTypeOptions = [
    { label: `🎬 ${t('pages.resources.types.youtube', {}, 'YouTube')}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${t('pages.resources.types.gdriveVideo', {}, 'Google Drive Video')}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${t('pages.resources.types.gdrivePdf', {}, 'Google Drive PDF')}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${t('pages.resources.types.external', {}, 'External Link')}`, value: ResourceType.EXTERNAL },
  ];

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });
  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const lectures = useMemo(() => lecturesData?.data || [], [lecturesData?.data]);
  const sections = useMemo(() => sectionsData?.data || [], [sectionsData?.data]);
  const subjects = subjectsData?.data || [];
  const sectionMap = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
  const lectureMap = useMemo(() => new Map(lectures.map((lecture) => [lecture.id, lecture])), [lectures]);
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

  const lectureOptions = useMemo(() => {
    if (!selectedSectionId) {
      return [];
    }

    return lectures
      .filter((lecture) => lecture.section_id === selectedSectionId)
      .map((lecture) => ({
        label: lecture.title,
        value: lecture.id,
      }));
  }, [lectures, selectedSectionId]);

  useEffect(() => {
    if (!selectedLectureId || selectedSectionId) {
      return;
    }

    const selectedLecture = lectureMap.get(selectedLectureId);
    if (selectedLecture?.section_id) {
      formProps.form?.setFieldValue('section_id', selectedLecture.section_id);
    }
  }, [lectureMap, selectedLectureId, selectedSectionId, formProps.form]);

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
          label={t('pages.resources.fields.subject', {}, 'Subject')}
          name="subject_id"
          rules={[{ required: true, message: t('pages.resources.validation.subjectRequired', {}, 'Please select subject') }]}
        >
          <Select
            placeholder={t('pages.resources.placeholders.subject', {}, 'Select subject')}
            options={subjects.map((subject) => ({
              label: `${subject.code} - ${subject.name}`,
              value: subject.id,
            }))}
            onChange={() => {
              formProps.form?.setFieldValue('section_id', undefined);
              formProps.form?.setFieldValue('lecture_id', undefined);
            }}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.section', {}, 'Section')}
          name="section_id"
          rules={[{ required: true, message: t('pages.resources.validation.sectionRequired', {}, 'Please select section') }]}
        >
          <Select
            placeholder={t('pages.resources.placeholders.section', {}, 'Select section')}
            options={sectionOptions}
            disabled={!selectedSubjectId}
            onChange={() => formProps.form?.setFieldValue('lecture_id', undefined)}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.lecture', {}, 'Lecture')}
          name="lecture_id"
          rules={[{ required: true }]}
        >
          <Select
            options={lectureOptions}
            disabled={!selectedSectionId}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.label', {}, 'Button Label')}
          name="label"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.type', {}, 'Resource Type')}
          name="type"
          rules={[{ required: true }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.url', {}, 'URL / Video ID')}
          name="url"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.resources.fields.orderIndex', {}, 'Display Order')} name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.resources.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default ResourcesEdit;
