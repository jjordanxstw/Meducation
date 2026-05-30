const base = 'bg-slate-100 animate-pulse rounded-lg';

/** Loading placeholder for a subject card. */
export function SubjectCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
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
