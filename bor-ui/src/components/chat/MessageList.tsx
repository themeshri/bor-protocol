import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`py-6 ${
            message.role === 'assistant' ? 'bg-white/50' : 'bg-pink-light/30'
          }`}
        >
          <div className="px-4 max-w-3xl mx-auto flex gap-4">
            <div className="mt-1 flex-shrink-0">
              {message.role === 'assistant' ? (
                <div className="w-8 h-8 bg-pink rounded-full flex items-center justify-center">
                  <img src="/bow-white.svg" alt="Borp" className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-pink-dark/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-dark" />
                </div>
              )}
            </div>
            <div className="prose prose-pink max-w-none text-sm whitespace-pre-wrap my-auto">
              {message.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}