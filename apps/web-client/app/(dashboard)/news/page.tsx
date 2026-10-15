'use client';

/**
 * News — every published article, newest first, filterable by category.
 */

import { useMemo, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/states/EmptyState';
import { FeaturedNewsCard, NewsCard, NewsCardSkeleton } from '@/components/news/NewsCards';
import { useHotNews } from '@/hooks/use-hot-news';
import { cn } from '@/lib/utils';

export default function NewsPage() {
  const { data: articles = [], isLoading, isError, refetch } = useHotNews(60);
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>();
    for (const article of articles) {
      if (article.category) seen.set(article.category.id, article.category);
    }
    return [...seen.values()];
  }, [articles]);

  const visible = category === 'all' ? articles : articles.filter((article) => article.category?.id === category);
  const [lead, ...rest] = visible;

  return (
    <PageTransition className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-1">News</h1>
          <p className="text-sm text-ink-3 sm:text-base">Faculty updates, events and student life</p>
        </div>
        {categories.length > 1 ? (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0" role="group" aria-label="Filter by category">
            {[{ id: 'all', name: 'All', color: '' }, ...categories].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                  category === item.id ? 'border-ink-1 bg-ink-1 text-white' : 'border-slate-200 bg-white text-ink-2 hover:border-slate-300',
                )}
              >
                {item.color ? <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden /> : null}
                {item.name}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <div className="space-y-5">
          <NewsCardSkeleton variant="featured" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          tone="error"
          title="Couldn’t load news"
          description="Check your connection and try again."
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : !lead ? (
        <EmptyState icon={Newspaper} title="No news here yet" description="New articles appear as soon as they are published." />
      ) : (
        <div className="space-y-5">
          <FeaturedNewsCard article={lead} />
          {rest.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </PageTransition>
  );
}
