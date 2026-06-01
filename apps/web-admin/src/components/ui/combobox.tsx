import { useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Allow clearing the current selection by re-selecting it. */
  allowClear?: boolean;
  'aria-invalid'?: boolean;
}

/** Searchable single-select — replaces Ant Design's <Select showSearch>. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  disabled = false,
  loading = false,
  className,
  allowClear = true,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-subtle transition-colors focus:outline-none focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-400',
            !selected && 'text-slate-400',
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <CommandPrimitive className="overflow-hidden rounded-xl" loop>
          <div className="flex items-center gap-2 border-b border-slate-100 px-3" cmdk-input-wrapper="">
            <Search className="size-4 shrink-0 text-slate-400" />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1.5">
            {loading ? (
              <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
            ) : (
              <>
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-slate-400">
                  {emptyText}
                </CommandPrimitive.Empty>
                {options.map((option) => (
                  <CommandPrimitive.Item
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(allowClear && option.value === value ? undefined : option.value);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    <span className="line-clamp-1">{option.label}</span>
                    {option.value === value && <Check className="size-4 shrink-0 text-brand" />}
                  </CommandPrimitive.Item>
                ))}
              </>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
