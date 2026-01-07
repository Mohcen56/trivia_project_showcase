'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { CACHE, QUERY } from '@/lib/config';

/**
 * React Query Provider for the application
 * Provides automatic caching, background refetching, and request deduplication
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CACHE.QUERY_STALE_TIME_MS,
            gcTime: CACHE.QUERY_GC_TIME_MS,
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnMount: true, // Refetch on component mount if data is stale
            retry: QUERY.DEFAULT_RETRY_COUNT,
          },
          mutations: {
            retry: 0, // Don't retry mutations by default
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only shown in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
