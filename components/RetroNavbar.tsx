'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface DesktopIcon {
  id: string;
  icon: string;
  label: string;
  type: "app" | "link" | "folder";
  action: () => void;
  folder?: string;
  iconImage?: string;
}

interface RetroNavbarProps {
  desktopIcons?: DesktopIcon[];
  openWindowsList?: { key: string; icon: string; iconImage?: string; label: string }[];
  activeWindow?: string | null;
  onTaskbarClick?: (key: string) => void;
  session?: any;
}

const RetroNavbar = ({ 
  desktopIcons = [], 
  openWindowsList = [], 
  activeWindow = null, 
  onTaskbarClick,
  session 
}: RetroNavbarProps) => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('--:--');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const folderCategories = ['SYSTEM', 'SPOŁECZNOŚĆ', 'ROZRYWKA', 'ZASOBY'];

  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-[#c0c0c0] border-b-2 border-b-black border-t-2 border-t-white flex items-center px-1 gap-1 z-[200] font-mono text-xs">
      {/* Start Button */}
      <button
        onClick={() => setShowStartMenu(!showStartMenu)}
        className={`px-3 h-7 flex items-center gap-1 font-bold border-2 ${showStartMenu ? 'border-t-black border-l-black border-r-white border-b-white bg-[#dfdfdf]' : 'border-t-white border-l-white border-r-black border-b-black bg-[#c0c0c0]'} active:bg-[#dfdfdf] shadow-sm`}
      >
        <span className="text-lg">🪟</span>
        <span className="hidden sm:inline">Start</span>
      </button>

      {/* Start Menu Popup (Retro Style with Categories) */}
      {showStartMenu && (
        <div className="absolute top-9 left-1 w-64 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black z-[210] shadow-xl p-1">
          <div className="bg-[#808080] text-white p-2 font-bold flex items-center gap-2 mb-1 border-b border-gray-400">
            <span className="text-xl">🚀</span> KUPMAX OS v1.0
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {folderCategories.map(category => (
                <div key={category} className="mb-1">
                    <div className="px-2 py-1 font-bold text-left text-[10px] bg-gray-400 text-gray-800 border-b border-gray-500 uppercase">{category}</div>
                    <div className="bg-white py-1">
                        {desktopIcons.filter(icon => icon.folder === category).map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.action();
                                    setShowStartMenu(false);
                                }}
                                className="w-full text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs"
                            >
                                {item.iconImage ? (
                                    <img src={item.iconImage} alt="" className="w-4 h-4 object-contain" />
                                ) : (
                                    <span className="text-base">{item.icon}</span>
                                )}
                                <span>{item.label.replace('.exe', '')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            
            <div className="border-t-2 border-gray-300 my-1"></div>
            
            {/* Direct Links (External) */}
            <div className="px-2 py-1 font-bold text-[10px] bg-gray-400 text-gray-800 border-b border-gray-500 uppercase">LINKS</div>
            <div className="bg-white py-1">
                {desktopIcons.filter(icon => !icon.folder && icon.type === 'link').map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            item.action();
                            setShowStartMenu(false);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs"
                    >
                        {item.iconImage ? (
                            <img src={item.iconImage} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                            <span className="text-base">{item.icon}</span>
                        )}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
          </div>

          <div className="border-t-2 border-gray-400 mt-1"></div>
          {session ? (
            <button
              onClick={() => { signOut(); setShowStartMenu(false); }}
              className="w-full text-left px-3 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-3 font-bold bg-gray-300 border-t border-white"
            >
              <span>🔑</span>
              <span>Wyloguj</span>
            </button>
          ) : (
            <Link
              href="/retro-admin"
              onClick={() => setShowStartMenu(false)}
              className="w-full text-left px-3 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-3 font-bold bg-gray-300 border-t border-white"
            >
              <span>🔑</span>
              <span>Zaloguj Admin</span>
            </Link>
          )}
        </div>
      )}

      {/* Taskbar Buttons (Open Windows) */}
      <div className="flex gap-1 flex-1 overflow-x-auto h-full items-center no-scrollbar px-1">
        {openWindowsList.map((win) => (
          <button
            key={win.key}
            onClick={() => onTaskbarClick?.(win.key)}
            className={`px-2 h-7 text-[10px] flex items-center gap-1 min-w-[80px] max-w-[150px] border-2 transition-all ${activeWindow === win.key ? 'bg-[#c0c0c0] font-bold border-t-black border-l-black border-r-white border-b-white shadow-inner' : 'bg-[#dfdfdf] border-t-white border-l-white border-r-black border-b-black'} active:shadow-inner`}
          >
            {win.iconImage ? (
              <img src={win.iconImage} alt="" className="w-3 h-3 object-contain" />
            ) : (
              <span className="text-sm">{win.icon}</span>
            )}
            <span className="truncate">{win.label}</span>
          </button>
        ))}
      </div>

      {/* Clock & System Tray */}
      <div className="px-3 h-7 bg-[#c0c0c0] border-2 border-t-black border-l-black border-r-white border-b-white shadow-inner flex items-center font-bold text-[#000] ml-1">
        {currentTime}
      </div>
      
      {/* Backdrop for closing menu */}
      {showStartMenu && (
        <div 
          className="fixed inset-0 z-[190]" 
          onClick={() => setShowStartMenu(false)}
        />
      )}
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default RetroNavbar;
