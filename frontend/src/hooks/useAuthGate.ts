import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { checkAuth, setCurrentUser } from '@/lib/utils/auth-utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials, logout as logoutAction } from '@/store/authSlice';
import type { User } from '@/types/game';
import { logger } from '@/lib/utils/logger';

// ✅ REQUEST DEDUPLICATION: Track in-flight profile requests
let profileFetchInFlight: Promise<{ user: User }> | null = null;
let cachedProfile: { user: User } | null = null;
const cacheExpiry = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;

export function useAuthGate({ redirectIfGuest }: { redirectIfGuest?: string } = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  
  // ✅ GET USER FROM REDUX STORE (most important!)
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxIsLoaded = useAppSelector((state) => state.auth.isLoaded);

  const fetchUser = async () => {
    if (typeof window === 'undefined') return;

    // ✅ SECURITY: Check auth via server endpoint (cookie-based)
    const isAuthenticated = await checkAuth();

    // 🔹 Short-circuit safely (don't call API if no auth)
    if (!isAuthenticated) {
      logger.log('No auth cookie, skipping getCurrentUser');
      setLoading(false);
      if (redirectIfGuest) router.replace(redirectIfGuest);
      return;
    }

    try {
      // ✅ Check cache first (valid for 5 minutes)
      const now = Date.now();
      if (cachedProfile && now - cacheTimestamp < cacheExpiry) {
        logger.log('Using cached profile');
        setUser(cachedProfile.user);
        setLoading(false);
        return;
      }

      // ✅ Deduplicate: if request already in flight, reuse that promise
      if (profileFetchInFlight) {
        logger.log('Profile request in flight, reusing...');
        const profile = await profileFetchInFlight;
        setUser(profile.user);
        setLoading(false);
        return;
      }

      // ✅ Start new request and cache the promise
      profileFetchInFlight = authAPI.getProfile();
      const profile = await profileFetchInFlight;
      
      cachedProfile = profile;
      cacheTimestamp = Date.now();
      profileFetchInFlight = null;

      setUser(profile.user);
      setCurrentUser(profile.user);
      
      // ✅ CRITICAL: Dispatch to Redux so useMembership can read it
      dispatch(setCredentials({ user: profile.user }));
    } catch {
      profileFetchInFlight = null;
      if (redirectIfGuest) router.replace(redirectIfGuest);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ CRITICAL: If redux already has loaded user, use that instead of fetching!
    if (reduxIsLoaded && reduxUser) {
      logger.log('Using user from Redux store');
      setUser(reduxUser);
      setLoading(false);
      return;
    }

    // ✅ Only fetch if redux doesn't have user yet
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxIsLoaded, reduxUser]);

  const logout = async () => {
    await authAPI.logout();
    
    // ✅ Clear Redux state (important for account switching)
    dispatch(logoutAction());
    
    // ✅ Clear cache on logout
    cachedProfile = null;
    cacheTimestamp = 0;
    profileFetchInFlight = null;
    
    router.replace('/login');
  };

  const refetchUser = async () => {
    setLoading(true);
    // ✅ Clear cache to force fresh fetch
    cachedProfile = null;
    cacheTimestamp = 0;
    profileFetchInFlight = null;
    await fetchUser();
  };

  return { user, setUser, isLoading, logout, refetchUser };
}
