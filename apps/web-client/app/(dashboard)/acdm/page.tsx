'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';

export default function AcdmPage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Card className="glass-card border border-white/30">
        <CardBody className="gap-4 p-8">
          <Chip color="primary" variant="flat" className="w-fit">
            ACDM
          </Chip>
          <h1 className="text-3xl font-bold text-slate-900">Academic Dashboard</h1>
          <p className="text-slate-600">
            This area is reserved for academic progress and assessment widgets.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
