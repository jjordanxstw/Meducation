/**
 * Announcements List Page
 * Admin management of system announcements
 */

import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Announcement } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const AnnouncementsList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Announcement>({
    syncWithLocation: true,
  });

  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState<string | undefined>(undefined);
  const [isPinned, setIsPinned] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];

    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (isPublished !== undefined) {
      nextFilters.push({ field: 'is_published', operator: 'eq', value: isPublished });
    }
    if (isPinned !== undefined) {
      nextFilters.push({ field: 'is_pinned', operator: 'eq', value: isPinned });
    }

    return nextFilters;
  }, [isPublished, isPinned]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const publishedValue = getFilterValue(filters, 'is_published');
    const pinnedValue = getFilterValue(filters, 'is_pinned');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setIsPublished(typeof publishedValue === 'string' ? publishedValue : undefined);
    setIsPinned(typeof pinnedValue === 'string' ? pinnedValue : undefined);

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
    setIsPublished(undefined);
    setIsPinned(undefined);
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
          style={{ width: 220 }}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isPublished}
          onChange={(value) => setIsPublished(value)}
          placeholder={t('pages.announcements.fields.published', {}, 'Status')}
          style={{ width: 150 }}
          options={[
            { label: t('pages.announcements.published', {}, 'Published'), value: 'true' },
            { label: t('pages.announcements.draft', {}, 'Draft'), value: 'false' },
          ]}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isPinned}
          onChange={(value) => setIsPinned(value)}
          placeholder={t('pages.announcements.fields.pinned', {}, 'Pinned')}
          style={{ width: 150 }}
          options={[
            { label: t('pages.announcements.pinned', {}, 'Pinned'), value: 'true' },
            { label: t('pages.announcements.notPinned', {}, 'Not Pinned'), value: 'false' },
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
        <Table.Column dataIndex="title" title={t('pages.announcements.fields.title', {}, 'Title')} ellipsis />
        <Table.Column
          dataIndex="is_published"
          title={t('pages.announcements.fields.published', {}, 'Published')}
          width={110}
          render={(value) => (
            <Tag color={value ? 'green' : 'default'}>
              {value ? t('pages.announcements.published', {}, 'Published') : t('pages.announcements.draft', {}, 'Draft')}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="is_pinned"
          title={t('pages.announcements.fields.pinned', {}, 'Pinned')}
          width={90}
          render={(value) => (
            <Tag color={value ? 'gold' : 'default'}>
              {value ? '📌 ' + t('pages.announcements.pinned', {}, 'Pinned') : '-'}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title={t('pages.announcements.fields.createdAt', {}, 'Created')}
          width={130}
          render={(value) => new Date(value).toLocaleDateString()}
        />
        <Table.Column
          title={t('pages.announcements.fields.actions', {}, 'Actions')}
          fixed="right"
          width={120}
          render={(_, record: Announcement) => (
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

export default AnnouncementsList;
