'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';

export default function LearningHubPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Card className="glass-card border border-white/30">
        <CardBody className="gap-4 p-8">
          <Chip color="secondary" variant="flat" className="w-fit">
            Learning Hub
          </Chip>
          <h1 className="text-3xl font-bold text-slate-900">Learning Hub</h1>
          <p className="text-slate-600">
            Curated learning paths, lecture bundles, and revision materials will appear here.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
