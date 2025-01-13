import { ChatSection } from './ChatSection';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useScene } from '../contexts/ScenesContext';
import SceneWrapper from './SceneWrapper';
import { useParams, useNavigate } from 'react-router-dom';

export function LiveStream() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);//
  const {
    triggerLike,
    setCurrentSceneIndex,
    activeScene,
    setActiveScene,
    scenes
  } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const { modelName } = useParams<{ modelName: string }>();

  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);

  // Handle model name from URL
  useEffect(() => {
    if (modelName) {
      const sceneIndex = scenes.findIndex(scene => scene.modelName?.toLowerCase() === modelName.toLowerCase());
      if (sceneIndex !== -1) {
        setCurrentSceneIndex(sceneIndex);
        setActiveScene(sceneIndex);
        const sceneElement = document.querySelector(`[data-scene-index="${sceneIndex}"]`);
        sceneElement?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [modelName, scenes, setCurrentSceneIndex, setActiveScene]);
    
  // Scroll down multiple scenes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            if (entry.isIntersecting) {
              if (timeout) clearTimeout(timeout);


              setCurrentSceneIndex(index);
              timeout = setTimeout(() => {
                setActiveScene(index);
                console.log('Scrolled to scene:', {
                  index,
                  sceneId: scenes[index].id,
                  sceneType: scenes[index].type
                });
              }, 50);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
        rootMargin: '-10% 0px',
      }
    );

    const sceneElements = container.querySelectorAll('[data-index]');
    sceneElements.forEach((scene) => observer.observe(scene));

    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [setCurrentSceneIndex, setActiveScene, scenes]);



  // Handle like ******
  const handleLike = () => {
    setIsLiked(true);
    triggerLike();
    setTimeout(() => setIsLiked(false), 300);
  };


  // Handle double tap to like
  useEffect(() => {
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        handleLike();
        e.preventDefault();
      }
      lastTap = currentTime;
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchend', handleDoubleTap);
      return () => element.removeEventListener('touchend', handleDoubleTap);
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsChatOpen(false);
  };


  return (
    <div className="flex flex-1 h-full w-full">
      {/* Main content area */}
      <div className="flex-1 flex-col min-w-0">

        <div
          ref={containerRef}
          className={`
            h-full w-full overflow-auto snap-y snap-mandatory
            ${isFullscreen ? 'fixed inset-0 z-[60] bg-black' : ''}
          `}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {scenes.map((scene, index) => (
            <div
              key={scene.id || `${scene.someUniqueValue}-${index}`}
              data-index={index}
              data-scene-index={index}
              className="h-full w-full snap-start snap-always flex flex-col"
            >
              <SceneWrapper
                scene={scene}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
                index={index}
                toggleChat={() => setIsChatOpen(!isChatOpen)}
              />

              {/* Gift Bar */}
              <div className={`
                flex-none bg-[#18181b]/95 backdrop-blur-sm
                transition-opacity duration-300
                
                ${isFullscreen ? 'opacity-0 hover:opacity-100' : ''}
              `}>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile chat toggle button */}
        {/* {!isFullscreen && (
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="md:hidden fixed bottom-24 right-4 z-50 bg-[#fe2c55] text-white px-4 py-2 rounded-full shadow-lg"
          >
            {isChatOpen ? 'Close' : 'Chat'}
          </button>
        )} */}
      </div>

      {/* Chat section */}
      {isFullscreen && (
        <div
          className={`
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} 
            fixed md:relative md:translate-x-0 
            right-0 top-16 bottom-0 
            w-full md:w-[320px] md:min-w-[320px]
            z-40 
            transition-transform duration-300 ease-in-out 
            md:top-0
            md:h-full
            md:border-l md:border-gray-100 md:dark:border-gray-700
          `}
        >
          <ChatSection onClose={() => setIsChatOpen(false)} />
        </div>
      )}

    </div>
  );
}