import { Heart, MessageCircle, Share2, Gift, Shirt } from 'lucide-react';
import { useScene } from '../../contexts/ScenesContext';

interface InteractionButtonsProps {
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onGiftClick: () => void;
  toggleChat: () => void;
}

export function SideActions({
  likes,
  isLiked,
  onLike,
  onCommentClick,
  onShareClick,
  onGiftClick,
  toggleChat
}: InteractionButtonsProps) {

  const { comments, commentCount, cycleSceneConfig } = useScene()

  return (
    <div className="absolute bottom-48 md:mb-[250px] right-2 flex flex-col items-center space-y-4 z-100 mb-250px">
{/* 
       <button
        onClick={cycleSceneConfig}
        className="flex flex-col items-center space-y-1 group"
      >
        <div className={`p-2 rounded-full bg-black/20 transition-transform duration-300 ${isLiked ? 'scale-125' : ''} z-100`}>
          <Shirt size={28} className="text-white group-hover:text-gray-300" />
        </div>
      </button> 
  */}
      <button
        onClick={onLike}
        className="flex flex-col items-center space-y-1 group md:hidden"
      >
        <div className={`p-2 rounded-full bg-black/20 transition-transform duration-300 ${isLiked ? 'scale-125' : ''} z-100`}>
          <Heart
            size={28}
            className={`transition-colors duration-300 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-500'}`}
          />
        </div>
        <span className="text-white text-sm">{likes < 10000 ? likes : `${(likes / 1000).toFixed(1)}k`}</span>
      </button>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={() => toggleChat()}
          className="md:hidden flex flex-col items-center space-y-1 group"
        >
          <div className="p-2 rounded-full">
            <MessageCircle size={28} className="text-white group-hover:text-gray-300" />
          </div>
          <span className="text-white text-sm text-muted-foreground">{commentCount}</span>
        </button>

        <button
          onClick={onShareClick}
          className="md:hidden flex flex-col items-center space-y-1 group"
        >
          <div className="p-2 rounded-full">
            <Share2 size={28} className="text-white group-hover:text-gray-300" />
          </div>
          <span className="text-white text-sm">Share</span>
        </button>

      </div>
    </div>
  );
}
