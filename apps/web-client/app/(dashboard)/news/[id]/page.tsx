'use client';

/**
 * News Article Detail — clean, readable article view for the student portal.
 * Cover, byline (author · date · read time), colored category tag, then the
 * markdown body rendered via react-markdown. Tailwind + Radix only.
 */

import React from 'react';
import Link from 'next/link';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, AlertCircle, Newspaper } from 'lucide-react';
import { formatDateShort } from '@medical-portal/shared';
import { useNewsArticle } from '@/hooks/use-hot-news';
import { readingTime } from '@/lib/reading-time';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/PageTransition';

const FALLBACK_COLOR = '#2f80ed';

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: article = null, isLoading, isError, error, refetch } = useNewsArticle(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    let title = 'Something went wrong';
    let message = 'We couldn’t load this article. Please try again.';
    if (status === 404 || (!isError && !article)) {
      title = 'Article not found';
      message = 'This article may have been moved or removed.';
    } else if (status === 403) {
      title = 'Access denied';
      message = 'You don’t have permission to view this article.';
    } else if (isError && status === undefined) {
      title = 'Connection failed';
      message = 'Check your internet connection and try again.';
    }

    return (
      <PageTransition className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button onClick={() => void refetch()}>Try Again</Button>
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const color = article.category?.color || FALLBACK_COLOR;
  const byline = [article.author_name, formatDateShort(article.published_at)].filter(Boolean).join(' · ');

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <Button asChild variant="secondary" size="sm" className="rounded-full text-slate-600">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      {/* Cover */}
      <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 shadow-subtle">
        {article.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover_image_url} alt={article.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-subtle text-brand/30">
            <Newspaper className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          {article.category && (
            <>
              <span className="font-semibold uppercase tracking-wide" style={{ color }}>
                {article.category.name}
              </span>
              <span className="text-slate-300">·</span>
            </>
          )}
          <span className="text-slate-400">{readingTime(article.body)} min read</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          {article.title}
        </h1>
        {byline && <p className="text-sm text-slate-500">{byline}</p>}
        {article.summary && (
          <p className="border-l-2 pl-4 text-base leading-relaxed text-slate-600" style={{ borderColor: color }}>
            {article.summary}
          </p>
        )}
      </header>

      {/* Body */}
      <article className="prose-news">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </article>
    </PageTransition>
  );
}
