/**
 * Profiles List Page
 * Migrated from src/app/profiles/page.tsx
 */

import { List, useTable, EditButton, ShowButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Avatar, Button, Input, Select, Space, Table, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const ProfilesList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Profile>({
    syncWithLocation: true,
  });

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [yearLevel, setYearLevel] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];

    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (role) {
      nextFilters.push({ field: 'role', operator: 'eq', value: role });
    }
    if (typeof yearLevel === 'number') {
      nextFilters.push({ field: 'year_level', operator: 'eq', value: yearLevel });
    }

    return nextFilters;
  }, [role, yearLevel]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const roleValue = getFilterValue(filters, 'role');
    const yearLevelValue = getFilterValue(filters, 'year_level');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setRole(typeof roleValue === 'string' ? roleValue : undefined);
    setYearLevel(typeof yearLevelValue === 'number' ? yearLevelValue : undefined);

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
    setRole(undefined);
    setYearLevel(undefined);
    setFilters([], 'replace');
  };

  return (
    <List>
      <Space wrap size="small" style={{ marginBottom: 12 }} className="resource-filter-bar">
        <Input.Search
          className="resource-filter-control"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('common.searchPlaceholder', {}, 'Search')}
          style={{ width: 260 }}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={role}
          onChange={(value) => setRole(value)}
          placeholder={t('pages.profiles.fields.role', {}, 'Role')}
          style={{ width: 180 }}
          options={[
            { label: t('pages.profiles.roles.admin', {}, 'Admin'), value: UserRole.ADMIN },
            { label: t('pages.profiles.roles.student', {}, 'Student'), value: UserRole.STUDENT },
          ]}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={yearLevel}
          onChange={(value) => setYearLevel(value)}
          placeholder={t('pages.profiles.fields.yearLevel', {}, 'Year Level')}
          style={{ width: 160 }}
          options={[1, 2, 3, 4, 5, 6].map((value) => ({
            label: `${t('common.yearPrefix', {}, 'Year')} ${value}`,
            value,
          }))}
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
          dataIndex="avatar_url"
          title=""
          width={50}
          sorter
          render={(value, record: Profile) => (
            <Avatar src={value} size="small">
              {record.full_name?.charAt(0)}
            </Avatar>
          )}
        />
        <Table.Column dataIndex="full_name" title={t('pages.profiles.fields.fullName', {}, 'Full Name')} ellipsis sorter />
        <Table.Column dataIndex="email" title={t('pages.profiles.fields.email', {}, 'Email')} ellipsis sorter />
        <Table.Column dataIndex="student_id" title={t('pages.profiles.fields.studentId', {}, 'Student ID')} ellipsis sorter />
        <Table.Column
          dataIndex="year_level"
          title={t('pages.profiles.fields.yearLevel', {}, 'Year Level')}
          width={80}
          sorter
          render={(value) => (value ? `${t('common.yearPrefix', {}, 'Year')} ${value}` : t('common.notAvailable', {}, '-'))}
        />
        <Table.Column
          dataIndex="role"
          title={t('pages.profiles.fields.role', {}, 'Role')}
          width={120}
          sorter
          render={(value) => (
            <Tag color={value === UserRole.ADMIN ? 'gold' : 'blue'}>
              {value === UserRole.ADMIN
                ? t('pages.profiles.roles.admin', {}, 'Admin')
                : t('pages.profiles.roles.student', {}, 'Student')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
          fixed="right"
          width={120}
          render={(_, record: Profile) => (
            <Space size="small">
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default ProfilesList;
