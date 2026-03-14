/**
 * Audit Logs List Page
 * Migrated from src/app/audit-logs/page.tsx
 */

import { List, useTable } from '@refinedev/antd';
import { Table, Tag } from 'antd';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AuditLogsList = () => {
  const { tableProps } = useTable<AuditLog>({
    syncWithLocation: true,
  });

  const actionColors: Record<string, string> = {
    INSERT: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
  };

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="table_name"
          title="ตาราง"
          width={150}
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column
          dataIndex="action"
          title="การกระทำ"
          width={120}
          render={(value) => (
            <Tag color={actionColors[value] || 'default'}>
              {value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="record_id"
          title="รหัสระเบียน"
          width={100}
        />
        <Table.Column
          dataIndex="old_values"
          title="ค่าเก่า"
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return '-';
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return '-';
            }
          }}
        />
        <Table.Column
          dataIndex="new_values"
          title="ค่าใหม่"
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return '-';
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return '-';
            }
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="วันที่"
          width={180}
          render={(value) =>
            new Date(value).toLocaleString('th-TH', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          }
        />
      </Table>
    </List>
  );
};

export default AuditLogsList;
