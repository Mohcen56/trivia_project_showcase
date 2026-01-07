// Shared types for authentication
// This file is safe to import in both client and server components

import type { User } from '@/types/game';

// Re-export User for convenience
export type { User };

export interface AuthSession {
  user: User;
  isAuthenticated: true;
  isPremium: boolean;
}

export interface NoAuthSession {
  user: null;
  isAuthenticated: false;
  isPremium: false;
}

export type Session = AuthSession | NoAuthSession;

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}
