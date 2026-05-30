import { LeftOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

type LayoutTitleProps = {
  collapsed?: boolean;
};

export const AppLayoutTitle = ({ collapsed }: LayoutTitleProps) => {
  const logoSize = collapsed ? 40 : 28;
  const initialsRadius = collapsed ? 10 : 8;
  const initialsFontSize = collapsed ? 14 : 12;

  const toggleSider = () => {
    const trigger = document.querySelector<HTMLElement>(
      '.ant-layout-sider-zero-width-trigger, .ant-layout-sider-trigger',
    );
    if (trigger) {
      trigger.click();
    }
  };

  const expandFromCollapsed = () => {
    if (collapsed) {
      toggleSider();
    }
  };

  return (
    <Space size={10} align="center">
      <button
        type="button"
        onClick={expandFromCollapsed}
        style={{
          width: logoSize,
          height: logoSize,
          borderRadius: initialsRadius,
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: initialsFontSize,
          background: 'linear-gradient(135deg, #2f80ed, #1b66cc)',
          padding: 0,
          cursor: collapsed ? 'pointer' : 'default',
        }}
        aria-label={collapsed ? 'Expand' : 'Meducation Admin'}
      >
        M
      </button>
      {!collapsed && (
        <Space size={8} align="center">
          <Typography.Text
            strong
            style={{
              fontFamily: "'Noto Sans', sans-serif",
              fontSize: 16,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--ink-1)',
              whiteSpace: 'nowrap',
            }}
          >
            Meducation Admin
          </Typography.Text>
          <Button type="text" icon={<LeftOutlined />} onClick={toggleSider} aria-label="Collapse" />
        </Space>
      )}
    </Space>
  );
};
