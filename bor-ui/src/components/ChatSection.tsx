import './WebSocketProvider';  // Import this first!

import { useState, useEffect, useRef } from 'react';
import { X, Heart } from 'lucide-react';
import { TopViewers, TopStreamer } from './TopViewers';
import { useScene } from '../contexts/ScenesContext';
import { useUser } from '../contexts/UserContext';
import { useTopGifters } from '../hooks/useGiftsApi';
import { HeartAnimation } from './old/HeartAnimation';
import { validateMessage, sanitizeMessage } from '../utils/messageValidation';
import { Client } from 'tmi.js';



interface ChatSectionProps {
  onClose?: () => void;
}

interface Message {
  id: string;
  user: string;
  message: string;
  avatar: string;
  timestamp: number;
  isSystem?: boolean;
  badges?: Badge[];
  messageType?: 'gift' | 'regular' | 'system';
  metadata?: {
    txHash?: string;
    giftName?: string;
    giftCount?: number;
    coinsTotal?: number;
    icon?: string;
    avatar?: string;
    handle?: string;
  };
}
interface ChatMessage {
  username: string;
  chatContent: string;
  timestamp: string;
  avatar: string;
}
interface MessageEvent {
  data: {
      type: string;
      payload: ChatMessage;
  };
}

interface Badge {
  icon: string;
  text?: string;
  type: 'level' | 'rank' | 'special';
  color?: string;
}

const getBadgeStyle = (badge: Badge) => {
  const baseStyle = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md";

  if (badge.type === 'level') {
    return `${baseStyle} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
  } else if (badge.type === 'rank') {
    return `${baseStyle} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
  } else if (badge.color) {
    return `${baseStyle} ${badge.color}`;
  }

  return `${baseStyle} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`;
};

const INITIAL_TOP_STREAMERS: TopStreamer[] = [
  {
    id: '1',
    username: "Helleyy",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop",
    rank: 1,
    coins: 2000
  },
  {
    id: '2',
    username: "DropOff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=48&h=48&fit=crop",
    rank: 2,
    coins: 1500
  },
  {
    id: '3',
    username: "Never Broke...",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=48&h=48&fit=crop",
    rank: 3,
    coins: 800
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    user: 'IM|@akura🎮',
    message: '999',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop',
    timestamp: Date.now(),
    badges: [
      { icon: '💎', text: '19', type: 'level' },
      { icon: '❤️', text: 'III', type: 'rank' }
    ]
  },
  {
    id: '2',
    user: 'Yohana Gomez',
    message: '@👨🏻PAPI👨🏻',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
    timestamp: Date.now(),
    badges: [
      { icon: '💎', text: '8', type: 'level' },
      { icon: '❤️', text: 'I', type: 'rank' }
    ]
  }
];

const SIMULATED_MESSAGES = [
  {
    user: 'Carlos_23',
    message: 'Hello everyone! 👋',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop',
    badges: [{ icon: '💎', text: '25', type: 'level' }]
  },
  {
    user: 'Maria.Luz',
    message: '❤️❤️❤️',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
    badges: [
      { icon: '💎', text: '11', type: 'level' },
      { icon: '❤️', text: 'I', type: 'rank' }
    ]
  },
  {
    user: 'Gaming_Pro',
    message: 'Amazing stream!',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=32&h=32&fit=crop',
    badges: [
      { icon: '🎯', text: 'No. 2', type: 'special', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' }
    ]
  }
];

export function ChatSection({ onClose }: ChatSectionProps) {
  const { comments, addComment, currentAgentId, triggerLike, lastLikeTimestamp } = useScene();
  const [newMessage, setNewMessage] = useState('');
  const [showTopStreamers, setShowTopStreamers] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [topStreamers, setTopStreamers] = useState(INITIAL_TOP_STREAMERS);
  const { userProfile } = useUser();
  const [likeCount, setLikeCount] = useState(15);
  const [isLiked, setIsLiked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(Date.now());
  const [showMultiplier, setShowMultiplier] = useState(false);
  const multiplierTimeoutRef = useRef<NodeJS.Timeout>();
  const [isMultiplierAnimating, setIsMultiplierAnimating] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showError, setShowError] = useState(false);

  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    message: string;
    isSystem: boolean;
    timestamp: number;
  }>>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);


  const { data: topViewers, isLoading } = useTopGifters(currentAgentId, 3);

  // // console.log({ topViewers });
  const [isConnected, setIsConnected] = useState(false);
  const clientIdRef = useRef(import.meta.env.VITE_TWITCH_CLIENT_ID);
 // Function to fetch user avatar
 const fetchUserAvatar = async (userId: string): Promise<string | null> => {
  try {
      const response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
          headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_TWITCH_ACCESS_TOKEN}`,
              'Client-Id': clientIdRef.current
          }
      });
      const data = await response.json();
      return data.data[0]?.profile_image_url;
  } catch (error) {
      console.error('Error fetching avatar:', error);
      return null;
  }
};

  useEffect(() => {
    (window as any).addChatMessage = (message: string) => addComment(message, true);
    return () => {
      delete (window as any).addChatMessage;
    };
  }, [addComment]);

  const simulateNewMessage = () => {
    const randomMessage = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
    const newMsg: Message = {
      id: Date.now().toString(),
      ...randomMessage,
      timestamp: Date.now(),
    };

    addComment(newMsg.message, false, false);
  };

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     simulateNewMessage();
  //   }, Math.random() * 2000 + 2000);

  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleLike = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    // Reset counter if more than 5 seconds have passed
    if (timeDiff > 5000) {
      setClickCount(1);
    } else {
      setClickCount(prev => {
        if (prev >= 4) {
          // Trigger animation on number change
          setIsMultiplierAnimating(true);
          setTimeout(() => setIsMultiplierAnimating(false), 100);
        }
        return prev + 1;
      });
    }

    // Clear any existing timeout
    if (multiplierTimeoutRef.current) {
      clearTimeout(multiplierTimeoutRef.current);
    }

    // Show multiplier if clicked more than 5 times
    if (clickCount >= 4) { // Changed to 4 so it shows on the 5th click
      setShowMultiplier(true);
      // Set new timeout
      multiplierTimeoutRef.current = setTimeout(() => {
        setShowMultiplier(false);
      }, 2000); // Increased to 2 seconds for better visibility
    }

    setLastClickTime(currentTime);
    setIsLiked(true);
    triggerLike();
    setTimeout(() => setIsLiked(false), 300);
  };

  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // Heart animation
  useEffect(() => {
    if (lastLikeTimestamp) {
      setIsHeartAnimating(true);
      const timer = setTimeout(() => setIsHeartAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [lastLikeTimestamp]);

  useEffect(() => {
 
      // Create a new client
     const client = new Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: import.meta.env.VITE_TWITCH_BOT_USERNAME,
        password: import.meta.env.VITE_TWITCH_ACCESS_TOKEN
    },
    channels: [import.meta.env.VITE_TWITCH_CHANNEL]
});
        //console.log('Received message:', event.data); // Debug log
        client.on('message', async (channel, tags, message, self) => {
          if (self) return;
      
          const avatar = await fetchUserAvatar(tags['user-id'] || '');


           // Verify the payload has the expected structure
            const newMessage: ChatMessage = {
                username:  tags['display-name'],
                chatContent: message,
                timestamp: new Date(),
                avatar: avatar || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png' // Default Twitch avatar
              };
            
            console.log('Processed message:', newMessage); // Debug log
            setChatMessages(prevMessages => [...prevMessages, newMessage]);
            const trimmedMessage = newMessage.chatContent.trim();
          
            // Validate message
           // const validation = validateMessage(trimmedMessage);
          

            // Sanitize message before sending
           // const sanitizedMessage = sanitizeMessage(trimmedMessage);
            addComment(trimmedMessage,newMessage.avatar,newMessage.username);
               // Trigger animation on number change
      setIsMultiplierAnimating(true);
      setTimeout(() => setIsMultiplierAnimating(false), 100);
      triggerLike();
            setNewMessage('');
            setCanSend(false);
            setTimeLeft(1);
          })

      
    
      
    

      // Handle incoming messages
     

      client.on('connected', () => {
        setIsConnected(true);
        console.log('Connected to Twitch chat!');
      });
      
      client.on('disconnected', () => {
        setIsConnected(false);
        console.log('Disconnected from Twitch chat!');
      });
      
      // Connect to Twitch
      client.connect().catch(console.error);
      
   

      // Cleanup on unmount
  

   

    return () => {
      client.disconnect();
        window.removeEventListener('message', messageHandler);
    };
}, []);



  // Add cooldown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(time => time - 1);
      } else {
        setCanSend(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const getTopViewerBadge = (userAddress: string): Badge | undefined => {
    if (!topViewers?.topGifters) return undefined;

    const viewerIndex = topViewers.topGifters.findIndex(viewer => viewer._id === userAddress);
    if (viewerIndex === -1) return undefined;

    return {
      icon: '👑',
      text: `${viewerIndex + 1}`,
      type: 'special',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
  };

  const renderMessage = (message: Message) => {
    if (message.messageType === 'gift') {
      return (
        <div key={message.id} className="flex items-center gap-2 animate-fade-in bg-pink-50 dark:bg-pink-950/40 p-2 border-l-2 border-pink-500">
          <img
            src={message.metadata?.avatar || message.avatar}
            className="w-8 h-8 rounded-full object-cover"
            alt={message.user}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {message.metadata?.handle || message.user}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                sent {message.metadata?.giftCount}x {message.metadata?.icon} {message.metadata?.giftName}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              {/* {message.metadata?.txHash && (
                <a
                  href={`https://solscan.io/tx/${message.metadata.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-500 hover:text-pink-600"
                >
                  View Transaction ↗
                </a>
              )} */}
            </div>
          </div>
        </div>
      );
    }

    if (message.isSystem) {
      return (
        <div key={message.id} className="flex items-start gap-2 animate-fade-in bg-[#fe2c55]/10 p-2 rounded-lg">
          <img
            src={message.avatar}
            className="w-8 h-8 rounded-full object-cover"
            alt={message.user}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#fe2c55] font-medium">
                {message?.handle}
              </span>
              {message.badges?.map((badge, index) => (
                <div key={index} className={getBadgeStyle(badge)}>
                  <span>{badge.icon}</span>
                  {badge.text && <span>{badge.text}</span>}
                </div>
              ))}
              {/* Add top streamer badge if applicable */}
              {getTopViewerBadge(message.user) && (
                <div className={getBadgeStyle(getTopViewerBadge(message.user)!)}>
                  <span>{getTopViewerBadge(message.user)!.icon}</span>
                  <span>{getTopViewerBadge(message.user)!.text}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{message.message}</p>
          </div>
        </div>
      );
    }

    // Default message render
    return (
      <div key={message.id} className="flex items-start gap-2 animate-fade-in">
        <img
          src={message.avatar}
          className="w-8 h-8 rounded-full object-cover"
          alt={message.user}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 dark:text-white">
              {message.handle }
            </span>
            {/* Add top viewer badge if applicable */}
            {getTopViewerBadge(message.user) && (
              <div className={getBadgeStyle(getTopViewerBadge(message.user)!)}>
                <span>{getTopViewerBadge(message.user)!.icon}</span>
                <span>{getTopViewerBadge(message.user)!.text}</span>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">{message.message}</p>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#000000] relative">
      <div className="absolute right-4 top-20 z-10">

      </div>

      <div className="p-4 border-b border-gray-100 dark:border-[#1f1f1f] flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white">LIVE chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] rounded-full"
          >
            <X size={20} className="text-gray-600 dark:text-white" />
          </button>
        )}
      </div>

      <HeartAnimation isLiked={isHeartAnimating} />

      <TopViewers
        expanded={showTopStreamers}
        onToggle={() => setShowTopStreamers(!showTopStreamers)}
        streamers={topStreamers}
      />

      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {comments.map(renderMessage)}
        
        {/* Add local system messages */}
        {localMessages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-2 animate-fade-in bg-[#fe2c55]/10 p-2 rounded-lg"
          >
            <span className="text-[#fe2c55] text-sm">{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="absolute right-4 bottom-24 z-50">
        <button
          onClick={handleLike}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 backdrop-blur-sm hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors relative"
        >
          <Heart
            size={28}
            className={`transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-700 dark:text-gray-300'}`}
          />
          {showMultiplier && clickCount >= 5 && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
              <span className={`inline-block ${isMultiplierAnimating ? 'animate-multiplier-pop' : ''}`}>
                x{clickCount}
              </span>
            </div>
          )}
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-[#1f1f1f]">
        <div className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();

             

              const trimmedMessage = newMessage.trim();
              
              // Validate message
              const validation = validateMessage(trimmedMessage);
              if (!validation.isValid) {
                setShowError(true);
                setTimeout(() => setShowError(false), 1000);
                
                setLocalMessages(prev => [...prev, {
                  id: crypto.randomUUID(),
                  message: validation.reason || "Invalid message",
                  isSystem: true,
                  timestamp: Date.now()
                }]);

                setTimeout(() => {
                  setLocalMessages(prev => prev.filter(msg =>
                    Date.now() - msg.timestamp < 2000
                  ));
                }, 2000);
                
                return;
              }

              if (!canSend) {
                setShowError(true);
                setTimeout(() => setShowError(false), 1000);
                
                setLocalMessages(prev => [...prev, {
                  id: crypto.randomUUID(),
                  message: `Please wait ${timeLeft} seconds before sending..`,
                  isSystem: true,
                  timestamp: Date.now()
                }]);

                setTimeout(() => {
                  setLocalMessages(prev => prev.filter(msg =>
                    Date.now() - msg.timestamp < 2000
                  ));
                }, 2000);
                
                return;
              }

              // Sanitize message before sending
              const sanitizedMessage = sanitizeMessage(trimmedMessage);
              addComment(sanitizedMessage);
              setNewMessage('');
              setCanSend(false);
              setTimeLeft(1);
            }}
            className="relative"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={!canSend ? `Wait ${timeLeft} seconds...` : "Say something nice"}
              className="w-full bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-white rounded-full py-2.5 pl-4 pr-12 outline-none placeholder-gray-500"
            />
            <button
              type="button"
              onClick={() => setNewMessage(prev => prev + '😊')}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-75"
            >
              😊
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}