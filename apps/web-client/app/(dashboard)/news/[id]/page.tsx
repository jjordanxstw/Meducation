'use client';

/**
 * News article — title and byline first, then the cover and the Markdown body
 * at a comfortable reading measure, with more stories underneath.
 */

import React from 'react';
import Link from 'next/link';
import { formatDay } from '@/lib/dates';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { useHotNews, useNewsArticle } from '@/hooks/use-hot-news';
import { readingTime } from '@/lib/reading-time';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/states/EmptyState';
import { NewsCard } from '@/components/news/NewsCards';

const FALLBACK_COLOR = '#2f80ed';

function MoreNews({ currentId }: { currentId: string }) {
  const { data: articles = [] } = useHotNews(12);
  const more = articles.filter((article) => article.id !== currentId).slice(0, 3);
  if (more.length === 0) return null;
  return (
    <section className="space-y-4 border-t border-slate-200/70 pt-8" aria-labelledby="more-news">
      <h2 id="more-news" className="text-lg font-semibold tracking-tight text-ink-1">
        More news
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {more.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: article = null, isLoading, isError, error, refetch } = useNewsArticle(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5" aria-busy="true">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-10 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="aspect-[16/9] rounded-2xl" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (isError || !article) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const notFound = status === 404 || (!isError && !article);
    return (
      <PageTransition className="mx-auto max-w-2xl">
        <EmptyState
          tone={notFound ? 'neutral' : 'error'}
          icon={notFound ? Newspaper : undefined}
          title={notFound ? 'Article not found' : 'Couldn’t load this article'}
          description={notFound ? 'It may have been unpublished or removed.' : 'Check your connection and try again.'}
          action={notFound ? { label: 'Back to News', href: '/news' } : { label: 'Try again', onClick: () => void refetch() }}
        />
      </PageTransition>
    );
  }

  const color = article.category?.color || FALLBACK_COLOR;

  return (
    <PageTransition className="space-y-10">
      <article className="mx-auto max-w-2xl space-y-5">
        <Link href="/news" className="inline-flex items-center gap-1.5 rounded text-sm text-ink-3 hover:text-ink-1">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          News
        </Link>

        <header className="space-y-3">
          <p className="flex flex-wrap items-center gap-1.5 text-xs">
            {article.category ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span className="font-semibold uppercase tracking-wider" style={{ color: `color-mix(in srgb, ${color} 80%, black)` }}>
                  {article.category.name}
                </span>
                <span className="text-ink-3">·</span>
              </>
            ) : null}
            <span className="text-ink-3 tabular">
              {[formatDay(article.published_at), `${readingTime(article.body)} min read`, article.author_name ? `by ${article.author_name}` : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink-1 sm:text-4xl">{article.title}</h1>
          {article.summary ? <p className="text-lg leading-relaxed text-ink-2">{article.summary}</p> : null}
        </header>

        {article.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="prose-news">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
        </div>
      </article>

      <MoreNews currentId={article.id} />
    </PageTransition>
  );
}
