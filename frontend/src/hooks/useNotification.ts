import { useCallback } from 'react';
import { notificationService } from '@/lib/utils/notificationService';

/**
 * Custom hook for showing notifications throughout the app
 * 
 * @example
 * ```tsx
 * const notify = useNotification();
 * 
 * // Simple notifications
 * notify.success('Success!', 'Operation completed');
 * notify.error('Error!', 'Something went wrong');
 * 
 * // App-specific notifications
 * notify.profileUpdated();
 * notify.loginFailed('Invalid credentials');
 * 
 * // Loading with transition
 * const payment = notify.paymentProcessing();
 * // Later...
 * payment.success('$29.99');
 * // Or on error...
 * payment.failed('Card declined');
 * ```
 */
export function useNotification() {
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return notificationService.success(title, message, duration);
  }, []);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return notificationService.error(title, message, duration);
  }, []);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return notificationService.info(title, message, duration);
  }, []);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return notificationService.warning(title, message, duration);
  }, []);

  const loading = useCallback((title: string, message?: string) => {
    return notificationService.loading(title, message);
  }, []);

  const remove = useCallback((id: number) => {
    return notificationService.remove(id);
  }, []);

  // App-specific notifications
  const paymentProcessing = useCallback(() => {
    return notificationService.paymentProcessing();
  }, []);

  const paymentSuccess = useCallback((amount?: string) => {
    return notificationService.paymentSuccess(amount);
  }, []);

  const paymentDeclined = useCallback((reason?: string) => {
    return notificationService.paymentDeclined(reason);
  }, []);

  const profileUpdated = useCallback(() => {
    return notificationService.profileUpdated();
  }, []);

  const loginFailed = useCallback((reason?: string) => {
    return notificationService.loginFailed(reason);
  }, []);

  const sendingEmail = useCallback((recipient?: string) => {
    return notificationService.sendingEmail(recipient);
  }, []);

  const accountVerified = useCallback(() => {
    return notificationService.accountVerified();
  }, []);

  const saving = useCallback((itemName?: string) => {
    return notificationService.saving(itemName);
  }, []);

  return {
    // Generic notifications
    success,
    error,
    info,
    warning,
    loading,
    remove,
    // App-specific notifications
    paymentProcessing,
    paymentSuccess,
    paymentDeclined,
    profileUpdated,
    loginFailed,
    sendingEmail,
    accountVerified,
    saving,
  };
}
