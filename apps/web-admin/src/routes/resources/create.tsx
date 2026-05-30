/**
 * Resources Create Page
 * Migrated from src/app/resources/create/page.tsx
 */import { useList } from '@refinedev/core';import { Create, useForm } from '@refinedev/antd';import { useMemo } from 'react';import { Form, Input, InputNumber, Switch, Select } from 'antd';import { ResourceType } from '@medical-portal/shared';import type { Resource, Lecture, Section, Subject } from '@medical-portal/shared';

const ResourcesCreate = () => {
  const { formProps, saveButtonProps } = useForm<Resource>();
  const selectedSubjectId = Form.useWatch('subject_id', formProps.form);
  const selectedSectionId = Form.useWatch('section_id', formProps.form);

  const resourceTypeOptions = [
    { label: `🎬 ${'YouTube'}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${'Google Drive Video'}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${'Google Drive PDF'}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${'External Link'}`, value: ResourceType.EXTERNAL },
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

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={'Subject'}
          name="subject_id"
          rules={[{ required: true, message: 'Please select subject' }]}
        >
          <Select
            placeholder={'Select subject'}
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
          label={'Section'}
          name="section_id"
          rules={[{ required: true, message: 'Please select section' }]}
        >
          <Select
            placeholder={'Select section'}
            options={sectionOptions}
            disabled={!selectedSubjectId}
            onChange={() => formProps.form?.setFieldValue('lecture_id', undefined)}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={'Lecture'}
          name="lecture_id"
          rules={[{ required: true, message: 'Please select lecture' }]}
        >
          <Select
            placeholder={'Select lecture'}
            options={lectureOptions}
            disabled={!selectedSectionId}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={'Button Label'}
          name="label"
          rules={[{ required: true, message: 'Please enter label' }]}
          extra={'Displayed text on button, e.g. Slide, Video, Summary, Exercise'}
        >
          <Input placeholder={'e.g. Slide, Video, Summary'} />
        </Form.Item>

        <Form.Item
          label={'Resource Type'}
          name="type"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item
          label={'URL / Video ID'}
          name="url"
          rules={[{ required: true, message: 'Please enter URL' }]}
          extra={'For YouTube use video ID, for Google Drive use full URL'}
        >
          <Input placeholder={'URL or Video ID'} />
        </Form.Item>

        <Form.Item label={'Display Order (left to right)'} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={'Active'} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default ResourcesCreate;
