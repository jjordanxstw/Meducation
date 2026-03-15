/**
 * Audit Logs List Page
 * Migrated from src/app/audit-logs/page.tsx
 */

import { List, useTable } from '@refinedev/antd';
import { useTranslate, useGetLocale } from '@refinedev/core';
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
  const t = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale() || 'th';
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
          title={t('pages.auditLogs.fields.table', {}, 'Table')}
          width={150}
          render={(value) => <Tag>{value}</Tag>}
        />
        <Table.Column
          dataIndex="action"
          title={t('common.actions', {}, 'Actions')}
          width={120}
          render={(value) => (
            <Tag color={actionColors[value] || 'default'}>
              {value}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="record_id"
          title={t('pages.auditLogs.fields.recordId', {}, 'Record ID')}
          width={100}
        />
        <Table.Column
          dataIndex="old_values"
          title={t('pages.auditLogs.fields.oldValues', {}, 'Old Values')}
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return t('common.notAvailable', {}, '-');
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return t('common.notAvailable', {}, '-');
            }
          }}
        />
        <Table.Column
          dataIndex="new_values"
          title={t('pages.auditLogs.fields.newValues', {}, 'New Values')}
          ellipsis
          render={(value) => {
            if (!value || typeof value !== 'object') return t('common.notAvailable', {}, '-');
            try {
              return JSON.stringify(value).slice(0, 50) + '...';
            } catch {
              return t('common.notAvailable', {}, '-');
            }
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title={t('pages.auditLogs.fields.createdAt', {}, 'Created At')}
          width={180}
          render={(value) =>
            new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
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
