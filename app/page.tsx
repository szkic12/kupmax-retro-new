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
const Forum = dynamic(() => import('@/components/Forum/Forum'), { ssr: false });
const Clippy = dynamic(() => import('@/components/Clippy'), { ssr: false });
const ClippyChat = dynamic(() => import('@/components/ClippyChat'), { ssr: false });
const LegalNoticeBoard = dynamic(() => import('@/components/LegalNoticeBoard'), { ssr: false });

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
  const [currentTime, setCurrentTime] = useState<string>('--:--');
  const [advertisement, setAdvertisement] = useState<any>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Update clock only on client side to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch advertisement from API
  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const res = await fetch('/api/advertisement', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data.advertisement) {
          setAdvertisement(data.advertisement);
        }
      } catch (error) {
        console.error('Error fetching advertisement:', error);
      } finally {
        setLoadingAd(false);
      }
    };
    fetchAdvertisement();
  }, []);

  // Fetch latest news from API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news?limit=3', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data.news) {
          setLatestNews(data.news);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  // Helper: ensure link has https://
  const ensureHttps = (url: string | null | undefined): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const [windows, setWindows] = useState({
    reklama: true, // Auto-open on startup - Reklama fotografki
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
    bulletin: false,
  });

  const [minimized, setMinimized] = useState({
    reklama: false,
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
    bulletin: false,
  });

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>('reklama'); // Aktywne okno

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

  // Przygotuj slajdy z aktywnej reklamy lub domyślne
  const slides = advertisement?.slides && advertisement.slides.length > 0
    ? advertisement.slides.map((slide: any) => ({
        title: slide.title || advertisement.title,
        imageUrl: slide.image_url,
        linkTo: advertisement.link_url || '#',
      }))
    : [
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
      id: 'reklama',
      icon: '📷',
      label: 'Reklama.exe',
      type: 'app',
      action: () => setWindows({ ...windows, reklama: true }),
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
      label: 'BlockBlitz.exe',
      type: 'app',
      action: () => setWindows({ ...windows, tetris: true }),
    },
    {
      id: 'clippy',
      icon: '📎',
      label: 'Clippy AI.exe',
      type: 'app',
      action: () => setShowClippyChat(true),
    },
    {
      id: 'mentor',
      icon: '🎓',
      label: 'Mentor.exe',
      type: 'link',
      action: () => window.open('/mentor', '_self'),
    },
    {
      id: 'bulletin',
      icon: '📜',
      label: 'Regulamin.exe',
      type: 'app',
      action: () => setWindows({ ...windows, bulletin: true }),
    },
  ];

  // Get list of open windows for taskbar buttons
  const openWindows = Object.entries(windows)
    .filter(([_, isOpen]) => isOpen)
    .map(([key]) => ({
      key,
      icon: key === 'reklama' ? '📷' :
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
            key === 'tetris' ? '🕹️' :
            key === 'bulletin' ? '📌' : '📁',
      label: key === 'privateChat' ? 'Private Chat' :
             key === 'reklama' ? 'Reklama' :
             key.charAt(0).toUpperCase() + key.slice(1),
    }));

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      {/* Taskbar - at very TOP */}
      <div className="absolute left-0 right-0 top-0 h-10 sm:h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-1 gap-1 z-50">
        {/* Start Button */}
        <button
          className="win95-button px-3 h-6 font-bold flex items-center gap-2"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <span className="text-lg">🪟</span>
          <span>Start</span>
        </button>

        {/* Taskbar Buttons for Open Windows - click to switch/restore */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {openWindows.map((win) => {
            const isActive = activeWindow === win.key && !minimized[win.key as keyof typeof minimized];
            const isMinimizedWin = minimized[win.key as keyof typeof minimized];

            return (
              <button
                key={win.key}
                className={`px-2 h-6 text-xs flex items-center gap-1 min-w-[80px] max-w-[120px] ${isActive ? 'font-bold' : ''}`}
                style={{
                  background: isActive ? '#ffffff' : isMinimizedWin ? '#a0a0a0' : '#dfdfdf',
                  border: '2px solid',
                  borderColor: isActive ? '#000 #fff #fff #000' : '#fff #000 #000 #fff',
                  boxShadow: isActive ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none'
                }}
                onClick={() => {
                  if (isMinimizedWin) {
                    // Przywróć zminimalizowane okno
                    setMinimized({ ...minimized, [win.key]: false });
                  }
                  // Ustaw jako aktywne
                  setActiveWindow(win.key);
                }}
              >
                <span>{win.icon}</span>
                <span className="truncate">{win.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clock */}
        <div className="text-xs px-2 border-2 border-[#808080] border-t-black border-l-black h-6 flex items-center ml-1">
          {currentTime}
        </div>

        {/* Start Menu - opens DOWNWARD */}
        {showStartMenu && (
          <div className="absolute top-10 sm:top-8 left-2 w-52 max-h-[50vh] overflow-y-auto bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black shadow-lg z-50">
            <div className="bg-gradient-to-b from-blue-800 to-blue-600 text-white font-bold p-2 text-lg">
              KUPMAX Retro
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

      {/* Desktop Icons - below taskbar */}
      <div className="absolute top-12 sm:top-10 left-2 right-2 grid grid-cols-6 sm:grid-cols-8 gap-1 z-10">
        {desktopIcons.map((item) => {
          // Powiększone ikonki dla wybranych elementów
          const isHighlighted = ['ai-studio', 'vibe3d', 'roblox'].includes(item.id);

          return (
            <div
              key={item.id}
              className={`desktop-icon cursor-pointer flex flex-col items-center p-1 ${isHighlighted ? 'transform hover:scale-110 transition-transform' : ''}`}
              onDoubleClick={item.action}
              onClick={item.action}
              style={isHighlighted ? { gridColumn: 'span 1' } : {}}
            >
              <div
                className={`bg-white/20 backdrop-blur rounded flex items-center justify-center ${
                  isHighlighted
                    ? 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl shadow-lg ring-2 ring-yellow-400/50'
                    : 'w-9 h-9 sm:w-11 sm:h-11 text-lg sm:text-xl'
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-center truncate text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)] ${
                  isHighlighted
                    ? 'text-[10px] sm:text-xs font-bold max-w-[60px]'
                    : 'text-[8px] sm:text-[10px] max-w-[50px]'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Windows - positioned below icons */}
      {windows.reklama && (
        <Window
          title={`📷 Reklama - ${advertisement?.advertiser_name || 'Ładowanie...'}`}
          icon="📷"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.reklama}
          onMinimize={() => setMinimized({ ...minimized, reklama: true })}
          onClose={() => setWindows({ ...windows, reklama: false })}
          isActive={activeWindow === 'reklama'}
          onFocus={() => setActiveWindow('reklama')}
          fullPageUrl="/reklama"
        >
          <div className="w-full h-full">
            {loadingAd ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <div className="text-4xl animate-pulse mb-2">📷</div>
                  <p className="text-sm">Ładowanie reklamy...</p>
                </div>
              </div>
            ) : (
              <HeroSlider slides={slides} />
            )}
          </div>
        </Window>
      )}

      {windows.news && (
        <Window
          title="KUPMAX News - Netscape Navigator"
          icon="📰"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.news}
          onMinimize={() => setMinimized({ ...minimized, news: true })}
          onClose={() => setWindows({ ...windows, news: false })}
          isActive={activeWindow === 'news'}
          onFocus={() => setActiveWindow('news')}
          fullPageUrl="/news"
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">📰 Latest News</h2>
            <div className="space-y-4">
              {loadingNews ? (
                <div className="text-center py-4">
                  <span className="animate-pulse">⏳ Ładowanie...</span>
                </div>
              ) : latestNews.length > 0 ? (
                latestNews.map((news) => (
                  <div key={news.id} className="border-2 border-gray-400 p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{news.title}</h3>
                      <span className="text-xs px-2 py-1 rounded" style={{
                        background: news.category === 'Niesamowite Historie' ? '#000080' :
                                   news.category === 'Nowoczesne Technologie' ? '#008000' : '#800000',
                        color: '#fff'
                      }}>
                        {news.category?.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{news.excerpt || news.content?.substring(0, 100)}...</p>
                    <p className="text-xs text-gray-600 mt-1">
                      ✍️ {news.author} | {new Date(news.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="border-2 border-gray-400 p-3 bg-white">
                  <h3 className="font-bold">Brak newsów</h3>
                  <p className="text-sm mt-2">Dodaj pierwszy news w panelu admina!</p>
                </div>
              )}
            </div>
          </div>
        </Window>
      )}

      {windows.shop && (
        <Window
          title="KUPMAX Shop - Internet Explorer"
          icon="🛒"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.shop}
          onMinimize={() => setMinimized({ ...minimized, shop: true })}
          onClose={() => setWindows({ ...windows, shop: false })}
          isActive={activeWindow === 'shop'}
          onFocus={() => setActiveWindow('shop')}
          fullPageUrl="/shop"
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
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.image}
          onMinimize={() => setMinimized({ ...minimized, image: true })}
          onClose={() => setWindows({ ...windows, image: false })}
          isActive={activeWindow === 'image'}
          onFocus={() => setActiveWindow('image')}
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
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.video}
          onMinimize={() => setMinimized({ ...minimized, video: true })}
          onClose={() => setWindows({ ...windows, video: false })}
          isActive={activeWindow === 'video'}
          onFocus={() => setActiveWindow('video')}
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
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.model3d}
          onMinimize={() => setMinimized({ ...minimized, model3d: true })}
          onClose={() => setWindows({ ...windows, model3d: false })}
          isActive={activeWindow === 'model3d'}
          onFocus={() => setActiveWindow('model3d')}
        >
          <Rollup3D src="/models/koszulka.glb" />
        </Window>
      )}

      {windows.character && (
        <Window
          title="Character.3ds - 3D Studio MAX"
          icon="🧑"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.character}
          onMinimize={() => setMinimized({ ...minimized, character: true })}
          onClose={() => setWindows({ ...windows, character: false })}
          isActive={activeWindow === 'character'}
          onFocus={() => setActiveWindow('character')}
        >
          <RollupCharacter src="/models/postac.glb" />
        </Window>
      )}

      {windows.forum && (
        <Window
          title="KUPMAX Forum - Microsoft Internet Explorer"
          icon="💬"
          width="min(96vw, 800px)"
          height="min(80vh, 600px)"
          x={4}
          y={260}
          minimized={minimized.forum}
          onMinimize={() => setMinimized({ ...minimized, forum: true })}
          onClose={() => setWindows({ ...windows, forum: false })}
          isActive={activeWindow === 'forum'}
          onFocus={() => setActiveWindow('forum')}
          fullPageUrl="/forum"
        >
          <Forum />
        </Window>
      )}

      {windows.webring && (
        <Window
          title="Webring - Netscape Navigator"
          icon="🌐"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.webring}
          onMinimize={() => setMinimized({ ...minimized, webring: true })}
          onClose={() => setWindows({ ...windows, webring: false })}
          isActive={activeWindow === 'webring'}
          onFocus={() => setActiveWindow('webring')}
          fullPageUrl="/webring"
        >
          <Webring currentUrl="https://kupmax.pl" />
        </Window>
      )}

      {windows.guestbook && (
        <Window
          title="Guestbook - Sign Here!"
          icon="📖"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.guestbook}
          onMinimize={() => setMinimized({ ...minimized, guestbook: true })}
          onClose={() => setWindows({ ...windows, guestbook: false })}
          isActive={activeWindow === 'guestbook'}
          onFocus={() => setActiveWindow('guestbook')}
          fullPageUrl="/guestbook"
        >
          <Guestbook title="💬 Retro Guestbook KupMax" maxEntries={15} showForm={true} showList={true} />
        </Window>
      )}

      {windows.chat && (
        <Window
          title="KUPMAX Chat - mIRC"
          icon="💬"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.chat}
          onMinimize={() => setMinimized({ ...minimized, chat: true })}
          onClose={() => setWindows({ ...windows, chat: false })}
          isActive={activeWindow === 'chat'}
          onFocus={() => setActiveWindow('chat')}
          fullPageUrl="/chat"
        >
          <Chatroom />
        </Window>
      )}

      {windows.privateChat && (
        <Window
          title="Private Chat - Secure Channel"
          icon="🔒"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.privateChat}
          onMinimize={() => setMinimized({ ...minimized, privateChat: true })}
          onClose={() => setWindows({ ...windows, privateChat: false })}
          isActive={activeWindow === 'privateChat'}
          onFocus={() => setActiveWindow('privateChat')}
          fullPageUrl="/private-chat"
        >
          <PrivateChatroom />
        </Window>
      )}

      {windows.photos && (
        <Window
          title="Photo Gallery - Microsoft Photo Editor"
          icon="📸"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.photos}
          onMinimize={() => setMinimized({ ...minimized, photos: true })}
          onClose={() => setWindows({ ...windows, photos: false })}
          isActive={activeWindow === 'photos'}
          onFocus={() => setActiveWindow('photos')}
          fullPageUrl="/photos"
        >
          <PhotoGallery />
        </Window>
      )}

      {windows.downloads && (
        <Window
          title="Downloads - File Manager"
          icon="💾"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.downloads}
          onMinimize={() => setMinimized({ ...minimized, downloads: true })}
          onClose={() => setWindows({ ...windows, downloads: false })}
          isActive={activeWindow === 'downloads'}
          onFocus={() => setActiveWindow('downloads')}
          fullPageUrl="/downloads"
        >
          <Downloads />
        </Window>
      )}

      {windows.radio && (
        <Window
          title="Radio Player - Winamp"
          icon="📻"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.radio}
          onMinimize={() => setMinimized({ ...minimized, radio: true })}
          onClose={() => setWindows({ ...windows, radio: false })}
          isActive={activeWindow === 'radio'}
          onFocus={() => setActiveWindow('radio')}
          fullPageUrl="/radio"
        >
          <ReactRadio />
        </Window>
      )}

      {windows.tetris && (
        <Window
          title="Block Blitz - Extreme Puzzle"
          icon="🕹️"
          width="min(98vw, 800px)"
          height="min(85vh, 650px)"
          x={2}
          y={20}
          minimized={minimized.tetris}
          onMinimize={() => setMinimized({ ...minimized, tetris: true })}
          onClose={() => setWindows({ ...windows, tetris: false })}
          isActive={activeWindow === 'tetris'}
          onFocus={() => setActiveWindow('tetris')}
          fullPageUrl="/tetris"
        >
          <TetrisGame onGameComplete={(code: string) => console.log('Discount code:', code)} />
        </Window>
      )}

      {windows.bulletin && (
        <Window
          title="Regulamin Serwisu - Terms of Service"
          icon="📜"
          width="min(96vw, 700px)"
          height="min(70vh, 550px)"
          x={4}
          y={260}
          minimized={minimized.bulletin}
          onMinimize={() => setMinimized({ ...minimized, bulletin: true })}
          onClose={() => setWindows({ ...windows, bulletin: false })}
          isActive={activeWindow === 'bulletin'}
          onFocus={() => setActiveWindow('bulletin')}
          fullPageUrl="/bulletin"
        >
          <LegalNoticeBoard />
        </Window>
      )}

      {/* Clippy Chat Window - Clippy icon is now on desktop */}
      <ClippyChat isOpen={showClippyChat} onClose={() => setShowClippyChat(false)} />
    </main>
  );
}
