import React from 'react';
import { GiftNotification } from './GiftNotification';

interface GiftNotificationsProps {
  notifications: Array<{
    id: number;
    sender: string;
    giftName: string;
    giftImage: string;
    quantity: number;
  }>;
}

export function GiftNotifications({ notifications }: GiftNotificationsProps) {
  return (
    <div className="absolute bottom-[60%] left-4 space-y-2 z-30">
      {notifications.map((notification) => (
        <GiftNotification key={notification.id} {...notification} />
      ))}
    </div>
  );
}