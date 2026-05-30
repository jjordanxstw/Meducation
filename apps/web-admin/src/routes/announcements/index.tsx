/**
 * Announcements List Page
 * Admin management of system announcements
 */import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';import { useCallback, useEffect, useRef, useState } from 'react';import type { Announcement } from '@medical-portal/shared';import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const AnnouncementsList = () => {
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
    <List createButtonProps={{ children: 'Create' }}>
      <Space wrap size="small" style={{ marginBottom: 12 }} className="resource-filter-bar">
        <Input.Search
          className="resource-filter-control"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={'Search'}
          style={{ width: 220 }}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isPublished}
          onChange={(value) => setIsPublished(value)}
          placeholder={'Status'}
          style={{ width: 150 }}
          options={[
            { label: 'Published', value: 'true' },
            { label: 'Draft', value: 'false' },
          ]}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isPinned}
          onChange={(value) => setIsPinned(value)}
          placeholder={'Pinned'}
          style={{ width: 150 }}
          options={[
            { label: 'Pinned', value: 'true' },
            { label: 'Not Pinned', value: 'false' },
          ]}
        />
        <Button className="resource-filter-button" onClick={resetFilters}>{'Clear'}</Button>
      </Space>

      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="title" title={'Title'} ellipsis />
        <Table.Column
          dataIndex="is_published"
          title={'Published'}
          width={110}
          render={(value) => (
            <Tag color={value ? 'green' : 'default'}>
              {value ? 'Published' : 'Draft'}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="is_pinned"
          title={'Pinned'}
          width={90}
          render={(value) => (
            <Tag color={value ? 'gold' : 'default'}>
              {value ? '📌 ' + 'Pinned' : '-'}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title={'Created'}
          width={130}
          render={(value) => new Date(value).toLocaleDateString()}
        />
        <Table.Column
          title={'Actions'}
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
