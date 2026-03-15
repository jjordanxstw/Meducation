import { Card, CardBody, Skeleton } from '@nextui-org/react';

export function SubjectGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="glass-surface">
          <CardBody className="gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function EventListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card className="glass-surface border divider-y-0">
      <CardBody className="gap-3 p-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-start gap-3">
            <Skeleton className="h-16 w-1 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function CalendarCardSkeleton() {
  return (
    <Card className="glass-surface">
      <CardBody className="p-4 sm:p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
      </CardBody>
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
      </div>

      <Card className="glass-surface">
        <CardBody className="gap-6 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
          </div>

          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
