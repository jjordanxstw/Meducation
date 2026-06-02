'use client';

/**
 * Hot News Section — featured hero + "Latest News" grid for the home dashboard.
 * Editorial, image-led cards in the brand light theme. Data is admin-managed via
 * the news API; each article carries a joined category (name + color).
 */

import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import { formatDateShort, type News } from '@medical-portal/shared';
import { useHotNews } from '@/hooks/use-hot-news';
import { readingTime } from '@/lib/reading-time';

const FALLBACK_COLOR = '#2f80ed';

/** Colored category tag + author·date·read-time meta line. */
function ArticleMeta({ article, className = '' }: { article: News; className?: string }) {
  const color = article.category?.color || FALLBACK_COLOR;
  const byline = [article.author_name, formatDateShort(article.published_at)].filter(Boolean).join(' · ');
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {article.category && (
        <span className="font-semibold uppercase tracking-wide" style={{ color }}>
          {article.category.name}
        </span>
      )}
      {article.category && <span className="text-slate-300">·</span>}
      <span className="text-slate-400">{byline || `${readingTime(article.body)} min read`}</span>
    </div>
  );
}

function CoverImage({ article, className }: { article: News; className?: string }) {
  return article.cover_image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={article.cover_image_url}
      alt={article.title}
      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${className ?? ''}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-brand-subtle text-brand/30">
      <Newspaper className="h-10 w-10" />
    </div>
  );
}

/** Large hero card — image on the left, story on the right. */
function FeaturedCard({ article }: { article: News }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className="group grid overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft md:grid-cols-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full">
        <CoverImage article={article} />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <ArticleMeta article={article} />
        <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
          {article.title}
        </h3>
        {article.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{article.summary}</p>
        )}
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          Read story
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Compact card for the "Latest News" grid. */
function NewsCard({ article }: { article: News }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverImage article={article} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <ArticleMeta article={article} />
        <h4 className="line-clamp-2 font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand">
          {article.title}
        </h4>
        {article.summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{article.summary}</p>
        )}
        <span className="mt-auto pt-1 text-xs text-slate-400">{readingTime(article.body)} min read</span>
      </div>
    </Link>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle md:grid-cols-2">
      <div className="aspect-[16/10] animate-pulse bg-slate-100 md:aspect-auto" />
      <div className="space-y-3 p-8">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
      <div className="aspect-[16/10] animate-pulse bg-slate-100" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function HotNewsSection() {
  const { data: articles = [], isLoading } = useHotNews();

  if (isLoading) {
    return (
      <section className="space-y-6">
        <header>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Hot News</h2>
          <p className="mt-0.5 text-sm text-slate-500">The latest from across the school</p>
        </header>
        <FeaturedSkeleton />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="space-y-6">
        <header>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Hot News</h2>
          <p className="mt-0.5 text-sm text-slate-500">The latest from across the school</p>
        </header>
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <Newspaper className="h-12 w-12 text-brand/35" />
          <h3 className="text-lg font-semibold text-slate-900">No news yet</h3>
          <p className="text-sm text-slate-500">Check back soon for the latest updates.</p>
        </div>
      </section>
    );
  }

  // Featured = the flagged article, else the most recent.
  const featured = articles.find((a) => a.is_featured) ?? articles[0];
  const rest = articles.filter((a) => a.id !== featured.id).slice(0, 8);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Hot News</h2>
        <p className="mt-0.5 text-sm text-slate-500">The latest from across the school</p>
      </header>

      <FeaturedCard article={featured} />

      {rest.length > 0 && (
        <>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Latest News</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
