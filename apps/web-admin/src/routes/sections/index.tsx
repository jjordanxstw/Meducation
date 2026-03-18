/**
 * Sections List Page
 * Migrated from src/app/sections/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Section, Subject } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const SectionsList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Section>({
    syncWithLocation: true,
  });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (subjectId) {
      nextFilters.push({ field: 'subject_id', operator: 'eq', value: subjectId });
    }
    if (typeof isActive === 'boolean') {
      nextFilters.push({ field: 'is_active', operator: 'eq', value: isActive });
    }
    return nextFilters;
  }, [isActive, subjectId]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const subjectValue = getFilterValue(filters, 'subject_id');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setSubjectId(typeof subjectValue === 'string' ? subjectValue : undefined);
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
    setIsActive(undefined);
    setFilters([], 'replace');
  };

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
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
          onChange={(value) => setSubjectId(value)}
          placeholder={t('pages.sections.fields.subject', {}, 'Subject')}
          style={{ width: 280 }}
          options={subjects.map((subject) => ({
            label: `${subject.code} - ${subject.name}`,
            value: subject.id,
          }))}
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
          dataIndex="subject_id"
          title={t('pages.sections.fields.subject', {}, 'Subject')}
          ellipsis
          render={(value) => {
            const subject = subjectMap.get(value);
            return subject ? `${subject.code} - ${subject.name}` : value;
          }}
          sorter
        />
        <Table.Column dataIndex="name" title={t('pages.sections.fields.name', {}, 'Section Name')} ellipsis sorter/>
        <Table.Column
          dataIndex="order_index"
          title={t('common.order', {}, 'Order')}
          width={10}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status', {}, 'Status')}
          width={10}
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? t('common.active', {}, 'Active') : t('common.inactive', {}, 'Inactive')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
          fixed="right"
          width={10}
          render={(_, record: Section) => (
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

export default SectionsList;
