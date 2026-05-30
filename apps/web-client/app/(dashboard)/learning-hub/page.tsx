'use client';

import { Card, CardBody, Chip, Button } from '@nextui-org/react';
import { FiBookOpen, FiClock, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

// Feature Card Component
function FeatureCard({
  icon,
  iconBgColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-xl bg-white dark:bg-[var(--surface-1)] border border-slate-200 dark:border-white/[0.08] p-5 transition-all duration-200 hover:border-blue-300 dark:hover:border-primary-500/50 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-default shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgColor} mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-foreground text-base mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-default-500 mb-4">{description}</p>
      {/* Coming Soon badge */}
      <Chip
        size="sm"
        className="absolute bottom-4 right-4 bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-500 text-xs font-medium border border-amber-200 dark:border-amber-500/20"
      >
        Coming Soon
      </Chip>
    </div>
  );
}

export default function LearningHubPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
      {/* Header with Coming Soon badge */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">Learning Hub</h1>
        <Chip
          size="sm"
          className="bg-amber-500/15 text-amber-500 text-xs font-medium border border-amber-500/20"
        >
          Coming Soon
        </Chip>
      </div>

      {/* Hero Card */}
      <Card className="glass-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.15),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_45%)]" />
        <CardBody className="gap-5 p-5 sm:gap-6 sm:p-8">
          <div className="space-y-2">
            <p className="max-w-2xl text-base text-[var(--ink-2)] sm:text-lg">
              Your personalized learning space with curated paths, lecture bundles, and revision materials.
            </p>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <FeatureCard
              icon={<FiBookOpen className="text-primary h-5 w-5" />}
              iconBgColor="bg-primary/10"
              title="Learning Paths"
              description="Structured courses to guide your study journey"
            />

            <FeatureCard
              icon={<FiClock className="text-warning h-5 w-5" />}
              iconBgColor="bg-warning/10"
              title="Track Progress"
              description="Monitor your learning journey and achievements"
            />

            <FeatureCard
              icon={<FiCheckCircle className="text-success h-5 w-5" />}
              iconBgColor="bg-success/10"
              title="Achievements"
              description="Earn badges and certificates as you learn"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Link href="/subjects" className="w-full sm:w-auto">
              <Button
                color="primary"
                variant="solid"
                className="btn-precise w-full justify-center sm:w-auto"
                startContent={<span className="icon-with-text"><FiBookOpen className="h-4 w-4" /></span>}
              >
                Browse Subjects
              </Button>
            </Link>
            <Link href="/calendar" className="w-full sm:w-auto">
              <Button
                variant="flat"
                className="btn-precise card-flat w-full justify-center sm:w-auto"
                startContent={<span className="icon-with-text"><FiClock className="h-4 w-4" /></span>}
              >
                View Schedule
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
