'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';

export default function AcdmPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Card className="glass-card">
        <CardBody className="gap-4 p-5 sm:p-8">
          <Chip color="primary" variant="flat" className="w-fit">
            ACDM
          </Chip>
          <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">Academic Dashboard</h1>
          <p className="text-sm text-[var(--ink-2)] sm:text-base">
            This area is reserved for academic progress and assessment widgets.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
