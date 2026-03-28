'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import RetroNavbar from '../../components/RetroNavbar';

interface Slide {
  id: string;
  image_url: string;
  title?: string;
  order_index: number;
}

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  link_url?: string;
  advertiser_name: string;
  image_url?: string;
  slides?: Slide[];
}

/**
 * /reklama - Flash Intro Style
 * Pełnoekranowa prezentacja jak stare Flash intro "ENTER SITE"
 * Dane pobierane z API /api/advertisement
 */
export default function ReklamaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [visitCount, setVisitCount] = useState(13847);
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch advertisement from API
  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const res = await fetch('/api/advertisement');
        const data = await res.json();
        if (data.advertisement) {
          setAdvertisement(data.advertisement);
        }
      } catch (error) {
        logger.error('Error fetching advertisement:', error);
      } finally {
        setLoadingAd(false);
      }
    };
    fetchAdvertisement();
  }, []);

  // Helper: ensure link has https://
  const ensureHttps = (url: string | null | undefined): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Symulacja ładowania Flash
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setShowContent(true), 500);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Get slides from advertisement (or create single slide from image_url)
  const slides: Slide[] = advertisement?.slides?.length
    ? advertisement.slides
    : advertisement?.image_url
    ? [{ id: '1', image_url: advertisement.image_url, title: advertisement.title, order_index: 0 }]
    : [
        { id: '1', image_url: '/images/slider-1.jpg', title: 'Sesje ślubne', order_index: 0 },
        { id: '2', image_url: '/images/slider-2.jpg', title: 'Portrety', order_index: 1 },
        { id: '3', image_url: '/images/slider-3.jpg', title: 'Eventy', order_index: 2 },
      ];

  // Get display data from advertisement or fallback
  const adTitle = advertisement?.title || 'Reklama';
  const adDescription = advertisement?.description || '';
  const adAdvertiser = advertisement?.advertiser_name || 'Reklamodawca';
  const adLinkUrl = ensureHttps(advertisement?.link_url);

  // Auto-advance slider
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Start/stop auto-slide
  useEffect(() => {
    if (showContent && slides.length > 1) {
      slideIntervalRef.current = setInterval(nextSlide, 4000);
      return () => {
        if (slideIntervalRef.current) {
          clearInterval(slideIntervalRef.current);
        }
      };
    }
  }, [showContent, slides.length, nextSlide]);

  // Loading screen - Flash style
  if (isLoading || loadingAd) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden pt-10">
        <RetroNavbar />
        {/* Animated stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 2 + 's',
                animationDuration: Math.random() * 2 + 1 + 's',
              }}
            />
          ))}
        </div>

        {/* Flash loading content */}
        <div className="relative z-10 text-center">
          {/* Animated logo */}
          <div className="text-6xl mb-8 animate-bounce">📷</div>

          <h1
            className="text-4xl font-bold mb-2 tracking-wider"
            style={{
              background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff)',
              backgroundSize: '400% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbow 3s linear infinite',
            }}
          >
            {adAdvertiser.toUpperCase()}
          </h1>
          <p className="text-cyan-400 text-xl mb-8 tracking-[0.5em]">R E K L A M A</p>

          {/* Loading bar */}
          <div className="w-80 mx-auto">
            <div
              className="h-4 border-2 border-cyan-400 rounded-full overflow-hidden"
              style={{ boxShadow: '0 0 10px #00ffff, inset 0 0 10px rgba(0,255,255,0.3)' }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(loadingProgress, 100)}%`,
                  background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1s linear infinite',
                  boxShadow: '0 0 20px #00ffff',
                }}
              />
            </div>
            <p className="text-cyan-400 mt-2 font-mono">
              LOADING... {Math.min(Math.floor(loadingProgress), 100)}%
            </p>
          </div>

          {/* Retro text */}
          <p className="text-gray-500 text-sm mt-8 animate-pulse">
            ★ Best viewed with Netscape Navigator 4.0 ★
          </p>
        </div>

        <style jsx>{`
          @keyframes rainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 400% 50%; }
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden transition-opacity duration-1000 pt-10 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      <RetroNavbar />
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-50"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Top retro banner */}
      <div className="relative z-10 bg-gradient-to-r from-purple-900 via-pink-800 to-purple-900 py-2 border-b-4 border-yellow-400">
        <div
          className="overflow-hidden whitespace-nowrap"
          style={{ animation: 'marquee 20s linear infinite' }}
        >
          <span className="text-yellow-300 text-lg font-bold tracking-wider">
            ★★★ {adAdvertiser.toUpperCase()} ★★★ {adTitle} ★★★ {adDescription || 'ZAPRASZAMY!'} ★★★
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4">

        {/* Image slider container */}
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Decorative frame */}
          <div
            className="absolute -inset-4 rounded-lg opacity-50"
            style={{
              background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff, #00ffff)',
              backgroundSize: '400% 400%',
              animation: 'gradient 5s ease infinite',
              filter: 'blur(10px)',
            }}
          />

          {/* Slider container */}
          <div className="relative bg-black rounded-lg overflow-hidden border-4 border-white shadow-2xl">
            {/* Slides */}
            <div className="relative h-[50vh] overflow-hidden">
              {slides.map((slide, index) => (
                <a
                  key={slide.id}
                  href={adLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  }`}
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title || `Slide ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </a>
              ))}

              {/* Navigation arrows (show only if multiple slides) */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all border-2 border-cyan-400"
                    style={{ boxShadow: '0 0 10px rgba(0,255,255,0.5)' }}
                  >
                    ◀
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all border-2 border-cyan-400"
                    style={{ boxShadow: '0 0 10px rgba(0,255,255,0.5)' }}
                  >
                    ▶
                  </button>
                </>
              )}
            </div>

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 z-10">
              <h2
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                style={{ textShadow: '2px 2px 4px #ff00ff, -2px -2px 4px #00ffff' }}
              >
                {slides[currentSlide]?.title || adTitle}
              </h2>
              {adDescription && (
                <p className="text-xl text-cyan-300">{adDescription}</p>
              )}
              <p className="text-white/70 text-sm mt-2">
                Reklamodawca: {adAdvertiser}
              </p>
            </div>

            {/* Slide indicators (dots) */}
            {slides.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full border-2 transition-all ${
                      index === currentSlide
                        ? 'bg-cyan-400 border-cyan-400'
                        : 'bg-transparent border-white/70 hover:border-cyan-400'
                    }`}
                    style={{ boxShadow: index === currentSlide ? '0 0 10px rgba(0,255,255,0.8)' : 'none' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <a
          href={adLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 px-8 py-4 text-xl font-bold rounded-lg relative overflow-hidden group"
          style={{
            background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
            boxShadow: '0 0 30px rgba(255,0,255,0.5), 0 0 60px rgba(0,255,255,0.3)',
          }}
        >
          <span className="relative z-10 text-white tracking-wider">
            ✨ ODWIEDŹ STRONĘ ✨
          </span>
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
            }}
          />
        </a>
      </div>

      {/* Bottom retro section */}
      <div className="relative z-10 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 py-4 border-t-4 border-cyan-400 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            {/* Visitor counter */}
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">👁️ Visitors:</span>
              <div className="flex">
                {String(visitCount).split('').map((digit, i) => (
                  <span
                    key={i}
                    className="bg-black text-green-400 px-2 py-1 font-mono text-xl border border-green-400"
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {/* Awards */}
            <div className="text-yellow-300">
              🏆 Featured Advertisement 🏆
            </div>

            {/* Guestbook link */}
            <Link
              href="/guestbook"
              className="text-pink-400 hover:text-pink-300 animate-pulse"
            >
              📖 Sign Our Guestbook! 📖
            </Link>
          </div>

          {/* Retro badges */}
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <div className="bg-blue-900 text-white px-3 py-1 text-sm border-2 border-blue-400 rounded">
              🌐 Netscape NOW!
            </div>
            <div className="bg-green-900 text-white px-3 py-1 text-sm border-2 border-green-400 rounded">
              ✓ Y2K Ready
            </div>
            <div className="bg-purple-900 text-white px-3 py-1 text-sm border-2 border-purple-400 rounded">
              🎨 Designed with ❤️
            </div>
          </div>

          {/* Back to main */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-gray-800 text-cyan-400 border-2 border-cyan-400 rounded hover:bg-cyan-400 hover:text-black transition-all"
              style={{ boxShadow: '0 0 10px rgba(0,255,255,0.5)' }}
            >
              ← POWRÓT DO KUPMAX RETRO ←
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-center text-gray-500 text-sm mt-4">
            © 1999-{new Date().getFullYear()} {adAdvertiser} | Powered by KUPMAX Retro
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
