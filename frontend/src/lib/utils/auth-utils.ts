/**
 * Centralized authentication utilities
 * 
 * SECURITY: Tokens are stored ONLY in HttpOnly cookies.
 * The token is set/cleared via /api/auth/set-cookie route.
 * Client code should NOT access or store tokens directly.
 */

import type { User } from '@/types/game';
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

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const setCurrentUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeCurrentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
};

// Membership storage removed; user now carries premium fields.
export const removeMembership = (): void => {
  if (typeof window === 'undefined') return;
  // Cleanup legacy key if present
  localStorage.removeItem('membership');
};

export const clearAuthData = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  await removeAuthToken();
  removeCurrentUser();
  removeMembership();
};
