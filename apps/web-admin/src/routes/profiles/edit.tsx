/**
 * Profiles Edit Page
 * Migrated from src/app/profiles/edit/[id]/page.tsx
 */

import { Edit, useForm } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { Form, Input, Select } from 'antd';
import { UserRole, YEAR_LEVELS } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const ProfilesEdit = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm<Profile>({ id });

  const roleOptions = [
    { label: t('pages.profiles.roles.student', {}, 'Student'), value: UserRole.STUDENT },
    { label: t('pages.profiles.roles.admin', {}, 'Admin'), value: UserRole.ADMIN },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} recordItemId={id}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label={t('pages.profiles.fields.email', {}, 'Email')} name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label={t('pages.profiles.fields.fullName', {}, 'Full Name')}
          name="full_name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.profiles.fields.studentId', {}, 'Student ID')} name="student_id">
          <Input />
        </Form.Item>

        <Form.Item label={t('pages.profiles.fields.yearLevel', {}, 'Year Level')} name="year_level">
          <Select
            allowClear
            options={YEAR_LEVELS.map((y) => ({
              label: `${t('common.yearPrefix', {}, 'Year')} ${y}`,
              value: y,
            }))}
          />
        </Form.Item>

        <Form.Item label={t('pages.profiles.fields.role', {}, 'Role')} name="role" rules={[{ required: true }]}>
          <Select options={roleOptions} />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default ProfilesEdit;
