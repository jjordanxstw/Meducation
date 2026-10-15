import Link from 'next/link';
import { AlertCircle, Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Action = { label: string; onClick?: () => void; href?: string };

/**
 * One designed empty / error state for every list and page (CLAUDE.md):
 * 48px icon at ~35% opacity, a friendly heading, helpful subtext and an
 * optional subtle bordered CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  code,
  tone = 'neutral',
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: Action;
  /** A second, quieter action (e.g. "Report" next to "Try again"). */
  secondaryAction?: Action;
  /** Quotable request code for errors, e.g. "REQ-7f3a2". */
  code?: string | null;
  tone?: 'neutral' | 'error';
  className?: string;
  compact?: boolean;
}) {
  const Icon = icon ?? (tone === 'error' ? AlertCircle : Inbox);
  const actionClass =
    'inline-flex h-10 items-center justify-center rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-2 shadow-subtle transition-colors hover:border-slate-300 hover:text-ink-1';
  const primaryClass =
    'inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover';
  const renderAction = (item: Action, className: string) =>
    item.href ? (
      <Link href={item.href} className={className}>
        {item.label}
      </Link>
    ) : (
      <button type="button" onClick={item.onClick} className={className}>
        {item.label}
      </button>
    );

  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-6 text-center shadow-subtle',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      <Icon
        className={cn('mb-1 h-12 w-12', tone === 'error' ? 'text-red-500/40' : 'text-brand/35')}
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-ink-1">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-ink-3">
          {description}
          {code ? ` If it keeps happening, report it with code ${code}.` : ''}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {action ? renderAction(action, tone === 'error' ? primaryClass : actionClass) : null}
          {secondaryAction ? renderAction(secondaryAction, actionClass) : null}
        </div>
      ) : null}
    </div>
  );
}
