import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { User, AuthSession, NoAuthSession, Session } from './types';

// Re-export types for convenience
export type { User, AuthSession, NoAuthSession, Session };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Get the auth token from cookies (server-side only)
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('authToken')?.value ?? null;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Fetch user profile from backend (cached per request)
 * Uses React's cache() for request deduplication
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  const token = await getAuthToken();
  
  if (!token || !API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache authenticated requests
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const user = data.user;
    // Ensure avatar always has a value
    return {
      ...user,
      avatar: user.avatar || '/avatars/thumbs.svg',
    } as User;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
});

/**
 * Get the current session (user + auth status + premium status)
 * Use this in Server Components and Server Actions
 */
export async function getSession(): Promise<Session> {
  const user = await getServerUser();
  
  if (user) {
    // Compute premium status directly from user to avoid extra function call
    let isPremium = !!user.is_premium;
    
    // Check if premium has expired
    if (isPremium && user.premium_expiry) {
      const expiryDate = new Date(user.premium_expiry);
      if (expiryDate < new Date()) {
        isPremium = false;
      }
    }
    
    return { user, isAuthenticated: true, isPremium };
  }
  
  return { user: null, isAuthenticated: false, isPremium: false };
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this at the top of protected pages/layouts
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<AuthSession> {
  const session = await getSession();
  
  if (!session.isAuthenticated) {
    redirect(redirectTo);
  }
  
  return session;
}

/**
 * Require guest (not authenticated) - redirects if already authenticated
 * Use this in login/signup pages
 */
export async function requireGuest(redirectTo: string = '/dashboard'): Promise<NoAuthSession> {
  const session = await getSession();
  
  if (session.isAuthenticated) {
    redirect(redirectTo);
  }
  
  return session;
}

/**
 * Check if user has premium status (server-side)
 */
export async function isPremiumUser(): Promise<boolean> {
  const user = await getServerUser();
  
  if (!user?.is_premium) {
    return false;
  }
  
  // Check if premium has expired
  if (user.premium_expiry) {
    const expiryDate = new Date(user.premium_expiry);
    if (expiryDate < new Date()) {
      return false;
    }
  }
  
  return true;
}

/**
 * Require premium - redirects to plans if not premium
 * Use this for premium-only features
 */
export async function requirePremium(redirectTo: string = '/plans'): Promise<AuthSession> {
  const session = await requireAuth();
  
  const premium = await isPremiumUser();
  if (!premium) {
    redirect(redirectTo);
  }
  
  return session;
}
