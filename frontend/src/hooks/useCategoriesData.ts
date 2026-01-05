import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, userCategoriesAPI } from '@/lib/api';
import { useMemo } from 'react';

/**
 * Hook to fetch and manage categories data using React Query
 * Supports fetching official, user-created, or all categories
 * 
 * Benefits:
 * - Automatic caching and background refetching
 * - Request deduplication
 * - Optimistic UI updates
 */
export function useCategoriesData(type: 'official' | 'user' | 'all' = 'all') {
  // Query for official categories
  const {
    data: officialData,
    isLoading: officialLoading,
    error: officialError,
  } = useQuery({
    queryKey: ['categories', 'official'],
    queryFn: categoriesAPI.getCategories,
    enabled: type === 'official' || type === 'all',
  });

  // Query for user categories
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ['categories', 'user'],
    queryFn: userCategoriesAPI.getUserCategories,
    enabled: type === 'user' || type === 'all',
  });

  // Combine categories based on type
  const categories = useMemo(() => {
    switch (type) {
      case 'official':
        return officialData || [];
      case 'user':
        return userData || [];
      case 'all':
        return [...(officialData || []), ...(userData || [])];
      default:
        return [];
    }
  }, [type, officialData, userData]);

  // Determine loading state
  const isLoading = type === 'all' 
    ? (officialLoading || userLoading)
    : type === 'official' 
      ? officialLoading 
      : userLoading;

  // Get first error if any
  const error = officialError || userError;
  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load categories' : null;

  return { 
    categories, 
    isLoading, 
    error: errorMessage,
    // Note: setCategories removed as React Query manages cache internally
    // Use query invalidation or mutations instead
  };
}
