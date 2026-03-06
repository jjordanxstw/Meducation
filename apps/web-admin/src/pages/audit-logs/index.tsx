/**
 * Audit Logs Page (Read-only)
 */

import { List, useTable } from '@refinedev/antd';
import { Table, Tag, Typography, Button, Space, Select, DatePicker } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { AuditAction } from '@medical-portal/shared';
import type { AuditLog } from '@medical-portal/shared';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const actionColors: Record<string, string> = {
  [AuditAction.INSERT]: 'green',
  [AuditAction.UPDATE]: 'blue',
  [AuditAction.DELETE]: 'red',
};

export const AuditLogList = () => {
  const [filters, setFilters] = useState<{
    table_name?: string;
    action?: string;
  }>({});

  const { tableProps } = useTable<AuditLog>({
    syncWithLocation: true,
    filters: {
      initial: Object.entries(filters)
        .filter(([_, value]) => value)
        .map(([field, value]) => ({
          field,
          operator: 'eq' as const,
          value,
        })),
    },
  });

  return (
    <List
      headerButtons={
        <Space>
          <Select
            placeholder="ตาราง"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters((f) => ({ ...f, table_name: value }))}
            options={[
              { label: 'subjects', value: 'subjects' },
              { label: 'sections', value: 'sections' },
              { label: 'lectures', value: 'lectures' },
              { label: 'resources', value: 'resources' },
              { label: 'calendar_events', value: 'calendar_events' },
              { label: 'profiles', value: 'profiles' },
            ]}
          />
          <Select
            placeholder="การกระทำ"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters((f) => ({ ...f, action: value }))}
            options={[
              { label: 'INSERT', value: AuditAction.INSERT },
              { label: 'UPDATE', value: AuditAction.UPDATE },
              { label: 'DELETE', value: AuditAction.DELETE },
            ]}
          />
        </Space>
      }
    >
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column
          dataIndex="created_at"
          title="วันเวลา"
          width={160}
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm:ss')}
        />
        <Table.Column
          dataIndex="table_name"
          title="ตาราง"
          width={140}
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column
          dataIndex="action"
          title="การกระทำ"
          width={100}
          render={(value) => (
            <Tag color={actionColors[value] || 'default'}>{value}</Tag>
          )}
        />
        <Table.Column
          dataIndex="record_id"
          title="Record ID"
          width={280}
          render={(value) => (
            <Text code copyable={{ text: value }} style={{ fontSize: 11 }}>
              {value?.slice(0, 8)}...
            </Text>
          )}
        />
        <Table.Column
          dataIndex={['profiles', 'full_name']}
          title="ผู้ดำเนินการ"
          width={150}
          render={(value, record: AuditLog & { profiles?: { full_name: string; email: string } }) =>
            record.profiles?.full_name || record.profiles?.email || '-'
          }
        />
        <Table.Column
          dataIndex="old_data"
          title="ข้อมูลเดิม"
          ellipsis
          render={(value) =>
            value ? (
              <Text
                ellipsis
                style={{ maxWidth: 200 }}
                title={JSON.stringify(value, null, 2)}
              >
                {JSON.stringify(value).slice(0, 50)}...
              </Text>
            ) : (
              '-'
            )
          }
        />
        <Table.Column
          dataIndex="new_data"
          title="ข้อมูลใหม่"
          ellipsis
          render={(value) =>
            value ? (
              <Text
                ellipsis
                style={{ maxWidth: 200 }}
                title={JSON.stringify(value, null, 2)}
              >
                {JSON.stringify(value).slice(0, 50)}...
              </Text>
            ) : (
              '-'
            )
          }
        />
      </Table>
    </List>
  );
};
