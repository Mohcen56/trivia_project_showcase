import axios from 'axios';
import { logger } from '@/lib/utils/logger';

// The actual Django backend URL (used by proxy route on server)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is required');
  }
  console.warn('NEXT_PUBLIC_API_BASE_URL not set, using localhost fallback');
}

/**
 * API client that routes through our Next.js proxy.
 * The proxy attaches auth tokens from HttpOnly cookies.
 * This keeps tokens secure and never exposed to the browser.
 */
export const api = axios.create({
  // All requests go through our proxy route
  baseURL: '/api/backend',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No auth interceptor needed - proxy handles authentication via HttpOnly cookies

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      logger.exception('Authentication failed - token may be invalid or expired');
      // Clear the cookie via our API route
      if (typeof window !== 'undefined') {
        try {
          await fetch('/api/auth/set-cookie', { method: 'DELETE' });
        } catch (e) {
          logger.exception(e, { where: 'base.401interceptor' });
        }
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };