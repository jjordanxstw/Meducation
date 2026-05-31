'use client';

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { FiChevronDown } from 'react-icons/fi';

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
    <Dropdown placement="bottom-start" className={className}>
      <DropdownTrigger>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-4 pr-3 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span>{selectedOption?.label ?? value}</span>
          <FiChevronDown size={14} className="text-slate-400" />
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={ariaLabel}
        variant="flat"
        selectionMode="single"
        selectedKeys={new Set([String(value)])}
        onAction={(key) => onChange(String(key))}
        className="max-h-72 overflow-y-auto"
      >
        {options.map((option) => (
          <DropdownItem key={String(option.value)}>{option.label}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
