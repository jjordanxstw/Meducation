/**
 * Profiles Show Page
 */
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Descriptions, Tag } from 'antd';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const ProfilesShow = () => {
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Profile>({ id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} recordItemId={id}>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label="Email">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="Full Name">{record?.full_name}</Descriptions.Item>
        <Descriptions.Item label="Student ID">{record?.student_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="Year Level">
          {record?.year_level ? `Year ${record.year_level}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color={record?.role === UserRole.ADMIN ? 'gold' : 'blue'}>
            {record?.role === UserRole.ADMIN ? 'Admin' : 'Student'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {record?.created_at ? new Date(record.created_at).toLocaleString('en-US') : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default ProfilesShow;
