const base = 'bg-white/[0.06] animate-pulse rounded-lg';

/** Loading placeholder for a lecture list row. */
export function LectureRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/5 p-3"
      role="status"
      aria-label="Loading lecture"
    >
      <div className={`${base} h-10 w-10 shrink-0`} />
      <div className="flex-1 space-y-2">
        <div className={`${base} h-4 w-1/2`} />
        <div className={`${base} h-3 w-1/3`} />
      </div>
    </div>
  );
}

export default LectureRowSkeleton;
