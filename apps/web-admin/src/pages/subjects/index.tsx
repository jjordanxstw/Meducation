/**
 * Subjects CRUD Pages
 */

import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  Create,
  Edit,
  Show,
  useForm,
} from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Table, Form, Input, InputNumber, Switch, Space, Typography, Descriptions, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { TextArea } = Input;
const { Title } = Typography;

// Subject List
export const SubjectList = () => {
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

// Subject Create
export const SubjectCreate = () => {
  const { formProps, saveButtonProps } = useForm<Subject>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="รหัสวิชา"
          name="code"
          rules={[{ required: true, message: 'กรุณากรอกรหัสวิชา' }]}
        >
          <Input placeholder="เช่น SCID101" />
        </Form.Item>

        <Form.Item
          label="ชื่อวิชา"
          name="name"
          rules={[{ required: true, message: 'กรุณากรอกชื่อวิชา' }]}
        >
          <Input placeholder="เช่น Anatomy I" />
        </Form.Item>

        <Form.Item
          label="ชั้นปี"
          name="year_level"
          rules={[{ required: true, message: 'กรุณาระบุชั้นปี' }]}
        >
          <InputNumber min={1} max={6} placeholder="1-6" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={4} placeholder="คำอธิบายรายวิชา" />
        </Form.Item>

        <Form.Item label="URL รูปภาพหน้าปก" name="thumbnail_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item label="ลำดับการแสดงผล" name="order_index" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

// Subject Edit
export const SubjectEdit = () => {
  const { formProps, saveButtonProps } = useForm<Subject>();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="รหัสวิชา"
          name="code"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="ชื่อวิชา"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="ชั้นปี"
          name="year_level"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={6} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label="URL รูปภาพหน้าปก" name="thumbnail_url">
          <Input />
        </Form.Item>

        <Form.Item label="ลำดับการแสดงผล" name="order_index">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

// Subject Show
export const SubjectShow = () => {
  const { queryResult } = useShow<Subject>();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5} style={{ fontFamily: 'Kanit', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}>
        รายละเอียดรายวิชา
      </Title>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label="รหัสวิชา">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="ชื่อวิชา">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="ชั้นปี">ปี {record?.year_level}</Descriptions.Item>
        <Descriptions.Item label="คำอธิบาย">{record?.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="ลำดับ">{record?.order_index}</Descriptions.Item>
        <Descriptions.Item label="สถานะ">
          <Tag color={record?.is_active ? 'green' : 'red'}>
            {record?.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
