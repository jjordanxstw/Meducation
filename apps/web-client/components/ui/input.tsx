'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading adornment (e.g. a search icon). */
  startContent?: React.ReactNode;
  /** Optional trailing adornment. */
  endContent?: React.ReactNode;
  /** Wrapper className when start/end content is present. */
  wrapperClassName?: string;
}

const baseField =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-subtle transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60';

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, startContent, endContent, wrapperClassName, ...props }, ref) => {
    if (startContent || endContent) {
      return (
        <div
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-subtle transition-colors focus-within:border-slate-300',
            wrapperClassName,
          )}
        >
          {startContent ? (
            <span className="flex shrink-0 items-center text-slate-400">{startContent}</span>
          ) : null}
          <input
            ref={ref}
            className={cn(
              'h-full w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60',
              className,
            )}
            {...props}
          />
          {endContent ? (
            <span className="flex shrink-0 items-center text-slate-400">{endContent}</span>
          ) : null}
        </div>
      );
    }

    return <input ref={ref} className={cn(baseField, className)} {...props} />;
  },
);
Input.displayName = 'Input';

export { Input };
