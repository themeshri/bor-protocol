import { Home, Compass, Users2, Radio, User, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useScene } from '../contexts/ScenesContext';
import Avatar from './Avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

import { SuggestedCreator } from './SuggestedCreator';
import { Entry } from './chat/Entry';
import { Link } from 'react-router-dom';

const navigationItems = [
  { icon: <Home size={18} />, text: "For You", active: true },
  { icon: <Compass size={18} />, text: "Explore", comingSoon: true },
  { icon: <Users2 size={18} />, text: "Following", comingSoon: true },
  { icon: <Radio size={18} />, text: "LIVE", comingSoon: true },
  { icon: <User size={18} />, text: "Profile", comingSoon: true }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { isMobile, isTablet } = useResponsive();
  const { setCurrentSceneIndex, setActiveScene, scenes } = useScene();

  const suggestedCreators = scenes
    .filter(scene => scene.creator && scene.type === 'stream')
    .map((scene, index) => ({
      name: scene.creator!.username,
      description: scene.creator!.title,
      viewers: scene.stats.likes.toLocaleString(),
      avatar: scene.creator!.avatar,
      agentId: scene.agentId,
      sceneIndex: index
    }));

  const handleCreatorClick = (sceneIndex: number) => {
    setCurrentSceneIndex(sceneIndex);
    setActiveScene(sceneIndex);

    const sceneElement = document.querySelector(`[data-scene-index="${sceneIndex}"]`);
    sceneElement?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isTablet) {
      setIsCollapsed(true);
    } else if (!isMobile) {
      setIsCollapsed(false);
    }
  }, [isTablet, isMobile]);

  if (isMobile) return null;

  return (
    <div
      className={`relative h-[calc(100vh-64px)] bg-white dark:bg-zinc-900 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-[48px]' : 'w-[240px]'
        }`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-1">
          {navigationItems.map((item, index) => (
            <div key={index}>
              <div
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 ${item.comingSoon ? 'opacity-60' : 'cursor-pointer'
                  } ${item.active ? 'text-gray-800 dark:text-gray-100' : 'text-gray-800 dark:text-gray-100'}`}
              >
                {item.icon}
                <div className="flex items-center justify-between flex-1">
                  <span className={`font-medium text-[15px] transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                    }`}>
                    {item.text}
                  </span>
                  {item.comingSoon && !isCollapsed && (
                    <span className="invisible group-hover:visible bg-[#fe2c55] px-2 py-0.5 rounded text-white text-[11px] font-medium ml-2">
                      Coming Soon!
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

       
        <div className="my-3 border-t border-gray-200 dark:border-white/10" />

        {/* Suggested Creators - Expanded View */}
        <div className={`transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
          <h3 className="text-xs font-medium mb-2 px-3 text-gray-700 dark:text-gray-200">
            Suggested creators
          </h3>
          <div className="space-y-2 px-2">
            {suggestedCreators.map((creator) => (
              <SuggestedCreator key={creator.name} creator={creator} onCreatorClick={handleCreatorClick} />
            ))}
          </div>
        </div>

        {/* Suggested Creators - Collapsed View */}
        <div className={`px-1 space-y-2 mt-2 ${isCollapsed ? 'block' : 'hidden'}`}>
          {suggestedCreators.map((creator) => (
            <TooltipProvider key={creator.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => handleCreatorClick(creator.sceneIndex)}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden mx-auto ring-1 ring-gray-200 dark:ring-white/10 transition-all duration-200 hover:ring-red-500 hover:ring-2">

                      <div className="w-8 h-8 rounded-full overflow-hidden mx-auto ring-1 ring-white/10 transition-all duration-200 hover:ring-red-500 hover:ring-2">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{creator.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{creator.viewers} viewers</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className={`border-t border-gray-200 dark:border-white/10 transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'
        }`}>
        <a href="https://www.borptv.com/launch">
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
        </a>
      </div>

      <div className={`p-4 border-t border-gray-200 dark:border-white/10 transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'
        }`}>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          {/* <div>Company</div> */}

          {/* <Link to="https://discord.gg/dw3zpyBS" className="block hover:text-[#fe2c55] transition-colors">Discord</Link> */}
          <Link to="https://x.com/watch_borp" className="block hover:text-[#fe2c55] transition-colors">X</Link>
          <Link to="/docs" className="block hover:text-[#fe2c55] transition-colors">Docs</Link>
          {/* <div>Terms & Policies</div> */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="text-xs">v1.1</div>
            </div>
            <div className="text-xs text-gray-500">Powered by Eliza</div>
          </div>
        </div>
      </div>

      {
        !isTablet && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-4 top-1/4 w-4 h-12 bg-gray-200 dark:bg-zinc-800 
          rounded-r-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-zinc-700 
          transition-colors z-10"
          >
            {isCollapsed ? (
              <ChevronRight size={12} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronLeft size={12} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>
        )
      }
    </div >
  );
}