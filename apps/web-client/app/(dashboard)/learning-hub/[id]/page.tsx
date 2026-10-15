'use client';

/**
 * Learning Hub card detail (Brilliant: Student Desktop / Learning Hub detail).
 * Header card, then each category as a column of external links.
 */

import React from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, ExternalLink, GraduationCap, User } from 'lucide-react';
import { useLearningResource } from '@/hooks/use-learning-hub';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectGlyph } from '@/components/ui/SubjectGlyph';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/states/EmptyState';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function LearningResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: resource = null, isLoading, isError, error, refetch } = useLearningResource(id);

  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !resource) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const notFound = status === 404 || (!isError && !resource);
    return (
      <PageTransition className="mx-auto max-w-2xl">
        <EmptyState
          tone={notFound ? 'neutral' : 'error'}
          icon={notFound ? GraduationCap : undefined}
          title={notFound ? 'Resource not found' : 'Couldn’t load this resource'}
          description={notFound ? 'It may have been unpublished.' : 'Check your connection and try again.'}
          action={notFound ? { label: 'Back to Learning Hub', href: '/learning-hub' } : { label: 'Try again', onClick: () => void refetch() }}
        />
      </PageTransition>
    );
  }

  const categories = (resource.categories ?? []).filter((category) => (category.links?.length ?? 0) > 0);

  return (
    <PageTransition className="space-y-5">
      <Link href="/learning-hub" className="inline-flex items-center gap-1.5 rounded text-sm text-ink-3 hover:text-ink-1">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Learning Hub
      </Link>

      <header className="flex flex-col gap-5 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle sm:flex-row sm:p-6">
        <span className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-subtle text-brand sm:w-48">
          {resource.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <SubjectGlyph name={`${resource.title} ${(resource.technologies ?? []).join(' ')}`} className="h-12 w-12" />
          )}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-1 sm:text-3xl">{resource.title}</h1>
          {resource.description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2 sm:text-base">{resource.description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-3">
            {resource.author_name ? (
              <span className="mr-1 inline-flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden />
                Curated by {resource.author_name}
              </span>
            ) : null}
            {(resource.technologies ?? []).map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-ink-2">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {categories.length === 0 ? (
        <EmptyState compact icon={ExternalLink} title="No links yet" description="This resource doesn’t have any links yet." />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <section key={category.name} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-4 py-3">
                <h2 className="truncate text-sm font-semibold text-ink-1">{category.name}</h2>
                <span className="shrink-0 text-xs text-ink-3 tabular">{category.links.length} links</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {category.links.map((link, index) => (
                  <li key={`${link.url}-${index}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-1">{link.label?.trim() || hostOf(link.url)}</span>
                        <span className="block truncate text-xs text-ink-3">{hostOf(link.url)}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-ink-4" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
