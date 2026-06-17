'use client';

/**
 * Learning Hub — a searchable grid of admin-managed learning resource cards.
 * Each card links to a detail page where its content is grouped into categories
 * of external links. Image-led, brand light theme; mirrors the Hot News cards.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Search } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { useLearningResources } from '@/hooks/use-learning-hub';
import { PageTransition } from '@/components/PageTransition';
import { Badge } from '@/components/ui/badge';

function CoverImage({ resource }: { resource: LearningResource }) {
  return resource.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resource.image_url}
      alt={resource.title}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-brand-subtle text-brand/30">
      <GraduationCap className="h-10 w-10" />
    </div>
  );
}

function ResourceCard({ resource }: { resource: LearningResource }) {
  const categories = resource.categories ?? [];
  const linkCount = categories.reduce((sum, c) => sum + (c.links?.length ?? 0), 0);

  return (
    <Link
      href={`/learning-hub/${resource.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <CoverImage resource={resource} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-brand">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{resource.description}</p>
          )}
        </div>

        {resource.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.technologies.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="brand">
                {tag}
              </Badge>
            ))}
            {resource.technologies.length > 5 && (
              <Badge variant="neutral">+{resource.technologies.length - 5}</Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
          <span className="truncate">
            {resource.author_name ? `by ${resource.author_name}` : `${categories.length} categories`}
            {resource.author_name ? '' : ` · ${linkCount} links`}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand">
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
      <div className="aspect-[16/9] animate-pulse bg-slate-100" />
      <div className="space-y-2 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function LearningHubPage() {
  const { data: resources = [], isLoading } = useLearningResources();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return resources;
    return resources.filter((r) => {
      const haystack = [r.title, r.description ?? '', r.author_name ?? '', ...(r.technologies ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [resources, search]);

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Learning Hub</h1>
        <p className="mt-0.5 text-base text-slate-500">Curated tools, resources and study materials</p>
      </header>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-subtle outline-none transition-colors placeholder:text-slate-400 focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <GraduationCap className="h-12 w-12 text-brand/35" />
          <h3 className="text-lg font-semibold text-slate-900">
            {search ? 'No matching resources' : 'No resources yet'}
          </h3>
          <p className="text-sm text-slate-500">
            {search ? 'Try a different search term.' : 'Check back soon for curated learning materials.'}
          </p>
        </div>
      )}
    </PageTransition>
  );
}
