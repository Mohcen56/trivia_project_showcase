import { NotificationType } from '../../components/ui/toast';

// Define the notification item interface
interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
}

type NotificationCallback = (notification: NotificationItem) => void;
type RemoveNotificationCallback = (id: number) => void;

class NotificationService {
  private listeners: NotificationCallback[] = [];
  private removeListeners: RemoveNotificationCallback[] = [];
  private nextId = 1;

  subscribe(callback: NotificationCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  subscribeRemove(callback: RemoveNotificationCallback) {
    this.removeListeners.push(callback);
    return () => {
      this.removeListeners = this.removeListeners.filter((listener) => listener !== callback);
    };
  }

  private notify(type: NotificationType, title: string, message?: string, showIcon: boolean = true, duration?: number) {
    const notification: NotificationItem = {
      id: this.nextId++,
      type,
      title,
      message,
      showIcon,
      duration,
    };

    this.listeners.forEach((listener) => listener(notification));
    return notification.id;
  }

  remove(id: number) {
    this.removeListeners.forEach((listener) => listener(id));
  }

  // Notification methods
  success(title: string, message?: string, duration: number = 3000) {
    return this.notify('success', title, message, true, duration);
  }

  error(title: string, message?: string, duration: number = 5000) {
    return this.notify('error', title, message, true, duration);
  }

  info(title: string, message?: string, duration: number = 4000) {
    return this.notify('info', title, message, true, duration);
  }

  warning(title: string, message?: string, duration: number = 5000) {
    return this.notify('warning', title, message, true, duration);
  }

  loading(title: string, message?: string) {
    return this.notify('loading', title, message, true);
  }

  // Specific app notifications
  paymentProcessing() {
    const loadingId = this.loading(
      'Processing Payment',
      'Please wait while we process your payment...'
    );

    return {
      success: (actualAmount?: string) => {
        setTimeout(() => {
          this.remove(loadingId);
          this.success(
            'Payment Successful',
            `Your payment${actualAmount ? ` of ${actualAmount}` : ''} has been processed successfully!`,
            4000
          );
        }, 100);
      },
      failed: (reason?: string) => {
        setTimeout(() => {
          this.remove(loadingId);
          this.error(
            'Payment Declined',
            reason || 'Your payment was declined. Please check your card details.',
            5000
          );
        }, 100);
      },
    };
  }

  paymentSuccess(amount?: string) {
    return this.success(
      'Payment Successful',
      `Your payment${amount ? ` of ${amount}` : ''} has been processed successfully!`,
      4000
    );
  }

  paymentDeclined(reason?: string) {
    return this.error(
      'Payment Declined',
      reason || 'Your payment was declined. Please check your card details.',
      5000
    );
  }

  profileUpdated() {
    return this.success(
      'Profile Updated',
      'Your profile has been updated successfully.',
      3000
    );
  }

  loginFailed(reason?: string) {
    return this.error(
      'Login Failed',
      reason || 'Invalid username or password. Please try again.',
      5000
    );
  }

  sendingEmail(recipient?: string) {
    const loadingId = this.loading(
      'Sending Email',
      recipient ? `Sending email to ${recipient}...` : 'Preparing and sending your email...'
    );

    return {
      success: () => {
        setTimeout(() => {
          this.remove(loadingId);
          this.success('Email Sent', 'Your email has been delivered successfully!', 4000);
        }, 100);
      },
      failed: (reason?: string) => {
        setTimeout(() => {
          this.remove(loadingId);
          this.error('Email Failed', reason || 'Failed to send email. Please try again.', 5000);
        }, 100);
      },
    };
  }

  accountVerified() {
    return this.success(
      'Account Verified',
      'Your email has been verified successfully.',
      4000
    );
  }

  // Generic saving notification
  saving(itemName: string = 'Changes') {
    const loadingId = this.loading('Saving', `Saving ${itemName.toLowerCase()}...`);

    return {
      success: () => {
        setTimeout(() => {
          this.remove(loadingId);
          this.success('Saved', `${itemName} saved successfully!`, 3000);
        }, 100);
      },
      failed: (reason?: string) => {
        setTimeout(() => {
          this.remove(loadingId);
          this.error('Save Failed', reason || `Failed to save ${itemName.toLowerCase()}.`, 5000);
        }, 100);
      },
    };
  }
}

export const notificationService = new NotificationService();
