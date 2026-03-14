/**
 * Subjects List Page
 * Migrated from src/app/subjects/page.tsx
 */

import { List, useTable, EditButton, ShowButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const SubjectsList = () => {
  const { tableProps } = useTable<Subject>({
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
        <Table.Column dataIndex="code" title="รหัสวิชา" width={120} />
        <Table.Column dataIndex="name" title="ชื่อวิชา" ellipsis />
        <Table.Column
          dataIndex="year_level"
          title="ชั้นปี"
          width={80}
          render={(value) => `ปี ${value}`}
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
              {value ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </Tag>
          )}
        />
        <Table.Column
          title="การจัดการ"
          fixed="right"
          width={180}
          render={(_, record: Subject) => (
            <Space size="small">
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default SubjectsList;
