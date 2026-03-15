import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly component - wraps content that should only render on the client
 * This is essential for SSR compatibility with components that use browser APIs
 *
 * @example
 * <ClientOnly fallback={<LoadingSpinner />}>
 *   <FullCalendar {...props} />
 * </ClientOnly>
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : <>{fallback}</>;
}
