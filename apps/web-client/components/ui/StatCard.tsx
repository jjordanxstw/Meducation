'use client';

import { Card, CardBody } from '@nextui-org/react';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <Card className={`glass-surface transition-smooth-hover hover:card-flat-hover ${className}`}>
      <CardBody className="gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm text-[var(--ink-2)]">{label}</p>
            <p className="truncate text-xl font-bold text-[var(--ink-1)] sm:text-2xl">{value}</p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className={trend.isPositive ? 'text-success' : 'text-danger'}>
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
            <span className="text-[var(--ink-2)]">vs last period</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
