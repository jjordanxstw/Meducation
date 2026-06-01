import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-subtle transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-400';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, startContent, endContent, wrapperClassName, ...props }, ref) => {
    if (startContent || endContent) {
      return (
        <div
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-subtle transition-colors focus-within:border-slate-300',
            wrapperClassName,
          )}
        >
          {startContent ? <span className="flex shrink-0 items-center text-slate-400">{startContent}</span> : null}
          <input
            ref={ref}
            className={cn(
              'h-full w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60',
              className,
            )}
            {...props}
          />
          {endContent ? <span className="flex shrink-0 items-center text-slate-400">{endContent}</span> : null}
        </div>
      );
    }
    return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
  },
);
Input.displayName = 'Input';

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-subtle transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-400',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
