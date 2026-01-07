/**
 * Standardized API Result Types
 * 
 * These types ensure consistent error handling across all API calls.
 * Use ApiResult<T> for operations that can fail gracefully.
 */

/**
 * Success result with data
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Error result with message
 */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

/**
 * Union type for API results - use this for all API operations
 */
export type ApiResult<T> = ApiSuccess<T> | ApiError;

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(result: ApiResult<T>): result is ApiSuccess<T> {
  return result.success === true;
}

/**
 * Type guard to check if result is an error
 */
export function isError<T>(result: ApiResult<T>): result is ApiError {
  return result.success === false;
}

/**
 * Create a success result
 */
export function success<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function error(message: string, code?: string): ApiError {
  return { success: false, error: message, code };
}

/**
 * Extract error message from unknown error object
 * Handles axios errors, fetch errors, and generic errors
 */
export function extractErrorMessage(err: unknown, defaultMessage: string = 'An error occurred'): string {
  if (typeof err === 'string') {
    return err;
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  // Handle axios-style errors
  if (typeof err === 'object' && err !== null) {
    const axiosError = err as { 
      response?: { 
        data?: { 
          error?: string; 
          message?: string;
          detail?: string;
        } 
      };
      message?: string;
    };
    
    // Check for backend error messages in priority order
    const errorMessage = 
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message ||
      axiosError.response?.data?.detail ||
      axiosError.message;
    
    if (errorMessage) {
      return errorMessage;
    }
  }
  
  return defaultMessage;
}

/**
 * Wrap an async operation in a try-catch and return ApiResult
 * This is useful for converting throwing functions to Result-based ones
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<ApiResult<T>> {
  try {
    const data = await operation();
    return success(data);
  } catch (err) {
    return error(extractErrorMessage(err, errorMessage));
  }
}
