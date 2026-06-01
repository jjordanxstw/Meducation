import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <main
      role="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Lock className="h-12 w-12 text-slate-400" aria-hidden="true" />
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-500">
          You don&apos;t have permission to view this page.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-subtle transition hover:border-brand/40 hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        Back to home
      </Link>
    </main>
  );
}
