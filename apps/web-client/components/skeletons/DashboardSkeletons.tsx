import { Card, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarCardSkeleton() {
  return (
    <Card>
      <CardBody className="p-4 pt-4 sm:p-6 sm:pt-6">
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

      <Card>
        <CardBody className="flex flex-col gap-6 p-6 pt-6">
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
