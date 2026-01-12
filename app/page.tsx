'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Window from '@/components/Window';
import HeroSlider from '@/components/HeroSlider';
import RollupImage from '@/components/RollupImage';
import RollupVideo from '@/components/RollupVideo';

const Rollup3D = dynamic(() => import('@/components/Rollup3D'), { ssr: false });
const RollupCharacter = dynamic(() => import('@/components/RollupCharacter'), { ssr: false });
const TetrisGame = dynamic(() => import('@/components/TetrisGame/TetrisGame'), { ssr: false });
const ReactRadio = dynamic(() => import('@/components/ReactRadio/ReactRadio'), { ssr: false });
const Chatroom = dynamic(() => import('@/components/Chatroom/Chatroom'), { ssr: false });
const PrivateChatroom = dynamic(() => import('@/components/PrivateChatroom/PrivateChatroom'), { ssr: false });
const Guestbook = dynamic(() => import('@/components/Guestbook/Guestbook'), { ssr: false });
const PhotoGallery = dynamic(() => import('@/components/PhotoGallery/PhotoGallery'), { ssr: false });
const Downloads = dynamic(() => import('@/components/Downloads/Downloads'), { ssr: false });
const Webring = dynamic(() => import('@/components/Webring/Webring'), { ssr: false });
const Clippy = dynamic(() => import('@/components/Clippy'), { ssr: false });
const ClippyChat = dynamic(() => import('@/components/ClippyChat'), { ssr: false });

interface DesktopIcon {
  id: string;
  icon: string;
  label: string;
  type: 'app' | 'link' | 'folder';
  action: () => void;
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showClippyChat, setShowClippyChat] = useState(false);

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

  // Fetch products when shop opens
  useEffect(() => {
    if (windows.shop && products.length === 0 && !loadingProducts) {
      fetchProducts();
    }
  }, [windows.shop]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch('/api/products?perPage=12');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

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
      {/* Desktop Icons - 6 rows horizontal layout */}
      <div className="absolute top-2 left-2 right-2 grid grid-rows-3 grid-flow-col auto-cols-max gap-1 sm:gap-2 z-10 overflow-x-auto pb-2">
        {desktopIcons.map((item) => (
          <div
            key={item.id}
            className="desktop-icon cursor-pointer"
            onDoubleClick={item.action}
            onClick={item.action}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded flex items-center justify-center text-xl sm:text-2xl">
              {item.icon}
            </div>
            <span className="text-[10px] sm:text-xs text-center max-w-[60px] truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Windows - smaller, left-positioned, below icons */}
      {windows.gallery && (
        <Window
          title="KUPMAX Gallery - Internet Explorer"
          icon="🖼️"
          width="min(90vw, 600px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
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
          width="min(90vw, 500px)"
          height="min(55vh, 350px)"
          x={15}
          y={145}
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
          width="min(90vw, 550px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, shop: false })}
        >
          <div className="p-4 h-full overflow-y-auto bg-white">
            <h2 className="text-xl font-bold mb-4">🛒 KUPMAX Online Shop</h2>

            {loadingProducts ? (
              <div className="text-center py-8">
                <p className="text-sm">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 border-2 border-gray-400 bg-yellow-50 p-4">
                <p className="text-sm font-bold mb-2">⚠️ No products available</p>
                <p className="text-xs">Make sure Supabase is running (npx supabase start)</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border-2 border-gray-400 p-3 bg-white cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <div className="aspect-square bg-gray-200 mb-2 flex items-center justify-center">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate">{product.name}</p>
                    <p className="text-xs text-gray-600 truncate mb-2">{product.category}</p>
                    <p className="text-sm font-bold text-green-600">
                      {product.price} {product.currency}
                    </p>
                    {product.stock !== null && (
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                    )}
                    <button className="win95-button w-full mt-2 text-xs">Add to Cart</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Window>
      )}

      {windows.image && (
        <Window
          title="Chlapak.bmp - Paint"
          icon="📷"
          width="min(90vw, 400px)"
          height="min(55vh, 320px)"
          x={10}
          y={140}
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
          width="min(90vw, 450px)"
          height="min(55vh, 350px)"
          x={10}
          y={145}
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
          width="min(90vw, 500px)"
          height="min(60vh, 380px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, model3d: false })}
        >
          <Rollup3D src="/models/koszulka.glb" />
        </Window>
      )}

      {windows.character && (
        <Window
          title="Character.3ds - 3D Studio MAX"
          icon="🧑"
          width="min(90vw, 500px)"
          height="min(60vh, 380px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, character: false })}
        >
          <RollupCharacter src="/models/postac.glb" />
        </Window>
      )}

      {windows.forum && (
        <Window
          title="KUPMAX Forum - Microsoft Internet Explorer"
          icon="💬"
          width="min(90vw, 500px)"
          height="min(55vh, 380px)"
          x={10}
          y={140}
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
          width="min(90vw, 550px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, webring: false })}
        >
          <Webring currentUrl="https://kupmax.pl" />
        </Window>
      )}

      {windows.guestbook && (
        <Window
          title="Guestbook - Sign Here!"
          icon="📖"
          width="min(90vw, 500px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, guestbook: false })}
        >
          <Guestbook title="💬 Retro Guestbook KupMax" maxEntries={15} showForm={true} showList={true} />
        </Window>
      )}

      {windows.chat && (
        <Window
          title="KUPMAX Chat - mIRC"
          icon="💬"
          width="min(90vw, 500px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, chat: false })}
        >
          <Chatroom />
        </Window>
      )}

      {windows.privateChat && (
        <Window
          title="Private Chat - Secure Channel"
          icon="🔒"
          width="min(90vw, 500px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, privateChat: false })}
        >
          <PrivateChatroom />
        </Window>
      )}

      {windows.photos && (
        <Window
          title="Photo Gallery - Microsoft Photo Editor"
          icon="📸"
          width="min(90vw, 550px)"
          height="min(60vh, 400px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, photos: false })}
        >
          <PhotoGallery />
        </Window>
      )}

      {windows.downloads && (
        <Window
          title="Downloads - File Manager"
          icon="💾"
          width="min(90vw, 500px)"
          height="min(55vh, 380px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, downloads: false })}
        >
          <Downloads />
        </Window>
      )}

      {windows.radio && (
        <Window
          title="Radio Player - Winamp"
          icon="📻"
          width="min(90vw, 350px)"
          height="min(55vh, 350px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, radio: false })}
        >
          <ReactRadio />
        </Window>
      )}

      {windows.tetris && (
        <Window
          title="Tetris - Classic Game"
          icon="🕹️"
          width="min(90vw, 450px)"
          height="min(70vh, 450px)"
          x={10}
          y={140}
          onClose={() => setWindows({ ...windows, tetris: false })}
        >
          <TetrisGame onGameComplete={(code: string) => console.log('Discount code:', code)} />
        </Window>
      )}

      {/* Clippy Assistant */}
      <Clippy onOpenChat={() => setShowClippyChat(true)} />

      {/* Clippy Chat Window */}
      <ClippyChat isOpen={showClippyChat} onClose={() => setShowClippyChat(false)} />

      {/* Taskbar - with safe area for Android navigation */}
      <div className="absolute left-0 right-0 h-10 sm:h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-1 gap-1 z-50" style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
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
          <div className="absolute bottom-10 sm:bottom-8 left-2 w-52 max-h-[60vh] overflow-y-auto bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black shadow-lg z-50">
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
