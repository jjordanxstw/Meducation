import { useEffect, useState } from 'react';
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
 * Normalize loose user input to a valid `HH:mm`, or return null if it can't be
 * read as a time. Accepts `9`, `9:5`, `930`, `0930`, `09:30`, etc.
 */
function normalizeTime(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  let h: number;
  let m: number;
  if (trimmed.includes(':')) {
    const [hp, mp = ''] = trimmed.split(':');
    h = Number(hp);
    m = Number(mp || '0');
  } else if (digits.length <= 2) {
    h = Number(digits);
    m = 0;
  } else {
    // last two digits are minutes, the rest is the hour
    h = Number(digits.slice(0, digits.length - 2));
    m = Number(digits.slice(-2));
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * App-styled time picker — a typeable `HH:mm` field with a Popover of quick-pick
 * slots, matching the DatePicker so the form avoids the browser-native `<input
 * type="time">`. Typing allows any minute; the dropdown offers common slots.
 * Value is an `HH:mm` string; clearing yields '' (= all-day).
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
  // Local draft so the user can type freely; committed on blur/Enter.
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    setDraft(selected);
  }, [selected]);

  const commitDraft = () => {
    const normalized = normalizeTime(draft);
    if (normalized === null) {
      setDraft(selected); // invalid — revert to last good value
      return;
    }
    setDraft(normalized);
    if (normalized !== selected) onChange(normalized);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'flex h-10 w-full items-center gap-1 rounded-lg border border-slate-200 bg-white pl-3 pr-1 text-sm shadow-subtle transition-colors focus-within:border-slate-300 aria-[invalid=true]:border-red-400',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        aria-invalid={ariaInvalid}
      >
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraft();
            }
          }}
          className="h-full w-full min-w-0 bg-transparent placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Pick a time"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
          >
            <Clock className="size-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[140px] p-1.5" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setDraft(opt);
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
              setDraft('');
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
