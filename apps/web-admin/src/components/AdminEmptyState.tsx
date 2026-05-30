import type { ReactNode } from 'react';
import { Button } from 'antd';

interface AdminEmptyStateProps {
  /** An Ant Design icon element, e.g. <DatabaseOutlined />. */
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Centered empty-state used across admin tables (resources, calendar,
 * announcements, profiles, audit logs) for a consistent, intentional
 * "no data" experience on the dark theme.
 */
export function AdminEmptyState({ icon, title, subtitle, action }: AdminEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48, opacity: 0.3, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
        {icon}
      </span>
      <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{title}</span>
      {subtitle ? (
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{subtitle}</span>
      ) : null}
      {action ? (
        <Button type="primary" onClick={action.onClick} style={{ marginTop: 8 }}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export default AdminEmptyState;
