/**
 * Resources List Page
 * Single-page workflow for hierarchy-aware resource management.
 */

import {
  useDataProvider,
  useDelete,
  useInvalidate,
  useList,
  useTranslate,
} from '@refinedev/core';
import { List, useTable } from '@refinedev/antd';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { ResourceType } from '@medical-portal/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResourceWithHierarchy, Section, Subject, Lecture } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';
import { resolveApiErrorMessage } from '../../utils/api-error';

const resourceTypeColors: Record<string, string> = {
  [ResourceType.YOUTUBE]: 'red',
  [ResourceType.GDRIVE_VIDEO]: 'blue',
  [ResourceType.GDRIVE_PDF]: 'green',
  [ResourceType.EXTERNAL]: 'purple',
};

const ResourcesList = () => {
  const t = useTranslate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const invalidate = useInvalidate();
  const dataProvider = useDataProvider();
  const { mutateAsync: deleteOne } = useDelete();
  const { tableProps, setFilters, filters } = useTable<ResourceWithHierarchy>({
    syncWithLocation: true,
  });

  const resourceTypeOptions = [
    { label: `🎬 ${t('pages.resources.types.youtube', {}, 'YouTube')}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${t('pages.resources.types.gdriveVideo', {}, 'Google Drive Video')}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${t('pages.resources.types.gdrivePdf', {}, 'Google Drive PDF')}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${t('pages.resources.types.external', {}, 'External Link')}`, value: ResourceType.EXTERNAL },
  ];

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [lectureId, setLectureId] = useState<string | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceWithHierarchy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSubjectSearchText, setModalSubjectSearchText] = useState('');
  const [modalSectionSearchText, setModalSectionSearchText] = useState('');
  const [modalLectureSearchText, setModalLectureSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  // Quick create states
  const [quickCreateType, setQuickCreateType] = useState<'subject' | 'section' | 'lecture' | null>(null);
  const [quickCreateForm] = Form.useForm();
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });
  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
    filters: subjectId ? [{ field: 'subject_id', operator: 'eq', value: subjectId }] : [],
    queryOptions: {
      enabled: !!subjectId,
    },
  });
  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
    filters: sectionId ? [{ field: 'section_id', operator: 'eq', value: sectionId }] : [],
    queryOptions: {
      enabled: !!sectionId,
    },
  });

  const subjects = subjectsData?.data || [];
  const sections = sectionsData?.data || [];
  const lectures = lecturesData?.data || [];
  const quickCreateSubjectId = Form.useWatch('subject_id', quickCreateForm);

  const modalSubjectId = Form.useWatch('subject_id', form);
  const modalSectionId = Form.useWatch('section_id', form);

  const { data: quickCreateSectionsData } = useList<Section>({
    resource: 'sections',
    filters: quickCreateSubjectId ? [{ field: 'subject_id', operator: 'eq', value: quickCreateSubjectId }] : [],
    queryOptions: {
      enabled: !!quickCreateSubjectId,
    },
  });

  const { data: modalSectionsData } = useList<Section>({
    resource: 'sections',
    filters: modalSubjectId ? [{ field: 'subject_id', operator: 'eq', value: modalSubjectId }] : [],
    queryOptions: {
      enabled: !!modalSubjectId,
    },
  });
  const { data: modalLecturesData } = useList<Lecture>({
    resource: 'lectures',
    filters: modalSectionId ? [{ field: 'section_id', operator: 'eq', value: modalSectionId }] : [],
    queryOptions: {
      enabled: !!modalSectionId,
    },
  });

  const modalSections = modalSectionsData?.data ?? [];
  const modalLectures = modalLecturesData?.data ?? [];
  const quickCreateSections = quickCreateSectionsData?.data ?? [];

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (subjectId) {
      nextFilters.push({ field: 'subject_id', operator: 'eq', value: subjectId });
    }
    if (sectionId) {
      nextFilters.push({ field: 'section_id', operator: 'eq', value: sectionId });
    }
    if (lectureId) {
      nextFilters.push({ field: 'lecture_id', operator: 'eq', value: lectureId });
    }
    if (resourceType) {
      nextFilters.push({ field: 'type', operator: 'eq', value: resourceType });
    }
    if (typeof isActive === 'boolean') {
      nextFilters.push({ field: 'is_active', operator: 'eq', value: isActive });
    }
    return nextFilters;
  }, [isActive, lectureId, resourceType, sectionId, subjectId]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const subjectValue = getFilterValue(filters, 'subject_id');
    const sectionValue = getFilterValue(filters, 'section_id');
    const lectureValue = getFilterValue(filters, 'lecture_id');
    const typeValue = getFilterValue(filters, 'type');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setSubjectId(typeof subjectValue === 'string' ? subjectValue : undefined);
    setSectionId(typeof sectionValue === 'string' ? sectionValue : undefined);
    setLectureId(typeof lectureValue === 'string' ? lectureValue : undefined);
    setResourceType(typeof typeValue === 'string' ? typeValue : undefined);
    setIsActive(typeof activeValue === 'boolean' ? activeValue : undefined);

    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) {
      return;
    }
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setSubjectId(undefined);
    setSectionId(undefined);
    setLectureId(undefined);
    setResourceType(undefined);
    setIsActive(undefined);
    setFilters([], 'replace');
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setModalSubjectSearchText('');
    setModalSectionSearchText('');
    setModalLectureSearchText('');
    form.resetFields();
    form.setFieldsValue({
      order_index: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: ResourceWithHierarchy) => {
    setEditingResource(record);
    setModalSubjectSearchText('');
    setModalSectionSearchText('');
    setModalLectureSearchText('');
    form.setFieldsValue({
      subject_id: record.subject_id || undefined,
      section_id: record.section_id || undefined,
      lecture_id: record.lecture_id,
      label: record.label,
      type: record.type,
      url: record.url,
      order_index: record.order_index,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    setModalSubjectSearchText('');
    setModalSectionSearchText('');
    setModalLectureSearchText('');
  };

  // Quick create handlers
  const openQuickCreateModal = (type: 'subject' | 'section' | 'lecture') => {
    setQuickCreateType(type);
    quickCreateForm.resetFields();
    if (type === 'section' && modalSubjectId) {
      quickCreateForm.setFieldValue('subject_id', modalSubjectId);
    }
    if (type === 'lecture') {
      if (modalSubjectId) {
        quickCreateForm.setFieldValue('subject_id', modalSubjectId);
      }
      if (modalSectionId) {
        quickCreateForm.setFieldValue('section_id', modalSectionId);
      }
    }
  };

  const closeQuickCreateModal = () => {
    setQuickCreateType(null);
    quickCreateForm.resetFields();
  };

  const handleQuickCreate = async () => {
    try {
      const values = await quickCreateForm.validateFields();
      setIsQuickCreateSubmitting(true);

      const provider = dataProvider();
      if (!provider?.custom) {
        throw new Error('Data provider custom method is not available');
      }

      if (quickCreateType === 'subject') {
        await provider.custom({
          url: '/api/v1/admin/subjects',
          method: 'post',
          payload: { code: values.code, name: values.name, year_level: values.year_level },
        });
        message.success(t('notifications.createSuccess', {}, 'Created successfully'));
      } else if (quickCreateType === 'section') {
        await provider.custom({
          url: '/api/v1/admin/sections',
          method: 'post',
          payload: { subject_id: values.subject_id, name: values.name },
        });
        message.success(t('notifications.createSuccess', {}, 'Created successfully'));
      } else if (quickCreateType === 'lecture') {
        await provider.custom({
          url: '/api/v1/admin/lectures',
          method: 'post',
          payload: {
            subject_id: values.subject_id,
            section_id: values.section_id,
            title: values.title,
          },
        });
        message.success(t('notifications.createSuccess', {}, 'Created successfully'));
      }

      await Promise.all([
        invalidate({ resource: 'subjects', invalidates: ['list'] }),
        invalidate({ resource: 'sections', invalidates: ['list'] }),
        invalidate({ resource: 'lectures', invalidates: ['list'] }),
      ]);

      closeQuickCreateModal();
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'errorFields' in error &&
        Array.isArray((error as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      const errorMessage = resolveApiErrorMessage(error, 'notifications.error');
      message.error(errorMessage);
    } finally {
      setIsQuickCreateSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteOne({
      resource: 'resources',
      id,
      successNotification: {
        message: t('notifications.deleteSuccess', {}, 'Deleted successfully'),
        type: 'success',
      },
      errorNotification: {
        message: t('notifications.deleteError', {}, 'Failed to delete'),
        type: 'error',
      },
    });
    await invalidate({ resource: 'resources', invalidates: ['list'] });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const subjectText = modalSubjectSearchText.trim();
      const sectionText = modalSectionSearchText.trim();
      const lectureText = modalLectureSearchText.trim();

      const payload = {
        resource_id: editingResource?.id,
        subject_id: values.subject_id || undefined,
        subject_name: values.subject_id ? undefined : subjectText,
        section_id: values.section_id || undefined,
        section_name: values.section_id ? undefined : sectionText,
        lecture_id: values.lecture_id || undefined,
        lecture_name: values.lecture_id ? undefined : lectureText,
        label: values.label,
        url: values.url,
        type: values.type,
        order_index: values.order_index,
        is_active: values.is_active,
      };

      setIsSubmitting(true);
      const provider = dataProvider();
      if (!provider?.custom) {
        throw new Error('Data provider custom method is not available');
      }

      await provider.custom({
        url: '/api/v1/admin/resources/full-create',
        method: 'post',
        payload,
      });

      message.success(
        editingResource
          ? t('notifications.updateSuccess', {}, 'Updated successfully')
          : t('notifications.createSuccess', {}, 'Created successfully'),
      );

      await Promise.all([
        invalidate({ resource: 'resources', invalidates: ['list'] }),
        invalidate({ resource: 'subjects', invalidates: ['list'] }),
        invalidate({ resource: 'sections', invalidates: ['list'] }),
        invalidate({ resource: 'lectures', invalidates: ['list'] }),
      ]);

      closeModal();
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'errorFields' in error &&
        Array.isArray((error as { errorFields?: unknown[] }).errorFields)
      ) {
        return;
      }
      const errorMessage = resolveApiErrorMessage(error, 'notifications.error');
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <List
      createButtonProps={{
        children: t('buttons.create', {}, 'Create'),
        onClick: openCreateModal,
      }}
    >
      <Space wrap size="small" style={{ marginBottom: 12 }} className="resource-filter-bar">
        <Input.Search
          className="resource-filter-control"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('common.searchPlaceholder', {}, 'Search')}
          style={{ width: 240 }}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={subjectId}
          onChange={(value) => {
            setSubjectId(value);
            setSectionId(undefined);
            setLectureId(undefined);
          }}
          placeholder={t('pages.resources.fields.subject', {}, 'Subject')}
          style={{ width: 280 }}
          options={subjects.map((subject) => ({
            label: `${subject.code} - ${subject.name}`,
            value: subject.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={sectionId}
          onChange={(value) => {
            setSectionId(value);
            setLectureId(undefined);
          }}
          placeholder={t('pages.resources.fields.section', {}, 'Section')}
          style={{ width: 280 }}
          disabled={!subjectId}
          options={sections.map((section) => ({
            label: section.name,
            value: section.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={lectureId}
          onChange={(value) => setLectureId(value)}
          placeholder={t('pages.resources.fields.lecture', {}, 'Lecture')}
          style={{ width: 280 }}
          disabled={!sectionId}
          options={lectures.map((lecture) => ({
            label: lecture.title,
            value: lecture.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={resourceType}
          onChange={(value) => setResourceType(value)}
          placeholder={t('pages.resources.fields.type', {}, 'Resource Type')}
          style={{ width: 220 }}
          options={resourceTypeOptions}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isActive}
          onChange={(value) => setIsActive(value)}
          placeholder={t('common.status', {}, 'Status')}
          style={{ width: 160 }}
          options={[
            { label: t('common.active', {}, 'Active'), value: true },
            { label: t('common.inactive', {}, 'Inactive'), value: false },
          ]}
        />
        <Button className="resource-filter-button" onClick={resetFilters}>{t('common.clearFilters', {}, 'Clear')}</Button>
      </Space>

      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="subject_name"
          title={t('pages.resources.fields.subject', {}, 'Subject')}
          ellipsis
          sorter
          render={(_, record: ResourceWithHierarchy) => (
            record.subject_code && record.subject_name
              ? `${record.subject_code} - ${record.subject_name}`
              : t('common.notAvailable', {}, '-')
          )}
        />
        <Table.Column
          dataIndex="section_name"
          title={t('pages.resources.fields.section', {}, 'Section')}
          ellipsis
          sorter
        />
        <Table.Column
          dataIndex="lecture_title"
          title={t('pages.resources.fields.lecture', {}, 'Lecture')}
          ellipsis
          sorter
        />
        <Table.Column dataIndex="label" title={t('pages.resources.fields.label', {}, 'Button Label')} ellipsis sorter />
        <Table.Column
          dataIndex="type"
          title={t('pages.resources.fields.type', {}, 'Resource Type')}
          width={150}
          sorter
          render={(value) => (
            <Tag color={resourceTypeColors[value] || 'default'}>
              {resourceTypeOptions.find((o) => o.value === value)?.label || value}
            </Tag>
          )}
        />
        <Table.Column dataIndex="url" title={t('pages.resources.fields.url', {}, 'URL / Video ID')} ellipsis sorter />
        <Table.Column
          dataIndex="order_index"
          title={t('common.order', {}, 'Order')}
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status', {}, 'Status')}
          width={100}
          sorter
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? t('common.active', {}, 'Active') : t('common.inactive', {}, 'Inactive')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
          fixed="right"
          width={120}
          render={(_, record: ResourceWithHierarchy) => (
            <Space size="small">
              <Button size="small" onClick={() => openEditModal(record)}>
                {t('buttons.edit', {}, 'Edit')}
              </Button>
              <Popconfirm
                title={t('common.actions', {}, 'Actions')}
                description={t('notifications.deleteError', {}, 'Failed to delete')}
                onConfirm={() => handleDelete(record.id)}
              >
                <Button danger size="small">Delete</Button>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      <Modal
        title={editingResource ? t('resources.titles.edit', {}, 'Edit Resource') : t('resources.titles.create', {}, 'Create Resource')}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={t('buttons.confirm', {}, 'Confirm')}
        cancelText={t('buttons.cancel', {}, 'Cancel')}
        confirmLoading={isSubmitting}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ order_index: 0, is_active: true }}>
          <Form.Item
            label={<>{t('pages.resources.fields.subject', {}, 'Subject')}</>}
            name="subject_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalSubjectSearchText.trim()) {
                    return;
                  }
                  throw new Error(t('pages.resources.validation.subjectRequired', {}, 'Please select subject'));
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder={t('pages.resources.placeholders.subject', {}, 'Select subject')}
                style={{ flex: 1 }}
                options={subjects.map((subject) => ({
                  label: `${subject.code} - ${subject.name}`,
                  value: subject.id,
                }))}
                onSearch={setModalSubjectSearchText}
                onChange={(value) => {
                  form.setFieldValue('subject_id', value || undefined);
                  setModalSubjectSearchText('');
                  form.setFieldValue('section_id', undefined);
                  form.setFieldValue('lecture_id', undefined);
                  setModalSectionSearchText('');
                  setModalLectureSearchText('');
                }}
              />
              <Button onClick={() => openQuickCreateModal('subject')}>{t('buttons.create', {}, '+Create')}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<>{t('pages.resources.fields.section', {}, 'Section')}</>}
            name="section_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalSectionSearchText.trim()) {
                    return;
                  }
                  throw new Error(t('pages.resources.validation.sectionRequired', {}, 'Please select section'));
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                disabled={!modalSubjectId}
                optionFilterProp="label"
                placeholder={t('pages.resources.placeholders.section', {}, 'Select section')}
                style={{ flex: 1 }}
                options={modalSections.map((section) => ({
                  label: section.name,
                  value: section.id,
                }))}
                onSearch={setModalSectionSearchText}
                onChange={(value) => {
                  form.setFieldValue('section_id', value || undefined);
                  setModalSectionSearchText('');
                  form.setFieldValue('lecture_id', undefined);
                  setModalLectureSearchText('');
                }}
              />
              <Button onClick={() => openQuickCreateModal('section')} disabled={!modalSubjectId}>{t('buttons.create', {}, '+Create')}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<>{t('pages.resources.fields.lecture', {}, 'Lecture')}</>}
            name="lecture_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalLectureSearchText.trim()) {
                    return;
                  }
                  throw new Error(t('pages.resources.validation.lectureRequired', {}, 'Please select lecture'));
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                disabled={!modalSectionId}
                optionFilterProp="label"
                placeholder={t('pages.resources.placeholders.lecture', {}, 'Select lecture')}
                style={{ flex: 1 }}
                options={modalLectures.map((lecture) => ({
                  label: lecture.title,
                  value: lecture.id,
                }))}
                onSearch={setModalLectureSearchText}
                onChange={(value) => {
                  form.setFieldValue('lecture_id', value || undefined);
                  setModalLectureSearchText('');
                }}
              />
              <Button onClick={() => openQuickCreateModal('lecture')} disabled={!modalSectionId}>{t('buttons.create', {}, '+Create')}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={t('pages.resources.fields.label', {}, 'Button Label')}
            name="label"
            rules={[{ required: true, message: t('pages.resources.validation.labelRequired', {}, 'Please enter label') }]}
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
          >
            <Input placeholder={t('pages.resources.placeholders.url', {}, 'URL or Video ID')} />
          </Form.Item>

          <Form.Item label={t('pages.resources.fields.orderIndex', {}, 'Display Order')} name="order_index">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={t('pages.resources.fields.isActive', {}, 'Active')} name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Quick Create Modals */}
      <Modal
        title={t('pages.resources.titles.createSubject', {}, 'Create Subject')}
        open={quickCreateType === 'subject'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={t('buttons.confirm', {}, 'Confirm')}
        cancelText={t('buttons.cancel', {}, 'Cancel')}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{t('pages.subjects.fields.code', {}, 'Code')}</>}
            name="code"
            required
            rules={[{ required: true, message: t('pages.subjects.validation.codeRequired', {}, 'Please enter code') }]}
          >
            <Input placeholder={t('pages.subjects.placeholders.code', {}, 'e.g. CS101')} />
          </Form.Item>
          <Form.Item
            label={<>{t('pages.subjects.fields.name', {}, 'Name')}</>}
            name="name"
            required
            rules={[{ required: true, message: t('pages.subjects.validation.nameRequired', {}, 'Please enter name') }]}
          >
            <Input placeholder={t('pages.subjects.placeholders.name', {}, 'Subject name')} />
          </Form.Item>
          <Form.Item
            label={<>{t('pages.subjects.fields.yearLevel', {}, 'Year Level')}</>}
            name="year_level"
            required
            rules={[{ required: true, message: t('pages.subjects.validation.yearLevelRequired', {}, 'Please specify year level') }]}
          >
            <InputNumber min={1} max={6} placeholder={t('pages.subjects.placeholders.yearLevel', {}, '1-6')} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('pages.resources.titles.createSection', {}, 'Create Section')}
        open={quickCreateType === 'section'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={t('buttons.confirm', {}, 'Confirm')}
        cancelText={t('buttons.cancel', {}, 'Cancel')}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{t('pages.resources.fields.subject', {}, 'Subject')}</>}
            name="subject_id"
            required
            rules={[{ required: true, message: t('pages.resources.validation.subjectRequired', {}, 'Please select subject') }]}
          >
            <Select
              placeholder={t('pages.resources.placeholders.subject', {}, 'Select subject')}
              options={subjects.map((subject) => ({
                label: `${subject.code} - ${subject.name}`,
                value: subject.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<>{t('pages.sections.fields.name', {}, 'Name')}</>}
            name="name"
            required
            rules={[{ required: true, message: t('pages.sections.validation.nameRequired', {}, 'Please enter name') }]}
          >
            <Input placeholder={t('pages.sections.placeholders.name', {}, 'Section name')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('pages.resources.titles.createLecture', {}, 'Create Lecture')}
        open={quickCreateType === 'lecture'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={t('buttons.confirm', {}, 'Confirm')}
        cancelText={t('buttons.cancel', {}, 'Cancel')}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{t('pages.resources.fields.subject', {}, 'Subject')}</>}
            name="subject_id"
            required
            rules={[{ required: true, message: t('pages.resources.validation.subjectRequired', {}, 'Please select subject') }]}
          >
            <Select
              placeholder={t('pages.resources.placeholders.subject', {}, 'Select subject')}
              options={subjects.map((subject) => ({
                label: `${subject.code} - ${subject.name}`,
                value: subject.id,
              }))}
              onChange={() => {
                quickCreateForm.setFieldValue('section_id', undefined);
              }}
            />
          </Form.Item>
          <Form.Item
            label={<>{t('pages.resources.fields.section', {}, 'Section')}</>}
            name="section_id"
            required
            rules={[{ required: true, message: t('pages.resources.validation.sectionRequired', {}, 'Please select section') }]}
          >
            <Select
              disabled={!quickCreateSubjectId}
              placeholder={t('pages.resources.placeholders.section', {}, 'Select section')}
              options={quickCreateSections.map((section) => ({
                label: section.name,
                value: section.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<>{t('pages.lectures.fields.title', {}, 'Title')}</>}
            name="title"
            required
            rules={[{ required: true, message: t('pages.lectures.validation.titleRequired', {}, 'Please enter title') }]}
          >
            <Input placeholder={t('pages.lectures.placeholders.title', {}, 'Lecture title')} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};

export default ResourcesList;
