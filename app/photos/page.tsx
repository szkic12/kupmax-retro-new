'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PhotoGallery = dynamic(() => import('../../components/PhotoGallery/PhotoGallery'), {
  ssr: false,
});

/**
 * /photos - GeoCities Style Gallery
 * Under construction GIFs, star backgrounds, frames, hit counter
 */
export default function PhotosPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const albums = [
    { name: 'Vacation 1999', icon: '🏖️', count: 24 },
    { name: 'Family Photos', icon: '👨‍👩‍👧‍👦', count: 42 },
    { name: 'My Pets', icon: '🐕', count: 18 },
    { name: 'Cool Cars', icon: '🚗', count: 31 },
    { name: 'Nature', icon: '🌲', count: 56 },
    { name: 'Random Stuff', icon: '📦', count: 89 },
  ];

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
        {/* Animated title */}
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
          ★ My Photo Gallery ★
        </h1>

        <p className="text-cyan-300 text-xl mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          ~ Welcome to my corner of the web! ~
        </p>

        {/* Under construction GIF placeholder */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-4xl animate-bounce">🚧</div>
          <div
            className="px-4 py-2 text-yellow-300 font-bold rounded animate-pulse"
            style={{
              background: 'repeating-linear-gradient(45deg, #000 0px, #000 10px, #ffff00 10px, #ffff00 20px)',
              border: '3px solid #ffff00',
            }}
          >
            ⚠️ UNDER CONSTRUCTION ⚠️
          </div>
          <div className="text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🚧</div>
        </div>

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
      <nav
        className="relative mx-4 mb-8 p-4 rounded-lg text-center"
        style={{
          background: 'linear-gradient(180deg, #4a004a 0%, #2a002a 100%)',
          border: '3px ridge #ff00ff',
        }}
      >
        <div className="flex flex-wrap justify-center gap-4">
          {['🏠 Home', '📸 Photos', '👤 About Me', '✉️ Email Me', '🔗 Links', '📖 Guestbook'].map((item) => (
            <span
              key={item}
              className="px-4 py-2 cursor-pointer transition-all hover:scale-110"
              style={{
                background: 'linear-gradient(180deg, #ff00ff 0%, #aa00aa 100%)',
                border: '2px outset #ff66ff',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px #000',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative container mx-auto px-4 pb-8">
        {/* Intro section */}
        <section
          className="mb-8 p-6 rounded-lg text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,50,0.8) 100%)',
            border: '4px double #00ffff',
          }}
        >
          <div className="text-6xl mb-4">📷</div>
          <h2
            className="text-2xl font-bold text-yellow-300 mb-4"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Welcome to my Photo Collection!!!
          </h2>
          <p className="text-cyan-200 max-w-2xl mx-auto" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Here you will find all my favorite photos from trips, family events, and random cool stuff I found on the internet!
            Feel free to browse around and don't forget to sign my <Link href="/guestbook" className="text-pink-400 underline animate-pulse">guestbook</Link>!
          </p>

          {/* Animated divider */}
          <div className="flex justify-center gap-2 mt-4">
            {['⭐', '✨', '🌟', '✨', '⭐', '✨', '🌟', '✨', '⭐'].map((star, i) => (
              <span
                key={i}
                className="text-xl animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {star}
              </span>
            ))}
          </div>
        </section>

        {/* Albums section */}
        <section className="mb-8">
          <h3
            className="text-2xl font-bold text-center mb-6"
            style={{
              color: '#ffff00',
              fontFamily: 'Comic Sans MS, cursive',
              textShadow: '2px 2px 4px #ff00ff',
            }}
          >
            ~ Photo Albums ~
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {albums.map((album, i) => (
              <div
                key={album.name}
                className="p-4 rounded-lg text-center cursor-pointer transition-all hover:scale-110 hover:-rotate-3"
                style={{
                  background: `linear-gradient(180deg, ${['#ff0066', '#00ff66', '#6600ff', '#ff6600', '#00ffff', '#ffff00'][i]} 0%, #000 100%)`,
                  border: '3px ridge silver',
                  boxShadow: '5px 5px 15px rgba(0,0,0,0.5)',
                }}
              >
                <div className="text-5xl mb-2">{album.icon}</div>
                <p className="text-white font-bold text-sm" style={{ textShadow: '1px 1px 2px #000' }}>
                  {album.name}
                </p>
                <p className="text-xs text-gray-300">({album.count} pics)</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actual gallery component */}
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
              background: 'linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff)',
            }}
          >
            <h3
              className="text-xl font-bold text-white"
              style={{ textShadow: '2px 2px 4px #000' }}
            >
              🖼️ LATEST PHOTOS 🖼️
            </h3>
          </div>

          <div className="p-4">
            <PhotoGallery />
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
              🏆 Best Gallery Award 1999
            </div>
            <div
              className="px-4 py-2 rounded animate-pulse"
              style={{
                background: 'linear-gradient(45deg, silver, gray)',
                border: '3px ridge silver',
                animationDelay: '0.5s',
              }}
            >
              ⭐ Cool Site of the Day
            </div>
            <div
              className="px-4 py-2 rounded animate-pulse"
              style={{
                background: 'linear-gradient(45deg, #cd7f32, #8b4513)',
                border: '3px ridge #cd7f32',
                color: 'white',
                animationDelay: '1s',
              }}
            >
              📸 Featured on GeoCities
            </div>
          </div>

          {/* Links */}
          <div
            className="inline-block p-4 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.8)',
              border: '2px dashed #ff00ff',
            }}
          >
            <p className="text-pink-400 mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Link to me!!!
            </p>
            <div
              className="px-4 py-2 bg-white text-black font-mono text-xs rounded"
            >
              &lt;a href="https://kupmax.pl/photos"&gt;&lt;img src="banner.gif"&gt;&lt;/a&gt;
            </div>
          </div>

          {/* Webrings */}
          <div className="flex justify-center gap-4 flex-wrap text-sm">
            <span className="text-cyan-400">[◀ Previous]</span>
            <span className="text-pink-400">~ Photo Lovers Webring ~</span>
            <span className="text-cyan-400">[Next ▶]</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative py-8 text-center"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
          borderTop: '4px double #ff00ff',
        }}
      >
        <div className="flex justify-center gap-2 mb-4">
          {['💖', '📸', '🌟', '✨', '🌈', '✨', '🌟', '📸', '💖'].map((emoji, i) => (
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
          Made with ❤️ and lots of ☕
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
          ← Back to KUPMAX Retro ←
        </Link>

        <p className="text-gray-500 text-xs mt-4">
          © 1999-2026 My Awesome Photo Gallery | All Rights Reserved
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
