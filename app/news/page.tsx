'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  author: string;
  category: 'Niesamowite Historie' | 'Nowoczesne Technologie' | 'Eksperckie Poradniki';
  views: number;
  created_at: string;
}

// Kategorie w stylu BossXD
const CATEGORIES = [
  { name: 'Niesamowite Historie', icon: '📚', color: '#000080' },
  { name: 'Nowoczesne Technologie', icon: '💻', color: '#008000' },
  { name: 'Eksperckie Poradniki', icon: '📖', color: '#800000' },
] as const;

/**
 * /news - Portal informacyjny
 * Połączenie stylu Onet/WP z 1998 z kategoriami BossXD
 */
export default function NewsPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [weather, setWeather] = useState({ temp: 15, condition: '☀️ Słonecznie' });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      logger.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Simple Markdown to HTML parser
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2" style="color: #000080;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2" style="color: #000080;">$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0000ff; text-decoration: underline;">$1</a>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote style="border-left: 4px solid #000080; padding-left: 12px; margin: 8px 0; font-style: italic; color: #555;">$1</blockquote>')
      // Lists
      .replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
      // Single newlines to br
      .replace(/\n/g, '<br />');

    // Wrap in paragraph if needed
    if (!html.startsWith('<h') && !html.startsWith('<blockquote') && !html.startsWith('<li')) {
      html = '<p style="margin-bottom: 12px;">' + html + '</p>';
    }

    return html;
  };

  // Convert API news to display format
  const getMainNews = () => {
    if (news.length === 0) {
      // Fallback data
      return [
        { id: '1', title: 'KUPMAX otwiera nową erę handlu internetowego!', excerpt: 'Nasza platforma przekroczyła 10 000 użytkowników. Dziękujemy za zaufanie!', category: 'Niesamowite Historie' as const, created_at: new Date().toISOString(), image_url: null, author: 'Admin', content: '', views: 0 },
        { id: '2', title: 'Nowa aktualizacja systemu retro już dostępna', excerpt: 'Windows 95 style powraca w wielkim stylu. Zobacz co nowego!', category: 'Nowoczesne Technologie' as const, created_at: new Date().toISOString(), image_url: null, author: 'Admin', content: '', views: 0 },
        { id: '3', title: 'Forum KUPMAX - dołącz do dyskusji', excerpt: 'Tysiące tematów, setki aktywnych użytkowników. Nie czekaj!', category: 'Eksperckie Poradniki' as const, created_at: new Date().toISOString(), image_url: null, author: 'Admin', content: '', views: 0 },
      ];
    }
    return news.slice(0, 4);
  };

  const getSideNews = () => {
    if (news.length <= 4) {
      return [
        { title: 'Promocje w sklepie KUPMAX', category: 'HANDEL' },
        { title: 'Nowe funkcje czatu dostępne', category: 'UPDATE' },
        { title: 'Webring powiększa się', category: 'WEB' },
        { title: 'Gra Block Blitz bije rekordy', category: 'ROZRYWKA' },
        { title: 'Radio KUPMAX nadaje 24/7', category: 'MUZYKA' },
      ];
    }
    return news.slice(4).map(n => ({ title: n.title, category: n.category.toUpperCase().split(' ')[0] }));
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.icon || '📰';
  };

  const getNewsByCategory = (categoryName: string) => {
    return news.filter(n => n.category === categoryName);
  };

  const filteredNews = selectedCategory
    ? news.filter(n => n.category === selectedCategory)
    : news;

  const mainNews = getMainNews();
  const sideNews = getSideNews();

  return (
    <div className="min-h-screen" style={{ background: '#c0c0c0' }}>
      {/* Top bar - like old portals */}
      <div
        className="py-1 px-4 flex justify-between items-center text-xs"
        style={{
          background: 'linear-gradient(180deg, #000080 0%, #000066 100%)',
          color: '#ffffff',
        }}
      >
        <span>{currentDate}</span>
        <div className="flex gap-4">
          <span>📧 Poczta</span>
          <span>🔍 Szukaj</span>
          <span>⭐ Ulubione</span>
        </div>
      </div>

      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #e0e0e0 100%)',
          borderBottom: '4px solid #000080',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div
                className="text-5xl font-bold px-4 py-2 rounded"
                style={{
                  background: 'linear-gradient(180deg, #ff0000 0%, #cc0000 100%)',
                  color: '#ffffff',
                  fontFamily: 'Impact, sans-serif',
                  textShadow: '2px 2px 0 #000',
                }}
              >
                📰 NEWS
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#000080' }}>
                  KUPMAX WIADOMOŚCI
                </h1>
                <p className="text-sm text-gray-600">Portal informacyjny od 1999 roku</p>
              </div>
            </div>

            {/* Weather widget */}
            <div
              className="text-center px-4 py-2 rounded"
              style={{
                background: 'linear-gradient(180deg, #87ceeb 0%, #4682b4 100%)',
                border: '2px solid #000080',
              }}
            >
              <div className="text-3xl">{weather.condition.split(' ')[0]}</div>
              <div className="text-white font-bold">{weather.temp}°C</div>
              <div className="text-xs text-white">Warszawa</div>
            </div>
          </div>

          {/* Navigation - BossXD style categories */}
          <nav className="mt-4">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-1 font-bold text-sm transition-colors"
                style={{
                  background: !selectedCategory ? '#000080' : '#e0e0e0',
                  color: !selectedCategory ? '#ffffff' : '#000080',
                  border: '2px solid #000080',
                }}
              >
                📋 WSZYSTKIE
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="px-4 py-1 font-bold text-sm transition-colors"
                  style={{
                    background: selectedCategory === cat.name ? cat.color : '#e0e0e0',
                    color: selectedCategory === cat.name ? '#ffffff' : '#000080',
                    border: `2px solid ${cat.color}`,
                  }}
                >
                  {cat.icon} {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Breaking news ticker */}
      <div
        className="py-2"
        style={{
          background: '#ff0000',
          borderTop: '3px solid #ffff00',
          borderBottom: '3px solid #ffff00',
        }}
      >
        <div className="flex items-center">
          <span
            className="px-4 py-1 font-bold text-white animate-pulse"
            style={{ background: '#000000' }}
          >
            🔴 PILNE
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <span
              className="inline-block text-white font-bold"
              style={{ animation: 'marquee 15s linear infinite' }}
            >
              ★★★ KUPMAX przebija kolejne rekordy popularności! ★★★ Nowa aktualizacja już dostępna! ★★★ Dołącz do tysięcy zadowolonych użytkowników! ★★★
            </span>
          </div>
        </div>
      </div>

      {/* Main content - frame-like layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-4">
          {/* Left sidebar */}
          <aside
            className="hidden lg:block w-48 flex-shrink-0"
            style={{
              background: '#ffffff',
              border: '3px solid #000080',
            }}
          >
            <div
              className="py-2 px-4 font-bold text-white text-center"
              style={{ background: '#000080' }}
            >
              📁 SERWISY
            </div>
            <div className="p-2 space-y-1">
              {['🏠 Strona główna', '📧 Poczta', '💬 Czat', '🎮 Gry', '📻 Radio', '🛒 Sklep', '📖 Księga gości', '📸 Galeria'].map((item) => (
                <div
                  key={item}
                  className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-100"
                  style={{ borderBottom: '1px dotted #ccc' }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Ad banner */}
            <div
              className="m-2 p-2 text-center text-xs animate-pulse"
              style={{
                background: 'linear-gradient(45deg, #ffff00, #ff9900)',
                border: '2px dashed #ff0000',
              }}
            >
              <p className="font-bold">🎁 REKLAMA</p>
              <p>Kliknij tutaj!</p>
            </div>
          </aside>

          {/* Main news area */}
          <div className="flex-1">
            {/* Featured news */}
            <div
              className="mb-6 rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '3px solid #000080',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white flex justify-between items-center"
                style={{ background: 'linear-gradient(90deg, #000080 0%, #0000cc 100%)' }}
              >
                <span>📰 NAJWAŻNIEJSZE WIADOMOŚCI</span>
                <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded animate-pulse">
                  🔴 LIVE
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4 animate-pulse">⏳</div>
                  <p>Ładowanie wiadomości...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 p-4">
                  {(selectedCategory ? filteredNews : mainNews).slice(0, 4).map((item, i) => (
                    <article
                      key={item.id}
                      onClick={() => setExpandedNews(expandedNews === item.id ? null : item.id)}
                      className="relative rounded overflow-hidden cursor-pointer transition-transform hover:-translate-y-1"
                      style={{
                        background: '#f5f5f5',
                        border: '2px solid #ccc',
                      }}
                    >
                      {i < 2 && (
                        <div
                          className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded animate-pulse"
                          style={{ background: '#ff0000' }}
                        >
                          🔥 NEW!
                        </div>
                      )}

                      <div
                        className="h-32 flex items-center justify-center text-6xl"
                        style={{ background: `linear-gradient(180deg, ${CATEGORIES.find(c => c.name === item.category)?.color || '#000080'}33 0%, #c0c0c0 100%)` }}
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          getCategoryIcon(item.category)
                        )}
                      </div>

                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded"
                            style={{ background: CATEGORIES.find(c => c.name === item.category)?.color || '#000080', color: '#ffffff' }}
                          >
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                        </div>
                        <h3
                          className="font-bold mb-2 hover:text-blue-600"
                          style={{ color: '#000080' }}
                        >
                          {item.title}
                        </h3>
                        {expandedNews === item.id ? (
                          <div
                            className="text-sm text-gray-700"
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(item.content) }}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{item.excerpt}</p>
                        )}
                        {expandedNews === item.id && (
                          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                            ✍️ {item.author} | 👁️ {item.views} odsłon
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* News list */}
            <div
              className="rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '3px solid #000080',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white"
                style={{ background: '#cc0000' }}
              >
                📋 WIĘCEJ WIADOMOŚCI
              </div>

              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {sideNews.map((news, i) => (
                    <tr
                      key={i}
                      className="hover:bg-yellow-50 cursor-pointer"
                      style={{ borderBottom: '1px solid #ccc' }}
                    >
                      <td className="p-3">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded mr-2"
                          style={{
                            background: i % 2 === 0 ? '#000080' : '#cc0000',
                            color: '#ffffff',
                          }}
                        >
                          {news.category}
                        </span>
                        <span className="font-bold hover:text-blue-600" style={{ color: '#000080' }}>
                          {news.title}
                        </span>
                        {i < 2 && (
                          <span className="ml-2 text-xs text-red-500 font-bold animate-pulse">
                            [NEW!]
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-sm text-gray-500 whitespace-nowrap">
                        {14 - i}.01.2026
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar */}
          <aside
            className="hidden md:block w-64 flex-shrink-0 space-y-4"
          >
            {/* Poll */}
            <div
              className="rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '3px solid #000080',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white text-center"
                style={{ background: '#008000' }}
              >
                📊 SONDA DNIA
              </div>
              <div className="p-4">
                <p className="font-bold mb-3 text-sm">Co najbardziej lubisz w KUPMAX?</p>
                {['Sklep online', 'Czat retro', 'Forum dyskusyjne', 'Gry'].map((option, i) => (
                  <label key={option} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                    <input type="radio" name="poll" className="accent-blue-600" />
                    <span>{option}</span>
                  </label>
                ))}
                <button
                  className="w-full mt-2 py-1 font-bold text-white rounded"
                  style={{ background: '#000080' }}
                >
                  GŁOSUJ
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div
              className="rounded overflow-hidden"
              style={{
                background: '#ffffff',
                border: '3px solid #000080',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-white text-center"
                style={{ background: '#800080' }}
              >
                📈 STATYSTYKI
              </div>
              <div className="p-4 text-center">
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Użytkowników online:</p>
                  <p className="text-2xl font-bold text-green-600">1,247</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Dzisiejszych odsłon:</p>
                  <p className="text-2xl font-bold text-blue-600">45,892</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wszystkich wizyt:</p>
                  <div className="flex justify-center mt-1">
                    {['2', '5', '8', '4', '1', '9', '3'].map((d, i) => (
                      <span
                        key={i}
                        className="bg-black text-green-400 px-1 font-mono text-sm border border-gray-600"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div
              className="rounded overflow-hidden"
              style={{
                background: '#ffffcc',
                border: '3px solid #ff9900',
              }}
            >
              <div
                className="py-2 px-4 font-bold text-center"
                style={{ background: '#ff9900', color: '#000' }}
              >
                ⭐ POLECAMY
              </div>
              <div className="p-2 space-y-1 text-sm">
                <Link href="/shop" className="block px-2 py-1 hover:bg-yellow-200">🛒 Sklep KUPMAX</Link>
                <Link href="/chat" className="block px-2 py-1 hover:bg-yellow-200">💬 Czat online</Link>
                <Link href="/forum" className="block px-2 py-1 hover:bg-yellow-200">🗨️ Forum</Link>
                <Link href="/radio" className="block px-2 py-1 hover:bg-yellow-200">📻 Radio</Link>
                <Link href="/tetris" className="block px-2 py-1 hover:bg-yellow-200">🎮 Zagraj w grę!</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #000080 0%, #000066 100%)',
          borderTop: '4px solid #ffff00',
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-4 text-white text-sm mb-4">
            <Link href="/" className="hover:text-yellow-400">Strona główna</Link>
            <span>|</span>
            <Link href="/bulletin" className="hover:text-yellow-400">Regulamin</Link>
            <span>|</span>
            <span>Reklama</span>
            <span>|</span>
            <span>Kontakt</span>
            <span>|</span>
            <span>Praca</span>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
            >
              ← POWRÓT DO KUPMAX RETRO
            </Link>
          </div>

          <p className="text-center text-gray-400 text-xs mt-4">
            © 1998-2026 KUPMAX News - Wszystkie prawa zastrzeżone
            <br />
            Redakcja nie ponosi odpowiedzialności za treść reklam
          </p>
        </div>
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
