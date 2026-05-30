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
 * "no data" experience.
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
      <span style={{ fontSize: 48, color: 'var(--brand)', opacity: 0.35, lineHeight: 1 }}>
        {icon}
      </span>
      <span style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{title}</span>
      {subtitle ? <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{subtitle}</span> : null}
      {action ? (
        <Button type="primary" onClick={action.onClick} style={{ marginTop: 8 }}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export default AdminEmptyState;
