'use client';

/**
 * Sections List Page
 */

import { useList } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

export default function SectionsPage() {
  const { tableProps } = useTable<Section>({
    syncWithLocation: true,
  });

  const { result: subjectsDataResult } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsDataResult?.data || [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="subject_id"
          title="รายวิชา"
          ellipsis
          render={(value) => {
            const subject = subjectMap.get(value);
            return subject ? `${subject.code} - ${subject.name}` : value;
          }}
        />
        <Table.Column dataIndex="name" title="ชื่อหมวดหมู่" ellipsis />
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
}
