"use client";

import { useAppSelector } from "@/store/hooks";

interface MembershipLike {
  is_premium: boolean;
  user?: { id: number };
  expiry_date?: string | null;
}

export function useMembership() {
  // ✅ ONLY read from Redux - do NOT make API calls here!
  // useAuthGate handles all API calls
  const { user: reduxUser, isLoaded } = useAppSelector((state) => state.auth);

  // Derive membership from redux user (trust backend validation)
  const membership: MembershipLike | null = reduxUser ? {
    is_premium: !!reduxUser.is_premium,
    user: reduxUser.id ? { id: reduxUser.id } : undefined,
    expiry_date: (reduxUser as { premium_expiry?: string | null }).premium_expiry ?? null,
  } : null;

  const currentUserId = reduxUser?.id ?? null;

  return { membership, currentUserId, isLoaded };
}
