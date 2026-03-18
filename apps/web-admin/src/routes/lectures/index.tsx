/**
 * Lectures List Page
 * Migrated from src/app/lectures/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import type { Lecture, Section } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const LecturesList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Lecture>({
    syncWithLocation: true,
  });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  const [search, setSearch] = useState('');
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = (searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (sectionId) {
      nextFilters.push({ field: 'section_id', operator: 'eq', value: sectionId });
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
    const sectionValue = getFilterValue(filters, 'section_id');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setSectionId(typeof sectionValue === 'string' ? sectionValue : undefined);
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
    setSectionId(undefined);
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
          value={sectionId}
          onChange={(value) => setSectionId(value)}
          placeholder={t('pages.lectures.fields.section', {}, 'Section')}
          style={{ width: 280 }}
          options={sections.map((section) => ({
            label: section.name,
            value: section.id,
          }))}
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
          dataIndex="section_id"
          title={t('pages.lectures.fields.section', {}, 'Section')}
          ellipsis
          render={(value) => sectionMap.get(value)?.name || value}
        />
        <Table.Column dataIndex="title" title={t('pages.lectures.fields.title', {}, 'Lecture Title')} ellipsis />
        <Table.Column
          dataIndex="lecture_date"
          title={t('pages.lectures.fields.lectureDate', {}, 'Lecture Date')}
          width={120}
          render={(value) => value ? dayjs(value).format('DD/MM/YYYY') : t('common.notAvailable', {}, '-')}
        />
        <Table.Column dataIndex="lecturer_name" title={t('pages.lectures.fields.lecturerName', {}, 'Lecturer')} ellipsis />
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
          render={(_, record: Lecture) => (
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

export default LecturesList;
