/**
 * Centralized configuration constants
 * 
 * This file contains all magic numbers and configuration values
 * to ensure consistency and easy maintenance across the codebase.
 */

// Cache durations (in milliseconds)
export const CACHE = {
  /** Profile cache expiry - how long to cache user profile data */
  PROFILE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  
  /** React Query stale time - data considered fresh for this duration */
  QUERY_STALE_TIME_MS: 60 * 1000, // 1 minute
  
  /** React Query garbage collection time - cache entries removed after this */
  QUERY_GC_TIME_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Query retry configuration
export const QUERY = {
  /** Default number of retries for failed queries */
  DEFAULT_RETRY_COUNT: 1,
} as const;

// Authentication configuration
export const AUTH = {
  /** Cookie name for auth token (must match backend) */
  TOKEN_COOKIE_NAME: 'auth_token',
  
  /** Cookie max age in seconds */
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24 * 30, // 30 days
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login/',
    REGISTER: '/api/auth/register/',
    PROFILE: '/api/auth/profile/',
    PROFILE_UPDATE: '/api/auth/profile/update/',
    PROFILE_AVATAR: '/api/auth/profile/avatar/',
    GOOGLE_AUTH: '/api/auth/google/',
    FORGOT_PASSWORD: '/api/auth/forgot-password/',
    RESET_PASSWORD: '/api/auth/reset-password/',
    CHANGE_PASSWORD: '/api/auth/change-password/',
    DELETE_ACCOUNT: '/api/auth/delete-account/',
  },
  CATEGORIES: '/api/categories/',
  GAMES: '/api/games/',
  GAMEPLAY: '/api/gameplay/',
} as const;

// Feature flags
export const FEATURES = {
  /** Enable debug logging in development */
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
} as const;
