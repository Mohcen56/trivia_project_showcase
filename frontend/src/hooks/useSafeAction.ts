"use client";

import { useState, useCallback, useRef } from 'react';
import { useNotification } from './useNotification';
import { logger } from '@/lib/utils/logger';

interface SafeActionOptions {
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Show "please wait" toast after this many ms */
  slowThreshold?: number;
  /** Skip showing success toast */
  skipSuccessToast?: boolean;
  /** Skip showing error toast */
  skipErrorToast?: boolean;
}

interface SafeActionResult<T = void> {
  /** Execute the wrapped action */
  run: () => Promise<T | undefined>;
  /** Current loading state */
  loading: boolean;
  /** Last error if any */
  error: Error | null;
  /** Whether action succeeded on last run */
  success: boolean;
}

/**
 * Hook to safely execute async actions with double-click prevention
 * 
 * @example
 * ```tsx
 * const { run, loading } = useSafeAction(async () => {
 *   await api.createCategory(data);
 * }, {
 *   successMessage: 'Category created!',
 *   errorMessage: 'Failed to create category'
 * });
 * 
 * <button disabled={loading} onClick={run}>
 *   {loading ? 'Creating...' : 'Create Category'}
 * </button>
 * ```
 */
export function useSafeAction<T = void>(
  action: () => Promise<T>,
  options: SafeActionOptions = {}
): SafeActionResult<T> {
  const {
    successMessage,
    errorMessage = 'Something went wrong',
    slowThreshold = 3000,
    skipSuccessToast = false,
    skipErrorToast = false,
  } = options;

  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);
  const isExecuting = useRef(false);
  const slowToastId = useRef<number | null>(null);

  const run = useCallback(async (): Promise<T | undefined> => {
    // Prevent double execution
    if (isExecuting.current || loading) {
      logger.warn('Action already executing, ignoring duplicate call');
      return undefined;
    }

    isExecuting.current = true;
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Show "please wait" toast if action takes too long
    const slowTimeout = setTimeout(() => {
      slowToastId.current = notify.loading('Please wait...', 'This is taking longer than expected');
    }, slowThreshold);

    try {
      const result = await action();
      
      // Clear slow toast if it was shown
      if (slowToastId.current !== null) {
        notify.remove(slowToastId.current);
        slowToastId.current = null;
      }

      setSuccess(true);
      
      if (!skipSuccessToast && successMessage) {
        notify.success('Success', successMessage);
      }

      return result;
    } catch (err) {
      // Clear slow toast if it was shown
      if (slowToastId.current !== null) {
        notify.remove(slowToastId.current);
        slowToastId.current = null;
      }

      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      setSuccess(false);

      if (!skipErrorToast) {
        notify.error('Error', errorMessage);
      }

      logger.exception(err, { where: 'useSafeAction' });
      
      return undefined;
    } finally {
      clearTimeout(slowTimeout);
      setLoading(false);
      isExecuting.current = false;
    }
  }, [action, loading, notify, successMessage, errorMessage, slowThreshold, skipSuccessToast, skipErrorToast]);

  return {
    run,
    loading,
    error,
    success,
  };
}
