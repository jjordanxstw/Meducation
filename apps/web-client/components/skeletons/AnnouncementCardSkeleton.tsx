const base = 'bg-slate-100 animate-pulse rounded-lg';

/** Loading placeholder for an announcement card. */
export function AnnouncementCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      role="status"
      aria-label="Loading announcement"
    >
      <div className={`${base} h-4 w-1/3`} />
      <div className={`${base} mt-3 h-3 w-full`} />
      <div className={`${base} mt-2 h-3 w-5/6`} />
    </div>
  );
}

export default AnnouncementCardSkeleton;
