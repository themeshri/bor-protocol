import { useScene } from '../contexts/ScenesContext';
import { useTopGifters } from '../hooks/useGiftsApi';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface TopStreamer {
  id: string;
  username: string;
  avatar: string;
  rank: number;
  coins: number;
  handle?: string;
  pfp?: string;
}



interface TopViewersProps {
  expanded: boolean;
  onToggle: () => void;
}

export function TopViewers({ expanded, onToggle }: Omit<TopViewersProps, 'streamers'>) {
  const { currentAgentId } = useScene();
  const { data: topViewers, isLoading } = useTopGifters(currentAgentId, 3);

  // Helper function to format Solana address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Array of NFT avatar URLs
  const avatarUrls = [
    'https://i.seadn.io/gcs/files/e087a961e54ea4429b46518105aca28c.png?auto=format&dpr=1&w=1000',
    'https://i.seadn.io/gcs/files/b80df858f6a00a9a74e26bd1aa7a460e.png?auto=format&dpr=1&w=1000',
    'https://i.seadn.io/gcs/files/2cacd360104c0b02781edba7272108c6.png?auto=format&dpr=1&w=1000'
  ];

  // Transform API data into TopStreamer format
  const streamers: TopStreamer[] = topViewers?.topGifters.map((gifter, index) => ({
    id: gifter._id,
    username: formatAddress(gifter._id),
    avatar: gifter.pfp || avatarUrls[index % avatarUrls.length], // Cycle through the avatars
    rank: index + 1,
    coins: gifter.totalCoins,
    handle: gifter.handle ?? formatAddress(gifter._id),
    pfp: gifter.pfp ?? avatarUrls[index % avatarUrls.length]
  })) || [];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse flex gap-6">
      {/* First place skeleton */}
      <div className="flex-1">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="mt-2 w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      {/* Second and third place skeletons */}
      <div className="flex-1 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="border-b border-gray-100 dark:border-[#1f1f1f]">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Top viewers</span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-3">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="flex gap-6">
              {/* First Place */}
              <div className="flex-1">
                {streamers[0] && (
                  <div className="relative">
                    <div className="absolute -top-1 left-0 text-4xl font-bold text-[#FCF4D6]">1</div>
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={streamers[0].pfp}
                          alt={streamers[0].handle}
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#FCF4D6]"
                        />
                        <div className="absolute -bottom-1 right-0 flex items-center gap-0.5 bg-black rounded-full px-1.5 py-0.5">
                          <span className="text-[#FFD700] text-[10px]">●</span>
                          <span className="text-white text-[10px] font-medium">{streamers[0].coins}</span>
                        </div>
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {streamers[0].handle}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Second and Third Place */}
              <div className="flex-1">
                {streamers.slice(1).map((streamer, index) => (
                  <div key={streamer.id} className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-[#EDF3F4]' : 'text-[#FBDFCC]'
                    }`}>
                      {index + 2}
                    </span>
                    <div className="relative">
                      <img
                        src={streamer.pfp}
                        alt={streamer.handle}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 right-0 flex items-center gap-0.5 bg-black rounded-full px-1.5 py-0.5">
                        <span className="text-[#FFD700] text-[10px]">●</span>
                        <span className="text-white text-[10px] font-medium">{streamer.coins}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {streamer.handle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}