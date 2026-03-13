'use client';

/**
 * Subjects Show Page
 */

import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { useParams } from 'next/navigation';
import { Typography, Descriptions, Tag } from 'antd';
import type { Subject } from '@medical-portal/shared';

const { Title } = Typography;

export default function SubjectShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result } = useShow<Subject>({ id });
  const record = result;

  return (
    <Show isLoading={!record}>
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
}
