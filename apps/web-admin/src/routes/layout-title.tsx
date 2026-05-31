import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

type LayoutTitleProps = {
  collapsed?: boolean;
};

export const AppLayoutTitle = ({ collapsed }: LayoutTitleProps) => {
  const toggleSider = () => {
    const trigger = document.querySelector<HTMLElement>(
      '.ant-layout-sider-zero-width-trigger, .ant-layout-sider-trigger',
    );
    if (trigger) {
      trigger.click();
    }
  };

  // Light arrow tint to stay legible against the navy sidebar.
  const arrowStyle = { color: 'rgba(255, 255, 255, 0.85)' };

  // Collapsed: show only the toggle arrow so it stays reachable inside the sidebar.
  if (collapsed) {
    return (
      <Button
        type="text"
        icon={<RightOutlined />}
        onClick={toggleSider}
        aria-label="Expand"
        style={arrowStyle}
      />
    );
  }

  return (
    <Space size={8} align="center">
      <Typography.Text
        strong
        style={{
          fontFamily: "'Noto Sans', sans-serif",
          fontSize: 16,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        Meducation Admin
      </Typography.Text>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={toggleSider}
        aria-label="Collapse"
        className="admin-sider-collapse"
        style={arrowStyle}
      />
    </Space>
  );
};
