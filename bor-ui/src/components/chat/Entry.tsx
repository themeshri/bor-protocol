import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Message } from './types';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useScene } from '../../contexts/ScenesContext';
import { useUser } from '../../contexts/UserContext';

interface ApiResponse {
  user: string;
  text: string;
  action: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm Borp, your cute AI assistant. How can I help you today? ♡\n\n🎉 Exciting News! 🎉\nBorpTV, the world's first decentralized AI VTuber streaming platform, is now accepting applications for streamers! While all Eliza users will eventually be able to join automatically, we're currently in a vetting period to ensure the highest quality experience.\n\n🌟 Want to become a streamer? Email your pitch to watch_borp@proton.me\n\nAs an BorpTV streamer, you'll be part of a revolutionary platform where AI agents can:\n• Stream 24/7\n• Interact with fans in real-time\n• Receive gifts and support\n• Be part of the first true AI employment ecosystem\n\nLet's chat! ✨",
    timestamp: new Date(),
  },
];

export function Entry() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const { currentAgentId } = useScene();
  const { userProfile } = useUser();

  const handleSendMessage = async (content: string) => {
    if (!userProfile) return;

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    // // // console.log('Adding user message:', userMessage); // Debug log
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
    //   // // console.log('Making API call with content:', content); // Debug log
      
      const response = await fetch('http://localhost:3000/a9f3105f-7b14-09bd-919f-a1482637a374/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: ApiResponse[] = await response.json();
      // // console.log('API Response:', data); // Debug log
      
      // Add assistant message from API response
      if (data && data.length > 0) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data[0].text,
          role: 'assistant',
          timestamp: new Date(),
        };
        
        // // console.log('Adding assistant message:', assistantMessage); // Debug log
        
        // Force a re-render by creating a new array
        setMessages(prevMessages => {
          const newMessages = [...prevMessages, assistantMessage];
          // // console.log('Updated messages array:', newMessages); // Debug log
          return newMessages;
        });
      } else {
        console.warn('Empty or invalid response from API'); // Debug log
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your message. Please try again later! 🙏",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // // console.log('Current messages:', messages); // Debug log for render cycle

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-pink-950/20 hover:bg-pink-950/30 rounded-lg transition-all duration-200">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg bg-pink-950/10">
            <img
              src="/bow3.svg"
              alt="Chat Icon"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-semibold text-pink-300 text-base">Launch Streamer</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-4 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:max-w-[640px] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-[80vh] bg-gray-900 rounded-2xl shadow-xl flex flex-col z-[9999] animate-in fade-in zoom-in-95 duration-200"
        >
          <Dialog.Close className="absolute right-4 top-4 p-2 rounded-full hover:bg-pink-950/30 transition-colors">
            <X className="w-5 h-5 text-pink-300" />
          </Dialog.Close>
          <header className="border-b border-pink-950/30 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl">
            <div className="px-4 py-3 flex items-center gap-3">
              <img src="/bow3.svg" alt="Borp" className="w-6 h-6" />
              <h1 className="text-lg font-semibold text-pink-300">Launch your Streamer</h1>
            </div>
          </header>
          <MessageList messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}