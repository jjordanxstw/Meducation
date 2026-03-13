'use client';

/**
 * Resources List Page
 */

import { useList } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import type { Resource, Lecture } from '@medical-portal/shared';

const resourceTypeOptions = [
  { label: '🎬 YouTube', value: ResourceType.YOUTUBE },
  { label: '📹 Google Drive Video', value: ResourceType.GDRIVE_VIDEO },
  { label: '📄 Google Drive PDF', value: ResourceType.GDRIVE_PDF },
  { label: '🔗 External Link', value: ResourceType.EXTERNAL },
];

const resourceTypeColors: Record<string, string> = {
  [ResourceType.YOUTUBE]: 'red',
  [ResourceType.GDRIVE_VIDEO]: 'blue',
  [ResourceType.GDRIVE_PDF]: 'green',
  [ResourceType.EXTERNAL]: 'purple',
};

export default function ResourcesPage() {
  const { tableProps } = useTable<Resource>({
    syncWithLocation: true,
  });

  const { result: lecturesDataResult } = useList<Lecture>({
    resource: 'lectures',
  });

  const lectures = lecturesDataResult?.data || [];
  const lectureMap = new Map(lectures.map((l) => [l.id, l]));

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="lecture_id"
          title="บทเรียน"
          ellipsis
          render={(value) => lectureMap.get(value)?.title || value}
        />
        <Table.Column dataIndex="label" title="ชื่อปุ่ม" ellipsis />
        <Table.Column
          dataIndex="type"
          title="ประเภท"
          width={150}
          render={(value) => (
            <Tag color={resourceTypeColors[value] || 'default'}>
              {resourceTypeOptions.find((o) => o.value === value)?.label || value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="order_index"
          title="ลำดับ"
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title="สถานะ"
          width={100}
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? 'เปิด' : 'ปิด'}
            </Tag>
          )}
        />
        <Table.Column
          title="การจัดการ"
          fixed="right"
          width={120}
          render={(_, record: Resource) => (
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
