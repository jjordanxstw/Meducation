'use client';

import { Chip, Button } from '@heroui/react';
import { FiBookOpen, FiClock, FiCheckCircle } from 'react-icons/fi';
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
      <Chip size="sm" className="border border-amber-200 bg-amber-50 text-xs font-medium text-amber-600">
        Coming Soon
      </Chip>
    </div>
  );
}

export default function LearningHubPage() {
  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Learning Hub</h1>
        <Chip size="sm" className="border border-amber-200 bg-amber-50 text-xs font-medium text-amber-600">
          Coming Soon
        </Chip>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle sm:p-8">
        <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Your personalized learning space with curated paths, lecture bundles, and revision materials.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<FiBookOpen className="h-5 w-5" />}
            title="Learning Paths"
            description="Structured courses to guide your study journey"
          />
          <FeatureCard
            icon={<FiClock className="h-5 w-5" />}
            title="Track Progress"
            description="Monitor your learning journey and achievements"
          />
          <FeatureCard
            icon={<FiCheckCircle className="h-5 w-5" />}
            title="Achievements"
            description="Earn badges and certificates as you learn"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            as={Link}
            href="/subjects"
            color="primary"
            className="w-full justify-center sm:w-auto"
            startContent={<FiBookOpen className="h-4 w-4" />}
          >
            Browse Subjects
          </Button>
          <Button
            as={Link}
            href="/#calendar"
            variant="flat"
            className="w-full justify-center sm:w-auto"
            startContent={<FiClock className="h-4 w-4" />}
          >
            View Schedule
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
