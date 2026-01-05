import { authAPI } from '@/lib/api/auth';
import { setCurrentUser, setAuthToken } from '@/lib/utils/auth-utils';
import { logger } from '@/lib/utils/logger';

/**
 * Handle Google OAuth response
 * Called after user selects a Google account
 */
export async function handleGoogleOAuth(
  idToken: string,
  isSignup: boolean = false
): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    logger.log(`Google OAuth ${isSignup ? 'signup' : 'login'} initiated`);

    // Send token to backend for verification and user creation/login
    const result = await authAPI.googleOAuth(idToken);

    if (!result.success) {
      logger.error(`Google OAuth failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
      };
    }

    // Store auth token (syncs to HTTP-only cookie for SSR)
    await setAuthToken(result.token!);

    // Store user in auth utils
    setCurrentUser(result.user);

    logger.log(
      `Google OAuth ${result.is_new ? 'signup' : 'login'} successful for ${result.user.email}`
    );

    return {
      success: true,
      token: result.token,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Google OAuth failed';
    logger.exception(errorMessage, { where: 'handleGoogleOAuth' });
    return {
      success: false,
      error: errorMessage,
    };
  }
}
