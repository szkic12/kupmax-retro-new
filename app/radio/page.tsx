'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactRadio = dynamic(() => import('../../components/ReactRadio/ReactRadio'), {
  ssr: false,
});

/**
 * /radio - Winamp Player Style
 * Classic Winamp skin, visualizations, playlists
 */
export default function RadioPage() {
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [selectedSkin, setSelectedSkin] = useState('classic');
  const [eqBands, setEqBands] = useState([60, 70, 80, 75, 65, 55, 70, 80, 85, 70]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animate EQ bands
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setEqBands(prev => prev.map(() => Math.random() * 50 + 40));
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const skinColors = {
    classic: { bg: '#232323', accent: '#00ff00', text: '#00ff00' },
    blue: { bg: '#1a1a3e', accent: '#00ccff', text: '#00ccff' },
    orange: { bg: '#2a1a0a', accent: '#ff9900', text: '#ffcc00' },
    pink: { bg: '#2a1a2a', accent: '#ff00ff', text: '#ff66ff' },
  };

  const colors = skinColors[selectedSkin as keyof typeof skinColors];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: `radial-gradient(ellipse at center, ${colors.bg} 0%, #000000 100%)`,
      }}
    >
      {/* Winamp tagline */}
      <div className="text-center mb-4">
        <p
          className="text-sm italic animate-pulse"
          style={{ color: colors.accent }}
        >
          "Winamp, it really whips the llama's ass!"
        </p>
      </div>

      {/* Main Winamp window */}
      <div className="relative">
        {/* Decorative glow */}
        <div
          className="absolute -inset-4 rounded-lg opacity-30 blur-xl"
          style={{ background: colors.accent }}
        />

        {/* Main player */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 3%, #1a1a1a 100%)',
            border: '2px solid #5a5a5a',
            boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
            width: '275px',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{
              background: 'linear-gradient(180deg, #3a5795 0%, #1e3a6e 100%)',
            }}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">⚡</span>
              <span className="text-white text-xs font-bold tracking-wider">KUPMAX RADIO</span>
            </div>
            <div className="flex gap-1">
              <button className="w-3 h-3 bg-gray-400 border border-gray-600 text-[8px] leading-none">_</button>
              <button className="w-3 h-3 bg-gray-400 border border-gray-600 text-[8px] leading-none">□</button>
              <button className="w-3 h-3 bg-red-500 border border-red-700 text-[8px] leading-none text-white">×</button>
            </div>
          </div>

          {/* Display */}
          <div
            className="mx-2 mt-2 p-2 rounded"
            style={{
              background: '#000000',
              border: '2px inset #333',
            }}
          >
            {/* Visualization area */}
            <div
              className="h-10 flex items-end justify-center gap-[2px] mb-2 px-1"
              style={{ background: 'linear-gradient(180deg, #001100 0%, #000000 100%)' }}
            >
              {eqBands.map((height, i) => (
                <div
                  key={i}
                  className="w-2 transition-all duration-75"
                  style={{
                    height: `${isPlaying ? height : 20}%`,
                    background: `linear-gradient(180deg, ${colors.accent} 0%, #004400 100%)`,
                    boxShadow: isPlaying ? `0 0 5px ${colors.accent}` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Track info */}
            <div className="overflow-hidden">
              <div
                className="text-xs font-mono whitespace-nowrap"
                style={{
                  color: colors.text,
                  textShadow: `0 0 10px ${colors.accent}`,
                  animation: isPlaying ? 'scroll 10s linear infinite' : 'none',
                }}
              >
                ♪ KUPMAX RADIO - The Best Retro Music Station ♪ Broadcasting 24/7 ♪
              </div>
            </div>

            {/* Time and bitrate */}
            <div className="flex justify-between mt-1 text-xs font-mono" style={{ color: colors.accent }}>
              <span>{currentTime}</span>
              <span>128 kbps</span>
              <span>44 kHz</span>
            </div>
          </div>

          {/* Volume and balance */}
          <div className="mx-2 mt-2 flex items-center gap-2 text-xs" style={{ color: '#aaa' }}>
            <span>VOL</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="flex-1 h-2 accent-green-500"
              style={{ accentColor: colors.accent }}
            />
            <span className="w-8 text-right" style={{ color: colors.text }}>{volume}%</span>
          </div>

          {/* Balance */}
          <div className="mx-2 mt-1 flex items-center gap-2 text-xs" style={{ color: '#aaa' }}>
            <span>BAL</span>
            <input
              type="range"
              min="-100"
              max="100"
              defaultValue="0"
              className="flex-1 h-2"
              style={{ accentColor: colors.accent }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex justify-center gap-1 mx-2 mt-3 mb-2">
            {['⏮', '⏪', '▶', '⏹', '⏩', '⏭'].map((btn, i) => (
              <button
                key={i}
                onClick={() => i === 2 && setIsPlaying(!isPlaying)}
                className="w-8 h-6 text-xs font-bold rounded transition-all hover:scale-110"
                style={{
                  background: i === 2 && isPlaying
                    ? `linear-gradient(180deg, ${colors.accent} 0%, #006600 100%)`
                    : 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)',
                  border: '1px solid #2a2a2a',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                  color: i === 2 && isPlaying ? '#000' : '#fff',
                }}
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Toggle buttons */}
          <div className="flex justify-center gap-2 mx-2 mb-2">
            <button
              onClick={() => setShowEqualizer(!showEqualizer)}
              className="px-2 py-1 text-[10px] font-bold rounded"
              style={{
                background: showEqualizer ? colors.accent : '#3a3a3a',
                color: showEqualizer ? '#000' : '#888',
              }}
            >
              EQ
            </button>
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="px-2 py-1 text-[10px] font-bold rounded"
              style={{
                background: showPlaylist ? colors.accent : '#3a3a3a',
                color: showPlaylist ? '#000' : '#888',
              }}
            >
              PL
            </button>
          </div>
        </div>

        {/* Equalizer window */}
        {showEqualizer && (
          <div
            className="relative mt-1 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 3%, #1a1a1a 100%)',
              border: '2px solid #5a5a5a',
              width: '275px',
            }}
          >
            <div
              className="flex items-center justify-between px-2 py-1"
              style={{
                background: 'linear-gradient(180deg, #3a5795 0%, #1e3a6e 100%)',
              }}
            >
              <span className="text-white text-xs font-bold">EQUALIZER</span>
              <button className="w-3 h-3 bg-gray-400 border border-gray-600 text-[8px]">×</button>
            </div>

            <div className="p-2">
              <div className="flex justify-between items-end h-20 gap-1">
                {['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'].map((freq, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue={50 + Math.random() * 30}
                      className="h-16 w-3"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        accentColor: colors.accent,
                      }}
                    />
                    <span className="text-[8px] mt-1" style={{ color: '#888' }}>{freq}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Playlist window */}
        {showPlaylist && (
          <div
            className="relative mt-1 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 3%, #1a1a1a 100%)',
              border: '2px solid #5a5a5a',
              width: '275px',
            }}
          >
            <div
              className="flex items-center justify-between px-2 py-1"
              style={{
                background: 'linear-gradient(180deg, #3a5795 0%, #1e3a6e 100%)',
              }}
            >
              <span className="text-white text-xs font-bold">PLAYLIST</span>
              <button className="w-3 h-3 bg-gray-400 border border-gray-600 text-[8px]">×</button>
            </div>

            <div
              className="p-1 max-h-32 overflow-y-auto"
              style={{ background: '#0a0a0a' }}
            >
              {[
                '01. Retro Vibes - Classic Mix',
                '02. 90s Megamix - Best Hits',
                '03. Techno Classics - Vol. 1',
                '04. Eurodance Party',
                '05. Chillout Lounge',
                '06. Rock Anthems',
              ].map((track, i) => (
                <div
                  key={i}
                  className={`px-2 py-1 text-xs cursor-pointer transition-colors ${i === 0 ? 'font-bold' : ''}`}
                  style={{
                    color: i === 0 ? colors.accent : '#888',
                    background: i === 0 ? 'rgba(0,255,0,0.1)' : 'transparent',
                  }}
                >
                  {track}
                </div>
              ))}
            </div>

            <div className="p-1 text-[10px] text-center" style={{ color: '#666' }}>
              6 tracks | 42:17
            </div>
          </div>
        )}
      </div>

      {/* Skin selector */}
      <div className="mt-6 flex gap-2">
        <span className="text-gray-500 text-sm">Skin:</span>
        {Object.keys(skinColors).map((skin) => (
          <button
            key={skin}
            onClick={() => setSelectedSkin(skin)}
            className={`px-3 py-1 text-xs rounded transition-all ${selectedSkin === skin ? 'scale-110' : ''}`}
            style={{
              background: skinColors[skin as keyof typeof skinColors].bg,
              border: `2px solid ${skinColors[skin as keyof typeof skinColors].accent}`,
              color: skinColors[skin as keyof typeof skinColors].text,
              boxShadow: selectedSkin === skin ? `0 0 10px ${skinColors[skin as keyof typeof skinColors].accent}` : 'none',
            }}
          >
            {skin.charAt(0).toUpperCase() + skin.slice(1)}
          </button>
        ))}
      </div>

      {/* Full radio component */}
      <div className="mt-8 w-full max-w-4xl">
        <div
          className="rounded-lg overflow-hidden"
          style={{
            border: `2px solid ${colors.accent}`,
            boxShadow: `0 0 30px ${colors.accent}30`,
          }}
        >
          <div
            className="py-2 px-4 text-center font-bold"
            style={{ background: colors.accent, color: '#000' }}
          >
            📻 WYBIERZ STACJĘ RADIOWĄ
          </div>
          <div style={{ background: '#1a1a1a' }}>
            <ReactRadio />
          </div>
        </div>
      </div>

      {/* Retro badges */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <div className="text-xs px-3 py-1 rounded" style={{ background: '#333', color: colors.accent, border: `1px solid ${colors.accent}` }}>
          🎵 MP3 Compatible
        </div>
        <div className="text-xs px-3 py-1 rounded" style={{ background: '#333', color: colors.accent, border: `1px solid ${colors.accent}` }}>
          📡 Streaming 24/7
        </div>
        <div className="text-xs px-3 py-1 rounded" style={{ background: '#333', color: colors.accent, border: `1px solid ${colors.accent}` }}>
          🔊 High Quality Audio
        </div>
      </div>

      {/* Back button */}
      <Link
        href="/"
        className="mt-8 px-6 py-2 font-bold rounded transition-all hover:scale-105"
        style={{
          background: colors.bg,
          color: colors.accent,
          border: `2px solid ${colors.accent}`,
          boxShadow: `0 0 10px ${colors.accent}40`,
        }}
      >
        ← POWRÓT DO KUPMAX RETRO
      </Link>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
