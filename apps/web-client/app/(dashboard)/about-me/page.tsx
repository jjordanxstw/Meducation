'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';

export default function AboutMePage() {
  return (
    <section className="mx-auto max-w-4xl">
      <Card className="glass-card border border-white/30">
        <CardBody className="gap-4 p-8">
          <Chip color="success" variant="flat" className="w-fit">
            About Me
          </Chip>
          <h1 className="text-3xl font-bold text-slate-900">Profile Overview</h1>
          <p className="text-slate-600">
            Personal profile settings and account preferences will be managed in this section.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
