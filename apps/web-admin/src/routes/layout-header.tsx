import { Layout, Typography, theme } from 'antd';
import { useGetIdentity } from '@refinedev/core';

type AdminIdentity = {
  name?: string;
  avatar?: string;
};

export const AppLayoutHeader = () => {
  const { token } = theme.useToken();
  const { data: user } = useGetIdentity<AdminIdentity>();

  if (!user?.name) {
    return null;
  }

  return (
    <Layout.Header
      style={{
        backgroundColor: token.colorBgElevated,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        padding: '0 24px',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Typography.Text strong>{user.name}</Typography.Text>
    </Layout.Header>
  );
};
