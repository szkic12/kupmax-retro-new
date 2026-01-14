'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const TetrisGame = dynamic(() => import('../../components/TetrisGame/TetrisGame'), {
  ssr: false,
});

/**
 * /tetris - Arcade Style
 * Neon lights, arcade cabinet feel, high scores, INSERT COIN
 */
export default function TetrisPage() {
  const [coins, setCoins] = useState(3);
  const [showGame, setShowGame] = useState(false);
  const [highScores, setHighScores] = useState([
    { name: 'AAA', score: 999999 },
    { name: 'BBB', score: 850000 },
    { name: 'CCC', score: 720000 },
    { name: 'DDD', score: 580000 },
    { name: 'EEE', score: 450000 },
    { name: 'FFF', score: 320000 },
    { name: 'GGG', score: 180000 },
    { name: 'HHH', score: 95000 },
  ]);

  const insertCoin = () => {
    if (coins > 0) {
      setCoins(coins - 1);
      setShowGame(true);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0015 100%)',
      }}
    >
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000'][Math.floor(Math.random() * 4)],
              opacity: 0.3,
              animation: `float ${Math.random() * 10 + 5}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Neon header */}
      <header className="relative py-8 text-center">
        <h1
          className="text-6xl md:text-8xl font-bold mb-4"
          style={{
            fontFamily: 'Impact, sans-serif',
            color: '#ffffff',
            textShadow: `
              0 0 10px #ff00ff,
              0 0 20px #ff00ff,
              0 0 30px #ff00ff,
              0 0 40px #ff00ff,
              0 0 50px #ff00ff
            `,
            animation: 'neonFlicker 2s infinite',
          }}
        >
          BLOCK BLITZ
        </h1>

        <p
          className="text-2xl mb-4"
          style={{
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
            fontFamily: 'monospace',
          }}
        >
          ★ EXTREME PUZZLE ARCADE ★
        </p>

        {/* Coin display */}
        <div
          className="inline-flex items-center gap-4 px-6 py-3 rounded-lg"
          style={{
            background: 'rgba(0,0,0,0.8)',
            border: '3px solid #ffff00',
            boxShadow: '0 0 20px rgba(255,255,0,0.5)',
          }}
        >
          <span className="text-yellow-400 text-xl">🪙 CREDITS:</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`text-3xl ${i < coins ? 'animate-pulse' : 'opacity-30'}`}
              >
                🪙
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative container mx-auto px-4 pb-8">
        {!showGame ? (
          /* Attract mode */
          <div className="max-w-4xl mx-auto">
            {/* INSERT COIN screen */}
            <div
              className="text-center p-8 rounded-lg mb-8"
              style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(20,0,40,0.9) 100%)',
                border: '4px solid',
                borderImage: 'linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff) 1',
                boxShadow: '0 0 30px rgba(255,0,255,0.3), inset 0 0 50px rgba(0,0,0,0.5)',
              }}
            >
              {/* Demo tetris pieces */}
              <div className="flex justify-center gap-4 mb-8">
                {['🟦', '🟨', '🟩', '🟥', '🟪', '🟧'].map((piece, i) => (
                  <span
                    key={i}
                    className="text-5xl animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {piece}
                  </span>
                ))}
              </div>

              <div
                className="text-4xl md:text-6xl font-bold mb-8 animate-pulse"
                style={{
                  color: '#ffff00',
                  textShadow: '0 0 20px #ffff00, 0 0 40px #ffff00',
                  fontFamily: 'monospace',
                }}
              >
                {coins > 0 ? '🕹️ INSERT COIN 🕹️' : '💸 GAME OVER 💸'}
              </div>

              {coins > 0 ? (
                <button
                  onClick={insertCoin}
                  className="px-12 py-6 text-3xl font-bold rounded-lg transition-all hover:scale-110"
                  style={{
                    background: 'linear-gradient(180deg, #ff0000 0%, #aa0000 100%)',
                    color: '#ffffff',
                    border: '4px solid #ff6666',
                    boxShadow: '0 0 30px rgba(255,0,0,0.5), 0 5px 0 #660000',
                    textShadow: '2px 2px 4px #000',
                  }}
                >
                  🎮 PRESS START 🎮
                </button>
              ) : (
                <button
                  onClick={() => setCoins(3)}
                  className="px-8 py-4 text-xl font-bold rounded-lg transition-all hover:scale-110"
                  style={{
                    background: 'linear-gradient(180deg, #00aa00 0%, #006600 100%)',
                    color: '#ffffff',
                    border: '3px solid #00ff00',
                  }}
                >
                  🪙 ADD MORE COINS
                </button>
              )}

              {/* Controls info */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { key: '←', action: 'MOVE LEFT' },
                  { key: '→', action: 'MOVE RIGHT' },
                  { key: '↑', action: 'ROTATE' },
                  { key: '↓', action: 'DROP' },
                ].map((ctrl) => (
                  <div
                    key={ctrl.key}
                    className="p-3 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <div
                      className="text-3xl mb-1"
                      style={{
                        color: '#00ffff',
                        textShadow: '0 0 10px #00ffff',
                      }}
                    >
                      {ctrl.key}
                    </div>
                    <div className="text-xs text-gray-400">{ctrl.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* High scores */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.9)',
                border: '3px solid #00ffff',
                boxShadow: '0 0 20px rgba(0,255,255,0.3)',
              }}
            >
              <div
                className="py-3 text-center font-bold text-xl"
                style={{
                  background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
                  color: '#000',
                }}
              >
                🏆 HIGH SCORES 🏆
              </div>

              <div className="p-4">
                <table className="w-full text-center">
                  <thead>
                    <tr className="text-cyan-400 text-sm">
                      <th className="py-2">RANK</th>
                      <th>NAME</th>
                      <th>SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((score, i) => (
                      <tr
                        key={i}
                        className={`${i === 0 ? 'text-yellow-400' : i < 3 ? 'text-white' : 'text-gray-500'}`}
                        style={{
                          textShadow: i === 0 ? '0 0 10px #ffff00' : 'none',
                        }}
                      >
                        <td className="py-2 text-xl">{i === 0 ? '👑' : i + 1}</td>
                        <td className="font-mono">{score.name}</td>
                        <td className="font-mono">{score.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Game mode */
          <div
            className="max-w-4xl mx-auto rounded-lg overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.95)',
              border: '4px solid',
              borderImage: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff) 1',
              boxShadow: '0 0 50px rgba(255,0,255,0.3)',
            }}
          >
            <div
              className="py-2 px-4 flex justify-between items-center"
              style={{
                background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
              }}
            >
              <span className="font-bold text-black">🎮 NOW PLAYING</span>
              <button
                onClick={() => setShowGame(false)}
                className="px-3 py-1 bg-red-500 text-white font-bold rounded hover:bg-red-600"
              >
                EXIT
              </button>
            </div>

            <div className="p-4">
              <TetrisGame
                onGameComplete={(code: string) => {
                  console.log('Discount code:', code);
                  setShowGame(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Arcade cabinet decorations */}
        <div className="flex justify-center gap-8 mt-8">
          {['🕹️', '👾', '🎮', '🏆', '⭐', '🎯', '🔥', '💎'].map((icon, i) => (
            <span
              key={i}
              className="text-4xl animate-bounce opacity-50"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {icon}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center">
        <Link
          href="/"
          className="inline-block px-8 py-3 font-bold text-lg rounded-lg transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(180deg, #6600ff 0%, #4400aa 100%)',
            color: '#ffffff',
            border: '3px solid #aa66ff',
            boxShadow: '0 0 20px rgba(102,0,255,0.5)',
            textShadow: '0 0 10px #ffffff',
          }}
        >
          ← EXIT TO LOBBY
        </Link>

        <p
          className="text-gray-500 text-sm mt-4"
          style={{ fontFamily: 'monospace' }}
        >
          © 1984-2026 KUPMAX ARCADE | INSERT COIN TO CONTINUE
        </p>
      </footer>

      <style jsx>{`
        @keyframes neonFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
          52% { opacity: 1; }
          54% { opacity: 0.8; }
          56% { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); }
          100% { transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
