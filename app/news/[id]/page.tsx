'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  author: string;
  category: string;
  views: number;
  likes: number;
  created_at: string;
}

const CATEGORIES = [
  { name: 'Niesamowite Historie', icon: '📚', color: '#000080' },
  { name: 'Nowoczesne Technologie', icon: '💻', color: '#008000' },
  { name: 'Eksperckie Poradniki', icon: '📖', color: '#800000' },
] as const;

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes: script tags, event handlers, javascript: protocol, iframes, objects, embeds, forms
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe/gi, '&lt;iframe')
    .replace(/<object/gi, '&lt;object')
    .replace(/<embed/gi, '&lt;embed')
    .replace(/<form/gi, '&lt;form');
}

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNews();
    }
  }, [id]);

  const fetchNews = async () => {
    try {
      const res = await fetch(`/api/news/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Nie znaleziono artykułu');
        } else {
          setError('Błąd podczas pobierania artykułu');
        }
        return;
      }
      const data = await res.json();
      setNews(data.news);
    } catch (err) {
      setError('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.name === category) || CATEGORIES[0];
  };

  // Simple Markdown to HTML parser
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2" style="color: #000080;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2" style="color: #000080;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2" style="color: #000080;">$1</h1>')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#c0c0c0' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-lg">Wczytywanie artykułu...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#c0c0c0' }}>
        <div
          className="text-center p-8 rounded"
          style={{
            background: '#ffffff',
            border: '3px solid #000080',
            maxWidth: '400px'
          }}
        >
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#000080' }}>
            {error || 'Nie znaleziono artykułu'}
          </h1>
          <p className="text-gray-600 mb-6">
            Artykuł o podanym ID nie istnieje lub został usunięty.
          </p>
          <Link
            href="/news"
            className="inline-block px-6 py-2 font-bold text-white rounded"
            style={{ background: '#000080' }}
          >
            ← Wróć do listy newsów
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(news.category);

  return (
    <div className="min-h-screen" style={{ background: '#c0c0c0' }}>
      {/* Top bar */}
      <div
        className="py-1 px-4 flex justify-between items-center text-xs"
        style={{
          background: 'linear-gradient(180deg, #000080 0%, #000066 100%)',
          color: '#ffffff',
        }}
      >
        <span>{formatDate(news.created_at)}</span>
        <div className="flex gap-4">
          <span>👁️ {news.views} odsłon</span>
          <span>❤️ {news.likes} polubień</span>
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
            <div className="flex items-center gap-4">
              <Link href="/news">
                <div
                  className="text-4xl font-bold px-4 py-2 rounded cursor-pointer hover:opacity-90"
                  style={{
                    background: 'linear-gradient(180deg, #ff0000 0%, #cc0000 100%)',
                    color: '#ffffff',
                    fontFamily: 'Impact, sans-serif',
                    textShadow: '2px 2px 0 #000',
                  }}
                >
                  📰 NEWS
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#000080' }}>
                  KUPMAX WIADOMOŚCI
                </h1>
                <p className="text-sm text-gray-600">Portal informacyjny od 1999 roku</p>
              </div>
            </div>

            <Link
              href="/news"
              className="px-4 py-2 font-bold rounded hover:opacity-90"
              style={{
                background: '#000080',
                color: '#ffffff',
              }}
            >
              ← Wszystkie newsy
            </Link>
          </div>
        </div>
      </header>

      {/* Article */}
      <main className="container mx-auto px-4 py-6">
        <article
          className="rounded overflow-hidden"
          style={{
            background: '#ffffff',
            border: '3px solid #000080',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {/* Article Header */}
          <div
            className="py-3 px-4 flex items-center justify-between"
            style={{
              background: categoryInfo.color,
              color: '#ffffff'
            }}
          >
            <span className="font-bold flex items-center gap-2">
              {categoryInfo.icon} {news.category}
            </span>
            <span className="text-sm">{formatDate(news.created_at)}</span>
          </div>

          {/* Cover Image */}
          {news.image_url && (
            <div
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${news.image_url})` }}
            />
          )}

          {/* Content */}
          <div className="p-6">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: '#000080' }}
            >
              {news.title}
            </h1>

            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <span>✍️ {news.author}</span>
              <span>|</span>
              <span>👁️ {news.views} odsłon</span>
              <span>|</span>
              <span>❤️ {news.likes} polubień</span>
            </div>

            <div
              className="prose max-w-none"
              style={{ fontSize: '16px', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(news.content)) }}
            />
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex justify-between items-center"
            style={{
              background: '#f0f0f0',
              borderTop: '2px solid #ccc',
            }}
          >
            <Link
              href="/news"
              className="px-4 py-2 font-bold rounded hover:opacity-90"
              style={{
                background: '#000080',
                color: '#ffffff',
              }}
            >
              ← Więcej artykułów
            </Link>
            <div className="text-sm text-gray-500">
              © 1998-{new Date().getFullYear()} KUPMAX News
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer
        className="mt-8"
        style={{
          background: 'linear-gradient(180deg, #000080 0%, #000066 100%)',
          borderTop: '4px solid #ffff00',
        }}
      >
        <div className="container mx-auto px-4 py-6 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
          >
            ← POWRÓT DO KUPMAX RETRO
          </Link>
          <p className="text-gray-400 text-xs mt-4">
            © 1998-{new Date().getFullYear()} KUPMAX News - Wszystkie prawa zastrzeżone
          </p>
        </div>
      </footer>
    </div>
  );
}
