import { useScene } from '../contexts/ScenesContext';
import { X, Loader2 } from 'lucide-react';
import Avatar from './Avatar';

interface GiftConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  gift: {
    name: string;
    icon: string;
    count: number;
    coins: number;
  } | null;
  isSending: boolean;
}

  export function GiftConfirmationModal({ isOpen, onClose, onConfirm, gift, isSending }: GiftConfirmationModalProps) {
    
    const { scene } = useScene();
    // // console.log('GiftConfirmationModal', { isOpen, gift })

    if (!isOpen || !gift) return null;

    const totalCost = gift.coins * gift.count;

    const handleConfirm = () => {
      onConfirm();
    };

    const handleClose = () => {
      onClose();
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full animate-fade-in pointer-events-auto">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-start gap-2">
         
            <img src={scene?.creator?.avatar} alt="Avatar" className="w-10 h-10 rounded-full mr-2 ring-2 ring-pink-500" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {scene?.creator ? `Confirm Gift to ${scene.creator.username}` : 'Confirm Gift'}
            </h3>
            {!isSending && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full ml-auto"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-3xl">
                {gift.icon}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {gift.count}x {gift.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total cost: {totalCost} BORP
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {!isSending && (
                <button 
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 z-50 ml-4"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-[#fe2c55] text-white rounded-lg hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }