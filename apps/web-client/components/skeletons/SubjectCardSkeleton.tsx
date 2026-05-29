const base = 'bg-white/[0.06] animate-pulse rounded-lg';

/** Loading placeholder for a subject card. */
export function SubjectCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/5 p-4"
      role="status"
      aria-label="Loading subject"
    >
      <div className={`${base} h-24 w-full`} />
      <div className={`${base} mt-4 h-4 w-2/3`} />
      <div className={`${base} mt-2 h-3 w-1/2`} />
    </div>
  );
}

export default SubjectCardSkeleton;
