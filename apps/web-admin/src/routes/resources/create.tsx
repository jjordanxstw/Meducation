/**
 * Resources Create Page
 * Migrated from src/app/resources/create/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Switch, Select } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture } from '@medical-portal/shared';

const ResourcesCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm<Resource>();

  const resourceTypeOptions = [
    { label: `🎬 ${t('pages.resources.types.youtube', {}, 'YouTube')}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${t('pages.resources.types.gdriveVideo', {}, 'Google Drive Video')}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${t('pages.resources.types.gdrivePdf', {}, 'Google Drive PDF')}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${t('pages.resources.types.external', {}, 'External Link')}`, value: ResourceType.EXTERNAL },
  ];

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesData?.data || [];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label={t('pages.resources.fields.lecture', {}, 'Lecture')}
          name="lecture_id"
          rules={[{ required: true, message: t('pages.resources.validation.lectureRequired', {}, 'Please select lecture') }]}
        >
          <Select
            placeholder={t('pages.resources.placeholders.lecture', {}, 'Select lecture')}
            options={lectures.map((l) => ({
              label: l.title,
              value: l.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.label', {}, 'Button Label')}
          name="label"
          rules={[{ required: true, message: t('pages.resources.validation.labelRequired', {}, 'Please enter label') }]}
          extra={t('pages.resources.help.label', {}, 'Displayed text on button, e.g. Slide, Video, Summary, Exercise')}
        >
          <Input placeholder={t('pages.resources.placeholders.label', {}, 'e.g. Slide, Video, Summary')} />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.type', {}, 'Resource Type')}
          name="type"
          rules={[{ required: true, message: t('pages.resources.validation.typeRequired', {}, 'Please select type') }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item
          label={t('pages.resources.fields.url', {}, 'URL / Video ID')}
          name="url"
          rules={[{ required: true, message: t('pages.resources.validation.urlRequired', {}, 'Please enter URL') }]}
          extra={t('pages.resources.help.url', {}, 'For YouTube use video ID, for Google Drive use full URL')}
        >
          <Input placeholder={t('pages.resources.placeholders.url', {}, 'URL or Video ID')} />
        </Form.Item>

        <Form.Item label={t('pages.resources.fields.orderIndex', {}, 'Display Order (left to right)')} name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label={t('pages.resources.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default ResourcesCreate;
