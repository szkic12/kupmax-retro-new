'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Window from "@/components/Window";
import HeroSlider from "@/components/HeroSlider";
import RollupImage from "@/components/RollupImage";
import RollupVideo from "@/components/RollupVideo";
import StartMenu from "@/components/StartMenu";

const Rollup3D = dynamic(() => import("@/components/Rollup3D"), { ssr: false });
const RollupCharacter = dynamic(() => import("@/components/RollupCharacter"), { ssr: false });
const TetrisGame = dynamic(() => import("@/components/TetrisGame/TetrisGame"), { ssr: false });
const ReactRadio = dynamic(() => import("@/components/ReactRadio/ReactRadio"), { ssr: false });
const Chatroom = dynamic(() => import("@/components/Chatroom/Chatroom"), { ssr: false });
const PrivateChatroom = dynamic(() => import("@/components/PrivateChatroom/PrivateChatroom"), { ssr: false });
const Guestbook = dynamic(() => import("@/components/Guestbook/Guestbook"), { ssr: false });
const PhotoGallery = dynamic(() => import("@/components/PhotoGallery/PhotoGallery"), { ssr: false });
const Downloads = dynamic(() => import("@/components/Downloads/Downloads"), { ssr: false });
const Webring = dynamic(() => import("@/components/Webring/Webring"), { ssr: false });
const Forum = dynamic(() => import("@/components/Forum/Forum"), { ssr: false });
const Clippy = dynamic(() => import("@/components/Clippy"), { ssr: false });
const ClippyChat = dynamic(() => import("@/components/ClippyChat"), { ssr: false });
const LegalNoticeBoard = dynamic(() => import("@/components/LegalNoticeBoard"), { ssr: false });

interface DesktopIcon {
  id: string;
  icon: string;
  label: string;
  type: "app" | "link" | "folder";
  action: () => void;
  folder?: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showClippyChat, setShowClippyChat] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("--:--");
  const [advertisement, setAdvertisement] = useState<any>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  // Stan dla folderów
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const res = await fetch("/api/advertisement", { cache: "no-store" });
        const data = await res.json();
        if (data.advertisement) setAdvertisement(data.advertisement);
      } catch (error) {
        console.error("Error fetching advertisement:", error);
      } finally {
        setLoadingAd(false);
      }
    };
    fetchAdvertisement();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news?limit=3", { cache: "no-store" });
        const data = await res.json();
        if (data.news) setLatestNews(data.news);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  const [windows, setWindows] = useState({
    reklama: true,
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
  const [activeWindow, setActiveWindow] = useState<string | null>("reklama");

  
  // Przygotuj slajdy z aktywnej reklamy lub domyślne
  const slides = advertisement?.slides && advertisement.slides.length > 0
    ? advertisement.slides.map((slide: any) => ({
        title: slide.title || advertisement.title,
        imageUrl: slide.image_url,
        linkTo: advertisement.link_url || "#",
      }))
    : [
        {
          title: "Koniec odkładania. Czas tworzenia.",
          imageUrl: "/images/slider-1.jpg",
          linkTo: "https://www.facebook.com/annajuszczakfotografia/",
        },
        {
          title: "Przestań marzyć. Zacznij działać.",
          imageUrl: "/images/slider-2.jpg",
          linkTo: "https://www.facebook.com/annajuszczakfotografia/",
        },
        {
          title: "Każdy wielki projekt zaczyna się od pierwszego kroku.",
          imageUrl: "/images/slider-3.jpg",
          linkTo: "https://www.facebook.com/annajuszczakfotografia/",
        },
      ];

  // Ujednolicone parametry okien (zoptymalizowane pod mobilki)
  const windowConfig = {
    width: "min(96vw, 700px)",
    height: "min(60vh, 450px)", // Zmniejszona wysokość
    x: 4,
    y: 200, // Przesunięte niżej
  };

  // Funkcja przełączania okien (Taskbar)
  const toggleWindow = (key: string) => {
    setWindows(prev => ({ ...prev, [key]: true }));
    setMinimized(prev => ({ ...prev, [key]: false }));
    setActiveWindow(key);
  };

  // Fetch products when shop opens
  useEffect(() => {
    if (windows.shop && products.length === 0 && !loadingProducts) {
      fetchProducts();
    }
  }, [windows.shop]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products?perPage=12");
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const desktopIcons: DesktopIcon[] = [
    // MAGNETS (Zostają na pulpicie)
    {
      id: "ai-studio",
      icon: "🤖",
      label: "AI Studio.lnk",
      type: "link",
      action: () => window.open("https://ai.kupmax.pl", "_blank"),
    },
    {
      id: "vibe3d",
      icon: "🎮",
      label: "Vibe3D.apk",
      type: "link",
      action: () => window.open("https://play.google.com/store/apps/details?id=com.kupmax.vibe3d", "_blank"),
    },
    {
      id: "roblox",
      icon: "🎪",
      label: "Roblox.url",
      type: "link",
      action: () => window.open("https://www.roblox.com", "_blank"),
    },
    // FOLDERY
    {
      id: "folder-system",
      icon: "📁",
      label: "SYSTEM",
      type: "folder",
      action: () => setOpenFolder("SYSTEM"),
    },
    {
      id: "folder-community",
      icon: "👥",
      label: "SPOŁECZNOŚĆ",
      type: "folder",
      action: () => setOpenFolder("SPOŁECZNOŚĆ"),
    },
    {
      id: "folder-fun",
      icon: "🎡",
      label: "ROZRYWKA",
      type: "folder",
      action: () => setOpenFolder("ROZRYWKA"),
    },
    {
      id: "folder-data",
      icon: "🗄️",
      label: "ZASOBY",
      type: "folder",
      action: () => setOpenFolder("ZASOBY"),
    },
    // UKRYTE W FOLDERACH (Przykładowe przypisanie)
    {
      id: "reklama",
      icon: "📷",
      label: "Reklama.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, reklama: true })),
      folder: "SYSTEM"
    },
    {
      id: "news",
      icon: "📰",
      label: "News.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, news: true })),
      folder: "SYSTEM"
    },
    {
      id: "shop",
      icon: "🛒",
      label: "Shop.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, shop: true })),
      folder: "SYSTEM"
    },
    {
      id: "chat",
      icon: "💬",
      label: "Chat.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, chat: true })),
      folder: "SPOŁECZNOŚĆ"
    },
    {
      id: "forum",
      icon: "🗨️",
      label: "Forum.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, forum: true })),
      folder: "SPOŁECZNOŚĆ"
    },
    {
      id: "guestbook",
      icon: "📖",
      label: "Guestbook.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, guestbook: true })),
      folder: "SPOŁECZNOŚĆ"
    },
    {
      id: "tetris",
      icon: "🕹️",
      label: "BlockBlitz.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, tetris: true })),
      folder: "ROZRYWKA"
    },
    {
      id: "radio",
      icon: "📻",
      label: "Radio.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, radio: true })),
      folder: "ROZRYWKA"
    },
    {
      id: "photos",
      icon: "📸",
      label: "Photos.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, photos: true })),
      folder: "ZASOBY"
    },
    {
      id: "downloads",
      icon: "💾",
      label: "Downloads",
      type: "folder",
      action: () => setWindows(prev => ({ ...prev, downloads: true })),
      folder: "ZASOBY"
    },
    {
      id: "clippy",
      icon: "📎",
      label: "Clippy AI.exe",
      type: "app",
      action: () => setShowClippyChat(true),
      folder: "SYSTEM"
    },
    {
      id: "bulletin",
      icon: "📜",
      label: "Regulamin.exe",
      type: "app",
      action: () => setWindows(prev => ({ ...prev, bulletin: true })),
      folder: "SYSTEM"
    }
  ];

  const mainIcons = desktopIcons.filter(icon => !icon.folder);
  const folderIcons = (folderName: string) => desktopIcons.filter(icon => icon.folder === folderName);

  const openWindowsList = Object.entries(windows)
    .filter(([_, isOpen]) => isOpen)
    .map(([key]) => {
      const iconDef = desktopIcons.find(icon => icon.id === key);
      return {
        key,
        icon: iconDef?.icon || "📁",
        label: iconDef?.label.replace('.exe', '') || key.charAt(0).toUpperCase() + key.slice(1),
      }
    });

  if (openFolder) {
    const folderIconDef = desktopIcons.find(icon => icon.id === `folder-${openFolder.toLowerCase()}`);
    openWindowsList.push({
      key: `folder-${openFolder}`,
      icon: folderIconDef?.icon || "📁",
      label: openFolder,
    });
  }

  const handleTaskbarClick = (key: string) => {
    setActiveWindow(key);
    // For regular windows, this un-minimizes them. For folders, it does nothing, which is fine.
    setMinimized(prev => ({ ...prev, [key]: false }));
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#008080]">
      {/* Taskbar */}
      <div className="absolute left-0 right-0 top-0 h-10 sm:h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-1 gap-1 z-[110]">
        <button className="win95-button px-3 h-6 font-bold flex items-center gap-2" onClick={() => setShowStartMenu(!showStartMenu)}>
          <span className="text-lg">🪟</span><span>Start</span>
        </button>
        <StartMenu show={showStartMenu} onClose={() => setShowStartMenu(false)} desktopIcons={desktopIcons} session={session} />
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {openWindowsList.map((win) => (
            <button
              key={win.key}
              onClick={() => handleTaskbarClick(win.key)}
              className={`px-2 h-6 text-xs flex items-center gap-1 min-w-[80px] border-2 ${activeWindow === win.key ? 'bg-[#c0c0c0] font-bold' : 'bg-[#dfdfdf]'} border-t-white border-l-white border-r-black border-b-black`}
            >
              <span>{win.icon}</span><span className="truncate">{win.label}</span>
            </button>
          ))}
        </div>
        <div className="text-xs px-2 border-2 border-t-black border-l-black h-6 flex items-center ml-1 bg-[#c0c0c0] shadow-inner">
          {currentTime}
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-12 left-4 right-4 grid grid-cols-4 sm:grid-cols-8 gap-6 z-10">
        {mainIcons.map((item) => (
          <div key={item.id} className="flex flex-col items-center cursor-pointer group" onClick={item.action} onDoubleClick={item.action}>
            <div className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 transition-colors ${["ai-studio", "vibe3d", "roblox"].includes(item.id) ? "ring-2 ring-yellow-400" : ""}`}>
              <span className="text-3xl sm:text-4xl">{item.icon}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white text-center mt-1 drop-shadow-md font-medium max-w-[80px] truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Folder Window */}
      {openFolder && (
        <Window
          title={`📁 Folder: ${openFolder}`}
          icon="📁"
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
          onClose={() => setOpenFolder(null)}
          isActive={activeWindow === `folder-${openFolder}`}
          onFocus={() => setActiveWindow(`folder-${openFolder}`)}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 bg-white h-full overflow-y-auto">
            {folderIcons(openFolder).map((item) => (
              <div key={item.id} className="flex flex-col items-center cursor-pointer hover:bg-blue-50 p-2 rounded" onClick={() => { item.action(); setOpenFolder(null); }}>
                <span className="text-3xl">{item.icon}</span>
                <span className="text-[10px] text-center mt-1 text-black font-medium truncate w-full">{item.label}</span>
              </div>
            ))}
          </div>
        </Window>
      )}

      {/* Pozostałe okna (uproszczone wywołania dla jasności) */}
      {windows.reklama && (
        <Window
          title={`📷 Reklama - ${advertisement?.advertiser_name || 'Ładowanie...'}`}
          icon="📷"
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
          width={windowConfig.width} height={windowConfig.height} x={windowConfig.x} y={windowConfig.y}
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
