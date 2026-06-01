import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (e.g. a Create button). */
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page title block — replaces Ant Design / Refine List/Create/Edit headers. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
