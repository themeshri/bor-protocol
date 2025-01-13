import React, { Suspense, useCallback, useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Share2, MoreHorizontal, Heart, User, Layout, Lock, Unlock } from 'lucide-react';
import DefaultScene from './3d/DefaultScene';
import { ErrorBoundary } from 'react-error-boundary';


import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneConfig } from '@/config/scenes';
import { Scene } from './old/Scene';
import ThreeScene from './3d/ThreeScene';
import { useScene } from '../contexts/ScenesContext';
import { SideActions } from './old/SideActions';
import { HeartAnimation } from './old/HeartAnimation';
import { LiveChat } from './old/LiveChat';
import AIResponseDisplay from './old/AIResponseDisplay';
import { useGiftNotifications } from '../hooks/useGiftNotifications';
import { GiftNotifications } from './old/GiftNotifications';

import { CommentDrawer } from './old/CommentDrawer';
import { ShareDrawer } from './old/ShareDrawer';
import { useGifts } from '../hooks/useGifts';
import { useSocket } from '../hooks/useSocket';
import Avatar from './Avatar';
import { useStreamCount } from '../hooks/useStreamCount';
import { useSceneEngine } from '../contexts/SceneEngineContext';
import { toast } from 'sonner';

interface Creator {
    name: string;
    avatar: string;
    description: string;
    followers: number;
}

interface Scene {
    id: string;
    creator: Creator;
    backgroundColor?: string;
}

interface SceneWrapperProps {
    scene: Scene;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    index: number;
    toggleChat: () => void;
    debugMode?: boolean;
}

interface OrbitingBallProps {
    color: string;
    delay: boolean;
}

export function OrbitingBall({ color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} />
        </div>
    );
}

export function OrbitingBall2({ color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            {/* <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} /> */}
            <img src={`/bow2.svg`} alt="Orbiting Ball" className="w-6 h-6" />
        </div>
    );
}

export function SceneLoader() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* <Music4 className="w-8 h-8 text-white animate-pulse" /> */}
                </div>
                <div className="absolute inset-0 origin-center">
                    <OrbitingBall color="bg-[#FFFFFF]" delay={false} />
                    <OrbitingBall color="bg-[#FFFFFF]" delay={true} />
                </div>
            </div>
        </div>
    );
}

function SceneErrorFallback() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-300">
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                <p className="text-muted-foreground">Please try refreshing the page</p>
            </div>
        </div>
    );
}


function SceneContent({ scene, isActive, debugMode, orbitEnabled }: {
    scene: any,
    isActive: boolean,
    debugMode: boolean,
    orbitEnabled: boolean
}) {
    const { scenes, activeScene, sceneConfigIndex } = useScene();
    const { playBackgroundMusic, stopBackgroundMusic } = useSceneEngine();
    const currentScene = scenes[activeScene];
    const prevSceneRef = useRef<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    useEffect(() => {
        const sceneConfig = currentScene.sceneConfigs[sceneConfigIndex];
        let currentBgm = sceneConfig?.bgm || currentScene.bgm;
        
        // Stop any playing BGM
        stopBackgroundMusic();
        
        // Handle BGM playlist
        if (Array.isArray(currentBgm)) {
            const playNextTrack = () => {
                setCurrentTrackIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % currentBgm.length;
                    playBackgroundMusic(currentBgm[nextIndex]);
                    return nextIndex;
                });
            };

            // Play initial track
            playBackgroundMusic(currentBgm[currentTrackIndex]);
        } else if (currentBgm) {
            // Single track behavior
            playBackgroundMusic(currentBgm);
        }

        return () => {
            stopBackgroundMusic();
        };
    }, [activeScene, sceneConfigIndex]);

    useEffect(() => {
        if (prevSceneRef.current !== currentScene.id) {
            setIsLoading(true);

            // Cleanup previous scene
            if (prevSceneRef.current) {
                // Signal ThreeScene to cleanup
                window.dispatchEvent(new CustomEvent('cleanup-scene', {
                    detail: { sceneId: prevSceneRef.current }
                }));
            }

            // Load new scene after a short delay to ensure cleanup
            const loadTimer = setTimeout(() => {
                prevSceneRef.current = currentScene.id;
                setIsLoading(false);
            }, 300);

            return () => clearTimeout(loadTimer);
        }
    }, [currentScene.id]);

    // Add keyboard controls for debug mode
    // useEffect(() => {
    // //     if (!debugMode) return;

    // //     // const handleKeyDown = (e: KeyboardEvent) => {
    // //     //     // Dispatch custom event for ThreeScene to handle
    // //     //     window.dispatchEvent(new CustomEvent('debug-control', {
    // //     //         detail: { 
    // //     //             key: e.key,
    // //     //             shift: e.shiftKey,
    // //     //             ctrl: e.ctrlKey
    // //     //         }
    // //     //     }));
    // //     // };

    // //     // window.addEventListener('keydown', handleKeyDown);
    // //     return () => window.removeEventListener('keydown', handleKeyDown);
    // // }, [debugMode]);

    if (!isActive) return null;

    return (
        <Suspense fallback={<SceneLoader />}>
            {isLoading ? (
                <SceneLoader />
            ) : (
                <Canvas>
                    <ThreeScene key={currentScene.id} debugMode={debugMode} orbitEnabled={orbitEnabled} />
                    {orbitEnabled && <OrbitControls />}
                </Canvas>
            )}
        </Suspense>
    );
}

const SceneWrapper: React.FC<SceneWrapperProps> = ({
    scene,
    isFullscreen,
    toggleFullscreen,
    index,
    toggleChat,
    debugMode: initialDebugMode = false
}) => {
    const [debugMode, setDebugmode] = useState(initialDebugMode);
    const [orbitEnabled, setOrbitEnabled] = useState(false);

    const {
        likes,
        triggerLike,
        lastLikeTimestamp,
        setLikes,
        currentSceneIndex,
        setCurrentSceneIndex,
        activeScene,
        setActiveScene,
        scenes,
        currentAgentId
    } = useScene();
    const { peerCount } = useSocket();
    const { notifications, addNotification } = useGiftNotifications();
    const { audioRef } = useSceneEngine();
    // console.log({ audioRef })
    // useGifts(addNotification);
    const [isLiked, setIsLiked] = useState(false);
    const [isHeartAnimating, setIsHeartAnimating] = useState(false);

    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
    const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
    const [isGiftsDrawerOpen, setIsGiftsDrawerOpen] = useState(false);

    const viewerCount = useStreamCount(currentAgentId);

    const twitter = scenes[currentSceneIndex].twitter

    const handleLike = () => {
        setIsLiked(true);
        triggerLike();
        setTimeout(() => setIsLiked(false), 300);
    };


    // Update the viewport height effect to run immediately
    useEffect(() => {
        const updateHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        // Run immediately
        updateHeight();

        // Force a second update after a brief delay to handle any initial rendering issues
        const initialTimeout = setTimeout(updateHeight, 100);

        // Add resize listener
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(initialTimeout);
        };
    }, []);
    useEffect(() => {
        // Force fullscreen on mount
        if (!isFullscreen) {
            toggleFullscreen();
        }
    }, []);

    // Heart animation
    useEffect(() => {
        if (lastLikeTimestamp) {
            setIsHeartAnimating(true);
            const timer = setTimeout(() => setIsHeartAnimating(false), 100);
            return () => clearTimeout(timer);
        }
    }, [lastLikeTimestamp]);


    const handleShare = async () => {
        const url = `https://www.borptv.com/${scene.identifier}`;
        
        try {
            // Try the modern navigator.clipboard API first
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                toast.success('Link copied to clipboard');
            } catch (err) {
                toast.error('Failed to copy link');
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };

   // Empty dependency array means this runs once on mount

    return (
        <div className="h-full w-full snap-start snap-always flex flex-col">
            <div className="flex-1 relative">
                {/* 3D Scene - Always render */}
                <div className="absolute inset-0">
                    <SceneContent scene={scene} isActive={activeScene === index} debugMode={debugMode} orbitEnabled={orbitEnabled} />
                </div>

                {/* Background Image */}
                {/* {debugMode && (
                    <>
                        <img 
                            src="/images/camera.png "
                            alt="Debug Overlay"
                            className="absolute pointer-events-none bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] object-cover"
                            style={{ opacity: 0.8 }}
                        />
                    </>
                )} */}

                {/* Conditionally render everything else */}
                {!debugMode && (
                    <>
                        {/* Creator Info */}
                        <div
                            className={`
            absolute top-4 left-4 right-4 
            flex items-center justify-between z-10
            transition-opacity duration-300
            ${isFullscreen ? 'opacity-0 hover:opacity-100' : ''}
          `}
                        >
                            <div className="flex items-center gap-3 opacity-0">
                                <Avatar avatar={scene.creator.avatar} username={scene.creator.username} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-semibold text-sm md:text-base">
                                            {scene.creator.username}
                                        </h3>
                                        <span className="text-white/80 text-xs md:text-sm hidden md:inline">
                                            {scene.description}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-white/80">
                                        {/* <span className="hidden md:inline">Virtual Creator</span> */}
                                        <div className="flex items-center gap-1  bg-black/50 px-2 py-0.5 rounded-lg">
                                            <User size={12} className="text-pink-500" />
                                            <span>{viewerCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1  bg-black/50 px-2 py-0.5 rounded-lg">
                                            <Heart size={12} className="text-red-500" />
                                            <span>{likes}</span>
                                        </div>
                                        {/* <div className="flex items-center gap-1  bg-black/50 px-2 py-0.5 rounded-lg">
                                            <span>{scene.agentId}</span>
                                        </div> */}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={toggleFullscreen}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 md:px-4 md:py-1.5 rounded-full"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 size={16} className="text-white" />
                                    ) : (
                                        <Maximize2 size={16} className="text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setDebugmode(!debugMode)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 md:px-4 md:py-1.5 rounded-full"
                                >
                                    <Layout size={16} className="text-white" />
                                </button>
                                <button
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 md:px-4 md:py-1.5 rounded-full"
                                    onClick={() => handleShare()}
                                >
                                    <Share2 size={16} className="text-white" />
                                </button>
                                {/* <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 md:px-4 md:py-1.5 rounded-full">
                                    <MoreHorizontal size={16} className="text-white" />
                                </button> */}
                                <a
                                    href={`https://twitter.com/${twitter.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden md:flex items-center gap-2 bg-black text-white px-3 py-2 px-2 rounded-md font-medium text-sm hover:bg-black/80 no transition-all duration-200 ease-in-out"
                                >
                                    <img src={'./icons/x.svg'} alt="X" className="w-3 h-3" />
                                    <span className="text-sm font-medium">{twitter.replace('@', '@')}</span>
                                </a>
                                {/* <button
                                    onClick={() => setOrbitEnabled(!orbitEnabled)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 md:px-4 md:py-1.5 rounded-full"
                                >
                                    {orbitEnabled ? (
                                        <Unlock size={16} className="text-white" />
                                    ) : (
                                        <Lock size={16} className="text-white" />
                                    )}
                                </button> */}
                            </div>
                        </div>

                        {/* Side Actions */}

                        <SideActions
                            likes={likes}
                            isLiked={isLiked}
                            onLike={handleLike}
                            onCommentClick={() => setIsCommentDrawerOpen(true)}
                            onShareClick={() => setIsShareDrawerOpen(true)}
                            onGiftClick={() => setIsGiftsDrawerOpen(true)}
                            toggleChat={toggleChat}
                        />

                        <HeartAnimation isLiked={isHeartAnimating} />

                        <LiveChat />

                        <AIResponseDisplay />

                        <GiftNotifications notifications={notifications} />


                        <CommentDrawer
                            isOpen={isCommentDrawerOpen}
                            onClose={() => setIsCommentDrawerOpen(false)}
                            className="md:hidden"
                        />



                    


                    </>
                )}
                <ShareDrawer
                    isOpen={isShareDrawerOpen}
                    onClose={() => setIsShareDrawerOpen(false)}
                    className=""
                />


            </div>
        </div>
    );
};

export default SceneWrapper;
