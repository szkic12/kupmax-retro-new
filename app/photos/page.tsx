'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RetroEmoji, EmojiType, emojiToCode } from '../../components/RetroEmoji/RetroEmoji';
import RetroNavbar from '../../components/RetroNavbar';

const allEmojis: EmojiType[] = ['smile', 'laugh', 'sad', 'wink', 'tongue', 'love', 'cool', 'angry', 'surprise', 'think'];

type TabType = 'products' | 'moje' | 'reklamy';

interface Photo {
  id: string;
  image_url?: string;
  imageUrl?: string;
  title?: string;
  name?: string;
  productName?: string;
}

/**
 * /photos - GeoCities Style Gallery z 3 zakładkami
 * 1. Produkty - zdjęcia z ai.kupmax.pl (firmy z activePlanets >= 3)
 * 2. Moje zdjęcia - prywatny magazynek admina (S3 linki)
 * 3. Reklamy - zdjęcia z systemu reklam
 */
export default function PhotosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Fetch photos based on active tab
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      setPhotos([]);

      try {
        if (activeTab === 'products') {
          // Fetch products from ai.kupmax.pl with activePlanets >= 3
          const res = await fetch('/api/photos?source=products');
          const data = await res.json();
          if (data.success && data.photos) {
            setPhotos(data.photos);
          }
        } else if (activeTab === 'moje') {
          // Fetch admin's gallery photos
          const res = await fetch('/api/gallery-photos');
          const data = await res.json();
          if (data.photos) {
            setPhotos(data.photos);
          }
        } else if (activeTab === 'reklamy') {
          // Fetch advertisement slides - try all first, then fallback to active ad
          const res = await fetch('/api/advertisement?all=true');
          const data = await res.json();
          const allSlides: Photo[] = [];

          if (data.advertisements && data.advertisements.length > 0) {
            // Flatten all slides from all advertisements
            data.advertisements.forEach((ad: any) => {
              if (ad.slides && ad.slides.length > 0) {
                ad.slides.forEach((slide: any) => {
                  allSlides.push({
                    id: slide.id,
                    image_url: slide.image_url,
                    title: slide.title || ad.title,
                  });
                });
              }
            });
          }

          // If no slides found, try getting the active advertisement (includes default fallback)
          if (allSlides.length === 0) {
            const resSingle = await fetch('/api/advertisement');
            const dataSingle = await resSingle.json();
            if (dataSingle.advertisement?.slides) {
              dataSingle.advertisement.slides.forEach((slide: any) => {
                allSlides.push({
                  id: slide.id,
                  image_url: slide.image_url,
                  title: slide.title || dataSingle.advertisement.title,
                });
              });
            }
          }

          setPhotos(allSlides);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [activeTab]);

  const tabs = [
    { id: 'products' as TabType, label: 'Produkty', icon: '🛒', color: '#00ff66' },
    { id: 'moje' as TabType, label: 'Moje Zdjecia', icon: '📷', color: '#ff00ff' },
    { id: 'reklamy' as TabType, label: 'Reklamy', icon: '📺', color: '#ffff00' },
  ];

  const getImageUrl = (photo: Photo) => {
    return photo.image_url || photo.imageUrl || '';
  };

  const getPhotoTitle = (photo: Photo) => {
    return photo.title || photo.name || photo.productName || 'Zdjecie';
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(255,0,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0,255,255,0.1) 0%, transparent 50%),
          linear-gradient(180deg, #000033 0%, #000066 50%, #000033 100%)
        `,
      }}
    >
      <RetroNavbar />
      {/* Star field background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 2 + 1 + 's',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative py-8 text-center">
        <h1
          className="text-5xl md:text-6xl font-bold mb-4"
          style={{
            fontFamily: 'Comic Sans MS, cursive',
            background: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
            backgroundSize: '400% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'rainbow 5s linear infinite',
            textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          }}
        >
          * My Photo Gallery *
        </h1>

        <p className="text-cyan-300 text-xl mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          ~ Welcome to my corner of the web! ~
        </p>

        {/* Hit counter */}
        <div className="inline-block px-4 py-2 bg-black rounded border-2 border-cyan-400">
          <p className="text-xs text-gray-400 mb-1">You are visitor number:</p>
          <div className="flex justify-center">
            {['0', '0', '4', '2', '1', '3', '7'].map((d, i) => (
              <span
                key={i}
                className="bg-gradient-to-b from-gray-800 to-black text-green-400 px-2 py-1 font-mono text-xl border border-green-800"
                style={{ fontFamily: 'Digital, monospace', textShadow: '0 0 5px #00ff00' }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation */}

      {/* Main content */}
      <main className="relative container mx-auto px-4 pb-8">
        {/* Emoticons section */}
        <section className="mb-8">
          <div
            className="rounded-lg overflow-hidden max-w-2xl mx-auto"
            style={{
              background: '#fff8dc',
              border: '4px ridge #8B4513',
            }}
          >
            <div
              className="py-2 px-4 text-center font-bold text-white"
              style={{ background: '#cc6600' }}
            >
              EMOTICONS
            </div>
            <div className="p-4 flex flex-wrap justify-center gap-4">
              {allEmojis.map((type) => (
                <div
                  key={type}
                  className="cursor-pointer hover:scale-125 transition-transform"
                  title={emojiToCode[type]}
                >
                  <RetroEmoji type={type} size={48} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className="mb-6">
          <div className="flex justify-center gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-6 py-3 font-bold text-lg transition-all hover:scale-105"
                style={{
                  background: activeTab === tab.id
                    ? `linear-gradient(180deg, ${tab.color} 0%, ${tab.color}88 100%)`
                    : 'linear-gradient(180deg, #333 0%, #111 100%)',
                  border: activeTab === tab.id ? `3px ridge ${tab.color}` : '3px ridge #666',
                  color: activeTab === tab.id ? '#000' : '#fff',
                  textShadow: activeTab === tab.id ? 'none' : '1px 1px 2px #000',
                  boxShadow: activeTab === tab.id ? `0 0 20px ${tab.color}66` : 'none',
                }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Gallery section */}
        <section
          className="rounded-lg overflow-hidden"
          style={{
            border: '4px ridge gold',
            background: 'rgba(0,0,0,0.7)',
          }}
        >
          <div
            className="py-3 px-4 text-center"
            style={{
              background: `linear-gradient(90deg, ${tabs.find(t => t.id === activeTab)?.color || '#ff00ff'}, #000, ${tabs.find(t => t.id === activeTab)?.color || '#ff00ff'})`,
            }}
          >
            <h3
              className="text-xl font-bold text-white"
              style={{ textShadow: '2px 2px 4px #000' }}
            >
              {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label.toUpperCase()} {tabs.find(t => t.id === activeTab)?.icon}
            </h3>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl animate-spin inline-block mb-4">⟳</div>
                <p className="text-cyan-400" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Ladowanie zdjec...
                </p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-yellow-400" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  {activeTab === 'products' && 'Brak zdjec produktow. Firmy musza miec min. 3 planety w Hive Sounds!'}
                  {activeTab === 'moje' && 'Brak zdjec. Dodaj zdjecia przez Panel Rudy!'}
                  {activeTab === 'reklamy' && 'Brak zdjec reklamowych.'}
                </p>
                {activeTab === 'moje' && (
                  <Link
                    href="/panelrudy"
                    className="inline-block mt-4 px-6 py-2 font-bold"
                    style={{
                      background: 'linear-gradient(180deg, #ff00ff 0%, #aa00aa 100%)',
                      border: '2px outset #ff66ff',
                      color: 'white',
                    }}
                  >
                    Przejdz do Panel Rudy
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer transition-all hover:scale-105 hover:z-10"
                    onClick={() => setSelectedPhoto(photo)}
                    style={{
                      border: '3px ridge silver',
                      background: '#000',
                    }}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {getImageUrl(photo) ? (
                        <Image
                          src={getImageUrl(photo)}
                          alt={getPhotoTitle(photo)}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <span className="text-4xl">📷</span>
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <p className="text-white text-center px-2 text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                        {getPhotoTitle(photo)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Fun extras */}
        <section className="mt-8 text-center space-y-6">
          {/* Awards */}
          <div className="flex justify-center gap-4 flex-wrap">
            <div
              className="px-4 py-2 rounded animate-pulse"
              style={{
                background: 'linear-gradient(45deg, gold, yellow)',
                border: '3px ridge gold',
              }}
            >
              Best Gallery Award 1999
            </div>
            <div
              className="px-4 py-2 rounded animate-pulse"
              style={{
                background: 'linear-gradient(45deg, silver, gray)',
                border: '3px ridge silver',
                animationDelay: '0.5s',
              }}
            >
              Cool Site of the Day
            </div>
          </div>

          {/* Webrings */}
          <div className="flex justify-center gap-4 flex-wrap text-sm">
            <span className="text-cyan-400">[&lt; Previous]</span>
            <span className="text-pink-400">~ Photo Lovers Webring ~</span>
            <span className="text-cyan-400">[Next &gt;]</span>
          </div>
        </section>
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            style={{
              border: '4px ridge gold',
              background: '#000',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center text-2xl font-bold"
              style={{
                background: 'linear-gradient(180deg, #ff0000 0%, #990000 100%)',
                border: '2px outset #ff6666',
                color: 'white',
              }}
            >
              X
            </button>

            <div className="relative">
              {getImageUrl(selectedPhoto) && (
                <Image
                  src={getImageUrl(selectedPhoto)}
                  alt={getPhotoTitle(selectedPhoto)}
                  width={800}
                  height={600}
                  className="max-h-[80vh] w-auto object-contain"
                />
              )}
            </div>

            <div
              className="py-2 px-4 text-center"
              style={{
                background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
              }}
            >
              <p className="text-white font-bold" style={{ textShadow: '1px 1px 2px #000' }}>
                {getPhotoTitle(selectedPhoto)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="relative py-8 text-center"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
          borderTop: '4px double #ff00ff',
        }}
      >
        <div className="flex justify-center gap-2 mb-4">
          {['<3', '📸', '*', '~', '📷', '~', '*', '📸', '<3'].map((emoji, i) => (
            <span
              key={i}
              className="text-2xl animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Made with love and lots of coffee
          <br />
          Best viewed in 800x600 with Netscape Navigator
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 font-bold rounded-lg transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(180deg, #ff00ff 0%, #aa00aa 100%)',
            border: '3px outset #ff66ff',
            color: 'white',
            textShadow: '2px 2px 4px #000',
          }}
        >
          &lt;- Back to KUPMAX Retro &lt;-
        </Link>

        <p className="text-gray-500 text-xs mt-4">
          © 1999-{new Date().getFullYear()} My Awesome Photo Gallery | All Rights Reserved
        </p>
      </footer>

      <style jsx>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
      `}</style>
    </div>
  );
}
