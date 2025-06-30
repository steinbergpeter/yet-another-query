/**
 * TanStack Query Provider and Configuration
 *
 * Sets up React Query client with optimal defaults for API caching and synchronization
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

// Query client configuration
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes

        // GC time: How long inactive data stays in cache
        gcTime: 10 * 60 * 1000, // 10 minutes

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error?.message?.includes('API Error')) {
            return false;
          }
          return failureCount < 3;
        },

        // Refetch configuration
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations once on network error
        retry: (failureCount, error) => {
          if (error?.message?.includes('API Error')) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query Provider Component
 * Wrap your app with this to enable TanStack Query
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create client instance once per component instance
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show dev tools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to get query client instance for manual operations
 */
export { useQueryClient } from '@tanstack/react-query';

/**
 * Query client instance for server-side operations
 */
export const queryClient = createQueryClient();

/**
 * Prefetch utilities for server-side rendering
 */
export async function prefetchUsers(params?: any) {
  const { apiClient } = await import('./api-client');
  const { queryKeys } = await import('./query-keys');

  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => apiClient.getUsers(params),
  });
}

export async function prefetchPosts(params?: any) {
  const { apiClient } = await import('./api-client');
  const { queryKeys } = await import('./query-keys');

  await queryClient.prefetchQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => apiClient.getPosts(params),
  });
}

/**
 * Dehydration utilities for SSR
 */
export { dehydrate, hydrate, HydrationBoundary } from '@tanstack/react-query';
