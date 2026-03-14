import { Typography } from 'antd';
import { useTranslate } from '@refinedev/core';

export const AppLayoutTitle = () => {
  const t = useTranslate();

  return (
    <Typography.Text strong style={{ fontFamily: 'Kanit, sans-serif', fontSize: 20 }}>
      {t('app.projectName', {}, 'Medical Admin')}
    </Typography.Text>
  );
};
