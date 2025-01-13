import { useEffect, useRef, useState } from 'react';
import { Terminal, X, Heart } from 'lucide-react';
import { useScene } from '../contexts/ScenesContext';

interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TerminalOverlay({ isOpen, onClose }: TerminalOverlayProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([]);
  const { currentAgentId } = useScene();

  useEffect(() => {
    if (!isOpen) {
      setLines([]);
      return;ma
    }

    const thoughts = [
      "✧･ﾟ Initializing Borp's neural pathways ･ﾟ✧",
      "♡ Loading kawaii personality matrix ♡",
      "✿ Analyzing conversation vibes ✿",
      "♪ Processing emotional patterns ♪",
      "✧ Generating cute response ✧",
      "♡ Calibrating sweet voice ♡",
      "✿ Adjusting expression parameters ✿",
      "♪ Synchronizing dance moves ♪",
      "✧･ﾟ Ready to make friends! ･ﾟ✧",
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < thoughts.length) {
        setLines(prev => [...prev, thoughts[currentIndex]]);
        currentIndex++;
        
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen, currentAgentId]);

  return (
    <>
      {isOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-[100] animate-fadeIn">
          <div className="absolute inset-0 bg-black/95 animate-fadeIn">
            {/* Terminal Header */}
            <div className="bg-[#2a1a1f]/80 px-3 py-1.5 flex items-center justify-center border-b border-[#fe2c55]/20">
              <div className="flex items-center gap-1.5">
                <Heart size={10} className="text-[#fe2c55]/70 animate-pulse" />
                <span className="text-[#fe2c55]/70 text-xs font-mono tracking-wide">
                  Borp's Thought Process ♡
                </span>
                <Heart size={10} className="text-[#fe2c55]/70 animate-pulse" />
              </div>
              <button
                onClick={onClose}
                className="absolute right-2 text-[#fe2c55]/50 hover:text-[#fe2c55] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalRef}
              className="h-[calc(100vh-4rem-2.5rem)] overflow-y-auto p-4 font-mono text-sm bg-[url('/cute.png')] bg-cover bg-center bg-opacity-5"
            >
              <div className="max-w-4xl mx-auto backdrop-blur-sm p-6 rounded-lg border border-[#fe2c55]/10">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="text-[#ff9eb6] mb-3 flex items-start opacity-90 hover:opacity-100 transition-opacity animate-slideIn"
                  >
                    <span className="text-[#fe2c55] mr-2">{'❀'}</span>
                    <span className="flex-1 animate-typewriter border-r-2 border-[#fe2c55] animate-cursor-blink">
                      {line}
                    </span>
                  </div>
                ))}
                <div className="h-4 w-2 bg-[#fe2c55] animate-pulse inline-block" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}