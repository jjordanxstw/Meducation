import { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  /** Selected date as a `YYYY-MM-DD` string (empty = none). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Inclusive bounds as `YYYY-MM-DD`; days outside are not selectable. */
  min?: string;
  max?: string;
  className?: string;
  'aria-invalid'?: boolean;
}

/**
 * App-styled single-date picker — replaces the browser-native `<input
 * type="date">` whose dropdown calendar can't be themed. Built on the in-repo
 * Popover + a Tailwind month grid, value is a `YYYY-MM-DD` string.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  min,
  max,
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const selected = value ? dayjs(value) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (selected ?? dayjs()).startOf('month'));

  const minDate = min ? dayjs(min) : null;
  const maxDate = max ? dayjs(max) : null;
  const isOutOfRange = (day: dayjs.Dayjs) =>
    (minDate ? day.isBefore(minDate, 'day') : false) || (maxDate ? day.isAfter(maxDate, 'day') : false);

  const gridStart = view.startOf('month').startOf('week');
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));

  const commit = (day: dayjs.Dayjs) => {
    onChange(day.format('YYYY-MM-DD'));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView((selected ?? dayjs()).startOf('month'));
      }}
    >
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
          <span>{selected ? selected.format('DD/MM/YYYY') : placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3" align="start">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setView((v) => v.subtract(1, 'month'))}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900">{view.format('MMMM YYYY')}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setView((v) => v.add(1, 'month'))}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-medium text-slate-400">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = day.month() === view.month();
            const isSelected = selected ? day.isSame(selected, 'day') : false;
            const isToday = day.isSame(dayjs(), 'day');
            const outOfRange = isOutOfRange(day);
            return (
              <button
                key={day.format('YYYY-MM-DD')}
                type="button"
                disabled={outOfRange}
                onClick={() => commit(day)}
                className={cn(
                  'flex h-8 items-center justify-center rounded-md text-sm transition-colors',
                  isSelected
                    ? 'bg-brand font-semibold text-white'
                    : outOfRange
                      ? 'cursor-not-allowed text-slate-300'
                      : inMonth
                        ? 'text-slate-700 hover:bg-brand-subtle'
                        : 'text-slate-300 hover:bg-slate-50',
                  !isSelected && !outOfRange && isToday && 'font-semibold text-brand',
                )}
              >
                {day.date()}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="text-xs text-slate-500 transition-colors hover:text-red-500"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const today = dayjs();
              if (isOutOfRange(today)) return;
              commit(today);
            }}
            className="text-xs font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
