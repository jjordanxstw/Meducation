/**
 * Subjects List Page
 * Migrated from src/app/subjects/page.tsx
 */

import { List, useTable, EditButton, ShowButton, DeleteButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Subject } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const SubjectsList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Subject>({
    syncWithLocation: true,
  });

  const [search, setSearch] = useState('');
  const [yearLevel, setYearLevel] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];

    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (typeof yearLevel === 'number') {
      nextFilters.push({ field: 'year_level', operator: 'eq', value: yearLevel });
    }
    if (typeof isActive === 'boolean') {
      nextFilters.push({ field: 'is_active', operator: 'eq', value: isActive });
    }

    return nextFilters;
  }, [isActive, yearLevel]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const yearLevelValue = getFilterValue(filters, 'year_level');
    const isActiveValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setYearLevel(typeof yearLevelValue === 'number' ? yearLevelValue : undefined);
    setIsActive(typeof isActiveValue === 'boolean' ? isActiveValue : undefined);

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
    setYearLevel(undefined);
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
          value={yearLevel}
          onChange={(value) => setYearLevel(value)}
          placeholder={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}
          style={{ width: 160 }}
          options={[1, 2, 3, 4, 5, 6].map((value) => ({
            label: `${t('common.yearPrefix', {}, 'Year')} ${value}`,
            value,
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
        <Table.Column dataIndex="code" title={t('pages.subjects.fields.code', {}, 'Subject Code')} width={150} sorter/>
        <Table.Column dataIndex="name" title={t('pages.subjects.fields.name', {}, 'Subject Name')} ellipsis sorter/>
        <Table.Column
          dataIndex="year_level"
          title={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}
          width={150}
          render={(value) => `${t('common.yearPrefix', {}, 'Year')} ${value}`}
          sorter
        />
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
          render={(_, record: Subject) => (
            <Space size="small">
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default SubjectsList;
