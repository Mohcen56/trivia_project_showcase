'use client'

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Notification, { NotificationType } from '@/components/ui/toast';
import { notificationService } from '@/lib/utils/notificationService';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
}

export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: NotificationPosition;
}

export function NotificationProvider({ children, position = 'bottom-right' }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    const unsubscribeRemove = notificationService.subscribeRemove((id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      unsubscribe();
      unsubscribeRemove();
    };
  }, []);

  const handleClose = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <>
      {children}
      <div className={`fixed p-4 space-y-2 w-full max-w-sm z-50 ${getPositionClasses()}`}>
        <AnimatePresence>
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
    </>
  );
}
