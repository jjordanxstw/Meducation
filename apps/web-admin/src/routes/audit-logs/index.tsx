/**
 * Audit Logs List Page
 * Migrated from src/app/audit-logs/page.tsx
 */

import { List, useTable } from '@refinedev/antd';
import { useTranslate, useGetLocale } from '@refinedev/core';
import { Button, DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AuditLogsList = () => {
  const t = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale() || 'th';
  const { tableProps, setFilters, filters } = useTable<AuditLog>({
    syncWithLocation: true,
  });
  const { RangePicker } = DatePicker;

  const actionColors: Record<string, string> = {
    INSERT: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
  };

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string | undefined>(undefined);
  const [tableName, setTableName] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = (searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];

    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (action) {
      nextFilters.push({ field: 'action', operator: 'eq', value: action });
    }
    if (tableName) {
      nextFilters.push({ field: 'table_name', operator: 'eq', value: tableName });
    }
    if (dateRange) {
      nextFilters.push({ field: 'start_date', operator: 'eq', value: dateRange[0] });
      nextFilters.push({ field: 'end_date', operator: 'eq', value: dateRange[1] });
    }

    return nextFilters;
  };

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const actionValue = getFilterValue(filters, 'action');
    const tableValue = getFilterValue(filters, 'table_name');
    const startDate = getFilterValue(filters, 'start_date');
    const endDate = getFilterValue(filters, 'end_date');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setAction(typeof actionValue === 'string' ? actionValue : undefined);
    setTableName(typeof tableValue === 'string' ? tableValue : undefined);
    if (typeof startDate === 'string' && typeof endDate === 'string') {
      setDateRange([startDate, endDate]);
    }

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
    setAction(undefined);
    setTableName(undefined);
    setDateRange(undefined);
    setFilters([], 'replace');
  };

  return (
    <List>
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
          value={action}
          onChange={(value) => setAction(value)}
          placeholder={t('common.actions', {}, 'Actions')}
          style={{ width: 160 }}
          options={[
            { label: 'INSERT', value: 'INSERT' },
            { label: 'UPDATE', value: 'UPDATE' },
            { label: 'DELETE', value: 'DELETE' },
          ]}
        />
        <Select
          allowClear
          value={tableName}
          onChange={(value) => setTableName(value)}
          placeholder={t('pages.auditLogs.fields.table', {}, 'Table')}
          style={{ width: 180 }}
          options={[
            { label: 'profiles', value: 'profiles' },
            { label: 'subjects', value: 'subjects' },
            { label: 'sections', value: 'sections' },
            { label: 'lectures', value: 'lectures' },
            { label: 'resources', value: 'resources' },
            { label: 'calendar_events', value: 'calendar_events' },
          ]}
        />
        <RangePicker
          value={
            dateRange
              ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
              : undefined
          }
          onChange={(values) => {
            if (!values?.[0] || !values?.[1]) {
              setDateRange(undefined);
              return;
            }
            setDateRange([values[0].startOf('day').toISOString(), values[1].endOf('day').toISOString()]);
          }}
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
          dataIndex="table_name"
          title={t('pages.auditLogs.fields.table', {}, 'Table')}
          width={150}
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column
          dataIndex="action"
          title={t('common.actions', {}, 'Actions')}
          width={120}
          render={(value) => (
            <Tag color={actionColors[value] || 'default'}>
              {value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="record_id"
          title={t('pages.auditLogs.fields.recordId', {}, 'Record ID')}
          width={100}
        />
        <Table.Column
          dataIndex="old_values"
          title={t('pages.auditLogs.fields.oldValues', {}, 'Old Values')}
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return t('common.notAvailable', {}, '-');
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return t('common.notAvailable', {}, '-');
            }
          }}
        />
        <Table.Column
          dataIndex="new_values"
          title={t('pages.auditLogs.fields.newValues', {}, 'New Values')}
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return t('common.notAvailable', {}, '-');
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return t('common.notAvailable', {}, '-');
            }
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title={t('pages.auditLogs.fields.createdAt', {}, 'Created At')}
          width={180}
          render={(value) =>
            new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          }
        />
      </Table>
    </List>
  );
};

export default AuditLogsList;
