'use client'

import React from 'react';
import Notification, { NotificationPosition, NotificationType } from './toast';
import { ProcessingButton } from '../ui/button2';
import { AnimatePresence } from 'framer-motion';

// Define the notification item interface
interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
}

export default function ToastView() {
    // We'll keep a state for dynamically added notifications
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
    const nextIdRef = React.useRef(1); // To generate unique IDs for new notifications

    const addNotification = (type: NotificationType, title: string, message?: string, showIcon?: boolean, duration?: number) => {
        const newNotification: NotificationItem = {
            id: nextIdRef.current++,
            type,
            title,
            message,
            showIcon,
            duration,
        };
        setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    };

    // New function for loading with timing system
    const addLoadingWithSuccess = (loadingTitle: string, loadingMessage: string, successTitle: string, successMessage: string, loadingDuration: number = 3000) => {
        const loadingId = nextIdRef.current++;
        
        // Add loading notification
        const loadingNotification: NotificationItem = {
            id: loadingId,
            type: 'loading',
            title: loadingTitle,
            message: loadingMessage,
            showIcon: true,
        };
        
        setNotifications((prevNotifications) => [...prevNotifications, loadingNotification]);
        
        // After loading duration, replace with success notification
        setTimeout(() => {
            setNotifications((prevNotifications) => 
                prevNotifications.map(notification => 
                    notification.id === loadingId 
                        ? {
                            ...notification,
                            type: 'success',
                            title: successTitle,
                            message: successMessage,
                            duration: 4000, // Success notification duration
                        }
                        : notification
                )
            );
        }, loadingDuration);
    };

    const handleClose = (id: number) => {
        setNotifications((prevNotifications) => prevNotifications.filter(n => n.id !== id));
    };

    // State to manage the current position
    const [position, setPosition] = React.useState<NotificationPosition>('bottom-right');

    // Function to get Tailwind CSS classes based on position
    const getPositionClasses = (currentPosition: NotificationPosition) => {
        switch (currentPosition) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'top-center':
                return 'top-4 left-1/2 -translate-x-1/2'; // Centered horizontally at the top
            case 'bottom-center':
                return 'bottom-4 left-1/2 -translate-x-1/2'; // Centered horizontally at the bottom
            default:
                return 'top-4 right-4'; // Default to top-right
        }
    };

  return (
    <div className="relative min-h-screen p-4">
      {/* Notifications container - Fixed positioning */}
      <div className={`fixed p-4 space-y-2 w-full max-w-sm z-50 ${getPositionClasses(position)}`}>
        <AnimatePresence>
          {/* Render dynamically added notifications */}
          {notifications.map((notification) => (
              <Notification
                  key={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  showIcon={notification.showIcon}
                  duration={notification.duration}
                  onClose={() => handleClose(notification.id)}
              />
          ))}
        </AnimatePresence>
      </div>

      {/* Controls to add new notifications */}
      <div className="mt-20 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">Test Notifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    <ProcessingButton
                        icon="play"
                        onProcess={async () => {
                            addLoadingWithSuccess(
                                'Processing Payment',
                                'Please wait while we process your payment...',
                                'Payment Successful',
                                'Your payment has been processed successfully!'
                            );
                            return true; // Always succeed (visual demo)
                        }}
                        processingText="Processing..."
                        successText="Done"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Payment Processing
                    </ProcessingButton>
                    <ProcessingButton
                        icon="download"
                        onProcess={async () => {
                            addNotification('error', 'Payment Declined', 'Your payment was declined. Please check your card details.', true, 5000);
                            return false; // Show error state
                        }}
                        processingText="Sending..."
                        successText="Sent"
                        errorText="Declined"
                        className="px-3 py-2 text-xs"
                    >
                        Payment Declined
                    </ProcessingButton>
                    <ProcessingButton
                        icon="check"
                        onProcess={async () => {
                            addNotification('error', 'Error!', 'An error occurred. Please try again.', true, 5000);
                            return false;
                        }}
                        processingText="Working..."
                        successText="OK"
                        errorText="Error"
                        className="px-3 py-2 text-xs"
                    >
                        Error
                    </ProcessingButton>
                    <ProcessingButton
                        icon="save"
                        onProcess={async () => {
                            addNotification('success', 'Payment Success', 'Your payment has been processed successfully.', true, 4000);
                            return true;
                        }}
                        processingText="Posting..."
                        successText="Success"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Payment Success
                    </ProcessingButton>
                    <ProcessingButton
                        icon="save"
                        onProcess={async () => {
                            addNotification('success', 'Profile Updated', 'Your profile has been updated successfully.', true, 3000);
                            return true;
                        }}
                        processingText="Updating..."
                        successText="Updated"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Profile Updated
                    </ProcessingButton>
                    <ProcessingButton
                        icon="download"
                        onProcess={async () => {
                            addNotification('error', 'Login Failed', 'Invalid username or password. Please try again.', true, 5000);
                            return false;
                        }}
                        processingText="Authenticating..."
                        successText="Logged"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Login Failed
                    </ProcessingButton>
                    <ProcessingButton
                        icon="play"
                        onProcess={async () => {
                            addLoadingWithSuccess(
                                'Sending Email',
                                'Preparing and sending your email...',
                                'Email Sent',
                                'Your email has been delivered successfully!'
                            );
                            return true;
                        }}
                        processingText="Sending..."
                        successText="Sent"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Send Email
                    </ProcessingButton>
                    <ProcessingButton
                        icon="check"
                        onProcess={async () => {
                            addNotification('success', 'Account Verified', 'Your email has been verified successfully.', true, 4000);
                            return true;
                        }}
                        processingText="Verifying..."
                        successText="Verified"
                        errorText="Failed"
                        className="px-3 py-2 text-xs"
                    >
                        Account Verified
                    </ProcessingButton>
                </div>
      </div>

      {/* Position controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 rounded-xl shadow-lg flex flex-wrap justify-center gap-1 z-40 border border-gray-200/50 dark:border-gray-700/50">
          <button
              onClick={() => setPosition('top-left')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'top-left' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Top Left
          </button>
          <button
              onClick={() => setPosition('top-center')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'top-center' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Top Center
          </button>
          <button
              onClick={() => setPosition('top-right')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'top-right' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Top Right
          </button>
          <button
              onClick={() => setPosition('bottom-left')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'bottom-left' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Bottom Left
          </button>
          <button
              onClick={() => setPosition('bottom-center')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'bottom-center' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Bottom Center
          </button>
          <button
              onClick={() => setPosition('bottom-right')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${position === 'bottom-right' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              Bottom Right
          </button>
      </div>
    </div>
  );
}
