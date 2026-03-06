/**
 * Profiles CRUD Pages
 */

import {
  List,
  useTable,
  EditButton,
  ShowButton,
  Edit,
  Show,
  useForm,
} from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Table, Form, Input, InputNumber, Select, Space, Tag, Descriptions, Avatar } from 'antd';
import { UserRole, YEAR_LEVELS } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';

const roleOptions = [
  { label: 'นักศึกษา', value: UserRole.STUDENT },
  { label: 'ผู้ดูแลระบบ', value: UserRole.ADMIN },
];

// Profile List
export const ProfileList = () => {
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

// Profile Edit
export const ProfileEdit = () => {
  const { formProps, saveButtonProps } = useForm<Profile>();

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
};

// Profile Show
export const ProfileShow = () => {
  const { queryResult } = useShow<Profile>();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
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
