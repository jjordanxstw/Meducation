/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        brand: 'border-brand/20 bg-brand-subtle text-brand',
        neutral: 'border-slate-200 bg-slate-50 text-slate-600',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border-red-200 bg-red-50 text-red-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700',
        outline: 'border-slate-200 bg-transparent text-slate-600',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
