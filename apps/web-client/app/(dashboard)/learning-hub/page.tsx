'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-subtle text-brand">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-slate-500">{description}</p>
      <Badge variant="warning">Coming Soon</Badge>
    </div>
  );
}

export default function LearningHubPage() {
  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Learning Hub</h1>
        <Badge variant="warning">Coming Soon</Badge>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle sm:p-8">
        <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Your personalized learning space with curated paths, lecture bundles, and revision materials.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Learning Paths"
            description="Structured courses to guide your study journey"
          />
          <FeatureCard
            icon={<Clock className="h-5 w-5" />}
            title="Track Progress"
            description="Monitor your learning journey and achievements"
          />
          <FeatureCard
            icon={<CheckCircle className="h-5 w-5" />}
            title="Achievements"
            description="Earn badges and certificates as you learn"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/subjects">
              <BookOpen className="h-4 w-4" />
              Browse Subjects
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/#calendar">
              <Clock className="h-4 w-4" />
              View Schedule
            </Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
