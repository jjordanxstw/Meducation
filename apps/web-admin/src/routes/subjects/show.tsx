/**
 * Subjects Show Page
 * Migrated from src/app/subjects/[id]/page.tsx
 */

import { useShow } from '@refinedev/core';
import { useTranslate } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Typography, Descriptions, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { Title } = Typography;

const SubjectsShow = () => {
  const t = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Subject>({ id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} recordItemId={id}>
      <Title level={5} style={{ fontFamily: 'Kanit', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}>
        {t('pages.subjects.detailTitle', {}, 'Subject Details')}
      </Title>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label={t('pages.subjects.fields.code', {}, 'Subject Code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={t('pages.subjects.fields.name', {}, 'Subject Name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={t('pages.subjects.fields.yearLevel', {}, 'Year Level')}>{t('common.yearPrefix', {}, 'Year')} {record?.year_level}</Descriptions.Item>
        <Descriptions.Item label={t('pages.subjects.fields.description', {}, 'Description')}>{record?.description || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.order', {}, 'Order')}>{record?.order_index}</Descriptions.Item>
        <Descriptions.Item label={t('common.status', {}, 'Status')}>
          <Tag color={record?.is_active ? 'green' : 'red'}>
            {record?.is_active ? t('common.active', {}, 'Active') : t('common.inactive', {}, 'Inactive')}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default SubjectsShow;
