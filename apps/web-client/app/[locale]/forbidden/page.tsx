import Link from 'next/link';
import { FiLock } from 'react-icons/fi';

export default function ForbiddenPage() {
  return (
    <main
      role="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <FiLock className="h-12 w-12 text-white/40" aria-hidden="true" />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white/80">Access denied</h1>
        <p className="text-sm text-white/60">
          You don&apos;t have permission to view this page.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to home
      </Link>
    </main>
  );
}
