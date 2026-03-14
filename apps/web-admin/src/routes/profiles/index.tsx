/**
 * Profiles List Page
 * Migrated from src/app/profiles/page.tsx
 */

import { List, useTable, EditButton, ShowButton } from '@refinedev/antd';
import { Table, Space, Tag, Avatar } from 'antd';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const ProfilesList = () => {
  const { tableProps } = useTable<Profile>({
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
        <Table.Column
          dataIndex="avatar_url"
          title=""
          width={50}
          render={(value, record: Profile) => (
            <Avatar src={value} size="small">
              {record.full_name?.charAt(0)}
            </Avatar>
          )}
        />
        <Table.Column dataIndex="full_name" title="ชื่อ-นามสกุล" ellipsis />
        <Table.Column dataIndex="email" title="อีเมล" ellipsis />
        <Table.Column dataIndex="student_id" title="รหัสนักศึกษา" ellipsis />
        <Table.Column
          dataIndex="year_level"
          title="ชั้นปี"
          width={80}
          render={(value) => (value ? `ปี ${value}` : '-')}
        />
        <Table.Column
          dataIndex="role"
          title="สิทธิ์"
          width={120}
          render={(value) => (
            <Tag color={value === UserRole.ADMIN ? 'gold' : 'blue'}>
              {value === UserRole.ADMIN ? 'ผู้ดูแล' : 'นักศึกษา'}
            </Tag>
          )}
        />
        <Table.Column
          title="การจัดการ"
          fixed="right"
          width={120}
          render={(_, record: Profile) => (
            <Space size="small">
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default ProfilesList;
