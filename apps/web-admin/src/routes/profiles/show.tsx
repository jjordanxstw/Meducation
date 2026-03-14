/**
 * Profiles Show Page
 * Migrated from src/app/profiles/[id]/page.tsx
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
        <Descriptions.Item label="อีเมล">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="ชื่อ-นามสกุล">{record?.full_name}</Descriptions.Item>
        <Descriptions.Item label="รหัสนักศึกษา">{record?.student_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="ชั้นปี">
          {record?.year_level ? `ปี ${record.year_level}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="สิทธิ์">
          <Tag color={record?.role === UserRole.ADMIN ? 'gold' : 'blue'}>
            {record?.role === UserRole.ADMIN ? 'ผู้ดูแลระบบ' : 'นักศึกษา'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="วันที่สร้าง">
          {record?.created_at
            ? new Date(record.created_at).toLocaleString('th-TH')
            : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default ProfilesShow;
