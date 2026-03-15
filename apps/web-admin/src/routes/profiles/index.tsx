/**
 * Profiles List Page
 * Migrated from src/app/profiles/page.tsx
 */

import { List, useTable, EditButton, ShowButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Table, Space, Tag, Avatar } from 'antd';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const ProfilesList = () => {
  const t = useTranslate();
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
        <Table.Column dataIndex="full_name" title={t('pages.profiles.fields.fullName', {}, 'Full Name')} ellipsis />
        <Table.Column dataIndex="email" title={t('pages.profiles.fields.email', {}, 'Email')} ellipsis />
        <Table.Column dataIndex="student_id" title={t('pages.profiles.fields.studentId', {}, 'Student ID')} ellipsis />
        <Table.Column
          dataIndex="year_level"
          title={t('pages.profiles.fields.yearLevel', {}, 'Year Level')}
          width={80}
          render={(value) => (value ? `${t('common.yearPrefix', {}, 'Year')} ${value}` : t('common.notAvailable', {}, '-'))}
        />
        <Table.Column
          dataIndex="role"
          title={t('pages.profiles.fields.role', {}, 'Role')}
          width={120}
          render={(value) => (
            <Tag color={value === UserRole.ADMIN ? 'gold' : 'blue'}>
              {value === UserRole.ADMIN
                ? t('pages.profiles.roles.admin', {}, 'Admin')
                : t('pages.profiles.roles.student', {}, 'Student')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
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
