const base = 'bg-white/[0.06] animate-pulse rounded-lg';

/** Loading placeholder for an announcement card. */
export function AnnouncementCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/5 p-4"
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
