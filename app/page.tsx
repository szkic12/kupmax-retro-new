'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Window from '@/components/Window';
import HeroSlider from '@/components/HeroSlider';
import RollupImage from '@/components/RollupImage';
import RollupVideo from '@/components/RollupVideo';

const Rollup3D = dynamic(() => import('@/components/Rollup3D'), { ssr: false });
const RollupCharacter = dynamic(() => import('@/components/RollupCharacter'), { ssr: false });

interface DesktopIcon {
  id: string;
  icon: string;
  label: string;
  type: 'app' | 'link' | 'folder';
  action: () => void;
}

export default function Home() {
  const [windows, setWindows] = useState({
    gallery: true, // Auto-open on startup
    news: false,
    shop: false,
    aiStudio: false,
    vibe3d: false,
    roblox: false,
    image: false,
    video: false,
    model3d: false,
    character: false,
    forum: false,
    webring: false,
    guestbook: false,
    downloads: false,
    radio: false,
    chat: false,
    tetris: false,
  });

  const [showStartMenu, setShowStartMenu] = useState(false);

  const slides = [
    {
      title: 'Koniec odkładania. Czas tworzenia.',
      imageUrl: '/images/slider-1.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
    {
      title: 'Przestań marzyć. Zacznij działać.',
      imageUrl: '/images/slider-2.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
    {
      title: 'Każdy wielki projekt zaczyna się od pierwszego kroku.',
      imageUrl: '/images/slider-3.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
  ];

  const desktopIcons: DesktopIcon[] = [
    {
      id: 'gallery',
      icon: '🖼️',
      label: 'Gallery.exe',
      type: 'app',
      action: () => setWindows({ ...windows, gallery: true }),
    },
    {
      id: 'news',
      icon: '📰',
      label: 'News.exe',
      type: 'app',
      action: () => setWindows({ ...windows, news: true }),
    },
    {
      id: 'shop',
      icon: '🛒',
      label: 'Shop.exe',
      type: 'app',
      action: () => setWindows({ ...windows, shop: true }),
    },
    {
      id: 'ai-studio',
      icon: '🤖',
      label: 'AI Studio.lnk',
      type: 'link',
      action: () => window.open('https://ai.kupmax.pl', '_blank'),
    },
    {
      id: 'vibe3d',
      icon: '🎮',
      label: 'Vibe3D.app',
      type: 'app',
      action: () => setWindows({ ...windows, vibe3d: true }),
    },
    {
      id: 'roblox',
      icon: '🎪',
      label: 'Roblox.url',
      type: 'link',
      action: () => window.open('https://www.roblox.com', '_blank'),
    },
    {
      id: 'forum',
      icon: '💬',
      label: 'Forum.exe',
      type: 'app',
      action: () => setWindows({ ...windows, forum: true }),
    },
    {
      id: 'webring',
      icon: '🌐',
      label: 'Webring.htm',
      type: 'app',
      action: () => setWindows({ ...windows, webring: true }),
    },
    {
      id: 'guestbook',
      icon: '📖',
      label: 'Guestbook.exe',
      type: 'app',
      action: () => setWindows({ ...windows, guestbook: true }),
    },
    {
      id: 'downloads',
      icon: '💾',
      label: 'Downloads',
      type: 'folder',
      action: () => setWindows({ ...windows, downloads: true }),
    },
    {
      id: 'radio',
      icon: '📻',
      label: 'Radio.exe',
      type: 'app',
      action: () => setWindows({ ...windows, radio: true }),
    },
    {
      id: 'tetris',
      icon: '🎮',
      label: 'Tetris.exe',
      type: 'app',
      action: () => setWindows({ ...windows, tetris: true }),
    },
  ];

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      {/* Desktop Icons - Grid Layout */}
      <div className="absolute top-4 left-4 grid grid-cols-2 gap-2 z-0">
        {desktopIcons.map((item) => (
          <div
            key={item.id}
            className="desktop-icon"
            onDoubleClick={item.action}
          >
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
              {item.icon}
            </div>
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Windows */}
      {windows.gallery && (
        <Window
          title="KUPMAX Gallery - Internet Explorer"
          icon="🖼️"
          width="900px"
          height="650px"
          x={200}
          y={50}
          onClose={() => setWindows({ ...windows, gallery: false })}
        >
          <div className="w-full h-full">
            <HeroSlider slides={slides} />
          </div>
        </Window>
      )}

      {windows.news && (
        <Window
          title="KUPMAX News - Netscape Navigator"
          icon="📰"
          width="700px"
          height="500px"
          x={150}
          y={80}
          onClose={() => setWindows({ ...windows, news: false })}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">📰 Latest News</h2>
            <div className="space-y-4">
              <div className="border-2 border-gray-400 p-3 bg-white">
                <h3 className="font-bold">Coming Soon...</h3>
                <p className="text-sm mt-2">News will be loaded from Supabase!</p>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.shop && (
        <Window
          title="KUPMAX Shop - Internet Explorer"
          icon="🛒"
          width="800px"
          height="600px"
          x={180}
          y={100}
          onClose={() => setWindows({ ...windows, shop: false })}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">🛒 Online Shop</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-gray-400 p-3 bg-white text-center">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm font-bold">Product 1</p>
                <p className="text-xs">Coming from Supabase!</p>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.vibe3d && (
        <Window
          title="Vibe3D - 3D Viewer"
          icon="🎮"
          width="800px"
          height="600px"
          x={250}
          y={120}
          onClose={() => setWindows({ ...windows, vibe3d: false })}
        >
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">🎮 Vibe3D App</h2>
            <p className="mb-4">Virtual 3D experience for youth!</p>
            <button className="win95-button">Launch Vibe3D</button>
          </div>
        </Window>
      )}

      {windows.forum && (
        <Window
          title="KUPMAX Forum - Microsoft Internet Explorer"
          icon="💬"
          width="750px"
          height="550px"
          x={220}
          y={90}
          onClose={() => setWindows({ ...windows, forum: false })}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">💬 Community Forum</h2>
            <div className="space-y-2">
              <div className="border-2 border-gray-400 p-2 bg-white hover:bg-blue-100 cursor-pointer">
                <span className="font-bold">» General Discussion</span>
              </div>
              <div className="border-2 border-gray-400 p-2 bg-white hover:bg-blue-100 cursor-pointer">
                <span className="font-bold">» Technical Support</span>
              </div>
              <div className="border-2 border-gray-400 p-2 bg-white hover:bg-blue-100 cursor-pointer">
                <span className="font-bold">» Off-Topic</span>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.webring && (
        <Window
          title="Webring - Netscape Navigator"
          icon="🌐"
          width="600px"
          height="450px"
          x={280}
          y={110}
          onClose={() => setWindows({ ...windows, webring: false })}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">🌐 KUPMAX Webring</h2>
            <div className="flex items-center justify-center gap-4 my-8">
              <button className="win95-button">◄ Previous</button>
              <div className="text-center">
                <div className="text-4xl mb-2">🌐</div>
                <p className="font-bold">Random Site</p>
              </div>
              <button className="win95-button">Next ►</button>
            </div>
            <div className="text-center text-sm">
              <p>Part of the retro web community!</p>
            </div>
          </div>
        </Window>
      )}

      {windows.guestbook && (
        <Window
          title="Guestbook - Sign Here!"
          icon="📖"
          width="650px"
          height="500px"
          x={190}
          y={85}
          onClose={() => setWindows({ ...windows, guestbook: false })}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">📖 Sign Our Guestbook!</h2>
            <div className="border-2 border-gray-400 p-3 bg-white mb-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full border p-1 mb-2"
              />
              <textarea
                placeholder="Leave a message..."
                className="w-full border p-1 h-24"
              />
              <button className="win95-button mt-2">Sign Guestbook</button>
            </div>
            <div className="space-y-2">
              <div className="border-2 border-gray-400 p-2 bg-white">
                <p className="font-bold">Guest #1</p>
                <p className="text-sm">Great retro website! Love it!</p>
              </div>
            </div>
          </div>
        </Window>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-2 gap-2 z-50">
        <button
          className="win95-button px-3 h-6 font-bold flex items-center gap-2"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <span className="text-lg">🪟</span>
          <span>Start</span>
        </button>

        {/* Start Menu */}
        {showStartMenu && (
          <div className="absolute bottom-8 left-2 w-48 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black shadow-lg">
            <div className="bg-gradient-to-b from-blue-800 to-blue-600 text-white font-bold p-2 text-lg">
              KUPMAX
            </div>
            <div className="p-1">
              {desktopIcons.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-2 py-1 hover:bg-blue-800 hover:text-white flex items-center gap-2 text-sm"
                  onClick={() => {
                    item.action();
                    setShowStartMenu(false);
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <hr className="my-1 border-gray-400" />
              <button className="w-full text-left px-2 py-1 hover:bg-blue-800 hover:text-white flex items-center gap-2 text-sm">
                <span>⚙️</span>
                <span>Settings</span>
              </button>
              <button className="w-full text-left px-2 py-1 hover:bg-blue-800 hover:text-white flex items-center gap-2 text-sm">
                <span>⏻</span>
                <span>Shut Down...</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1" />
        <div className="text-xs px-2 border-2 border-[#808080] border-t-black border-l-black h-6 flex items-center">
          {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </main>
  );
}
