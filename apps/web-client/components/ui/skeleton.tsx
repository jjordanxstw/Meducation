import { cn } from '@/lib/utils';

/** Pulsing placeholder used while content loads. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/70', className)}
      {...props}
    />
  );
}

export { Skeleton };
