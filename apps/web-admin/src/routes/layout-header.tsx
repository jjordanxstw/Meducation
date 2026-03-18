import { Layout, Typography, Avatar, Segmented, Space, theme } from 'antd';
import { useGetIdentity, useTranslation } from '@refinedev/core';

type AdminIdentity = {
  name?: string;
  avatar?: string;
};

export const AppLayoutHeader = () => {
  const { token } = theme.useToken();
  const { data: user } = useGetIdentity<AdminIdentity>();
  const { getLocale, changeLocale, translate } = useTranslation();

  const currentLocale = getLocale() || 'th';

  if (!user?.name && !user?.avatar) {
    return null;
  }

  return (
    <Layout.Header
      style={{
        backgroundColor: token.colorBgElevated,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 24px',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 0 rgba(15, 23, 42, 0.08)',
      }}
    >
      <Space size="middle">
        {user?.name && <Typography.Text strong>{user.name}</Typography.Text>}
        <Segmented
          size="small"
          value={currentLocale}
          options={[
            { label: translate('languages.th', undefined, 'TH'), value: 'th' },
            { label: translate('languages.en', undefined, 'EN'), value: 'en' },
          ]}
          onChange={(value) => {
            void changeLocale(String(value));
          }}
        />
        {user?.avatar && <Avatar src={user.avatar} alt={user?.name} />}
      </Space>
    </Layout.Header>
  );
};
