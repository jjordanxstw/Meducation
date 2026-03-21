'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';
import { FiBook, FiArrowRight } from 'react-icons/fi';
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

// Preset brand colors for subject accent bars
const SUBJECT_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
];

// Generate consistent color based on subject code
function getSubjectColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function SubjectThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="relative flex h-20 w-full items-center justify-center bg-slate-100 dark:bg-white/5">
        <FiBook className="text-slate-300 dark:text-white/30 text-xl" />
      </div>
    );
  }

  return (
    <div className="relative h-20 w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setFailed(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
      className="glass-surface h-[200px] min-w-[220px] max-w-[260px] w-full transition-all duration-200 hover:card-flat-hover hover:shadow-lg group overflow-hidden cursor-pointer"
    >
      <CardBody className="p-0 flex flex-col">
        {/* Colored accent bar - 4px */}
        <div className={`h-1 w-full bg-gradient-to-r ${getSubjectColor(code)}`} />
        <SubjectThumbnail src={thumbnailUrl} alt={name} />
        <div className="flex-1 flex flex-col p-3 gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip size="sm" color="primary" variant="flat" className="h-5 text-[10px] font-medium px-2">
              {code}
            </Chip>
            <span className="text-[10px] text-slate-500 dark:text-white/50">Year {yearLevel}</span>
          </div>
          <h3 className="font-semibold text-foreground text-sm line-clamp-1 leading-tight">
            {name}
          </h3>
          <p className="text-xs text-default-500 line-clamp-2 flex-1">
            {description || 'No description'}
          </p>
          {progress !== undefined && (
            <div className="space-y-1 mt-auto">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-white/50">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {/* Hover indicator */}
          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-1">
            <span className="text-[10px] font-medium text-blue-400 flex items-center gap-0.5">
              Open <FiArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return <Link href={href} className="block h-full">{cardContent}</Link>;
}
