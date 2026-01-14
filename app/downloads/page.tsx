'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Downloads = dynamic(() => import('../../components/Downloads/Downloads'), {
  ssr: false,
});

/**
 * /downloads - Tucows/Download.com Style
 * Star ratings, download progress bars, file categories
 */
export default function DownloadsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDownload = (fileName: string) => {
    setDownloading(fileName);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloading(null), 1000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const featuredDownloads = [
    { name: 'WinZip 8.0', size: '2.4 MB', rating: 5, downloads: '2,451,892', category: 'Utilities', icon: '📦' },
    { name: 'Winamp 2.91', size: '1.2 MB', rating: 5, downloads: '5,892,341', category: 'Audio', icon: '🎵' },
    { name: 'mIRC 6.03', size: '1.8 MB', rating: 4, downloads: '1,234,567', category: 'Internet', icon: '💬' },
    { name: 'ICQ 2003b', size: '4.5 MB', rating: 4, downloads: '892,145', category: 'Internet', icon: '🌸' },
    { name: 'Napster 2.0', size: '3.2 MB', rating: 5, downloads: '3,456,789', category: 'Audio', icon: '🎸' },
    { name: 'RealPlayer 8', size: '5.1 MB', rating: 3, downloads: '456,123', category: 'Video', icon: '🎬' },
  ];

  const categories = [
    { name: 'Audio & Video', icon: '🎵', count: 1234 },
    { name: 'Internet Tools', icon: '🌐', count: 892 },
    { name: 'Games', icon: '🎮', count: 2341 },
    { name: 'Utilities', icon: '🔧', count: 1567 },
    { name: 'Graphics', icon: '🎨', count: 456 },
    { name: 'Development', icon: '💻', count: 234 },
    { name: 'Education', icon: '📚', count: 189 },
    { name: 'Business', icon: '💼', count: 312 },
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
            <div className="hidden md:flex items-center gap-2">
              <input
                type="text"
                placeholder="Search downloads..."
                className="px-4 py-2 rounded"
                style={{
                  background: '#ffffff',
                  border: '2px inset #808080',
                }}
              />
              <button
                className="px-4 py-2 font-bold"
                style={{
                  background: '#ffcc00',
                  border: '2px outset #ffffff',
                }}
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex gap-2 flex-wrap">
            {['Home', 'New Releases', 'Top Downloads', 'Categories', 'Submit Software'].map((item, i) => (
              <button
                key={item}
                className="px-3 py-1 text-sm font-bold"
                style={{
                  background: i === 0 ? '#ffcc00' : '#ffffff',
                  border: '2px outset #ffffff',
                  color: '#003399',
                }}
              >
                {item}
              </button>
            ))}
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
        <span className="mx-4">📊 <strong>45,892</strong> Programs</span>
        <span className="mx-4">⬇️ <strong>12,456,789</strong> Downloads Today</span>
        <span className="mx-4">⭐ <strong>98%</strong> Virus Free Guarantee</span>
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
                {categories.map((cat) => (
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
                ))}
              </div>
            </div>

            {/* Today's Pick */}
            <div
              className="mt-4 rounded overflow-hidden"
              style={{
                background: '#fffff0',
                border: '3px solid #ffcc00',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-center"
                style={{ background: '#ffcc00' }}
              >
                ⭐ TODAY'S PICK ⭐
              </div>
              <div className="p-4 text-center">
                <div className="text-5xl mb-2">🎵</div>
                <h3 className="font-bold text-blue-800">Winamp 2.91</h3>
                <div className="text-yellow-500 text-xl my-1">★★★★★</div>
                <p className="text-sm text-gray-600 mb-2">The best MP3 player!</p>
                <button
                  onClick={() => handleDownload('Winamp 2.91')}
                  className="px-4 py-1 font-bold text-white rounded"
                  style={{ background: '#009900' }}
                >
                  ⬇️ Download Now!
                </button>
              </div>
            </div>

            {/* Cow rating */}
            <div
              className="mt-4 p-4 rounded text-center"
              style={{
                background: '#e8f4e8',
                border: '2px solid #009900',
              }}
            >
              <p className="text-sm font-bold text-green-800 mb-2">Our Rating System:</p>
              <div className="space-y-1 text-sm">
                <div>🐄🐄🐄🐄🐄 = Excellent!</div>
                <div>🐄🐄🐄🐄 = Very Good</div>
                <div>🐄🐄🐄 = Good</div>
                <div>🐄🐄 = Average</div>
                <div>🐄 = Poor</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">(Inspired by Tucows)</p>
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
                          <div className="text-yellow-500 text-sm">
                            {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                          </div>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center text-xs text-gray-600">
                        <span>📁 {item.size}</span>
                        <span>⬇️ {item.downloads}</span>
                      </div>

                      <button
                        onClick={() => handleDownload(item.name)}
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
