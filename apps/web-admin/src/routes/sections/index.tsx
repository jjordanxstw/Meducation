/**
 * Sections List Page
 * Migrated from src/app/sections/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import type { Section, Subject } from '@medical-portal/shared';

const SectionsList = () => {
  const t = useTranslate();
  const { tableProps } = useTable<Section>({
    syncWithLocation: true,
  });

  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const subjects = subjectsData?.data || [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="subject_id"
          title={t('pages.sections.fields.subject', {}, 'Subject')}
          ellipsis
          render={(value) => {
            const subject = subjectMap.get(value);
            return subject ? `${subject.code} - ${subject.name}` : value;
          }}
        />
        <Table.Column dataIndex="name" title={t('pages.sections.fields.name', {}, 'Section Name')} ellipsis />
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
          width={120}
          render={(_, record: Section) => (
            <Space size="small">
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default SectionsList;
