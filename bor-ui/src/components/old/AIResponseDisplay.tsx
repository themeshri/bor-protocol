import React, { useEffect, useState } from 'react';
import { useSceneEngine } from '../../contexts/SceneEngineContext';
import { AGENT_MAP } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Gift } from 'lucide-react';

export default function AIResponseDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  const { currentResponse, audioRef } = useSceneEngine();

  const isRightSide = true;

  useEffect(() => {
    if (!currentResponse?.text) return;
    setIsVisible(true);
    return () => setIsVisible(false);
  }, [currentResponse?.text]);

  if (!currentResponse?.text) return null;

  const { 
    text, 
    replyToUser: replyTo, 
    replyToMessage, 
    replyToHandle, 
    replyToPfp, 
    isGiftResponse, 
    agentId 
  } = currentResponse;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed ${isRightSide ? 'right-4' : 'left-4'} top-10 z-50 w-[90%] max-w-md`}
        >
          <div className="bg-black/20 rounded-2xl">
            {/* Agent Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/25 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {AGENT_MAP[agentId]?.name?.[0] || 'A'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {AGENT_MAP[agentId]?.name || 'Bor'}
                  </h3>
                  <p className="text-xs text-white/90">
                    {isGiftResponse ? 'Sending a gift' : 'Responding'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reply Context */}
            {replyTo && (
              <div className="px-4 py-2 bg-black/25">
                <div className="flex items-center gap-2">
                  <img src={replyToPfp} alt={replyToHandle} className="w-5 h-5 rounded-full" />
                  <span className="text-sm text-white">
                    Replying to {replyToHandle}
                  </span>
                  {isGiftResponse ? 
                    <Gift size={14} className="text-white/90" /> : 
                    <MessageCircle size={14} className="text-white/90" />
                  }
                </div>
                {replyToMessage && (
                  <p className="mt-1 text-sm text-white/90 italic">
                    "{replyToMessage}"
                  </p>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-white leading-relaxed font-normal">
                  {text}
                </p>
              </div>

              {/* Audio Visualization
              {audioRef.current && !audioRef.current.paused && (
                <div className="mt-4 flex gap-1 justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-4 bg-white/40 rounded-full"
                      animate={{
                        height: [4, 16, 4],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )} */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}