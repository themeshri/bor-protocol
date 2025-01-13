import React from 'react';
import { Twitter, Facebook, Link, Send } from 'lucide-react';

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ShareDrawer({ isOpen, onClose, className = '' }: ShareDrawerProps) {
  const shareButtons = [
    { icon: Twitter, label: 'X', onClick: () => window.open('https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20stream!', '_blank') },
    { icon: Facebook, label: 'Facebook', onClick: () => window.open('https://www.facebook.com/sharer/sharer.php', '_blank') },
    { icon: Link, label: 'Copy Link', onClick: () => navigator.clipboard.writeText(window.location.href) },
    { icon: Send, label: 'Send to Friends', onClick: () => {} },
  ];

  return null;
  return (
    <div className={`${className} ${isOpen ? 'block' : 'hidden'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={onClose}
      />
      <div
        className={`absolute left-0 right-0 bottom-0 bg-[#1C1C1E] transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: '45%',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
        }}
      >
        <div className="h-1 w-10 bg-gray-600 rounded-full mx-auto my-3" />
        
        {/* <div className="px-4 pb-3 flex justify-between items-center">
          <h2 className="text-white text-lg font-medium">Share</h2>
          <button onClick={onClose} className="text-white/80 p-2">✕</button>
        </div> */}

        <div className="p-4 grid grid-cols-4 gap-6">
          {shareButtons.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center transition-colors group-hover:bg-pink-600">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs group-hover:text-pink-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}