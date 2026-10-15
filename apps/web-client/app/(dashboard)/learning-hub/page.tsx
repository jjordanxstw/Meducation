'use client';

/**
 * Learning Hub (Brilliant: Student Desktop / Learning Hub). Curated tools and
 * study guides: tag chips, the first two cards featured, the rest as a grid.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Search } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { useLearningResources } from '@/hooks/use-learning-hub';
import { PageTransition } from '@/components/PageTransition';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectGlyph } from '@/components/ui/SubjectGlyph';
import { EmptyState } from '@/components/states/EmptyState';
import { cn } from '@/lib/utils';

function linkCount(resource: LearningResource) {
  return (resource.categories ?? []).reduce((sum, category) => sum + (category.links?.length ?? 0), 0);
}

function IconTile({ resource, large }: { resource: LearningResource; large?: boolean }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden bg-brand-subtle text-brand',
        large ? 'h-full w-full' : 'h-10 w-10 rounded-xl',
      )}
    >
      {resource.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resource.image_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <SubjectGlyph name={`${resource.title} ${(resource.technologies ?? []).join(' ')}`} className={large ? 'h-10 w-10' : 'h-5 w-5'} />
      )}
    </span>
  );
}

function FeaturedCard({ resource }: { resource: LearningResource }) {
  const categories = resource.categories?.length ?? 0;
  return (
    <Link
      href={`/learning-hub/${resource.id}`}
      className="group grid grid-cols-[0.6fr_1fr] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all hover:border-brand/40 hover:shadow-soft"
    >
      <IconTile resource={resource} large />
      <div className="flex flex-col gap-2 p-5">
        <span className="w-fit rounded-md bg-brand-subtle px-1.5 py-0.5 text-[11px] font-semibold text-brand-hover">Featured</span>
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-ink-1 group-hover:text-brand-hover">{resource.title}</h3>
        {resource.description ? <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">{resource.description}</p> : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap gap-1">
            {(resource.technologies ?? []).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                {tag}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs text-ink-3 tabular">
            {categories} {categories === 1 ? 'category' : 'categories'} · {linkCount(resource)} links
          </span>
        </div>
      </div>
    </Link>
  );
}

function ResourceCard({ resource }: { resource: LearningResource }) {
  return (
    <Link
      href={`/learning-hub/${resource.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
    >
      <IconTile resource={resource} />
      <div className="min-w-0">
        <h3 className="font-semibold leading-snug text-ink-1 group-hover:text-brand-hover">{resource.title}</h3>
        {resource.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-2">{resource.description}</p> : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-ink-3">
        <span className="truncate">{resource.author_name ? `By ${resource.author_name}` : ''}</span>
        <span className="shrink-0 tabular">{linkCount(resource)} links</span>
      </div>
    </Link>
  );
}

export default function LearningHubPage() {
  const { data: resources = [], isLoading, isError, refetch } = useLearningResources();
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const resource of resources) {
      for (const item of resource.technologies ?? []) counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name);
  }, [resources]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (tag && !(resource.technologies ?? []).includes(tag)) return false;
      if (!term) return true;
      return [resource.title, resource.description ?? '', resource.author_name ?? '', ...(resource.technologies ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [resources, search, tag]);

  const filteringActive = Boolean(search.trim() || tag);
  const featured = filteringActive ? [] : filtered.slice(0, 2);
  const rest = filteringActive ? filtered : filtered.slice(2);

  return (
    <PageTransition className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-1">Learning Hub</h1>
          <p className="mt-0.5 text-sm text-ink-3 sm:text-base">Curated tools, question banks and study guides picked by seniors and faculty</p>
        </div>
        <Input
          type="search"
          aria-label="Search the Learning Hub"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resources or tags"
          startContent={<Search className="h-4 w-4" />}
          wrapperClassName="w-full sm:w-72"
        />
      </header>

      {tags.length > 0 ? (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by tag">
          {[null, ...tags].map((item) => (
            <button
              key={item ?? 'all'}
              type="button"
              aria-pressed={tag === item}
              onClick={() => setTag(item)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors',
                tag === item ? 'border-ink-1 bg-ink-1 text-white' : 'border-slate-200 bg-white text-ink-2 hover:border-slate-300',
              )}
            >
              {item ?? 'All'}
              {item === null ? <span className="tabular opacity-70">{resources.length}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          tone="error"
          title="Couldn’t load the Learning Hub"
          description="Check your connection and try again."
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={filteringActive ? 'No matching resources' : 'No resources yet'}
          description={filteringActive ? 'Try a different search or tag.' : 'Curated study materials will appear here.'}
          action={
            filteringActive
              ? {
                  label: 'Clear filters',
                  onClick: () => {
                    setSearch('');
                    setTag(null);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {featured.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {featured.map((resource) => (
                <FeaturedCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </PageTransition>
  );
}
