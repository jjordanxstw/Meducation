'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';
import { FiBook } from 'react-icons/fi';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

interface SubjectCardProps {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  yearLevel: number;
  thumbnailUrl?: string | null;
  progress?: number; // Progress percentage (optional)
  href?: string;
}

function SubjectThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="card-flat relative flex aspect-[16/9] w-full items-center justify-center rounded-t-[var(--radius-lg)]">
        <FiBook className="text-default-400 text-3xl" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[var(--radius-lg)]">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setFailed(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}

export function SubjectCard({
  id,
  code,
  name,
  description,
  yearLevel,
  thumbnailUrl,
  progress,
  href = `/subjects/${id}`,
}: SubjectCardProps) {
  const cardContent = (
    <Card
      isPressable
      isBlurred
      className="glass-surface h-full transition-smooth-hover hover:card-flat-hover hover:scale-[1.01]"
    >
      <CardBody className="p-0">
        <SubjectThumbnail src={thumbnailUrl} alt={name} />
        <div className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" color="primary" variant="flat" className="text-xs">
              {code}
            </Chip>
            <Chip size="sm" variant="flat" className="text-xs">
              Year {yearLevel}
            </Chip>
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
            {name}
          </h3>
          <p className="text-sm text-default-500 line-clamp-2">
            {description || 'No description'}
          </p>
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-default-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );

  return <Link href={href}>{cardContent}</Link>;
}
