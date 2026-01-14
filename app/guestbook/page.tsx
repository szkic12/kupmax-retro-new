'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Guestbook = dynamic(() => import('../../components/Guestbook/Guestbook'), {
  ssr: false,
});

/**
 * /guestbook - Classic 90s Guestbook
 * Sign my guestbook!, animated emoticons, colorful entries
 */
export default function GuestbookPage() {
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          linear-gradient(180deg, #ffffcc 0%, #ffcc99 50%, #ff9966 100%)
        `,
      }}
    >
      {/* Header */}
      <header
        className="py-8 text-center"
        style={{
          background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffaa00\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20z\'/%3E%3C/g%3E%3C/svg%3E")',
          borderBottom: '5px ridge #8B4513',
        }}
      >
        {/* Decorative books */}
        <div className="flex justify-center gap-4 text-5xl mb-4">
          <span className="animate-bounce">📖</span>
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>✍️</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>📝</span>
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold mb-2"
          style={{
            fontFamily: 'Georgia, serif',
            color: '#8B4513',
            textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
          }}
        >
          📖 Guest Book 📖
        </h1>

        <p
          className="text-xl text-orange-800"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          "Leave your mark in history!"
        </p>

        {/* Animated banner */}
        <div className="mt-4">
          <span
            className="inline-block px-6 py-2 text-lg font-bold rounded-lg animate-pulse"
            style={{
              background: 'linear-gradient(45deg, #ff6600, #ffcc00)',
              color: '#8B4513',
              border: '3px outset #ffcc00',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            ✨ Please Sign My Guestbook! ✨
          </span>
        </div>
      </header>

      {/* Marquee */}
      <div
        className="py-2"
        style={{
          background: '#8B4513',
          borderTop: '3px ridge #ffcc00',
          borderBottom: '3px ridge #ffcc00',
        }}
      >
        <div className="overflow-hidden whitespace-nowrap">
          <span
            className="inline-block text-yellow-300 font-bold"
            style={{ animation: 'marquee 20s linear infinite' }}
          >
            ⭐ Welcome to my Guestbook! ⭐ Please leave a message! ⭐ I love reading your comments! ⭐ Thank you for visiting! ⭐ Don&apos;t forget to bookmark this page! ⭐
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Rules */}
          <aside
            className="order-2 lg:order-1"
          >
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: '#fff8dc',
                border: '4px ridge #8B4513',
                boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="py-2 px-4 text-center font-bold text-white"
                style={{ background: '#8B4513' }}
              >
                📜 RULES 📜
              </div>
              <div className="p-4 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                <ul className="space-y-2 text-orange-900">
                  <li>✅ Be nice and respectful</li>
                  <li>✅ No spam or advertising</li>
                  <li>✅ Keep it family friendly</li>
                  <li>✅ Have fun!</li>
                  <li>❌ No bad words</li>
                  <li>❌ No links to bad sites</li>
                </ul>
              </div>
            </div>

            {/* Emoticons */}
            <div
              className="mt-4 rounded-lg overflow-hidden"
              style={{
                background: '#fff8dc',
                border: '4px ridge #8B4513',
              }}
            >
              <div
                className="py-2 px-4 text-center font-bold text-white"
                style={{ background: '#cc6600' }}
              >
                😊 EMOTICONS 😊
              </div>
              <div className="p-4 flex flex-wrap justify-center gap-2 text-2xl">
                {['😀', '😂', '🥰', '😎', '🤗', '👋', '🎉', '❤️', '⭐', '🌟', '🔥', '💯'].map((emoji, i) => (
                  <span
                    key={i}
                    className="cursor-pointer hover:scale-150 transition-transform"
                    title="Click to add"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div
              className="mt-4 rounded-lg overflow-hidden"
              style={{
                background: '#fff8dc',
                border: '4px ridge #8B4513',
              }}
            >
              <div
                className="py-2 px-4 text-center font-bold text-white"
                style={{ background: '#006633' }}
              >
                📊 STATS 📊
              </div>
              <div className="p-4 text-center text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                <p className="text-orange-800 mb-2">Total Entries:</p>
                <div className="flex justify-center">
                  {['1', '2', '4', '7'].map((d, i) => (
                    <span
                      key={i}
                      className="bg-black text-green-400 px-2 py-1 font-mono text-lg border border-gray-600"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-orange-800 mt-4">Last signed: Today!</p>
              </div>
            </div>
          </aside>

          {/* Main guestbook area */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Sign form */}
            <div
              className="rounded-lg overflow-hidden mb-8"
              style={{
                background: '#fff8dc',
                border: '4px ridge #8B4513',
                boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="py-3 px-4 text-center"
                style={{
                  background: 'linear-gradient(180deg, #8B4513 0%, #5c2d0a 100%)',
                }}
              >
                <h2 className="text-xl font-bold text-yellow-300" style={{ textShadow: '2px 2px 4px #000' }}>
                  ✍️ SIGN THE GUESTBOOK ✍️
                </h2>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-orange-900 font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                      Your Name: *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 rounded"
                      style={{
                        background: '#fffff0',
                        border: '3px inset #8B4513',
                        fontFamily: 'Georgia, serif',
                      }}
                      placeholder="Enter your name..."
                    />
                  </div>
                  <div>
                    <label className="block text-orange-900 font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                      Email (optional):
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 rounded"
                      style={{
                        background: '#fffff0',
                        border: '3px inset #8B4513',
                        fontFamily: 'Georgia, serif',
                      }}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-orange-900 font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Your Website (optional):
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 rounded"
                    style={{
                      background: '#fffff0',
                      border: '3px inset #8B4513',
                      fontFamily: 'Georgia, serif',
                    }}
                    placeholder="http://www.yoursite.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-orange-900 font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Your Message: *
                  </label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded resize-none"
                    style={{
                      background: '#fffff0',
                      border: '3px inset #8B4513',
                      fontFamily: 'Georgia, serif',
                    }}
                    placeholder="Write your message here... Be creative! 😊"
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    className="px-6 py-2 font-bold rounded transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
                      border: '3px outset #ffcc00',
                      color: '#8B4513',
                      boxShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    ✍️ SIGN GUESTBOOK
                  </button>
                  <button
                    className="px-6 py-2 font-bold rounded transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(180deg, #cccccc 0%, #999999 100%)',
                      border: '3px outset #cccccc',
                      color: '#333',
                      boxShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                    }}
                    onClick={() => { setFormName(''); setFormMessage(''); }}
                  >
                    🔄 CLEAR
                  </button>
                </div>
              </div>
            </div>

            {/* Actual guestbook component */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: '#fff8dc',
                border: '4px ridge #8B4513',
                boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="py-3 px-4 text-center"
                style={{
                  background: 'linear-gradient(180deg, #006633 0%, #004422 100%)',
                }}
              >
                <h2 className="text-xl font-bold text-yellow-300" style={{ textShadow: '2px 2px 4px #000' }}>
                  📜 GUESTBOOK ENTRIES 📜
                </h2>
              </div>

              <div className="p-4">
                <Guestbook
                  title=""
                  maxEntries={20}
                  showForm={false}
                  showList={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          <button
            className="px-4 py-2 font-bold rounded"
            style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #5c2d0a 100%)',
              color: '#ffcc00',
              border: '3px outset #8B4513',
            }}
          >
            ◀◀ First Page
          </button>
          <button
            className="px-4 py-2 font-bold rounded"
            style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #5c2d0a 100%)',
              color: '#ffcc00',
              border: '3px outset #8B4513',
            }}
          >
            ◀ Previous
          </button>
          <span className="px-4 py-2 font-bold text-orange-900">Page 1 of 5</span>
          <button
            className="px-4 py-2 font-bold rounded"
            style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #5c2d0a 100%)',
              color: '#ffcc00',
              border: '3px outset #8B4513',
            }}
          >
            Next ▶
          </button>
          <button
            className="px-4 py-2 font-bold rounded"
            style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #5c2d0a 100%)',
              color: '#ffcc00',
              border: '3px outset #8B4513',
            }}
          >
            Last Page ▶▶
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-8 text-center"
        style={{
          background: '#8B4513',
          borderTop: '5px ridge #ffcc00',
        }}
      >
        <div className="flex justify-center gap-4 mb-4 text-3xl">
          <span className="animate-bounce">📖</span>
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>💖</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>✍️</span>
          <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>💖</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>📖</span>
        </div>

        <p className="text-yellow-300 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Thank you for signing my guestbook!
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 font-bold rounded-lg transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
            border: '3px outset #ffcc00',
            color: '#8B4513',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.4)',
          }}
        >
          ← Back to KUPMAX Retro ←
        </Link>

        <p className="text-orange-300 text-sm mt-4" style={{ fontFamily: 'Georgia, serif' }}>
          Guestbook powered by KUPMAX © 1999-2026
        </p>
      </footer>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
