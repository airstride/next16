import { QueryClient } from "@tanstack/react-query";

/**
 * Global React Query client instance
 * Configured with sensible defaults for the application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        // Don't retry on 4xx errors (client errors)
        if (err?.status && err.status >= 400 && err.status < 500) {
          return false;
        }
        // Retry max 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes
      refetchOnReconnect: "always", // Refetch when network reconnects
      retryOnMount: false, // Prevent infinite retries
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      gcTime: 5 * 60 * 1000, // Cache mutation results for 5 minutes
    },
  },
});

/**
 * Invalidate queries by query key
 * @param queryKey - The query key to invalidate
 */
export const invalidateQueries = (queryKey: unknown[]) => {
  queryClient.invalidateQueries({ queryKey });
};

/**
 * Remove queries from cache
 * @param queryKey - The query key to remove
 */
export const removeQueries = (queryKey: unknown[]) => {
  queryClient.removeQueries({ queryKey });
};

/**
 * Clear all cache
 */
export const clearCache = () => queryClient.clear();

/**
 * Prefetch data for a query
 * @param queryKey - The query key
 * @param queryFn - The function to fetch data
 */
export const prefetchQuery = async <T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
  });
};

