'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-lg font-semibold text-[var(--ink-1)] sm:text-xl">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--ink-2)] sm:text-base">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full items-center justify-start sm:w-auto sm:justify-end sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
