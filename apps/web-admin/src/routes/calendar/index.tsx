/**
 * Calendar Events List Page
 * Migrated from src/app/calendar/page.tsx
 */

import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { useGetLocale, useList, useTranslate } from '@refinedev/core';
import { Button, DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Subject } from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const eventTypeColors: Record<string, string> = {
  [EventType.EXAM]: 'red',
  [EventType.LECTURE]: 'blue',
  [EventType.HOLIDAY]: 'green',
  [EventType.EVENT]: 'purple',
};

const CalendarList = () => {
  const t = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale() || 'th';
  const { tableProps, setFilters, filters } = useTable<CalendarEvent>({
    syncWithLocation: true,
  });
  const { RangePicker } = DatePicker;

  const eventTypeOptions = [
    { label: `🎯 ${t('pages.calendar.types.exam', {}, 'Exam')}`, value: EventType.EXAM },
    { label: `📚 ${t('pages.calendar.types.lecture', {}, 'Lecture')}`, value: EventType.LECTURE },
    { label: `🎉 ${t('pages.calendar.types.holiday', {}, 'Holiday')}`, value: EventType.HOLIDAY },
    { label: `📅 ${t('pages.calendar.types.event', {}, 'Event')}`, value: EventType.EVENT },
  ];

  const { data: subjectsData } = useList<Subject>({ resource: 'subjects' });
  const subjects = subjectsData?.data ?? [];

  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];

    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (eventType) {
      nextFilters.push({ field: 'type', operator: 'eq', value: eventType });
    }
    if (subjectId) {
      nextFilters.push({ field: 'subject_id', operator: 'eq', value: subjectId });
    }
    if (dateRange) {
      nextFilters.push({ field: 'start_date', operator: 'eq', value: dateRange[0] });
      nextFilters.push({ field: 'end_date', operator: 'eq', value: dateRange[1] });
    }

    return nextFilters;
  }, [dateRange, eventType, subjectId]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const typeValue = getFilterValue(filters, 'type');
    const subjectValue = getFilterValue(filters, 'subject_id');
    const startDate = getFilterValue(filters, 'start_date');
    const endDate = getFilterValue(filters, 'end_date');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setEventType(typeof typeValue === 'string' ? typeValue : undefined);
    setSubjectId(typeof subjectValue === 'string' ? subjectValue : undefined);
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
  }, [buildFilters, debouncedSearch, setFilters]);

  const resetFilters = () => {
    setSearch('');
    setEventType(undefined);
    setSubjectId(undefined);
    setDateRange(undefined);
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
          value={eventType}
          onChange={(value) => setEventType(value)}
          placeholder={t('pages.calendar.fields.type', {}, 'Type')}
          style={{ width: 180 }}
          options={eventTypeOptions}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={subjectId}
          onChange={(value) => setSubjectId(value)}
          placeholder={t('pages.calendar.fields.subject', {}, 'Related Subject')}
          style={{ width: 260 }}
          options={subjects.map((subject) => ({
            label: `${subject.code} - ${subject.name}`,
            value: subject.id,
          }))}
        />
        <RangePicker
          className="resource-filter-control"
          placeholder={[
            t('pages.calendar.placeholders.dateRangeStart', {}, 'Start date'),
            t('pages.calendar.placeholders.dateRangeEnd', {}, 'End date'),
          ]}
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
        <Button className="resource-filter-button" onClick={resetFilters}>{t('common.clearFilters', {}, 'Clear')}</Button>
      </Space>

      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="title" title={t('pages.calendar.fields.title', {}, 'Title')} ellipsis sorter />
        <Table.Column
          dataIndex="type"
          title={t('pages.calendar.fields.type', {}, 'Type')}
          width={130}
          sorter
          render={(value) => (
            <Tag color={eventTypeColors[value] || 'default'}>
              {eventTypeOptions.find((o) => o.value === value)?.label?.split(' ')[0] || value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="start_time"
          title={t('pages.calendar.fields.start', {}, 'Start')}
          width={160}
          sorter
          render={(value) =>
            new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          }
        />
        <Table.Column
          dataIndex="end_time"
          title={t('pages.calendar.fields.end', {}, 'End')}
          width={160}
          sorter
          render={(value) =>
            new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          }
        />
        <Table.Column
          dataIndex="is_all_day"
          title={t('pages.calendar.fields.allDay', {}, 'All Day')}
          width={80}
          sorter
          render={(value) => (value ? '✓' : t('common.notAvailable', {}, '-'))}
        />
        <Table.Column
          title={t('pages.calendar.fields.actions', {}, 'Actions')}
          fixed="right"
          width={120}
          render={(_, record: CalendarEvent) => (
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

export default CalendarList;
