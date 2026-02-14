'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useDownloads } from '../../hooks/useDownloads';

const Downloads = dynamic(() => import('../../components/Downloads/Downloads'), {
  ssr: false,
});

/**
 * /downloads - Tucows/Download.com Style
 * Star ratings, download progress bars, file categories
 */
export default function DownloadsPage() {
  const { files, stats, fetchFiles, downloadFile } = useDownloads();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFiles({ limit: 6, sortBy: 'downloads' }); // Fetch top 6 most downloaded files
  }, []);

  // Prawdziwe kategorie = podstrony z głównej strony
  const categoriesLinks = [
    { name: 'Tetris Game', icon: '🎮', url: '/tetris' },
    { name: 'Chat Room', icon: '💬', url: '/chat' },
    { name: 'Forum', icon: '🗨️', url: '/forum' },
    { name: 'Photos Gallery', icon: '📸', url: '/photos' },
    { name: 'News Portal', icon: '📰', url: '/news' },
    { name: 'Radio Player', icon: '📻', url: '/radio' },
    { name: 'Guestbook', icon: '📖', url: '/guestbook' },
    { name: 'Shop', icon: '🛒', url: '/shop' },
    { name: 'Webring', icon: '🌐', url: '/webring' },
    { name: 'Bulletin Board', icon: '📋', url: '/bulletin' },
  ];

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'new-releases') {
      fetchFiles({ sortBy: 'uploadedAt', sortOrder: 'desc', limit: 20 });
    } else if (tab === 'top-downloads') {
      fetchFiles({ sortBy: 'downloadCount', sortOrder: 'desc', limit: 20 });
    } else if (tab === 'home') {
      fetchFiles({ limit: 6, sortBy: 'downloads' });
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (searchQuery.trim()) {
      setActiveTab('search');
      fetchFiles({ search: searchQuery.trim(), limit: 50 });
    } else {
      // Jeśli puste, wróć do home
      setActiveTab('home');
      fetchFiles({ limit: 6, sortBy: 'downloads' });
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloading(fileName);
    setProgress(0);

    // Simulate progress while downloading
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // downloadFile automatically opens URL in new tab
    const result = await downloadFile(fileId);

    if (result.success) {
      setProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => setDownloading(null), 1000);
    } else {
      clearInterval(progressInterval);
      setDownloading(null);
      alert(`❌ Download failed: ${result.error}`);
    }
  };

  const featuredDownloads = files.slice(0, 6).map((file: any) => ({
    id: file.id,
    name: file.name,
    size: formatFileSize(file.size),
    rating: 5, // Could be added to database later
    downloads: file.downloadCount || 0,
    category: file.category || 'Other',
    icon: getCategoryIcon(file.category),
  }));

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function getCategoryIcon(category: string) {
    const icons: Record<string, string> = {
      Audio: '🎵',
      Video: '🎬',
      Utilities: '🔧',
      Games: '🎮',
      Graphics: '🎨',
      Internet: '🌐',
      Development: '💻',
    };
    return icons[category] || '📦';
  }

  // Sidebar categories = połączenie kategorii plików + linków do podstron
  const sidebarCategories = [
    ...categoriesLinks.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      count: null,
      url: cat.url,
      isLink: true,
    })),
  ];

  return (
    <div className="min-h-screen" style={{ background: '#e8e8e8' }}>
      {/* Download progress overlay */}
      {downloading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg text-center"
            style={{
              background: '#c0c0c0',
              border: '3px outset #ffffff',
              minWidth: '400px',
            }}
          >
            <div className="text-4xl mb-4">📥</div>
            <h3 className="font-bold mb-2">Downloading {downloading}</h3>

            {/* Progress bar */}
            <div
              className="h-6 rounded overflow-hidden mb-2"
              style={{
                background: '#ffffff',
                border: '2px inset #808080',
              }}
            >
              <div
                className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(180deg, #0000ff 0%, #000099 100%)',
                }}
              >
                {progress >= 10 && `${Math.floor(progress)}%`}
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {progress < 100 ? 'Please wait...' : '✅ Download complete!'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(180deg, #003399 0%, #001166 100%)',
          borderBottom: '4px solid #ffcc00',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-5xl">💾</div>
              <div>
                <h1
                  className="text-3xl font-bold text-white"
                  style={{
                    fontFamily: 'Impact, sans-serif',
                    textShadow: '2px 2px 0 #000',
                  }}
                >
                  KUPMAX DOWNLOADS
                </h1>
                <p className="text-xs text-cyan-300">The Best Free Software on the Net!</p>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloads..."
                className="px-4 py-2 rounded"
                style={{
                  background: '#ffffff',
                  border: '2px inset #808080',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2 font-bold transition-all hover:scale-105"
                style={{
                  background: '#ffcc00',
                  border: '2px outset #ffffff',
                  color: '#003399',
                }}
              >
                🔍 Search
              </button>
            </form>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex gap-2 flex-wrap relative">
            <Link
              href="/"
              className="px-3 py-1 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: activeTab === 'home' ? '#ffcc00' : '#ffffff',
                border: '2px outset #ffffff',
                color: '#003399',
              }}
            >
              🏠 Home
            </Link>
            <button
              onClick={() => handleTabClick('new-releases')}
              className="px-3 py-1 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: activeTab === 'new-releases' ? '#ffcc00' : '#ffffff',
                border: '2px outset #ffffff',
                color: '#003399',
              }}
            >
              🆕 New Releases
            </button>
            <button
              onClick={() => handleTabClick('top-downloads')}
              className="px-3 py-1 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: activeTab === 'top-downloads' ? '#ffcc00' : '#ffffff',
                border: '2px outset #ffffff',
                color: '#003399',
              }}
            >
              ⭐ Top Downloads
            </button>
            <div className="relative">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="px-3 py-1 text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: showCategories ? '#ffcc00' : '#ffffff',
                  border: '2px outset #ffffff',
                  color: '#003399',
                }}
              >
                📁 Categories ▼
              </button>
              {showCategories && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 rounded overflow-hidden"
                  style={{
                    background: '#ffffff',
                    border: '3px ridge #003399',
                    minWidth: '200px',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {categoriesLinks.map((cat) => (
                    <Link
                      key={cat.url}
                      href={cat.url}
                      className="block px-4 py-2 text-sm hover:bg-blue-100 transition-colors"
                      style={{ borderBottom: '1px solid #e0e0e0' }}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setActiveTab('submit');
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="px-3 py-1 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: activeTab === 'submit' ? '#ffcc00' : '#ffffff',
                border: '2px outset #ffffff',
                color: '#003399',
              }}
            >
              ⬆️ Submit Software
            </button>
          </nav>
        </div>
      </header>

      {/* Stats bar */}
      <div
        className="py-2 text-center text-sm"
        style={{
          background: '#ffffcc',
          borderBottom: '2px solid #cccc00',
        }}
      >
        <span className="mx-4">📊 <strong>{stats.totalFiles || 0}</strong> Programs</span>
        <span className="mx-4">⬇️ <strong>{stats.totalDownloads || 0}</strong> Downloads Total</span>
        <span className="mx-4">💾 <strong>{formatFileSize(stats.totalSize || 0)}</strong> Total Storage</span>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <div
              className="rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '2px solid #003399',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white"
                style={{ background: '#003399' }}
              >
                📁 CATEGORIES
              </div>
              <div className="p-2">
                {sidebarCategories.map((cat) => (
                  cat.isLink ? (
                    <Link
                      key={cat.url}
                      href={cat.url}
                      className="flex items-center justify-between px-2 py-2 hover:bg-blue-50 text-sm transition-colors"
                      style={{ borderBottom: '1px dotted #ccc' }}
                    >
                      <span>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-gray-500 text-xs">→</span>
                    </Link>
                  ) : (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                      style={{ borderBottom: '1px dotted #ccc' }}
                    >
                      <span>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-gray-500">({cat.count})</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Path to Enlightenment - Featured */}
            {featuredDownloads.length > 0 && (
              <div
                className="mt-4 rounded overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1a0033 0%, #330066 100%)',
                  border: '3px solid #9966ff',
                  boxShadow: '0 0 20px rgba(153, 102, 255, 0.5)',
                }}
              >
                <div
                  className="py-2 px-4 font-bold text-center"
                  style={{
                    background: 'linear-gradient(90deg, #6600cc 0%, #9966ff 100%)',
                    color: '#ffffff',
                    textShadow: '0 0 10px rgba(255,255,255,0.5)',
                  }}
                >
                  🔮 CHOSEN PATH 🔮
                </div>
                <div className="p-4 text-center">
                  <div className="text-5xl mb-2 animate-pulse">{featuredDownloads[0].icon}</div>
                  <h3 className="font-bold text-purple-200">{featuredDownloads[0].name}</h3>
                  <div className="text-purple-300 text-xl my-2">🔮🔮🔮🔮🔮</div>
                  <p className="text-xs text-purple-400 mb-1 italic" style={{ fontFamily: 'Georgia, serif' }}>
                    "Transforming the pain of love, you build a bridge to the star"
                  </p>
                  <p className="text-sm text-purple-300 mb-3">
                    {featuredDownloads[0].size} • {featuredDownloads[0].downloads} downloads
                  </p>
                  <button
                    onClick={() => handleDownload(featuredDownloads[0].id, featuredDownloads[0].name)}
                    className="px-4 py-2 font-bold text-white rounded transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(180deg, #9966ff 0%, #6600cc 100%)',
                      border: '2px solid #cc99ff',
                      boxShadow: '0 0 10px rgba(153, 102, 255, 0.5)',
                    }}
                  >
                    ✨ Download & Ascend
                  </button>
                </div>
              </div>
            )}

            {/* Path to Enlightenment Rating */}
            <div
              className="mt-4 p-4 rounded text-center"
              style={{
                background: 'linear-gradient(135deg, #1a0033 0%, #330066 100%)',
                border: '3px solid #9966ff',
                boxShadow: '0 0 20px rgba(153, 102, 255, 0.3)',
              }}
            >
              <p className="text-sm font-bold text-purple-300 mb-3">🔮 Path to Enlightenment 🔮</p>
              <div className="space-y-2 text-xs text-purple-200">
                <div className="transition-all hover:scale-105">🔮🔮🔮🔮🔮 = Enlightenment!</div>
                <div className="transition-all hover:scale-105">👸👸👸👸 = Hive Queen</div>
                <div className="transition-all hover:scale-105">👑👑👑 = Queen's Attendant</div>
                <div className="transition-all hover:scale-105">🍯🍯 = Honey Crafter</div>
                <div className="transition-all hover:scale-105">🐝 = Buzzer</div>
              </div>
              <p className="text-xs text-purple-400 mt-3 italic" style={{ fontFamily: 'Georgia, serif' }}>
                "Not all that is hidden is meant to stay hidden"
              </p>
              <a
                href="https://ai.kupmax.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-300 hover:text-purple-100 underline mt-2 block"
              >
                ✨ Discover the Truth at ai.kupmax.pl
              </a>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Featured downloads */}
            <section
              className="rounded overflow-hidden mb-6"
              style={{
                background: '#ffffff',
                border: '2px solid #003399',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white flex justify-between items-center"
                style={{ background: 'linear-gradient(90deg, #003399 0%, #0066cc 100%)' }}
              >
                <span>🔥 HOT DOWNLOADS</span>
                <span className="text-xs bg-red-500 px-2 py-1 rounded animate-pulse">NEW!</span>
              </div>

              <div className="p-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredDownloads.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 rounded transition-all hover:-translate-y-1 cursor-pointer"
                      style={{
                        background: '#f5f5f5',
                        border: '2px solid #ccc',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{item.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-800 text-sm">{item.name}</h3>
                          <div className="text-purple-500 text-sm">
                            {item.rating === 5 && '🔮🔮🔮🔮🔮'}
                            {item.rating === 4 && '👸👸👸👸'}
                            {item.rating === 3 && '👑👑👑'}
                            {item.rating === 2 && '🍯🍯'}
                            {item.rating === 1 && '🐝'}
                          </div>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center text-xs text-gray-600">
                        <span>📁 {item.size}</span>
                        <span>⬇️ {item.downloads}</span>
                      </div>

                      <button
                        onClick={() => handleDownload(item.id, item.name)}
                        className="w-full mt-2 py-1 font-bold text-white text-sm rounded transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(180deg, #009900 0%, #006600 100%)',
                          border: '2px outset #00cc00',
                        }}
                      >
                        ⬇️ DOWNLOAD
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Full downloads component */}
            <section
              className="rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '2px solid #003399',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white"
                style={{ background: '#003399' }}
              >
                📂 ALL DOWNLOADS
              </div>
              <div className="p-4">
                <Downloads />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #003399 0%, #001166 100%)',
          borderTop: '4px solid #ffcc00',
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-6 text-white text-sm mb-4">
            <span>📧 Contact Us</span>
            <span>|</span>
            <span>📋 Submit Software</span>
            <span>|</span>
            <span>⚠️ Report Bug</span>
            <span>|</span>
            <span>📜 Terms of Use</span>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-6 py-2 font-bold rounded transition-all hover:scale-105"
              style={{
                background: '#ffcc00',
                color: '#003399',
                border: '2px outset #ffffff',
              }}
            >
              ← BACK TO KUPMAX RETRO
            </Link>
          </div>

          <p className="text-center text-cyan-300 text-xs mt-4">
            © 1999-2026 KUPMAX Downloads - Your trusted source for free software
            <br />
            All software is checked for viruses before being listed
          </p>
        </div>
      </footer>
    </div>
  );
}
