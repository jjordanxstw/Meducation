import { LeftOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { useTranslate } from '@refinedev/core';

const LOGO_PATH = '';

type LayoutTitleProps = {
  collapsed?: boolean;
};

export const AppLayoutTitle = ({ collapsed }: LayoutTitleProps) => {
  const t = useTranslate();

  const toggleSider = () => {
    const triggerButton = document.querySelector<HTMLButtonElement>('.ant-layout-sider-trigger button');
    if (triggerButton) {
      triggerButton.click();
    }
  };

  const expandFromCollapsed = () => {
    if (collapsed) {
      toggleSider();
    }
  };

  return (
    <Space size={10} align="center">
      {LOGO_PATH ? (
        <button
          type="button"
          onClick={expandFromCollapsed}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: collapsed ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={collapsed ? t('buttons.expand', {}, 'Expand') : 'MedPI Logo'}
        >
          <img src={LOGO_PATH} alt="MedPI Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        </button>
      ) : (
        <button
          type="button"
          onClick={expandFromCollapsed}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.55)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 12,
            background: 'transparent',
            padding: 0,
            cursor: collapsed ? 'pointer' : 'default',
          }}
          aria-label={collapsed ? t('buttons.expand', {}, 'Expand') : 'MedPI Logo'}
        >
          M
        </button>
      )}
      {!collapsed && (
        <Space size={8} align="center">
          <Typography.Text
            strong
            style={{
              fontFamily: 'Kanit, sans-serif',
              fontSize: 16,
              lineHeight: 1.1,
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            {t('app.projectName', {}, 'MedPI Admin')}
          </Typography.Text>
          <Button
            type="text"
            className="sider-top-trigger"
            icon={<LeftOutlined />}
            onClick={toggleSider}
            aria-label={t('buttons.collapse', {}, 'Collapse')}
          />
        </Space>
      )}
    </Space>
  );
};
