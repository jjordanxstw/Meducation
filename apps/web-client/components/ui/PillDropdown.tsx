'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full text-sm font-medium border transition bg-white border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <span>{selectedOption?.label ?? value}</span>
        <FiChevronDown
          size={14}
          className={`text-brand transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 min-w-[170px] max-h-72 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-2 shadow-[var(--shadow-lg)]"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const isActive = String(option.value) === String(value);
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-brand-subtle text-brand'
                    : 'text-[var(--ink-2)] hover:bg-slate-100 hover:text-[var(--ink-1)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
