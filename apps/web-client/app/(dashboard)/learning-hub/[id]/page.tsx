'use client';

/**
 * Learning Hub Detail Page — card header + categories accordion of external
 * links. Mirrors the Subject detail page (Tailwind + Radix primitives only).
 */

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, ExternalLink, GraduationCap, AlertCircle } from 'lucide-react';
import type { LearningResourceCategory } from '@medical-portal/shared';
import { useLearningResource } from '@/hooks/use-learning-hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { PageTransition } from '@/components/PageTransition';

function LinkButton({ label, url }: { label?: string; url: string }) {
  const display = label?.trim() || url;
  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand/40 hover:bg-brand/15"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      <span className="max-w-[16rem] truncate">{display}</span>
    </button>
  );
}

export default function LearningResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: resource = null, isLoading, isError, error, refetch } = useLearningResource(id);

  const categories = resource?.categories ?? [];
  const firstCategoryKey = categories.length > 0 ? '0' : undefined;
  const [openKeys, setOpenKeys] = useState<string[] | null>(null);
  const effectiveOpenKeys = openKeys ?? (firstCategoryKey ? [firstCategoryKey] : []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-56 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !resource) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    let title = 'Something went wrong';
    let message = 'We couldn’t load this resource. Please try again.';
    if (status === 404 || (!isError && !resource)) {
      title = 'Resource not found';
      message = 'This resource may have been moved or removed.';
    } else if (status === 403) {
      title = 'Access denied';
      message = 'You don’t have permission to view this resource.';
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
              <Link href="/learning-hub">
                <ArrowLeft className="h-4 w-4" />
                Back to Learning Hub
              </Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      <div className="sticky top-20 z-20 w-fit">
        <Button asChild variant="secondary" size="sm" className="rounded-full text-slate-600 shadow-soft">
          <Link href="/learning-hub">
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Hub
          </Link>
        </Button>
      </div>

      {/* Resource header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
        <div className="relative h-56 w-full overflow-hidden bg-brand-subtle sm:h-72 lg:h-80">
          {resource.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.image_url} alt={`${resource.title} cover`} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand/30">
              <GraduationCap className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="space-y-2 p-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {resource.title}
          </h1>
          {resource.author_name && <p className="text-sm text-slate-500">by {resource.author_name}</p>}
          {resource.description && (
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{resource.description}</p>
          )}
          {resource.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resource.technologies.map((tag) => (
                <Badge key={tag} variant="brand">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 ? (
        <Accordion
          type="multiple"
          value={effectiveOpenKeys}
          onValueChange={(keys) => setOpenKeys(keys)}
          className="flex flex-col gap-3"
        >
          {categories.map((category: LearningResourceCategory, index) => {
            const key = String(index);
            const isOpen = effectiveOpenKeys.includes(key);
            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger aria-label={category.name}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-sm font-bold text-brand">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-slate-900">{category.name}</span>
                      <p className={`text-xs text-slate-500 transition-opacity ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                        {category.links?.length || 0} links
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {category.links && category.links.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {category.links.map((link, i) => (
                        <LinkButton key={i} label={link.label} url={link.url} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                      <ExternalLink className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-500">No links in this category yet</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <GraduationCap className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 font-serif text-xl font-semibold text-slate-900">No content available</h3>
          <p className="text-slate-500">This resource doesn&apos;t have any links yet. Please check back later.</p>
        </div>
      )}
    </PageTransition>
  );
}
