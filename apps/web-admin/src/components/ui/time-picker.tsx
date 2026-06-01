import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  /** Selected time as `HH:mm` (empty = none / all-day). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Increment of the suggestion list in minutes (default 15). */
  stepMinutes?: number;
  className?: string;
  'aria-invalid'?: boolean;
}

function buildOptions(step: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return out;
}

/**
 * App-styled time picker — a Popover with a scrollable list of `HH:mm` slots,
 * matching the DatePicker so the form avoids the browser-native `<input
 * type="time">`. Value is an `HH:mm` string; clearing yields '' (= all-day).
 */
export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  stepMinutes = 15,
  className,
  'aria-invalid': ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const options = buildOptions(stepMinutes);
  const selected = value ? value.slice(0, 5) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-subtle transition-colors focus:outline-none focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-400',
            !selected && 'text-slate-400',
            className,
          )}
        >
          <span>{selected || placeholder}</span>
          <Clock className="size-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[140px] p-1.5" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center rounded-md px-2.5 py-1.5 text-sm transition-colors',
                opt === selected ? 'bg-brand font-semibold text-white' : 'text-slate-700 hover:bg-brand-subtle',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-end border-t border-slate-100 pt-1.5">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="px-1.5 text-xs text-slate-500 transition-colors hover:text-red-500"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
