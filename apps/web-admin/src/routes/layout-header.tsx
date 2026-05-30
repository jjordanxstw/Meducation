import { Layout, Typography, Avatar, theme } from 'antd';
import { useGetIdentity } from '@refinedev/core';

type AdminIdentity = {
  name?: string;
  avatar?: string;
};

export const AppLayoutHeader = () => {
  const { token } = theme.useToken();
  const { data: user } = useGetIdentity<AdminIdentity>();

  if (!user?.name && !user?.avatar) {
    return null;
  }

  const initial = user?.name?.slice(0, 1).toUpperCase() ?? 'A';

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
      {user?.name && <Typography.Text strong>{user.name}</Typography.Text>}
      {user?.avatar ? (
        <Avatar src={user.avatar} alt={user?.name} />
      ) : (
        <Avatar style={{ backgroundColor: token.colorPrimary }}>{initial}</Avatar>
      )}
    </Layout.Header>
  );
};
