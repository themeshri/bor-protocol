import { Moon, Sun, Circle, Pencil, Coins, Terminal } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { RechargeModal } from './RechargeModal';
import { TerminalOverlay } from './TerminalOverlay';
import { BORP_MINT, COIN_LOGO } from '../utils/constants';
import { useTokenBalance } from '../hooks/useTokenBalance';

interface HeaderProps {
  onMenuClick: () => void;
}





// const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// const USDC_DECIMALS = 6;

export function Header({ onMenuClick }: HeaderProps) {
 
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { userProfile, setShowProfileModal } = useUser();
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [solBalance, setSolBalance] = useState<string>('0');
  const [showTerminal, setShowTerminal] = useState(false);


  // console.log({ usdcQuery, BORP_MINT, publicKey })
  const borpBalance = 10//@voir

  // // console.log({ showRechargeModal })

  return (
    <>
      <header className="h-16 bg-white dark:bg-dark-gray-1 border-b border-gray-100 dark:border-dark-gray-3 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <img
            src="icons/borptext2.svg"
            alt="Logo"
            className="w-16 h-6 brightness-0 dark:brightness-100"
          />
          <img
            src="/bow2.svg"
            alt="TV Logo"
            className="w-8 h-8 "
          />

          {/* <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Borp.tv</h1> */}
        </div>

        <div className="flex items-center gap-4">
          {/* <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-gray-3 rounded-full"
          >
            <Terminal size={20} className="text-gray-600 dark:text-gray-400" />
          </button> */}

          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-gray-3 rounded-full"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-dark-text-secondary" />
            ) : (
              <Moon size={20} />
            )}
          </button>



              <div className="flex items-center gap-2">
                <div className="relative group">
                  <img
                    src={userProfile?.pfp || ''}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-100 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil size={14} className="text-white" />
                  </button>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-100 group-hover:opacity-100 transition-opacity">
                    {userProfile?.handle || ''}
                  </div>
                </div>
              </div>
          

        </div>
      </header>


     
      <TerminalOverlay
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </>
  );
}