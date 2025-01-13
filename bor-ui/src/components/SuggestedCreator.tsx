import { Heart, User } from "lucide-react";
import { useViewerCount } from "../hooks/useViewerCount";
import Avatar from "./Avatar";
import { useEffect, useState } from "react";

interface SuggestedCreatorProps {
    creator: {
        name: string;
        description: string;
        viewers: string;
        avatar: string;
        sceneIndex: number;
        agentId: string;
    };
    onCreatorClick: (sceneIndex: number) => void;
}

export function SuggestedCreator({ creator, onCreatorClick }: SuggestedCreatorProps) {
    const viewerCount = useViewerCount(creator.agentId);
    const likeCount = 0;
    const [animateCount, setAnimateCount] = useState(false);

    useEffect(() => {
        setAnimateCount(true);
        const timer = setTimeout(() => setAnimateCount(false), 300); // Reset animation
        return () => clearTimeout(timer);
    }, [viewerCount]); // Trigger animation when viewerCount changes

    return (
        <div
            className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md cursor-pointer"
            onClick={() => onCreatorClick(creator.sceneIndex)}
        >
            <Avatar avatar={creator.avatar} username={creator.name} />
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium truncate text-gray-900 dark:text-gray-200">
                    {creator.name}
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                    {creator.description}
                </p>
            </div>
            <div className="flex items-center gap-1 px-3 text-pink-500">
                <User className="w-4 h-4"/>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 overflow-hidden">
                    <span 
                        className={`inline-block transition-transform duration-300 ${
                            animateCount ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                        }`}
                    >
                        {viewerCount}
                    </span>
                </span>
                {/* <Heart className="w-4 h-4 text-red-500 ml-2"/>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 overflow-hidden">
                    <span 
                        className={`inline-block transition-transform duration-300 ${
                            animateCount ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                        }`}
                    >
                        {likeCount}
                    </span>
                </span> */}
            </div>
        </div>
    );
} 