"use client";

import { createContext, useContext, ReactNode } from "react";
import type { User } from "@/types/game";

interface SessionContextType {
  user: User | null;
  isAuthenticated: boolean;
  isPremium: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  user: User | null;
  isPremium?: boolean;
}

/**
 * Client-side session provider that receives user data from Server Components.
 * This replaces the need to pass user as props through multiple components.
 */
export function SessionProvider({ children, user, isPremium = false }: SessionProviderProps) {
  const value: SessionContextType = {
    user,
    isAuthenticated: !!user,
    isPremium: isPremium || user?.is_premium || false,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to access session data in client components.
 * Must be used within a SessionProvider.
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

/**
 * Hook that requires authentication - throws if not authenticated.
 */
export function useRequiredSession(): SessionContextType & { user: User } {
  const session = useSession();
  if (!session.user) {
    throw new Error("This component requires authentication");
  }
  return session as SessionContextType & { user: User };
}
