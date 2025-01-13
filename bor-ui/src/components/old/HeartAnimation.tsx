import React, { useEffect, useState } from 'react';

interface HeartProps {
  isLiked: boolean;
}

let heartCounter = 0;

export function HeartAnimation({ isLiked }: HeartProps) {
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);

  useEffect(() => {
    if (isLiked) {
      const newHearts = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => ({
        id: ++heartCounter,
        left: Math.random() * 40 + 30, // Random position between 30-70%
      }));
      
      setHearts(prev => [...prev, ...newHearts]);

      // Remove hearts after animation
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => !newHearts.find(h => h.id === heart.id)));
      }, 1500);
    }
  }, [isLiked]);

  return (
    <div className="absolute bottom-0 right-0 w-32 h-full overflow-hidden pointer-events-none">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute bottom-0 animate-float-heart"
          style={{
            left: `${heart.left}%`,
          }}
        >
          <div className="text-3xl">❤️</div>
        </div>
      ))}
    </div>
  );
}