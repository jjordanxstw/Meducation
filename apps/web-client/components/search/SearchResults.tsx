'use client';

import Link from 'next/link';
import { CornerDownLeft, Layers, Newspaper, Play, SearchX, User, type LucideIcon } from 'lucide-react';
import { HighlightText } from '@/components/ui/HighlightText';
import { cn } from '@/lib/utils';
import { SEARCH_KIND_ORDER, type SearchHit, type SearchKind, type SearchScope } from '@/hooks/use-search-index';

const KIND_META: Record<SearchKind, { label: string; icon: LucideIcon }> = {
  lecture: { label: 'Lectures', icon: Play },
  lecturer: { label: 'Lecturers', icon: User },
  subject: { label: 'Subjects', icon: Layers },
  news: { label: 'News', icon: Newspaper },
};

export const SCOPES: Array<{ key: SearchScope; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'lecture', label: 'Lectures' },
  { key: 'subject', label: 'Subjects' },
  { key: 'lecturer', label: 'Lecturers' },
];

/** Scope chips with counts + the "My year only" toggle (Brilliant: Search palette). */
export function SearchScopes({
  scope,
  onScope,
  counts,
  year,
  yearOnly,
  onYearOnly,
}: {
  scope: SearchScope;
  onScope: (scope: SearchScope) => void;
  counts: Record<'lecture' | 'subject' | 'lecturer', number>;
  year: number | null;
  yearOnly: boolean;
  onYearOnly: (value: boolean) => void;
}) {
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors',
      active ? 'border-ink-1 bg-ink-1 text-white' : 'border-slate-200 bg-white text-ink-2 hover:border-slate-300',
    );
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" role="group" aria-label="Search scope">
      {SCOPES.map((option) => (
        <button key={option.key} type="button" aria-pressed={scope === option.key} onClick={() => onScope(option.key)} className={chip(scope === option.key)}>
          {option.label}
          {option.key !== 'all' ? <span className="tabular opacity-70">{counts[option.key]}</span> : null}
        </button>
      ))}
      {year ? (
        <button type="button" aria-pressed={yearOnly} onClick={() => onYearOnly(!yearOnly)} className={chip(yearOnly)}>
          My year only
        </button>
      ) : null}
    </div>
  );
}

/**
 * Grouped search results, shared by the ⌘K palette and the /search page.
 * `activeIndex` is the keyboard-highlighted row in flat (rendered) order.
 */
export function SearchResults({
  query,
  hits,
  isLoading,
  activeIndex = -1,
  onNavigate,
  onHover,
}: {
  query: string;
  hits: SearchHit[];
  isLoading: boolean;
  activeIndex?: number;
  onNavigate?: () => void;
  onHover?: (index: number) => void;
}) {
  if (query.trim().length < 2) {
    return (
      <p className="px-4 py-8 text-center text-sm text-ink-3">
        Type at least two letters to search lectures, lecturers and subjects.
      </p>
    );
  }

  if (isLoading && hits.length === 0) {
    return (
      <div className="space-y-2 p-3" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <SearchX className="h-10 w-10 text-brand/35" aria-hidden />
        <p className="text-sm font-semibold text-ink-1">No results for “{query.trim()}”</p>
        <p className="text-sm text-ink-3">Try a subject code like “MDCV”, a topic, or a lecturer’s name.</p>
      </div>
    );
  }

  // Flat (rendered) index of each hit, for keyboard highlighting.
  const groups = SEARCH_KIND_ORDER.map((kind) => hits.filter((hit) => hit.kind === kind));
  const offsets = groups.map((_, i) => groups.slice(0, i).reduce((sum, group) => sum + group.length, 0));

  return (
    <div role="listbox" aria-label="Search results" className="p-2">
      {SEARCH_KIND_ORDER.map((kind, groupIndex) => {
        const group = groups[groupIndex];
        if (group.length === 0) return null;
        const { label, icon: Icon } = KIND_META[kind];
        return (
          <div key={kind} className="py-1">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</p>
            {group.map((hit, hitIndex) => {
              const index = offsets[groupIndex] + hitIndex;
              const active = index === activeIndex;
              return (
                <Link
                  key={`${hit.kind}-${hit.id}`}
                  href={hit.href}
                  role="option"
                  aria-selected={active}
                  data-search-index={index}
                  onClick={onNavigate}
                  onMouseEnter={() => onHover?.(index)}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2 outline-none transition-colors', active ? 'bg-brand-subtle' : 'hover:bg-slate-50')}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      kind === 'lecture' ? (active ? 'bg-white text-brand' : 'bg-slate-100 text-ink-1') : 'bg-slate-100 text-ink-3',
                      kind === 'lecturer' && 'rounded-full',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', kind === 'lecture' && 'fill-current')} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-1">
                      <HighlightText text={hit.title} query={query} />
                    </span>
                    <span className="block truncate text-xs text-ink-3">{hit.subtitle}</span>
                  </span>
                  {active ? <CornerDownLeft className="h-4 w-4 shrink-0 text-brand" aria-hidden /> : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
