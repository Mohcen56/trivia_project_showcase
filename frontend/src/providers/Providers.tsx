"use client";

import { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryProvider } from "@/providers/QueryProvider";
import ReduxProvider from "@/components/utils/ReduxProvider";
import ErrorBoundary from "@/components/utils/ErrorBoundary";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import type { User } from "@/types/game";

interface ProvidersProps {
  children: ReactNode;
  user: User | null;
  isPremium?: boolean;
}

/**
 * Combines all client-side providers in one place.
 * This keeps the root layout clean and makes the provider hierarchy clear.
 */
export function Providers({ children, user, isPremium = false }: ProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || ""}>
      <QueryProvider>
        <ReduxProvider>
          <SessionProvider user={user} isPremium={isPremium}>
            <ErrorBoundary>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </ErrorBoundary>
          </SessionProvider>
        </ReduxProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
}
