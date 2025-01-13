import { Diamond, Gift } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';
import { useScene } from '../../contexts/ScenesContext';
import { useSocket } from '../../hooks/useSocket';
import { useUser } from '../../contexts/UserContext';

function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 65%)`; // Using HSL for better control over brightness
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

export function LiveChat() {
  const { comments, addComment } = useScene();
  const [inputValue, setInputValue] = useState("");
  const [canSend, setCanSend] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string,
    message: string,
    isSystem: boolean,
    timestamp: number
  }>>([]);
  const [showError, setShowError] = useState(false);
  const { userProfile } = useUser();


 

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(time => time - 1);
      } else {
        setCanSend(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

   


    addComment(inputValue.trim());
    setInputValue("");
    setCanSend(false);
    setTimeLeft(3);
  };

  // // console.log({comments});
 
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[0] p-4 bg-gradient-to-t from-black/70 to-transparent">
      <div className="mb-4 space-y-0.5 overflow-hidden">
        {comments
          .slice(Math.max(comments.length - 7, 0))
          .map((comment) => (
            <div
              key={comment.id}
              className="group flex items-start space-x-3 p-1 rounded-lg 
                animate-slide-up transition-all duration-300 ease-out"
            >
              <div className="relative pt-1">
                <img 
                  src={comment.avatar} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full ring-2 ring-white-500/50 
                    group-hover:ring-white-500 transition-all" 
                />
                {/* <div className="absolute -bottom-1 -right-1 w-3 h-3 
                  bg-green-500 rounded-full border-1 border-black"></div> */}
              </div>
              
              <div className="flex-1 max-w-sm">
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-bold text-sm text-white/80">
                    {comment.handle}
                  </span>
                </div>
                
                <div>
                  {comment.message.includes('diamonds') ? (
                    <div className="flex items-center space-x-2 bg-yellow-500/10 
                      px-3 py-1.5 rounded-full inline-block">
                      <Diamond className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-100 text-sm">{truncateText(comment.message, 100)}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] leading-tight text-white/70">
                      {truncateText(comment.message, 100)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

        {localMessages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-center space-x-2 p-2 rounded-lg 
              bg-red-500/10 animate-slide-up"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-white-400 text-sm italic">{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}