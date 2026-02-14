'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WebringEntry {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  icon?: string;
  owner?: string;
  tags?: string[];
}

export default function WebringCatalog() {
  const [sites, setSites] = useState<WebringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/webring');
      const data = await response.json();
      setSites(data.sites || []);
    } catch (error) {
      logger.error('Error fetching webring sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(sites.map(s => s.category))];
  const filteredSites = filter === 'all' ? sites : sites.filter(s => s.category === filter);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000033 0%, #000066 50%, #000033 100%)',
      fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #000080 0%, #0000AA 100%)',
        border: '3px outset #c0c0c0',
        padding: '15px 20px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <h1 style={{
          color: '#ffff00',
          textShadow: '2px 2px #000',
          margin: 0,
          fontSize: '28px',
          letterSpacing: '2px',
        }}>
          ◈ RETRO WEBRING CATALOG ◈
        </h1>
        <p style={{ color: '#00ffff', margin: '10px 0 0 0' }}>
          Odkryj najlepsze strony retro w sieci!
        </p>
      </div>

      {/* Back to main */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/" style={{
          background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
          border: '2px outset #fff',
          padding: '8px 16px',
          color: '#000',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-block',
        }}>
          ◄ Powrót do KupMax
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: '#c0c0c0',
        border: '2px inset #fff',
        padding: '10px',
        marginBottom: '20px',
      }}>
        <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Kategoria:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              background: filter === cat
                ? 'linear-gradient(180deg, #000080 0%, #0000AA 100%)'
                : 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
              border: '2px outset #fff',
              padding: '5px 12px',
              marginRight: '5px',
              color: filter === cat ? '#fff' : '#000',
              cursor: 'pointer',
              fontWeight: filter === cat ? 'bold' : 'normal',
            }}
          >
            {cat === 'all' ? 'Wszystkie' : cat}
          </button>
        ))}
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          color: '#00ff00',
          padding: '40px',
          fontSize: '18px',
        }}>
          <div style={{ marginBottom: '10px' }}>⏳</div>
          Ładowanie stron...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '15px',
        }}>
          {filteredSites.map((site, index) => (
            <div
              key={site.id}
              style={{
                background: 'linear-gradient(180deg, #c0c0c0 0%, #a0a0a0 100%)',
                border: '3px outset #fff',
                padding: '0',
              }}
            >
              {/* Title bar */}
              <div style={{
                background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '18px' }}>{site.icon || '🌐'}</span>
                <span style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {site.name}
                </span>
                <span style={{
                  background: '#ffff00',
                  color: '#000',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}>
                  #{index + 1}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: '12px' }}>
                <p style={{
                  margin: '0 0 10px 0',
                  color: '#333',
                  fontSize: '13px',
                  lineHeight: '1.4',
                }}>
                  {site.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '5px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    background: '#000080',
                    color: '#fff',
                    padding: '2px 8px',
                    fontSize: '11px',
                  }}>
                    {site.category}
                  </span>
                  {site.owner && (
                    <span style={{
                      background: '#008000',
                      color: '#fff',
                      padding: '2px 8px',
                      fontSize: '11px',
                    }}>
                      👤 {site.owner}
                    </span>
                  )}
                </div>

                {site.tags && site.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '10px',
                  }}>
                    {site.tags.map(tag => (
                      <span key={tag} style={{
                        background: '#800080',
                        color: '#fff',
                        padding: '1px 6px',
                        fontSize: '10px',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: 'linear-gradient(180deg, #00aa00 0%, #008800 100%)',
                    border: '2px outset #00ff00',
                    padding: '8px',
                    textAlign: 'center',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    textShadow: '1px 1px #000',
                  }}
                >
                  🔗 ODWIEDŹ STRONĘ
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats footer */}
      <div style={{
        marginTop: '30px',
        background: '#000',
        border: '2px inset #333',
        padding: '15px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#00ff00', margin: 0, fontFamily: 'monospace' }}>
          ═══════════════════════════════════════
        </p>
        <p style={{ color: '#ffff00', margin: '10px 0' }}>
          📊 Stron w webring: {sites.length} | Wyświetlono: {filteredSites.length}
        </p>
        <p style={{ color: '#00ffff', margin: '10px 0', fontSize: '12px' }}>
          Chcesz dodać swoją stronę? Skontaktuj się z nami: <a href="mailto:kontakt@kupmax.pl" style={{ color: '#ffff00', textDecoration: 'underline' }}>kontakt@kupmax.pl</a>
        </p>
        <p style={{ color: '#00ff00', margin: 0, fontFamily: 'monospace' }}>
          ═══════════════════════════════════════
        </p>
      </div>

      {/* Retro decoration */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: '#ff00ff',
        fontSize: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          animation: 'marquee 15s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          ★ ★ ★ Welcome to the RETRO WEBRING - Best viewed with Netscape Navigator 4.0 ★ ★ ★
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}
