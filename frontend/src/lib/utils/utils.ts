/**
 * API Response Utilities
 * Standardized functions for handling API responses
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Normalizes paginated or array API responses into a consistent array format
 * Handles Django REST Framework paginated responses and direct array responses
 * 
 * @param data - The API response data (can be array or paginated object)
 * @returns Array of items of type T
 * 
 * @example
 * const categories = normalizeApiResponse<Category>(response.data);
 */
export function normalizeApiResponse<T>(data: unknown): T[] {
  // If data is already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If data has a 'results' property (DRF pagination), return that
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }
  
  // If data has a 'data' property, try to normalize that
  if (data && typeof data === 'object' && 'data' in data) {
    return normalizeApiResponse<T>(data.data);
  }
  
  // Default to empty array for safety
  return [];
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse(data: unknown): data is { results: unknown[]; count: number; next: string | null; previous: string | null } {
  return Boolean(
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray((data as { results?: unknown }).results) &&
    'count' in data
  );
}

/**
 * Class name utility: merge Tailwind classes intelligently
 * This mirrors the common `cn` helper pattern used across the codebase.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
