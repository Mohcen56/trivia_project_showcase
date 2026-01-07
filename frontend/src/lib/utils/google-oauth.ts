import { googleLoginAction } from '@/lib/auth/actions';
import { logger } from '@/lib/utils/logger';

/**
 * Handle Google OAuth response
 * Called after user selects a Google account
 * Uses server action to set HttpOnly cookie
 */
export async function handleGoogleOAuth(
  idToken: string,
  isSignup: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.log(`Google OAuth ${isSignup ? 'signup' : 'login'} initiated`);

    // Use server action for Google OAuth
    const result = await googleLoginAction(idToken);

    if (!result.success) {
      logger.error(`Google OAuth failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
      };
    }

    logger.log(`Google OAuth ${isSignup ? 'signup' : 'login'} successful`);

    return {
      success: true,
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
