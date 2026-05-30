/**
 * Subjects Show Page
 */
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { useParams } from 'react-router-dom';
import { Typography, Descriptions, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { Title } = Typography;

const SubjectsShow = () => {
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Subject>({ id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} recordItemId={id}>
      <Title level={5} style={{ fontFamily: "'Noto Sans', sans-serif", fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}>
        Subject Details
      </Title>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label="Subject Code">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="Subject Name">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Year Level">Year {record?.year_level}</Descriptions.Item>
        <Descriptions.Item label="Description">{record?.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="Order">{record?.order_index}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={record?.is_active ? 'green' : 'red'}>
            {record?.is_active ? 'Active' : 'Inactive'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default SubjectsShow;
