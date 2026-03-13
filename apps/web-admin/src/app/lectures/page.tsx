'use client';

/**
 * Lectures List Page
 */

import { useList } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import type { Lecture, Section } from '@medical-portal/shared';

export default function LecturesPage() {
  const { tableProps } = useTable<Lecture>({
    syncWithLocation: true,
  });

  const { result: sectionsDataResult } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsDataResult?.data || [];
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="section_id"
          title="หมวดหมู่"
          ellipsis
          render={(value) => sectionMap.get(value)?.name || value}
        />
        <Table.Column dataIndex="title" title="หัวข้อ" ellipsis />
        <Table.Column
          dataIndex="lecture_date"
          title="วันที่"
          width={120}
          render={(value) => value ? dayjs(value).format('DD/MM/YYYY') : '-'}
        />
        <Table.Column dataIndex="lecturer_name" title="ผู้บรรยาย" ellipsis />
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
          render={(_, record: Lecture) => (
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
