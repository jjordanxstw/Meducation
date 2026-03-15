/**
 * Subjects List Page
 * Migrated from src/app/subjects/page.tsx
 */

import { List, useTable, EditButton, ShowButton, DeleteButton } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Table, Space, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const SubjectsList = () => {
  const t = useTranslate();
  const { tableProps } = useTable<Subject>({
    syncWithLocation: true,
  });

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column dataIndex="code" title={t('pages.subjects.fields.code', {}, 'Subject Code')} width={120} />
        <Table.Column dataIndex="name" title={t('pages.subjects.fields.name', {}, 'Subject Name')} ellipsis />
        <Table.Column
          dataIndex="year_level"
          title={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}
          width={80}
          render={(value) => `${t('common.yearPrefix', {}, 'Year')} ${value}`}
        />
        <Table.Column
          dataIndex="order_index"
          title={t('common.order', {}, 'Order')}
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status', {}, 'Status')}
          width={100}
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? t('common.active', {}, 'Active') : t('common.inactive', {}, 'Inactive')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
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

export default SubjectsList;
