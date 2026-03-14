/**
 * Calendar Events List Page
 * Migrated from src/app/calendar/page.tsx
 */

import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Table, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';

const eventTypeColors: Record<string, string> = {
  [EventType.EXAM]: 'red',
  [EventType.LECTURE]: 'blue',
  [EventType.HOLIDAY]: 'green',
  [EventType.EVENT]: 'purple',
};

const CalendarList = () => {
  const t = useTranslate();
  const { tableProps } = useTable<CalendarEvent>({
    syncWithLocation: true,
  });

  const eventTypeOptions = [
    { label: `🎯 ${t('pages.calendar.types.exam', {}, 'Exam')}`, value: EventType.EXAM },
    { label: `📚 ${t('pages.calendar.types.lecture', {}, 'Lecture')}`, value: EventType.LECTURE },
    { label: `🎉 ${t('pages.calendar.types.holiday', {}, 'Holiday')}`, value: EventType.HOLIDAY },
    { label: `📅 ${t('pages.calendar.types.event', {}, 'Event')}`, value: EventType.EVENT },
  ];

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="title" title={t('pages.calendar.fields.title', {}, 'Title')} ellipsis />
        <Table.Column
          dataIndex="type"
          title={t('pages.calendar.fields.type', {}, 'Type')}
          width={130}
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
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="end_time"
          title={t('pages.calendar.fields.end', {}, 'End')}
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="is_all_day"
          title={t('pages.calendar.fields.allDay', {}, 'All Day')}
          width={80}
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
