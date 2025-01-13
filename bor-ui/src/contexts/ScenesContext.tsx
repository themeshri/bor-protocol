import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { type SceneConfig } from '../config/scenes';
import { useSocket } from '../hooks/useSocket';
import { useUser } from './UserContext';
import axios from 'axios';
import { API_URL, NEW_STREAM_CONFIGS, StreamConfig, STREAMER_ADDRESS, NewStreamConfig } from '../utils/constants';
import { useSceneManager } from '../hooks/useSceneManager';
import { useTopGifters } from '../hooks/useGiftsApi';
import { useGiftNotifications } from '../hooks/useGiftNotifications';
import Splash from '../components/Splash';
import { useScenesQuery } from '../hooks/useScenesApi';

interface Comment {
  id: string;
  agentId: string;
  user: string;
  message: string;
  createdAt: string;
  avatar: string;
  handle: string;
  __v: number;
  _id: string;
  messageType?: 'gift' | 'regular' | 'system';
  metadata?: {
    txHash?: string;
    giftName?: string;
    giftCount?: number;
    coinsTotal?: number;
    icon?: string;
  };
}

const COLORS = ['text-pink-400', 'text-orange-400', 'text-green-400', 'text-yellow-400'];

const getColorForUser = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};

export interface SceneStats {
  likes: number;
  comments: number;
  bookmarks: number;
  shares: number;
}

interface SceneContextType {
  currentAgentId: string;
  nextAgentId: string;
  prevAgentId: string;
  scenes: StreamConfig[]; // TODO: moving off this
  newScenes: NewStreamConfig[];
  setCurrentAgentId: (agentId: string) => void;
  updateSceneStats: (agentId: string, key: keyof SceneStats) => void;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  setCommentCount: (commentCount: number) => void;
  commentCount: number;
  likes: number;
  addComment: (message: string,avatar?: string,handle?: string, isSystem?: boolean, emitToServer?: boolean) => void;
  triggerLike: () => void;
  lastLikeTimestamp: number | null;
  currentSceneIndex: number;
  nextSceneIndex: number;
  prevSceneIndex: number;
  activeScene: number;
  setCurrentSceneIndex: (index: number) => void;
  setActiveScene: (scene: number) => void;
  scene: SceneConfig | null;
  isLoading: boolean;
  error: Error | null;
  refreshScenes: () => Promise<void>;
  sendGift: (gift: {
    count: number,
    name: string,
    icon: string,
    coins: number,
    txHash: string,
    recipientAddress: string
  }) => void;
  sceneConfigIndex: number;
  setSceneConfigIndex: (index: number) => void;
  swapSceneConfig: (index: number) => void;
  cycleSceneConfig: () => void;
  swapSceneConfigByClothes: (clothesName: string) => void;
  availableSceneConfigs: SceneConfig[];
  availableClothes: string[];
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

const FAKE_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=32&h=32&fit=crop'
];

const FAKE_BADGES = [
  { icon: '💎', text: '25', type: 'level' },
  { icon: '❤️', text: 'I', type: 'rank' },
  { icon: '🎯', text: 'No. 2', type: 'special', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' }
];



export function SceneProvider({ children }: { children: ReactNode }) {
  const { scenes: fetchedScenes, isLoading, error, refreshScenes } = useSceneManager();

  // const scenes = useMemo(() => STREAM_CONFIGS, [])
  const newScenes: NewStreamConfig[] = useMemo(() => NEW_STREAM_CONFIGS, [])
  const scenes: NewStreamConfig[] = useMemo(() => NEW_STREAM_CONFIGS, [])


  const { data: newScenesnew } = useScenesQuery();
  console.log({newScenesnew})


  const { emit, socket } = useSocket();
  const {  userProfile } = useUser()
  const [userId, setUserId] = useState<string>("Anonymous");


  const [currentAgentId, setCurrentAgentId] = useState(newScenes[0]?.agentId || '');

  // Commenta 
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0)

  // Likes
  const [likes, setLikes] = useState(0);
  const [lastLikeTimestamp, setLastLikeTimestamp] = useState<number | null>(null);

  // Helper function to get scene indices
  const getCurrentSceneIndex = useCallback(() =>
    newScenes.findIndex(newScene => newScene.agentId === currentAgentId),
    [newScenes, currentAgentId]
  );

  const nextAgentId = useMemo(() =>
    newScenes[(getCurrentSceneIndex() + 1) % newScenes.length].agentId,
    [newScenes, getCurrentSceneIndex]
  );

  const prevAgentId = useMemo(() =>
    newScenes[(getCurrentSceneIndex() - 1 + newScenes.length) % newScenes.length].agentId,
    [newScenes, getCurrentSceneIndex]
  );

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeScene, setActiveScene] = useState<number>(0);

  // Scene configs (clothes etc)
  const [sceneConfigIndex, setSceneConfigIndex] = useState(0);

  const swapSceneConfig = (index: number) => {
    setSceneConfigIndex(index);
  }

  const availableSceneConfigs = useMemo(() => newScenes[currentSceneIndex].sceneConfigs, [newScenes, currentSceneIndex]);
  const availableClothes = useMemo(() => availableSceneConfigs.map(sceneConfig => sceneConfig.clothes), [availableSceneConfigs]);
  // console.log({ availableSceneConfigs, availableClothes })

  const cycleSceneConfig = useCallback(() => {
    // console.log('cycling scene config', availableSceneConfigs.length)
    setSceneConfigIndex(prevIndex => (prevIndex + 1) % availableSceneConfigs.length);
  }, [availableSceneConfigs.length]);
  

  const swapSceneConfigByClothes = useCallback((clothesName: string) => {
    const targetIndex = availableSceneConfigs.findIndex(
      config => config.clothes === clothesName
    );
    if (targetIndex !== -1) {
      setSceneConfigIndex(targetIndex);
    }
  }, [availableSceneConfigs]);

  const [sceneStats, setSceneStats] = useState<SceneStats[]>(() =>
    newScenes.map(scene => ({ ...scene.stats }))
  );

  // Scene mgmt
  const nextSceneIndex = (currentSceneIndex + 1) % newScenes.length;
  const prevSceneIndex = (currentSceneIndex - 1 + newScenes.length) % newScenes.length;

  const { notifications, addNotification } = useGiftNotifications(currentSceneIndex);
  const { refetch: refetchTopViewers } = useTopGifters(currentAgentId, 3);


  // Update currentAgentId when scenes change
  useEffect(() => {
    if (newScenes.length > 0) {
      const currentScene = newScenes[currentSceneIndex];
      // console.log('setting current agent id to', currentScene.agentId);
      setCurrentAgentId(currentScene.agentId);
      
      // Update URL with scene identifier
    }
  }, [newScenes, currentSceneIndex]);


  // Initial scene stats
  useEffect(() => {
    const fetchSceneStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/streams/${currentAgentId}/stats`);
        // console.log(`Scene stats for ${currentAgentId}:`, res.data);
        setLikes(res.data.likes);
        setCommentCount(res.data.comments || []);
      } catch (error) {
        console.error(`Failed to fetch scene stats for ${currentAgentId}:`, error);
      }
    };

    fetchSceneStats();

    if (socket) {
      socket.emit('join_agent_stream', currentAgentId);
    }

  }, [currentAgentId, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Create a single handler function
    const handleCommentReceived = (data: { commentCount: number, newComment: Comment }) => {
      console.log("comment received for agent:", currentAgentId, data);
      setCommentCount(data.commentCount);

      if (data.newComment.user === userId) return;
      const comment: Comment = {
        id: data.newComment.id.toString(),
        agentId: data.newComment.agentId,
        user: data.newComment.user,
        message: data.newComment.message,
        createdAt: data.newComment.createdAt,
        avatar: data.newComment.avatar,
        handle: data.newComment.handle,
      };

      setComments(prev => [...prev, comment].slice(-100));
    };

    // Remove any existing listeners before adding new ones
    socket.off(`${currentAgentId}_comment_received`);
    socket.off(`${currentAgentId}_like_received`);

    // Add new listeners
    socket.on(`${currentAgentId}_comment_received`, handleCommentReceived);
    socket.on(`${currentAgentId}_like_received`, () => {
      setLikes(prev => prev + 1);
      setLastLikeTimestamp(Date.now());
    });

    return () => {
      socket.off(`${currentAgentId}_comment_received`);
      socket.off(`${currentAgentId}_like_received`);
    };
  }, [socket, currentAgentId, userId]);

  // Unused
  const updateSceneStats = (agentId: string, key: keyof SceneStats) => {
    setSceneStats(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [key]: prev[agentId][key] + 1
      }
    }));
  };

  // Comments
  const addComment = useCallback((
    message: string,
    avatar?: string,
    handle?: string,
    isSystem: boolean = false,
    emitToServer: boolean = true,
    messageType: 'gift' | 'regular' | 'system' = 'regular',
   
    metadata?: {
      txHash?: string;
      giftName?: string;
      giftCount?: number;
      coinsTotal?: number;
      icon?: string;
    }
  ) => {
    const randomAvatar = FAKE_AVATARS[Math.floor(Math.random() * FAKE_AVATARS.length)];
    const randomBadges = [FAKE_BADGES[Math.floor(Math.random() * FAKE_BADGES.length)]];

    const newComment = {
      id: Date.now().toString(),
      user: userId ? userId : isSystem ? 'System' : '',
      message,
      avatar: avatar?avatar:randomAvatar,
      handle: handle?handle:'Anonymous',
      badges: randomBadges,
      color: isSystem ? 'text-gray-500' : getColorForUser(userId),
      createdAt: Date.now(),
      messageType,
      metadata // Add the metadata
    };

    setComments(prev => [...prev, newComment]);

    if (emitToServer) {
      emit(`new_comment`, { comment: newComment, agentId: currentAgentId });
    }
  }, [currentAgentId, userId, emit, userProfile]);

  // Likes
  const triggerLike = () => {
    emit(`new_like`, { user: userId, agentId: currentAgentId });
    setLikes(prev => prev + 1);
    setLastLikeTimestamp(Date.now());
  };

  // Update scene memo with safety check
  const scene = useMemo(() =>
    newScenes[currentSceneIndex] || null,
    [newScenes, currentSceneIndex]
  );

  // On scene change
  useEffect(() => {
    if (scene) {
      // console.log('new scene', scene);
      setComments([]);

      // Fetch comments for the new scene
      const fetchComments = async () => {
        try {
          const url = `${API_URL}/api/agents/${currentAgentId}/chat-history?limit=15`;
          // console.log('fetching comments from', url);
          const res = await axios.get(url);
          // Reverse the array to get the latest comments first   
          const reversedComments = res.data.chatHistory.reverse();
          // console.log({ comments: reversedComments })
          setComments(reversedComments);
        } catch (error) {
          console.error(`Failed to fetch comments for ${currentAgentId}:`, error);
        }
      };

      // Fetch recent gifts
      const fetchGifts = async () => {
        
      };

      fetchGifts();
      fetchComments();
    }
  }, [scene, currentAgentId]);

  // Add the sendGift function
  const sendGift = useCallback((gift: {
    count: number,
    name: string,
    icon: string,
    coins: number,
    txHash: string
  }) => {
    if (!socket || !userId) return;

    // Get the recipient wallet address from the current scene or use the default
    const recipientWallet = scene?.walletAddress || STREAMER_ADDRESS;

    const giftEvent = {
      senderPublicKey: userId,
      recipientAgentId: currentAgentId,
      recipientWallet, // Use the recipient wallet address
      giftName: gift.name,
      giftCount: gift.count,
      coinsTotal: gift.coins * gift.count,
      txHash: gift.txHash,
      icon: gift.icon,
      timestamp: Date.now(),
      handle: userProfile?.handle || undefined, // Include user's handle
      avatar: userProfile?.pfp || undefined // Include user's pfp
    };

    // console.log('Emitting gift event:', giftEvent);
    emit('new_gift', giftEvent);

    setTimeout(() => {
      refetchTopViewers();
    }, 1000);

    // Optionally add a system message to the chat
    // addComment(
    //     `Sent ${gift.count}x ${gift.icon} ${gift.name} (${gift.coins * gift.count} USDC)`,
    //     false,
    //     false
    // );
  }, [socket, userId, currentAgentId, scene, emit, addComment, userProfile]);

  // Listen for server's response to the gift event
  const { addNotification: _addGiftNotification } = useGiftNotifications(currentSceneIndex);
  useEffect(() => {
    if (!socket) return;

    const handleGiftReceived = (data: any) => {
      // console.log('Gift received from server:', data);
      // Update chat log or UI with the received gift data
      addComment(
        `sent ${data.giftCount}x ${data.icon} ${data.giftName})`,
        false,
        false,
        'gift',
        data
      );

      addNotification(data.giftName, data.icon, data.giftCount);

    };

    // Listen for the specific event emitted by the server
    socket.on(`${currentAgentId}_gift_received`, handleGiftReceived);

    return () => {
      socket.off(`${currentAgentId}_gift_received`, handleGiftReceived);
    };
  }, [socket, currentAgentId, addComment]);

  if (isLoading) {
    return <Splash />; // Or any loading indicator you prefer
  }

  return (
    <SceneContext.Provider
      value={{
        currentAgentId,
        nextAgentId,
        prevAgentId,
        
        scenes: newScenes,
        setCurrentAgentId,
        updateSceneStats,
        scene,
        newScenes,

        // Comments
        comments,
        commentCount,
        setCommentCount,
        addComment,

        // Likes
        likes,
        triggerLike,
        lastLikeTimestamp,

        // Scene Context
        currentSceneIndex,
        nextSceneIndex,
        prevSceneIndex,
        activeScene,
        setCurrentSceneIndex,
        setActiveScene,

        // New properties
        isLoading,
        error,
        refreshScenes,
        sendGift,


        sceneConfigIndex,
        setSceneConfigIndex,
        swapSceneConfig,
        cycleSceneConfig,
        swapSceneConfigByClothes,
        availableSceneConfigs,
        availableClothes,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}
