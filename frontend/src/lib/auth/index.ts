/**
 * Server-side authentication utilities
 * 
 * IMPORTANT: This file re-exports from session.ts which uses 'next/headers'.
 * Only import from this file in:
 * - Server Components
 * - Route Handlers (API routes)
 * - Server Actions
 * 
 * For Client Components, import directly from:
 * - '@/lib/auth/actions' for server actions
 * - '@/lib/auth/types' for type definitions
 */

// Re-export types (safe to import anywhere)
export type {
  User,
  AuthSession,
  NoAuthSession,
  Session,
  LoginResult,
  RegisterResult,
} from './types';

// Re-export server-only functions (only import in Server Components!)
export {
  getAuthToken,
  isAuthenticated,
  getServerUser,
  getSession,
  requireAuth,
  requireGuest,
  isPremiumUser,
  requirePremium,
} from './session';

// Note: Server actions should be imported directly from '@/lib/auth/actions'
// to avoid importing server-only code in client components
