/**
 * Resources List Page
 * Migrated from src/app/resources/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import { useEffect, useRef, useState } from 'react';
import type { Resource, Lecture } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const resourceTypeColors: Record<string, string> = {
  [ResourceType.YOUTUBE]: 'red',
  [ResourceType.GDRIVE_VIDEO]: 'blue',
  [ResourceType.GDRIVE_PDF]: 'green',
  [ResourceType.EXTERNAL]: 'purple',
};

const ResourcesList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Resource>({
    syncWithLocation: true,
  });

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
  const lectureMap = new Map(lectures.map((l) => [l.id, l]));

  const [search, setSearch] = useState('');
  const [lectureId, setLectureId] = useState<string | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = (searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
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
  };

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const lectureValue = getFilterValue(filters, 'lecture_id');
    const typeValue = getFilterValue(filters, 'type');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
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
  }, [debouncedSearch]);

  const applyFilters = () => {
    setFilters(buildFilters(search), 'replace');
  };

  const resetFilters = () => {
    setSearch('');
    setLectureId(undefined);
    setResourceType(undefined);
    setIsActive(undefined);
    setFilters([], 'replace');
  };

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Space wrap size="small" style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={applyFilters}
          placeholder={t('common.searchPlaceholder', {}, 'Search')}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          value={lectureId}
          onChange={(value) => setLectureId(value)}
          placeholder={t('pages.resources.fields.lecture', {}, 'Lecture')}
          style={{ width: 280 }}
          options={lectures.map((lecture) => ({
            label: lecture.title,
            value: lecture.id,
          }))}
        />
        <Select
          allowClear
          value={resourceType}
          onChange={(value) => setResourceType(value)}
          placeholder={t('pages.resources.fields.type', {}, 'Resource Type')}
          style={{ width: 220 }}
          options={resourceTypeOptions}
        />
        <Select
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
        <Button type="primary" onClick={applyFilters}>{t('common.applyFilters', {}, 'Apply')}</Button>
        <Button onClick={resetFilters}>{t('common.clearFilters', {}, 'Clear')}</Button>
      </Space>

      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="lecture_id"
          title={t('pages.resources.fields.lecture', {}, 'Lecture')}
          ellipsis
          render={(value) => lectureMap.get(value)?.title || value}
        />
        <Table.Column dataIndex="label" title={t('pages.resources.fields.label', {}, 'Button Label')} ellipsis />
        <Table.Column
          dataIndex="type"
          title={t('pages.resources.fields.type', {}, 'Resource Type')}
          width={150}
          render={(value) => (
            <Tag color={resourceTypeColors[value] || 'default'}>
              {resourceTypeOptions.find((o) => o.value === value)?.label || value}
            </Tag>
          )}
        />
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
          render={(_, record: Resource) => (
            <Space size="small">
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default ResourcesList;
