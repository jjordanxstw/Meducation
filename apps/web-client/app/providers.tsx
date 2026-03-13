'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { ReactNode, useState } from 'react';
import { createQueryClient } from '../lib/queryClient';

export function Providers({ children }: { children: ReactNode }) {
  // Use useState to avoid recreating QueryClient on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </QueryClientProvider>
  );
}
