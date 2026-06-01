'use client';

import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type PillDropdownOption = {
  value: string | number;
  label: string;
};

type PillDropdownProps = {
  value: string | number;
  options: PillDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function PillDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: PillDropdownProps) {
  const selectedOption = options.find((option) => String(option.value) === String(value));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'flex items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-4 pr-3 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
            className,
          )}
        >
          <span>{selectedOption?.label ?? value}</span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto" aria-label={ariaLabel}>
        {options.map((option) => {
          const isSelected = String(option.value) === String(value);
          return (
            <DropdownMenuItem
              key={String(option.value)}
              onSelect={() => onChange(String(option.value))}
              className={cn('justify-between', isSelected && 'bg-brand-subtle text-brand')}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
