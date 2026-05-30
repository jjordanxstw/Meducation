import { ReactNode } from 'react';

/**
 * Wraps page content in a subtle fade-in-up entrance animation. The animation
 * is defined in `tailwind.config.ts` and respects `prefers-reduced-motion`
 * via the global reduced-motion overrides in `globals.css`.
 *
 * Do NOT wrap loading skeletons in this — skeletons should appear instantly.
 */
export function PageTransition({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`animate-fade-in-up ${className}`}>{children}</div>;
}
