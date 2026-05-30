import { useEffect, type RefObject } from 'react';

/**
 * Invokes `onIntersect` whenever the observed element enters the viewport.
 * Used to drive "load more" / infinite-scroll sentinels.
 */
export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  onIntersect: () => void,
  options?: { enabled?: boolean; rootMargin?: string },
) {
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? '0px';

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntersect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, onIntersect, enabled, rootMargin]);
}
