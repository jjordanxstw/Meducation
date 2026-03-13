'use client';

/**
 * Calendar Events List Page
 */

import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { EventType } from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';

const eventTypeOptions = [
  { label: '🎯 Exam', value: EventType.EXAM },
  { label: '📚 Lecture', value: EventType.LECTURE },
  { label: '🎉 Holiday', value: EventType.HOLIDAY },
  { label: '📅 Event', value: EventType.EVENT },
];

const eventTypeColors: Record<string, string> = {
  [EventType.EXAM]: 'red',
  [EventType.LECTURE]: 'blue',
  [EventType.HOLIDAY]: 'green',
  [EventType.EVENT]: 'purple',
};

export default function CalendarPage() {
  const { tableProps } = useTable<CalendarEvent>({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="title" title="Title" ellipsis />
        <Table.Column
          dataIndex="type"
          title="Type"
          width={130}
          render={(value) => (
            <Tag color={eventTypeColors[value] || 'default'}>
              {eventTypeOptions.find((o) => o.value === value)?.label?.split(' ')[0] || value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="start_time"
          title="Start"
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="end_time"
          title="End"
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column
          dataIndex="is_all_day"
          title="All Day"
          width={80}
          render={(value) => (value ? '✓' : '-')}
        />
        <Table.Column
          title="Actions"
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
}
