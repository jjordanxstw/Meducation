/**
 * Resources List Page
 * Single-page workflow for hierarchy-aware resource management.
 */import { useDataProvider, useDelete, useInvalidate, useList } from '@refinedev/core';import { List, useTable } from '@refinedev/antd';import {
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
} from 'antd';import { ResourceType } from '@medical-portal/shared';import { useCallback, useEffect, useRef, useState } from 'react';import { DatabaseOutlined, LinkOutlined, WarningOutlined } from '@ant-design/icons';import type { ResourceWithHierarchy, Section, Subject, Lecture } from '@medical-portal/shared';import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';import { resolveApiErrorMessage } from '../../utils/api-error';import { ResourceTypeTag } from '../../components/ResourceTypeTag';import { AdminEmptyState } from '../../components/AdminEmptyState';import { notify } from '../../utils/notify';

const ResourcesList = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const invalidate = useInvalidate();
  const dataProvider = useDataProvider();
  const { mutateAsync: deleteOne } = useDelete();
  const { tableProps, setFilters, filters, tableQueryResult } = useTable<ResourceWithHierarchy>({
    syncWithLocation: true,
  });

  const resourceTypeOptions = [
    { label: `🎬 ${'YouTube'}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${'Google Drive Video'}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${'Google Drive PDF'}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${'External Link'}`, value: ResourceType.EXTERNAL },
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
  const [formShake, setFormShake] = useState(false);
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
  const modalType = Form.useWatch('type', form);

  const typeAccent: Record<string, string> = {
    [ResourceType.YOUTUBE]: '#dc2626',
    [ResourceType.GDRIVE_VIDEO]: '#1d4ed8',
    [ResourceType.GDRIVE_PDF]: '#16a34a',
    [ResourceType.EXTERNAL]: '#7c3aed',
  };

  const { data: quickCreateSectionsData } = useList<Section>({
    resource: 'sections',
    filters: quickCreateSubjectId ? [{ field: 'subject_id', operator: 'eq', value: quickCreateSubjectId }] : [],
    queryOptions: {
      enabled: !!quickCreateSubjectId,
    },
  });

  const { data: modalSectionsData, isFetching: modalSectionsFetching } = useList<Section>({
    resource: 'sections',
    filters: modalSubjectId ? [{ field: 'subject_id', operator: 'eq', value: modalSubjectId }] : [],
    queryOptions: {
      enabled: !!modalSubjectId,
    },
  });
  const { data: modalLecturesData, isFetching: modalLecturesFetching } = useList<Lecture>({
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

  const hasActiveFilters = Boolean(
    search || subjectId || sectionId || lectureId || resourceType || typeof isActive === 'boolean',
  );

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
        message.success('Created successfully');
      } else if (quickCreateType === 'section') {
        await provider.custom({
          url: '/api/v1/admin/sections',
          method: 'post',
          payload: { subject_id: values.subject_id, name: values.name },
        });
        message.success('Created successfully');
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
        message.success('Created successfully');
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
        message: 'Deleted successfully',
        type: 'success',
      },
      errorNotification: {
        message: 'Failed to delete',
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
          ? 'Updated successfully'
          : 'Created successfully',
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
        // Validation failure — shake the form to draw attention.
        setFormShake(true);
        window.setTimeout(() => setFormShake(false), 400);
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
        children: 'Create',
        onClick: openCreateModal,
      }}
    >
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Space wrap size="small" className="resource-filter-bar">
        <Input.Search
          className="resource-filter-control"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={'Search'}
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
          placeholder={'Subject'}
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
          placeholder={'Section'}
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
          placeholder={'Lecture'}
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
          placeholder={'Resource Type'}
          style={{ width: 220 }}
          options={resourceTypeOptions}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isActive}
          onChange={(value) => setIsActive(value)}
          placeholder={'Status'}
          style={{ width: 160 }}
          options={[
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ]}
        />
        {hasActiveFilters && (
          <Button className="resource-filter-button" type="text" onClick={resetFilters}>
            {'Clear all'}
          </Button>
        )}
        <Button
          className="resource-filter-button"
          type="text"
          icon={<LinkOutlined />}
          onClick={() => {
            void navigator.clipboard
              ?.writeText(window.location.href)
              .then(() => notify.success('Filter URL copied'))
              .catch(() => notify.error('Could not copy link'));
          }}
        >
          {'Share filters'}
        </Button>
      </Space>
      </div>

      {tableQueryResult?.isError ? (
        <AdminEmptyState
          icon={<WarningOutlined />}
          title={'Failed to load resources'}
          subtitle={
            (tableQueryResult.error as { message?: string } | undefined)?.message ||
            'Something went wrong'
          }
          action={{ label: 'Retry', onClick: () => void tableQueryResult.refetch() }}
        />
      ) : (
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <AdminEmptyState
              icon={<DatabaseOutlined />}
              title={'No resources found'}
              subtitle={'Adjust your filters or create a new resource.'}
              action={{ label: 'Create', onClick: openCreateModal }}
            />
          ),
        }}
      >
        <Table.Column
          dataIndex="subject_name"
          title={'Subject'}
          ellipsis
          sorter
          render={(_, record: ResourceWithHierarchy) => (
            record.subject_code && record.subject_name
              ? `${record.subject_code} - ${record.subject_name}`
              : '-'
          )}
        />
        <Table.Column
          dataIndex="section_name"
          title={'Section'}
          ellipsis
          sorter
        />
        <Table.Column
          dataIndex="lecture_title"
          title={'Lecture'}
          ellipsis
          sorter
        />
        <Table.Column dataIndex="label" title={'Button Label'} ellipsis sorter />
        <Table.Column
          dataIndex="type"
          title={'Resource Type'}
          width={150}
          sorter
          render={(value) => <ResourceTypeTag type={value} />}
        />
        <Table.Column dataIndex="url" title={'URL / Video ID'} ellipsis sorter />
        <Table.Column
          dataIndex="order_index"
          title={'Order'}
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title={'Status'}
          width={100}
          sorter
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? 'Active' : 'Inactive'}
            </Tag>
          )}
        />
        <Table.Column
          title={'Actions'}
          fixed="right"
          width={120}
          render={(_, record: ResourceWithHierarchy) => (
            <Space size="small">
              <Button size="small" onClick={() => openEditModal(record)}>
                {'Edit'}
              </Button>
              <Popconfirm
                title={'Actions'}
                description={'Failed to delete'}
                onConfirm={() => handleDelete(record.id)}
              >
                <Button danger size="small">Delete</Button>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>
      )}

      <Modal
        title={
          <span
            style={{
              display: 'inline-block',
              borderLeft: `4px solid ${typeAccent[modalType] ?? '#0070f3'}`,
              paddingLeft: 10,
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {editingResource ? 'Edit Resource' : 'Create Resource'}
          </span>
        }
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={'Confirm'}
        cancelText={'Cancel'}
        confirmLoading={isSubmitting}
        width={760}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ order_index: 0, is_active: true }}
          className={formShake ? 'admin-shake' : undefined}
        >
          <Form.Item
            label={<>{'Subject'}</>}
            name="subject_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalSubjectSearchText.trim()) {
                    return;
                  }
                  throw new Error('Please select subject');
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder={'Select subject'}
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
              <Button onClick={() => openQuickCreateModal('subject')}>{'+Create'}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<>{'Section'}</>}
            name="section_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalSectionSearchText.trim()) {
                    return;
                  }
                  throw new Error('Please select section');
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                disabled={!modalSubjectId}
                loading={modalSectionsFetching}
                optionFilterProp="label"
                placeholder={
                  modalSubjectId
                    ? 'Select section'
                    : 'Select a subject first'
                }
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
              <Button onClick={() => openQuickCreateModal('section')} disabled={!modalSubjectId}>{'+Create'}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<>{'Lecture'}</>}
            name="lecture_id"
            required
            rules={[
              {
                validator: async (_, value) => {
                  if (value || modalLectureSearchText.trim()) {
                    return;
                  }
                  throw new Error('Please select lecture');
                },
              },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                allowClear
                disabled={!modalSectionId}
                loading={modalLecturesFetching}
                optionFilterProp="label"
                placeholder={
                  modalSectionId
                    ? 'Select lecture'
                    : 'Select a section first'
                }
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
              <Button onClick={() => openQuickCreateModal('lecture')} disabled={!modalSectionId}>{'+Create'}</Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={'Button Label'}
            name="label"
            rules={[{ required: true, message: 'Please enter label' }]}
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
          >
            <Input
              placeholder={'URL or Video ID'}
              addonAfter={
                <button
                  type="button"
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#1d4ed8' }}
                  onClick={() => {
                    const url = String(form.getFieldValue('url') ?? '').trim();
                    if (url) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {'Test Link'}
                </button>
              }
            />
          </Form.Item>

          <Form.Item label={'Display Order'} name="order_index">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={'Active'} name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Quick Create Modals */}
      <Modal
        title={'Create Subject'}
        open={quickCreateType === 'subject'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={'Confirm'}
        cancelText={'Cancel'}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{'Code'}</>}
            name="code"
            required
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder={'e.g. CS101'} />
          </Form.Item>
          <Form.Item
            label={<>{'Name'}</>}
            name="name"
            required
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder={'Subject name'} />
          </Form.Item>
          <Form.Item
            label={<>{'Year Level'}</>}
            name="year_level"
            required
            rules={[{ required: true, message: 'Please specify year level' }]}
          >
            <InputNumber min={1} max={6} placeholder={'1-6'} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={'Create Section'}
        open={quickCreateType === 'section'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={'Confirm'}
        cancelText={'Cancel'}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{'Subject'}</>}
            name="subject_id"
            required
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select
              placeholder={'Select subject'}
              options={subjects.map((subject) => ({
                label: `${subject.code} - ${subject.name}`,
                value: subject.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<>{'Name'}</>}
            name="name"
            required
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder={'Section name'} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={'Create Lecture'}
        open={quickCreateType === 'lecture'}
        onCancel={closeQuickCreateModal}
        onOk={handleQuickCreate}
        okText={'Confirm'}
        cancelText={'Cancel'}
        confirmLoading={isQuickCreateSubmitting}
        destroyOnClose
      >
        <Form form={quickCreateForm} layout="vertical">
          <Form.Item
            label={<>{'Subject'}</>}
            name="subject_id"
            required
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select
              placeholder={'Select subject'}
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
            label={<>{'Section'}</>}
            name="section_id"
            required
            rules={[{ required: true, message: 'Please select section' }]}
          >
            <Select
              disabled={!quickCreateSubjectId}
              placeholder={'Select section'}
              options={quickCreateSections.map((section) => ({
                label: section.name,
                value: section.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<>{'Title'}</>}
            name="title"
            required
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder={'Lecture title'} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};

export default ResourcesList;
