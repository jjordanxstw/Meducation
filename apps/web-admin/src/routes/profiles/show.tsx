/**
 * Profiles Show Page
 * Migrated from src/app/profiles/[id]/page.tsx
 */

import { useShow, useTranslate, useGetLocale } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Descriptions, Tag } from 'antd';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const ProfilesShow = () => {
  const t = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale() || 'th';
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Profile>({ id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} recordItemId={id}>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label={t('pages.profiles.fields.email', {}, 'Email')}>{record?.email}</Descriptions.Item>
        <Descriptions.Item label={t('pages.profiles.fields.fullName', {}, 'Full Name')}>{record?.full_name}</Descriptions.Item>
        <Descriptions.Item label={t('pages.profiles.fields.studentId', {}, 'Student ID')}>{record?.student_id || t('common.notAvailable', {}, '-')}</Descriptions.Item>
        <Descriptions.Item label={t('pages.profiles.fields.yearLevel', {}, 'Year Level')}>
          {record?.year_level ? `${t('common.yearPrefix', {}, 'Year')} ${record.year_level}` : t('common.notAvailable', {}, '-')}
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.profiles.fields.role', {}, 'Role')}>
          <Tag color={record?.role === UserRole.ADMIN ? 'gold' : 'blue'}>
            {record?.role === UserRole.ADMIN
              ? t('pages.profiles.roles.admin', {}, 'Admin')
              : t('pages.profiles.roles.student', {}, 'Student')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.profiles.fields.createdAt', {}, 'Created At')}>
          {record?.created_at
            ? new Date(record.created_at).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')
            : t('common.notAvailable', {}, '-')}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default ProfilesShow;
