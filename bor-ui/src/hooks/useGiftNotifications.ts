import { useScene } from '../contexts/ScenesContext';
import { useState, useCallback, useEffect } from 'react';

interface GiftNotification {
  id: number;
  sender: string;
  giftName: string;
  giftImage: string;
  quantity: number;
}

export function useGiftNotifications(sceneIndex: number) {
  const [notifications, setNotifications] = useState<GiftNotification[]>([]);

  // Clear notifications when scene changes
  useEffect(() => {
    setNotifications([]);
  }, [sceneIndex]);

  const addNotification = useCallback((giftName: string, giftImage: string, quantity: number = 1) => {
   
    // console.log('addNotification', giftName, giftImage, quantity);
    const newNotification = {
      id: Date.now(),
      sender: `user${Math.floor(Math.random() * 10000)}`,
      giftName,
      giftImage,
      quantity,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 3000);
  }, []);

  // console.log('notifications', notifications  );

  return { notifications, addNotification };
}