'use client';

/**
 * Profiles Edit Page
 */

import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';
import { UserRole, YEAR_LEVELS } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

interface ProfileEditPageProps {
  params: Promise<{ id: string }>;
}

const roleOptions = [
  { label: 'นักศึกษา', value: UserRole.STUDENT },
  { label: 'ผู้ดูแลระบบ', value: UserRole.ADMIN },
];

export default async function ProfileEditPage({ params }: ProfileEditPageProps) {
  const { id } = await params;
  const { formProps, saveButtonProps } = useForm<Profile>({ id });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label="อีเมล" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="ชื่อ-นามสกุล"
          name="full_name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="รหัสนักศึกษา" name="student_id">
          <Input />
        </Form.Item>

        <Form.Item label="ชั้นปี" name="year_level">
          <Select
            allowClear
            options={YEAR_LEVELS.map((y) => ({
              label: `ชั้นปีที่ ${y}`,
              value: y,
            }))}
          />
        </Form.Item>

        <Form.Item label="สิทธิ์การใช้งาน" name="role" rules={[{ required: true }]}>
          <Select options={roleOptions} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
