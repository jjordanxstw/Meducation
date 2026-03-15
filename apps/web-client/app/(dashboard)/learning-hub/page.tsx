'use client';

import { Card, CardBody, Chip, Button } from '@nextui-org/react';
import { FiBookOpen, FiClock, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function LearningHubPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
      {/* Hero Card */}
      <Card className="glass-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.15),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_45%)]" />
        <CardBody className="gap-5 p-5 sm:gap-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Chip color="secondary" variant="flat" size="sm">
              Coming Soon
            </Chip>
            <Chip color="primary" variant="flat" size="sm">
              <FiTrendingUp className="h-3 w-3" />
              New Feature
            </Chip>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink-1)]">Learning Hub</h1>
            <p className="max-w-2xl text-base text-[var(--ink-2)] sm:text-lg">
              Your personalized learning space with curated paths, lecture bundles, and revision materials.
            </p>
          </div>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3 sm:pt-2">
            <div className="card-flat-hover rounded-xl p-4 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FiBookOpen className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Learning Paths</h3>
              <p className="text-sm text-default-500">Structured courses to guide your study</p>
            </div>

            <div className="card-flat-hover rounded-xl p-4 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <FiClock className="text-warning h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Track Progress</h3>
              <p className="text-sm text-default-500">Monitor your learning journey</p>
            </div>

            <div className="card-flat-hover rounded-xl p-4 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <FiCheckCircle className="text-success h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Achievements</h3>
              <p className="text-sm text-default-500">Earn badges and certificates</p>
            </div>
          </div>

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
