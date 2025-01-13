import React from 'react';

interface GiftNotificationProps {
  sender: string;
  giftName: string;
  giftImage: string;
  quantity: number;
}

export function GiftNotification({ sender, giftName, giftImage, quantity }: GiftNotificationProps) {
  return (
    <div className="flex items-center space-x-2 bg-black/40 rounded-full px-4 py-2 animate-slide-in-left">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop"
          alt={sender}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-white font-medium">{sender}</span>
      <span className="text-white">sent</span>
      <div className="w-8 h-8">
        <img src={giftImage} alt={giftName} className="w-full h-full object-contain" />
      </div>
      {quantity > 1 && (
        <>
          <span className="text-white">x</span>
          <span className="text-white font-bold">{quantity}</span>
        </>
      )}
    </div>
  );
}