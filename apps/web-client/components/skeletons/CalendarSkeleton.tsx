const base = 'bg-slate-100 animate-pulse rounded-lg';

/** Loading placeholder for the calendar grid. */
export function CalendarSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
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
