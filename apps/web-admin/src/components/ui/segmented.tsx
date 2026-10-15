import { cn } from '@/lib/utils';

type Option<T extends string> = { label: React.ReactNode; value: T; title?: string };

/**
 * Segmented control. `variant="tiles"` renders separate equal-width tiles
 * (the New subject year picker); the default is a compact pill group.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  variant = 'pill',
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<Option<T>>;
  variant?: 'pill' | 'tiles';
  className?: string;
  'aria-label'?: string;
}) {
  if (variant === 'tiles') {
    return (
      <div role="radiogroup" aria-label={ariaLabel} className={cn('grid auto-cols-fr grid-flow-col gap-2', className)}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.title}
              onClick={() => onChange(option.value)}
              className={cn(
                'h-9 rounded-lg border text-sm font-medium transition-colors',
                active
                  ? 'border-brand bg-brand-subtle text-brand-hover'
                  : 'border-slate-200 bg-white text-ink-2 hover:border-slate-300 hover:text-ink-1',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              active ? 'bg-white text-ink-1 shadow-subtle' : 'text-ink-3 hover:text-ink-1',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
