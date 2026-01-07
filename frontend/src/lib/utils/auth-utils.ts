/**
 * Centralized authentication utilities
 * 
 * SECURITY: Tokens are stored ONLY in HttpOnly cookies.
 * The token is set/cleared via /api/auth/set-cookie route.
 * Client code should NOT access or store tokens directly.
 */

import { logger } from './logger';

/**
 * Check if user is authenticated by calling a server endpoint.
 * The actual token is in an HttpOnly cookie - not accessible to JS.
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/auth/check', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Sets the auth token in HttpOnly cookie via server route.
 * Token is NEVER stored in localStorage.
 */
export const setAuthToken = async (token: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    logger.exception(err, { where: 'setAuthToken' });
  }
};

/**
 * Clears the auth token from HttpOnly cookie.
 */
export const removeAuthToken = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/auth/set-cookie', { method: 'DELETE' });
  } catch (err) {
    logger.exception(err, { where: 'removeAuthToken' });
  }
};

/**
 * Clears all authentication data.
 * Token and user data are now managed via server-side session.
 */
export const clearAuthData = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  await removeAuthToken();
  // Cleanup legacy localStorage keys if present
  localStorage.removeItem('user');
  localStorage.removeItem('membership');
};
