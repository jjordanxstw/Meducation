'use client';

/**
 * News cards shared by Today (news upfront) and the /news list.
 * Image-led, light surfaces; the category colour is the only accent.
 */

import Link from 'next/link';
import { formatDay } from '@/lib/dates';
import { ArrowRight, Newspaper } from 'lucide-react';
import type { News } from '@medical-portal/shared';
import { readingTime } from '@/lib/reading-time';
import { cn } from '@/lib/utils';

const FALLBACK_COLOR = '#2f80ed';

export function ArticleMeta({ article, className, withReadTime = true }: { article: News; className?: string; withReadTime?: boolean }) {
  const color = article.category?.color || FALLBACK_COLOR;
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 text-[11px]', className)}>
      {article.category ? (
        <>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          <span className="shrink-0 font-semibold uppercase tracking-wider" style={{ color: `color-mix(in srgb, ${color} 80%, black)` }}>
            {article.category.name}
          </span>
          <span className="text-ink-3">·</span>
        </>
      ) : null}
      <span className="truncate text-ink-3 tabular">
        {formatDay(article.published_at)}
        {withReadTime ? ` · ${readingTime(article.body)} min read` : ''}
      </span>
    </div>
  );
}

function Cover({ article, className }: { article: News; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-brand-subtle', className)}>
      {article.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/10 to-brand/5">
          <Newspaper className="h-10 w-10 text-brand/35" aria-hidden />
        </div>
      )}
    </div>
  );
}

/** Large lead story: cover on top (mobile) or left (desktop). */
export function FeaturedNewsCard({ article, className }: { article: News; className?: string }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className={cn(
        'group grid overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-200 hover:border-brand/40 hover:shadow-soft md:grid-cols-[1fr_1fr]',
        className,
      )}
    >
      <div className="relative">
        <Cover article={article} className="aspect-[16/9] h-full !bg-[#1e3a5f] md:aspect-auto md:min-h-[260px]" />
        {article.is_featured ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-brand-hover">Featured</span>
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
        <ArticleMeta article={article} />
        <h3 className="text-xl font-semibold leading-tight tracking-tight text-ink-1 sm:text-[28px]">{article.title}</h3>
        {article.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-ink-2 sm:text-base">{article.summary}</p> : null}
        <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-hover">
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Compact story with a thumbnail on the left — used beside the lead story. */
export function CompactNewsCard({ article }: { article: News }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className="group flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-subtle transition-all duration-200 hover:border-brand/40 hover:shadow-soft"
    >
      <Cover article={article} className="aspect-square w-24 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <ArticleMeta article={article} />
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-1 leading-thai group-hover:text-brand-hover">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

/** Grid card for the /news list and the mobile carousel. */
export function NewsCard({ article, className }: { article: News; className?: string }) {
  return (
    <Link
      href={`/news/${article.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-soft',
        className,
      )}
    >
      <Cover article={article} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <ArticleMeta article={article} withReadTime={false} />
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink-1 group-hover:text-brand-hover">{article.title}</h3>
        {article.summary ? <p className="line-clamp-2 text-sm leading-relaxed text-ink-3">{article.summary}</p> : null}
      </div>
    </Link>
  );
}

export function NewsCardSkeleton({ variant = 'card' }: { variant?: 'card' | 'featured' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-3">
        <div className="aspect-square w-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2 py-2">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/70 bg-white',
        variant === 'featured' && 'grid md:grid-cols-[1.15fr_1fr]',
      )}
    >
      <div className={cn('animate-pulse bg-slate-100', variant === 'featured' ? 'aspect-[16/9] md:aspect-auto md:min-h-[260px]' : 'aspect-[16/10]')} />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
