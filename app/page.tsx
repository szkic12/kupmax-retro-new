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
    image: false,
    video: false,
    model3d: false,
    character: false,
    chat: false,
    privateChat: false,
    forum: false,
    webring: false,
    guestbook: false,
    photos: false,
    downloads: false,
    radio: false,
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
      label: 'Vibe3D.apk',
      type: 'link',
      action: () => window.open('https://play.google.com/store/apps/details?id=com.kupmax.vibe3d', '_blank'),
    },
    {
      id: 'roblox',
      icon: '🎪',
      label: 'Roblox.url',
      type: 'link',
      action: () => window.open('https://www.roblox.com', '_blank'),
    },
    {
      id: 'chat',
      icon: '💬',
      label: 'Chat.exe',
      type: 'app',
      action: () => setWindows({ ...windows, chat: true }),
    },
    {
      id: 'privateChat',
      icon: '🔒',
      label: 'Private Chat.exe',
      type: 'app',
      action: () => setWindows({ ...windows, privateChat: true }),
    },
    {
      id: 'forum',
      icon: '🗨️',
      label: 'Forum.exe',
      type: 'app',
      action: () => setWindows({ ...windows, forum: true }),
    },
    {
      id: 'photos',
      icon: '📸',
      label: 'Photos.exe',
      type: 'app',
      action: () => setWindows({ ...windows, photos: true }),
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
      icon: '🕹️',
      label: 'Tetris.exe',
      type: 'app',
      action: () => setWindows({ ...windows, tetris: true }),
    },
  ];

  // Get list of open windows for taskbar buttons
  const openWindows = Object.entries(windows)
    .filter(([_, isOpen]) => isOpen)
    .map(([key]) => ({
      key,
      icon: key === 'gallery' ? '🖼️' :
            key === 'news' ? '📰' :
            key === 'shop' ? '🛒' :
            key === 'image' ? '📷' :
            key === 'video' ? '🎬' :
            key === 'model3d' ? '👕' :
            key === 'character' ? '🧑' :
            key === 'chat' ? '💬' :
            key === 'privateChat' ? '🔒' :
            key === 'forum' ? '🗨️' :
            key === 'photos' ? '📸' :
            key === 'webring' ? '🌐' :
            key === 'guestbook' ? '📖' :
            key === 'downloads' ? '💾' :
            key === 'radio' ? '📻' :
            key === 'tetris' ? '🕹️' : '📁',
      label: key === 'privateChat' ? 'Private Chat' : key.charAt(0).toUpperCase() + key.slice(1),
    }));

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
                <h3 className="font-bold">Welcome to KUPMAX!</h3>
                <p className="text-sm mt-2">News will be loaded from Supabase database.</p>
                <p className="text-xs text-gray-600 mt-1">Posted: 2026-01-11</p>
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
              <div className="border-2 border-gray-400 p-3 bg-white text-center cursor-pointer hover:bg-gray-100">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm font-bold">Product 1</p>
                <p className="text-xs text-green-600 font-bold">$99.99</p>
              </div>
              <div className="border-2 border-gray-400 p-3 bg-white text-center cursor-pointer hover:bg-gray-100">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm font-bold">Product 2</p>
                <p className="text-xs text-green-600 font-bold">$149.99</p>
              </div>
              <div className="border-2 border-gray-400 p-3 bg-white text-center">
                <p className="text-xs text-gray-500 mt-4">Products from Supabase</p>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.image && (
        <Window
          title="Chlapak.bmp - Paint"
          icon="📷"
          width="500px"
          height="400px"
          x={150}
          y={100}
          onClose={() => setWindows({ ...windows, image: false })}
        >
          <div className="p-4">
            <RollupImage
              src="/images/chlapak.avif"
              alt="Reklama - Chlapak"
              linkTo="https://kupmax.pl"
            />
          </div>
        </Window>
      )}

      {windows.video && (
        <Window
          title="Movie.avi - Windows Media Player"
          icon="🎬"
          width="600px"
          height="450px"
          x={200}
          y={150}
          onClose={() => setWindows({ ...windows, video: false })}
        >
          <div className="p-4">
            <RollupVideo src="/videos/reklama.mp4" />
          </div>
        </Window>
      )}

      {windows.model3d && (
        <Window
          title="Shirt3D.obj - 3D Viewer"
          icon="👕"
          width="700px"
          height="500px"
          x={250}
          y={80}
          onClose={() => setWindows({ ...windows, model3d: false })}
        >
          <Rollup3D src="/models/koszulka.glb" />
        </Window>
      )}

      {windows.character && (
        <Window
          title="Character.3ds - 3D Studio MAX"
          icon="🧑"
          width="700px"
          height="500px"
          x={300}
          y={120}
          onClose={() => setWindows({ ...windows, character: false })}
        >
          <RollupCharacter src="/models/postac.glb" />
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
                <span className="text-xs text-gray-500 ml-2">(123 posts)</span>
              </div>
              <div className="border-2 border-gray-400 p-2 bg-white hover:bg-blue-100 cursor-pointer">
                <span className="font-bold">» Technical Support</span>
                <span className="text-xs text-gray-500 ml-2">(45 posts)</span>
              </div>
              <div className="border-2 border-gray-400 p-2 bg-white hover:bg-blue-100 cursor-pointer">
                <span className="font-bold">» Off-Topic</span>
                <span className="text-xs text-gray-500 ml-2">(789 posts)</span>
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
                <p className="font-bold">Random Retro Site</p>
              </div>
              <button className="win95-button">Next ►</button>
            </div>
            <div className="text-center text-sm">
              <p>Part of the retro web community!</p>
              <p className="text-xs text-gray-600 mt-2">Join the ring - share the nostalgia</p>
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
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="border-2 border-gray-400 p-2 bg-white">
                <p className="font-bold">Guest #1 - John</p>
                <p className="text-sm">Great retro website! Love the Windows 95 vibes!</p>
                <p className="text-xs text-gray-500">2026-01-11 20:30</p>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.chat && (
        <Window
          title="KUPMAX Chat - mIRC"
          icon="💬"
          width="700px"
          height="550px"
          x={160}
          y={70}
          onClose={() => setWindows({ ...windows, chat: false })}
        >
          <div className="p-4 bg-white h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">💬 Retro Chatroom v1.0</h2>
            <div className="flex-1 border-2 border-gray-400 p-2 bg-white overflow-y-auto mb-2">
              <div className="text-xs space-y-1">
                <p><span className="text-blue-600 font-bold">[System]</span> Welcome to KUPMAX Chat!</p>
                <p><span className="text-green-600 font-bold">[Admin]</span> Hello everyone!</p>
                <p><span className="text-purple-600 font-bold">[User123]</span> Hey! Love this retro vibe!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border-2 border-gray-400 px-2 py-1 text-sm"
              />
              <button className="win95-button">Send</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Users online: 42</p>
          </div>
        </Window>
      )}

      {windows.privateChat && (
        <Window
          title="Private Chat - Secure Channel"
          icon="🔒"
          width="650px"
          height="500px"
          x={200}
          y={100}
          onClose={() => setWindows({ ...windows, privateChat: false })}
        >
          <div className="p-4 bg-white h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">🔒 Private Chatroom v2.0</h2>
            <div className="border-2 border-gray-400 p-3 bg-yellow-50 mb-4">
              <p className="text-sm font-bold">🔐 End-to-End Encrypted</p>
              <p className="text-xs">Your messages are secure and private.</p>
            </div>
            <div className="flex-1 border-2 border-gray-400 p-2 bg-white overflow-y-auto mb-2">
              <div className="text-xs space-y-1">
                <p><span className="text-blue-600 font-bold">[System]</span> Secure channel established.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type private message..."
                className="flex-1 border-2 border-gray-400 px-2 py-1 text-sm"
              />
              <button className="win95-button">Send</button>
            </div>
          </div>
        </Window>
      )}

      {windows.photos && (
        <Window
          title="Photo Gallery - Microsoft Photo Editor"
          icon="📸"
          width="800px"
          height="600px"
          x={150}
          y={60}
          onClose={() => setWindows({ ...windows, photos: false })}
        >
          <div className="p-4 bg-white h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">📸 Photo Gallery v2.0</h2>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div key={num} className="border-2 border-gray-400 p-2 bg-gray-200 aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-300">
                  <span className="text-4xl">🖼️</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Gallery photos will be loaded from server</p>
          </div>
        </Window>
      )}

      {windows.downloads && (
        <Window
          title="Downloads - File Manager"
          icon="💾"
          width="600px"
          height="450px"
          x={250}
          y={120}
          onClose={() => setWindows({ ...windows, downloads: false })}
        >
          <div className="p-4 bg-white h-full">
            <h2 className="text-xl font-bold mb-4">💾 Retro Downloads v1.0</h2>
            <div className="space-y-2">
              <div className="border-2 border-gray-400 p-3 bg-white flex items-center justify-between hover:bg-blue-100 cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-bold text-sm">KUPMAX_Brochure.pdf</p>
                    <p className="text-xs text-gray-500">Size: 2.5 MB</p>
                  </div>
                </div>
                <button className="win95-button text-xs px-2 py-1">Download</button>
              </div>
              <div className="border-2 border-gray-400 p-3 bg-white flex items-center justify-between hover:bg-blue-100 cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💿</span>
                  <div>
                    <p className="font-bold text-sm">RetroSoftware_v1.0.zip</p>
                    <p className="text-xs text-gray-500">Size: 15.8 MB</p>
                  </div>
                </div>
                <button className="win95-button text-xs px-2 py-1">Download</button>
              </div>
            </div>
          </div>
        </Window>
      )}

      {windows.radio && (
        <Window
          title="Radio Player - Winamp"
          icon="📻"
          width="400px"
          height="350px"
          x={300}
          y={150}
          onClose={() => setWindows({ ...windows, radio: false })}
        >
          <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900 h-full text-white">
            <h2 className="text-lg font-bold mb-4">📻 WEB 2.0 RADIO</h2>
            <div className="border-2 border-gray-600 p-3 bg-black mb-4">
              <p className="text-green-400 font-mono text-sm">♪ Now Playing...</p>
              <p className="text-white text-xs mt-1">Select a station to start</p>
            </div>
            <div className="space-y-2 mb-4">
              <button className="w-full win95-button text-xs text-left">📻 Radio ZET (Pop)</button>
              <button className="w-full win95-button text-xs text-left">📻 RMF FM (Rock)</button>
              <button className="w-full win95-button text-xs text-left">📻 Radio Maryja (Religious)</button>
            </div>
            <div className="flex gap-2 justify-center">
              <button className="win95-button px-4">▶️</button>
              <button className="win95-button px-4">⏸️</button>
              <button className="win95-button px-4">⏹️</button>
            </div>
          </div>
        </Window>
      )}

      {windows.tetris && (
        <Window
          title="Tetris - Classic Game"
          icon="🕹️"
          width="400px"
          height="550px"
          x={350}
          y={50}
          onClose={() => setWindows({ ...windows, tetris: false })}
        >
          <div className="p-4 bg-black h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4 text-green-400">🕹️ TETRIS</h2>
            <div className="border-4 border-gray-600 bg-gray-900 w-64 h-96 mb-4 flex items-center justify-center">
              <p className="text-white text-center">
                <span className="text-6xl block mb-4">🎮</span>
                <span className="text-sm">Press START to play</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button className="win95-button px-4">START</button>
              <button className="win95-button px-4">PAUSE</button>
              <button className="win95-button px-4">RESET</button>
            </div>
            <div className="mt-4 text-white text-xs">
              <p>Score: 0</p>
              <p>Level: 1</p>
            </div>
          </div>
        </Window>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-1 gap-1 z-50">
        {/* Start Button */}
        <button
          className="win95-button px-3 h-6 font-bold flex items-center gap-2"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <span className="text-lg">🪟</span>
          <span>Start</span>
        </button>

        {/* Taskbar Buttons for Open Windows */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {openWindows.map((win) => (
            <button
              key={win.key}
              className="win95-button px-2 h-6 text-xs flex items-center gap-1 min-w-[100px] max-w-[150px]"
              style={{
                borderStyle: 'inset',
                background: '#dfdfdf'
              }}
            >
              <span>{win.icon}</span>
              <span className="truncate">{win.label}</span>
            </button>
          ))}
        </div>

        {/* System Tray - Quick Launch Icons */}
        <div className="flex items-center gap-1 border-l-2 border-l-[#808080] pl-2">
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-blue-200 cursor-pointer"
            onClick={() => setWindows({ ...windows, image: true })}
            title="Chlapak"
          >
            📷
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-blue-200 cursor-pointer"
            onClick={() => setWindows({ ...windows, video: true })}
            title="Video"
          >
            🎬
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-blue-200 cursor-pointer"
            onClick={() => setWindows({ ...windows, model3d: true })}
            title="3D Shirt"
          >
            👕
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-blue-200 cursor-pointer"
            onClick={() => setWindows({ ...windows, character: true })}
            title="Character"
          >
            🧑
          </button>
        </div>

        {/* Clock */}
        <div className="text-xs px-2 border-2 border-[#808080] border-t-black border-l-black h-6 flex items-center ml-1">
          {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Start Menu */}
        {showStartMenu && (
          <div className="absolute bottom-8 left-2 w-52 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black shadow-lg z-50">
            <div className="bg-gradient-to-b from-blue-800 to-blue-600 text-white font-bold p-2 text-lg">
              KUPMAX Retro
            </div>
            <div className="p-1">
              <button
                className="w-full text-left px-2 py-1 hover:bg-blue-800 hover:text-white flex items-center gap-2 text-sm"
                onClick={() => {
                  setWindows({ ...windows, gallery: true });
                  setShowStartMenu(false);
                }}
              >
                <span>🖼️</span>
                <span>Gallery</span>
              </button>
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
                  <span>{item.label.replace('.exe', '').replace('.lnk', '').replace('.htm', '').replace('.url', '').replace('.apk', '')}</span>
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
      </div>
    </main>
  );
}
