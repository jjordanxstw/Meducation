'use client';

/**
 * ⌘K / Ctrl+K search palette (Brilliant: Student Desktop / Search). Scope
 * chips with counts, "My year only", ↑↓ to move, Enter to open, Tab to switch
 * scope. Mobile uses the /search page, which renders the same results.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { SCOPES, SearchResults, SearchScopes } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearch, type SearchScope } from '@/hooks/use-search-index';
import { useStudyYear } from '@/lib/study-year';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { year } = useStudyYear();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [yearOnly, setYearOnly] = useState(false);
  const debounced = useDebounce(query, 120);
  const { hits, counts, isLoading } = useSearch(debounced, { enabled: open, scope, yearOnly: yearOnly ? year : null });

  // The highlight belongs to one result list; a new query or scope starts at the top.
  const listKey = `${debounced}|${scope}|${yearOnly}`;
  const [highlight, setHighlight] = useState({ key: '', index: 0 });
  const activeIndex = highlight.key === listKey ? highlight.index : 0;
  const setActiveIndex = useCallback(
    (update: number | ((current: number) => number)) =>
      setHighlight((current) => {
        const base = current.key === listKey ? current.index : 0;
        return { key: listKey, index: typeof update === 'function' ? update(base) : update };
      }),
    [listKey],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const order = SCOPES.map((option) => option.key);
        const step = event.shiftKey ? -1 : 1;
        setScope((current) => order[(order.indexOf(current) + step + order.length) % order.length]);
        return;
      }
      if (hits.length === 0) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((current) => {
          const next = (current + delta + hits.length) % hits.length;
          document.querySelector(`[data-search-index="${next}"]`)?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        // useSearch returns hits grouped in rendered order.
        const hit = hits[activeIndex];
        if (hit) {
          onOpenChange(false);
          router.push(hit.href);
        }
      }
    },
    [activeIndex, hits, onOpenChange, router, setActiveIndex],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[72vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search MedPi</DialogPrimitive.Title>
          <div className="flex items-center gap-3 px-4">
            <Search className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search lectures, subjects, lecturers…"
              aria-label="Search"
              className="h-14 w-full bg-transparent text-base text-ink-1 outline-none placeholder:text-ink-3"
            />
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-3 sm:block">Esc</kbd>
          </div>
          <div className="border-b border-slate-200/70 px-4 pb-3">
            <SearchScopes scope={scope} onScope={setScope} counts={counts} year={year} yearOnly={yearOnly} onYearOnly={setYearOnly} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SearchResults
              query={debounced}
              hits={hits}
              isLoading={isLoading}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onNavigate={() => onOpenChange(false)}
            />
          </div>
          <div className="hidden items-center gap-4 border-t border-slate-200/70 bg-slate-50/70 px-4 py-2.5 text-xs text-ink-3 sm:flex">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">↑↓</kbd> Move
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">Enter</kbd> Open
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">Tab</kbd> Switch scope
            </span>
            <span className="ml-auto">Searches titles, lecturers and subjects</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Global ⌘K / Ctrl+K and "/" shortcuts. Ignores "/" while typing in a field. */
export function useCommandPaletteShortcut(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, [contenteditable="true"]');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);
}
