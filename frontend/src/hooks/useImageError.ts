/**
 * useImageError Hook
 * Manages image loading error states across components
 * Tracks which images have failed to load and provides error handling utilities
 */

import { useState, useCallback } from 'react';

export function useImageError<T extends string | number>() {
  const [errors, setErrors] = useState<Set<T>>(new Set());
  
  /**
   * Mark an image as having an error
   * @param id - Unique identifier for the image (category ID, name, etc.)
   */
  const handleError = useCallback((id: T) => {
    setErrors(prev => new Set(prev).add(id));
  }, []);
  
  /**
   * Check if an image has an error
   * @param id - Unique identifier to check
   * @returns true if the image has errored
   */
  const hasError = useCallback((id: T) => {
    return errors.has(id);
  }, [errors]);
  
  /**
   * Clear error state for a specific image
   * Useful when retrying image loads
   * @param id - Unique identifier to clear
   */
  const clearError = useCallback((id: T) => {
    setErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  /**
   * Clear all error states
   */
  const clearAllErrors = useCallback(() => {
    setErrors(new Set());
  }, []);
  
  return { 
    handleError, 
    hasError, 
    clearError, 
    clearAllErrors,
    errorCount: errors.size 
  };
}
