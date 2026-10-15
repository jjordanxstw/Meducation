import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <Compass className="h-12 w-12 text-brand/60" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-1">This page doesn’t exist</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-3">The link may be old, or the lecture was moved to another section.</p>
      <div className="mt-5 flex gap-2">
        <Link href="/" className="inline-flex h-10 items-center rounded-[10px] bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
          Go to Today
        </Link>
        <Link
          href="/search"
          className="inline-flex h-10 items-center rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-slate-300"
        >
          Search lectures
        </Link>
      </div>
    </main>
  );
}
