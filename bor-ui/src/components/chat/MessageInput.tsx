import React, { useState, KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    // // console.log('Submit attempted', { message, disabled }); // Debug log
    
    if (message.trim()) {
      // // console.log('Sending message:', message); // Debug log
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // // console.log('Key pressed:', e.key); // Debug log
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-pink-950/30 bg-gray-900/80 backdrop-blur-sm rounded-b-2xl">
      <div className="p-4">
        <div className="relative flex items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Borp..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none rounded-2xl border border-pink-950/30 bg-gray-800 px-4 py-3 pr-12 text-sm text-pink-300
                     focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 
                     disabled:opacity-50 placeholder:text-pink-300/50"
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="absolute right-2 rounded-lg p-2 text-pink-300 hover:bg-pink-950/30 disabled:opacity-50 
                     transition-colors duration-200"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}