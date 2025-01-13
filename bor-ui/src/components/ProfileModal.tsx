import { useState, useEffect } from 'react';
import { X, Upload, Copy, ExternalLink } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const DEFAULT_PFPS = [
  '/pfp_blue.png',
  '/pfp_green.png',
  '/pfp_orange.png',
  '/pfp_pink.png',
  '/pfp_red.png',
  '/pfp_violet.png',
  '/pfp_yellow.png',
];



export function ProfileModal() {
  const { userProfile, updateProfile, showProfileModal, setShowProfileModal } = useUser();

  const [handle, setHandle] = useState(userProfile?.handle || '');
  const [pfp, setPfp] = useState(userProfile?.pfp || DEFAULT_PFPS[0]);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
        try {
          setBalance(555);//@voir
        } catch (err) {
          console.error('Error fetching balance:', err);
        }
      
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handle.trim()) {
      setError('Handle is required');
      return;
    }

    if (handle.length < 3) {
      setError('Handle must be at least 3 characters');
      return;
    }

    updateProfile({
      handle: handle.trim(),
      pfp
    });
    setShowProfileModal(false);
  };

  
  if (!showProfileModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-lg dark:text-gray-200">
            {userProfile ? 'Update Profile' : 'Create Profile'}
          </h3>
          <button
            onClick={() => userProfile && setShowProfileModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} className="dark:text-gray-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          

<div>
            <label htmlFor="handle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Handle
            </label>
            <input
              type="text"
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#fe2c55] focus:border-transparent"
              placeholder="@username"
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Picture
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DEFAULT_PFPS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPfp(url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    pfp === url 
                      ? 'border-[#fe2c55]' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img 
                    src={url} 
                    alt="Profile option" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
              <button
                type="button"
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500"
              >
                <Upload size={24} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </div>


          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#fe2c55] to-[#ff4975] text-white py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            {userProfile ? 'Update Profile' : 'Create Profile'}
          </button>

         
        </form>
      </div>
    </div>
  );
}