import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AdminEmptyStateProps {
  /** An icon element, e.g. <Database className="size-12" />. */
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
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="text-brand opacity-35 [&_svg]:size-12">{icon}</span>
      <span className="font-semibold text-slate-900">{title}</span>
      {subtitle ? <span className="text-sm text-slate-400">{subtitle}</span> : null}
      {action ? (
        <Button className="mt-2" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export default AdminEmptyState;
