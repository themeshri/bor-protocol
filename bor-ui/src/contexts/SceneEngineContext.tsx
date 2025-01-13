import { useSocket } from '../hooks/useSocket';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useScene } from './ScenesContext';
import { ANIMATION_MAP, getAnimationUrl, getMessageTimeout } from '../utils/constants';

interface SceneEngineContextType {
  currentResponse: AIResponse | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  animation: { [agentId: string]: string | null };
  animationFile: { [agentId: string]: string | null };
  handleAnimation: (animation: string, agentId: string) => void;
  bgmRef: React.RefObject<HTMLAudioElement>;
  playBackgroundMusic: (url: string, onEnded?: () => void) => void;
  stopBackgroundMusic: () => void;
  audioData: {
    isPlaying: boolean;
    currentTime: number;
    amplitude: number;
  };
}

const SceneEngineContext = createContext<SceneEngineContextType | undefined>(undefined);

interface SceneEngineProviderProps {
  children: ReactNode;
}

interface AIResponse {
  id: string;
  agentId: string;
  text: string;
  audioUrl?: string;
  animation?: string;
  replyToUser?: string;
  replyToMessageId?: string;
  replyToMessage?: string;
  replyToHandle?: string;
  replyToPfp?: string;
  isGiftResponse?: boolean;
  giftId?: string;
  thought?: boolean;
}

interface AudioResponse {
  audioUrl: string;
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


export function SceneEngineProvider({ children }: SceneEngineProviderProps) {
  const { socket } = useSocket();
  const { currentAgentId, scenes, currentSceneIndex, sceneConfigIndex } = useScene();


  // AI Response
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [previousResponses] = useState(() => new Set<string>());
  const [responseQueue, setResponseQueue] = useState<AIResponse[]>([]);

  // Audio Manager
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Animation - updated to store animations per agent
  const [animation, setAnimation] = useState<{ [agentId: string]: string | null }>({});
  const [animationFile, setAnimationFile] = useState<{ [agentId: string]: string | null }>({});


  // Queue
  const [messageQueue, setMessageQueue] = useState<AIResponse[]>([]);
  const processingRef = useRef(false);


  const scene = scenes[currentSceneIndex]; // Current scene (tiktok stream)
  const sceneConfig = scene.sceneConfigs[sceneConfigIndex]; // Current scene config (environment, camera, models)
  const models = sceneConfig.models;
  const agentIds = models.map((model: { agentId: string }) => model.agentId);

  console.log('agentIds: ', { agentIds })



  // console.log('messageQueue: ', {messageQueue})


  // const handleSetAnimation = (animation: string, callback?: () => void) => {
  //   setAnimation(animations[animation]);

  //   // Set a timeout to revert to idle after 2 seconds
  //   setTimeout(() => {
  //     setAnimation(animations['idle']);
  //     if (callback) callback();
  //   }, 2000);
  // }

  


  // Process Next Message //
  const processNextMessage = () => {
    console.log('processNextMessage called', {
      queueLength: messageQueue.length,
      isProcessing: processingRef.current
    });

    if (messageQueue.length === 0 || processingRef.current) {
      console.log('Skipping processNextMessage:', {
        emptyQueue: messageQueue.length === 0,
        isProcessing: processingRef.current
      });
      return;
    }

    processingRef.current = true;
    const nextMessage = messageQueue[0];
    console.log('Processing next message:', nextMessage);

    setMessageQueue(prev => {
      console.log('Updating message queue:', {
        oldLength: prev.length,
        newLength: prev.slice(1).length
      });
      return prev.slice(1);
    });

    handleProcessMessage(nextMessage);
  }






  // Audio //
  const [audioData, setAudioData] = useState({
    isPlaying: false,
    currentTime: 0,
    amplitude: 0
  });

  // Add refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const mediaSourceRef = useRef<MediaElementSourceNode | null>(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        gainNodeRef.current = audioContextRef.current.createGain();
        
        // Configure analyzer
        analyzerRef.current.fftSize = 2048;
        dataArrayRef.current = new Float32Array(analyzerRef.current.frequencyBinCount);
        
        // Set up initial audio routing
        gainNodeRef.current.connect(audioContextRef.current.destination);
        analyzerRef.current.connect(gainNodeRef.current);
        
        // Set initial volume
        gainNodeRef.current.gain.value = 1.0;
      }
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleAudioResponse = useCallback(async (audioUrl: string) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      // Reset current audio if playing
      if (audioRef.current.src) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Set new audio source
      audioRef.current.src = audioUrl;
      audioRef.current.crossOrigin = "anonymous"; // Important for CORS

      // Make sure audio context is running
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create and connect media element source only if it hasn't been created yet
      if (audioContextRef.current && analyzerRef.current && gainNodeRef.current) {
        if (!mediaSourceRef.current) {
          mediaSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          mediaSourceRef.current.connect(analyzerRef.current);
        }

        // Set up audio analysis
        const analyzeAudio = () => {
          if (!audioRef.current?.paused && analyzerRef.current && dataArrayRef.current) {
            analyzerRef.current.getFloatTimeDomainData(dataArrayRef.current);
            const amplitude = Math.max(...dataArrayRef.current);

            setAudioData({
              isPlaying: true,
              currentTime: audioRef.current.currentTime,
              amplitude: amplitude
            });

            requestAnimationFrame(analyzeAudio);
          }
        };

        // Set up event handlers
        audioRef.current.onplay = () => {
          console.log('Audio started playing');
          analyzeAudio();
        };

        audioRef.current.onended = () => {
          console.log('Audio playback ended');
          setAudioData({
            isPlaying: false,
            currentTime: 0,
            amplitude: 0
          });
          setCurrentResponse(null);
            // // Process next message
        processingRef.current = false;
         processNextMessage();
        };

        // Start playback
        console.log('Starting audio playback');
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Playback failed:', error);
            // Try to play on user interaction
            const playOnInteraction = () => {
              audioRef.current?.play().catch(e => console.error('Retry failed:', e));
              document.removeEventListener('click', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction, { once: true });
          });
        }
      }
    } catch (error) {
      console.error('Error in handleAudioResponse:', error);
      setCurrentResponse(null);
    }
  }, []);

  // Clean up audio context when component unmounts
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      mediaSourceRef.current = null;  // Reset the media source reference
    };
  }, []);


  // HandleAudio Response
  const _handleAudioResponse = useCallback(async (data: AudioResponse) => {
    // console.log('Received audio response:', data);

    if (!data.audioUrl || !isValidUrl(data.audioUrl)) {
      console.error('Invalid audio URL received:', data.audioUrl);
      return;
    }

    handleAudioResponse(data.audioUrl);
  }, [audioRef]);


  // Animation Handler //
  const handleAnimation = useCallback((animation: string, agentId: string) => {
    console.log('🎭 Animation Requested:', { 
      animation, 
      agentId,
      currentAnimationState: animation 
    });

    const animationFile = getAnimationUrl(animation);

    if (animationFile) {
      console.log('🎬 Setting Animation:', { 
        animation, 
        agentId, 
        animationFile,
        currentState: animation
      });

      setAnimation(prev => {
        const newState = {
          ...prev,
          [agentId]: animation
        };
        console.log('🔄 New Animation State:', newState);
        return newState;
      });

      setAnimationFile(prev => {
        const newState = {
          ...prev,
          [agentId]: animationFile
        };
        console.log('📁 New Animation File State:', newState);
        return newState;
      });

      // Set a timeout to revert to idle
      setTimeout(() => {
        console.log('⏰ Reverting to idle for agent:', agentId);
        setAnimation(prev => ({
          ...prev,
          [agentId]: ANIMATION_MAP['idle']
        }));
      }, 2000);
    }
  }, []);
    // Process Message //
    const handleProcessMessage = useCallback((messageResponse: AIResponse) => {
      console.log('processMessage started:', messageResponse);
      setCurrentResponse(messageResponse);
  
      if (messageResponse.audioUrl) {
        handleAudioResponse(messageResponse.audioUrl);
      } else {
        const timeout = getMessageTimeout(messageResponse.text);
        setTimeout(() => {
          setCurrentResponse(null);
          processingRef.current = false;
        }, timeout);
      }
  
      // Update this section to use the agentId directly from the response
      if (messageResponse.animation && messageResponse.agentId) {
        handleAnimation(messageResponse.animation, messageResponse.agentId);
      }
    }, [handleAnimation]);


  // Handle AI Response
  const handleAIResponse = useCallback((response: AIResponse) => {
    // Instead of checking currentResponse state, check if audio is currently playing
    if (audioRef.current && !audioRef.current.ended || !!currentResponse) {
      // console.log('handleAIResponse: Audio playing, queueing new response');
      setMessageQueue(prev => [...prev, response]);
    } else {
      // console.log('handleAIResponse: No audio playing, showing new response immediately');
      handleProcessMessage(response);
    }
  }, [handleProcessMessage, currentResponse]);

  // Socket intake
  useEffect(() => {
    if (!socket) return;
    if (!currentAgentId && (!agentIds || agentIds.length === 0)) return;

    const cleanupListeners: (() => void)[] = [];

    // Handle multiple agents if agentIds exists, otherwise use currentAgentId
    const agents = agentIds?.length ? agentIds : [currentAgentId];

    agents.forEach((agentId: string) => {
      // AI Response
      const AGENT_AI_RESPONSE = `${agentId}_ai_response`;
      socket.on(AGENT_AI_RESPONSE, handleAIResponse);

     /* const AGENT_AI_RESPONSE = `${agentId}_ai_response`;
      handleAIResponse({
        id: 'test',
        agentId: agentId,
        text: 'this is so funny',
        animation: 'blow_a_kiss'
      });*/
      cleanupListeners.push(() => socket.off(AGENT_AI_RESPONSE));

      // Audio Response
      const AGENT_AUDIO_RESPONSE = `${agentId}_audio_response`;
      // socket.on(AGENT_AUDIO_RESPONSE, _handleAudioResponse);
      cleanupListeners.push(() => socket.off(AGENT_AUDIO_RESPONSE));

      // Updated Animation listener
      const AGENT_ANIMATION = `${agentId}_update_animation`;
      socket.on(AGENT_ANIMATION, (animation: string) => handleAnimation(animation, agentId));
      cleanupListeners.push(() => socket.off(AGENT_ANIMATION));
    });

    // Cleanup all listeners on unmount or when agents change
    return () => {
      cleanupListeners.forEach(cleanup => cleanup());
    };
  }, [socket, currentAgentId, agentIds, handleAnimation]);


  // Reset when currentAgentId changes
  useEffect(() => {
    setCurrentResponse(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [currentAgentId]);


  useEffect(() => {
    // console.log('useEffect: currentResponse, messageQueue: ', {currentResponse, messageQueue})
    if (!currentResponse && messageQueue.length > 0) {
      processNextMessage();
    }
  }, [currentResponse, messageQueue]);

  // Add BGM ref
  // const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Add BGM controls
  const playBackgroundMusic = useCallback((url: string, onEnded?: () => void) => {
    try {
      console.log('Attempting to play BGM:', url);

      if (!url) {
        console.error('No BGM URL provided');
        return;
      }

      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`BGM file not found: ${url}`);
          }

          if (!bgmRef.current) {
            bgmRef.current = new Audio();
          }

          // Stop any currently playing BGM
          if (bgmRef.current.src) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0;
          }

          bgmRef.current.src = url;
          bgmRef.current.loop = true;
          bgmRef.current.volume = 0.3;

          // Play with user interaction check
          const playPromise = bgmRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Detailed BGM error:', error);
              document.addEventListener('click', () => {
                bgmRef.current?.play().catch(e => console.error('Retry BGM error:', e));
              }, { once: true });
            });
          }
        })
        .catch(error => {
          console.error('BGM fetch error:', error);
        });

    } catch (error) {
      console.error('BGM setup error:', error);
    }
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, []);

  // Add cleanup for BGM in the currentAgentId effect
  useEffect(() => {
    setCurrentResponse(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Add BGM cleanup
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
  }, [currentAgentId]);

  const value: SceneEngineContextType = {
    currentResponse,
    audioRef,
    animation,
    animationFile,
    handleAnimation,
    bgmRef,
    playBackgroundMusic,
    stopBackgroundMusic,
    audioData,
  };


  return (
    <SceneEngineContext.Provider value={value}>
      {children}
    </SceneEngineContext.Provider>
  );
}

export function useSceneEngine() {
  const context = useContext(SceneEngineContext);
  if (context === undefined) {
    throw new Error('useSceneEngine must be used within a SceneEngineProvider');
  }
  return context;
}
