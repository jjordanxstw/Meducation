'use client';

/**
 * Search — the mobile entry point (bottom nav). Desktop uses the ⌘K palette,
 * which renders the same results.
 */

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/PageTransition';
import { SearchResults, SearchScopes } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearch, type SearchScope } from '@/hooks/use-search-index';
import { useStudyYear } from '@/lib/study-year';

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const debounced = useDebounce(query, 150);
  const { year } = useStudyYear();
  const [scope, setScope] = useState<SearchScope>('all');
  const [yearOnly, setYearOnly] = useState(false);
  const { hits, counts, isLoading } = useSearch(debounced, { scope, yearOnly: yearOnly ? year : null });

  // Keep ?q= in sync so back/forward and shared links restore the search.
  useEffect(() => {
    const next = debounced.trim();
    if ((params.get('q') ?? '') === next) return;
    router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname, { scroll: false });
  }, [debounced, params, pathname, router]);

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-1">Search</h1>
      <Input
        autoFocus
        type="search"
        aria-label="Search lectures, subjects and news"
        placeholder="Lectures, subjects, lecturers…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        startContent={<Search className="h-4 w-4" />}
        endContent={
          query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
        wrapperClassName="h-12 text-base"
      />
      <SearchScopes scope={scope} onScope={setScope} counts={counts} year={year} yearOnly={yearOnly} onYearOnly={setYearOnly} />
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
        <SearchResults query={debounced} hits={hits} isLoading={isLoading} />
      </div>
    </PageTransition>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
