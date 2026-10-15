import type * as React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  hidden: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  brand: 'bg-brand-subtle text-brand-hover ring-brand/15',
  neutral: 'bg-slate-100 text-ink-2 ring-slate-500/10',
  danger: 'bg-red-50 text-red-700 ring-red-600/15',
} as const;

export type StatusTone = keyof typeof TONES;

/** Small rounded status label (Live / Hidden / New / Draft …). */
export function StatusPill({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
