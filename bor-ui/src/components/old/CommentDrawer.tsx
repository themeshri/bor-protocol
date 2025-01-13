import React from 'react';
import { useScene } from '../../contexts/ScenesContext';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function CommentDrawer({ isOpen, onClose, className = '' }: CommentDrawerProps) {

  const { comments } = useScene();
  // // console.log({comments});

  return (
    <div className={`${className} ${isOpen ? 'block' : 'hidden'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={onClose}
      />
      <div
        className={`absolute left-0 right-0 bottom-0 bg-[#1C1C1E] transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: '45%',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
        }}
      >
        <div className="h-1 w-10 bg-gray-600 rounded-full mx-auto my-3" />
        
        <div className="px-4 pb-3 flex justify-between items-center">
          <h2 className="text-white text-lg font-medium">Comments</h2>
          <button onClick={onClose} className="text-white/80 p-2">✕</button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          <div className="p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-700" />
                <div>
                  <span className={`font-medium ${comment.color}`}>{comment.user}</span>
                  <p className="text-white mt-1">{comment.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}