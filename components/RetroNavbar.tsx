'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const RetroNavbar = () => {
  const { data: session } = useSession();
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

  const navLinks = [
    { label: 'Pulpit', href: '/', icon: '🪟' },
    { label: 'Photos', href: '/photos', icon: '📸' },
    { label: 'Pentomino', href: '/tetris', icon: '🕹️' },
    { label: 'Shop', href: '/shop', icon: '🛒' },
    { label: 'Forum', href: '/forum', icon: '🗨️' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-[#c0c0c0] border-b-2 border-b-black border-t-2 border-t-white flex items-center px-1 gap-2 z-[200] font-mono text-xs sm:text-sm">
      {/* Start Button */}
      <button
        onClick={() => setShowStartMenu(!showStartMenu)}
        className={`px-2 h-7 flex items-center gap-1 font-bold border-2 ${showStartMenu ? 'border-t-black border-l-black border-r-white border-b-white bg-[#dfdfdf]' : 'border-t-white border-l-white border-r-black border-b-black bg-[#c0c0c0]'} active:bg-[#dfdfdf] shadow-sm`}
      >
        <span className="text-lg">🪟</span>
        <span>Start</span>
      </button>

      {/* Start Menu Popup */}
      {showStartMenu && (
        <div className="absolute top-9 left-1 w-56 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black z-[210] shadow-xl p-1">
          <div className="bg-[#808080] text-white p-2 font-bold flex items-center gap-2 mb-1">
            <span className="text-xl">🚀</span> KupMax OS
          </div>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowStartMenu(false)}
                className="w-full text-left px-3 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-3"
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-400 my-1"></div>
            {session ? (
              <button
                onClick={() => { signOut(); setShowStartMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-3 font-bold"
              >
                <span>🔑</span>
                <span>Wyloguj</span>
              </button>
            ) : (
              <Link
                href="/retro-admin"
                onClick={() => setShowStartMenu(false)}
                className="w-full text-left px-3 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-3 font-bold"
              >
                <span>🔑</span>
                <span>Zaloguj</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="hidden md:flex gap-1 overflow-x-auto flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 h-7 bg-[#dfdfdf] border-2 border-t-white border-l-white border-r-black border-b-black flex items-center gap-2 hover:bg-white transition-colors"
          >
            <span>{link.icon}</span>
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        ))}
      </div>
      
      <div className="flex-1 md:hidden"></div>

      {/* Clock */}
      <div className="px-3 h-7 bg-[#c0c0c0] border-2 border-t-black border-l-black border-r-white border-b-white shadow-inner flex items-center font-bold text-[#000]">
        {currentTime}
      </div>
      
      {/* Backdrop for closing menu */}
      {showStartMenu && (
        <div 
          className="fixed inset-0 z-[190]" 
          onClick={() => setShowStartMenu(false)}
        />
      )}
    </div>
  );
};

export default RetroNavbar;
