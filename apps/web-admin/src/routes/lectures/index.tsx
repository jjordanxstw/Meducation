/**
 * Lectures List Page
 * Migrated from src/app/lectures/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import type { Lecture, Section } from '@medical-portal/shared';

const LecturesList = () => {
  const t = useTranslate();
  const { tableProps } = useTable<Lecture>({
    syncWithLocation: true,
  });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });

  const sections = sectionsData?.data || [];
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="section_id"
          title={t('pages.lectures.fields.section', {}, 'Section')}
          ellipsis
          render={(value) => sectionMap.get(value)?.name || value}
        />
        <Table.Column dataIndex="title" title={t('pages.lectures.fields.title', {}, 'Lecture Title')} ellipsis />
        <Table.Column
          dataIndex="lecture_date"
          title={t('pages.lectures.fields.lectureDate', {}, 'Lecture Date')}
          width={120}
          render={(value) => value ? dayjs(value).format('DD/MM/YYYY') : t('common.notAvailable', {}, '-')}
        />
        <Table.Column dataIndex="lecturer_name" title={t('pages.lectures.fields.lecturerName', {}, 'Lecturer')} ellipsis />
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
          render={(_, record: Lecture) => (
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

export default LecturesList;
