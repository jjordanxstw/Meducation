const base = 'bg-white/[0.06] animate-pulse rounded-lg';

/** Loading placeholder for the calendar grid. */
export function CalendarSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/5 p-4"
      role="status"
      aria-label="Loading calendar"
    >
      <div className={`${base} mb-4 h-5 w-40`} />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className={`${base} aspect-square w-full`} />
        ))}
      </div>
    </div>
  );
}

export default CalendarSkeleton;
