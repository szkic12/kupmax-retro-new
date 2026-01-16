'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { RetroEmoji, EmojiPicker, EmojiParser, EmojiType, emojiToCode } from '../../components/RetroEmoji';

// Dozwolone emaile adminów
const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

export default function SecureAdminPanel() {
  const { data: session, status } = useSession();

  // ============= ADMIN PANEL STATE =============
  const [activeTab, setActiveTab] = useState('advertisement');
  const [stations, setStations] = useState<any[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [webringSites, setWebringSites] = useState<any[]>([]);
  const [forumThreads, setForumThreads] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Advertisement form
  const [newAd, setNewAd] = useState({
    image_url: '',
    title: '',
    description: '',
    link_url: '',
    advertiser_name: '',
    advertiser_email: '',
    end_date: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // New station form
  const [newStation, setNewStation] = useState({ name: '', url: '', genre: '' });

  // New webring site form
  const [newSite, setNewSite] = useState({ name: '', url: '', description: '', category: '', icon: ':)' });

  // News form
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    author: 'Admin',
    category: 'Niesamowite Historie',
  });

  const NEWS_CATEGORIES = ['Niesamowite Historie', 'Nowoczesne Technologie', 'Eksperckie Poradniki'];

  // Check if user is admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase());

  // ============= ADMIN PANEL LOGIC =============
  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'advertisement') {
        const res = await fetch('/api/advertisement');
        const data = await res.json();
        setCurrentAd(data.advertisement || null);

        const resAll = await fetch('/api/advertisement?all=true');
        const dataAll = await resAll.json();
        setAllAds(dataAll.advertisements || []);
      } else if (activeTab === 'radio') {
        const res = await fetch('/api/radio/stations');
        const data = await res.json();
        setStations(data);
      } else if (activeTab === 'guestbook') {
        const res = await fetch('/api/guestbook');
        const data = await res.json();
        setGuestbookEntries(data.entries || []);
      } else if (activeTab === 'webring') {
        const res = await fetch('/api/webring');
        const data = await res.json();
        setWebringSites(data.sites || []);
      } else if (activeTab === 'forum') {
        const res = await fetch('/api/forum/threads');
        const data = await res.json();
        setForumThreads(data.threads || []);
      } else if (activeTab === 'news') {
        const res = await fetch('/api/news?all=true');
        const data = await res.json();
        setNewsList(data.news || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleSaveAdvertisement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.image_url || !newAd.title || !newAd.advertiser_name) {
      setMessage('Obrazek, tytuł i nazwa reklamodawcy są wymagane!');
      return;
    }

    try {
      const res = await fetch('/api/advertisement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAd,
          end_date: newAd.end_date || null,
        }),
      });

      if (res.ok) {
        setMessage('Reklama zapisana!');
        setNewAd({
          image_url: '',
          title: '',
          description: '',
          link_url: '',
          advertiser_name: '',
          advertiser_email: '',
          end_date: '',
        });
        setImagePreview(null);
        fetchData();
      } else {
        setMessage('Błąd zapisywania reklamy');
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Czy na pewno usunąć reklamę?')) return;

    try {
      const res = await fetch(`/api/advertisement?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Reklama usunięta!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleActivateAdvertisement = async (id: string) => {
    try {
      const res = await fetch('/api/advertisement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage('Reklama aktywowana!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Nieprawidłowy typ pliku! Dozwolone: JPG, PNG, WebP, GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Plik za duży! Maksymalny rozmiar: 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setMessage('Wysyłanie obrazka...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/advertisement/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setNewAd({ ...newAd, image_url: data.url });
        setMessage('Obrazek wgrany pomyślnie!');
      } else {
        setMessage('Błąd uploadu: ' + (data.error || 'Nieznany błąd'));
        setImagePreview(null);
      }
    } catch (error) {
      setMessage('Błąd sieci podczas uploadu');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.url || !newStation.genre) {
      setMessage('Wypełnij wszystkie pola!');
      return;
    }

    try {
      const res = await fetch('/api/radio/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStation),
      });

      if (res.ok) {
        setMessage('Stacja dodana!');
        setNewStation({ name: '', url: '', genre: '' });
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm('Czy na pewno usunąć stację?')) return;

    try {
      const res = await fetch(`/api/radio/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Stacja usunięta!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteGuestbookEntry = async (id: string) => {
    if (!confirm('Czy na pewno usunąć wpis?')) return;

    try {
      const res = await fetch(`/api/guestbook?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Wpis usunięty!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleAddWebsiteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.url) {
      setMessage('Nazwa i URL są wymagane!');
      return;
    }

    try {
      const res = await fetch('/api/webring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      });

      if (res.ok) {
        setMessage('Strona dodana do webring!');
        setNewSite({ name: '', url: '', description: '', category: '', icon: ':)' });
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteWebringSite = async (id: string) => {
    if (!confirm('Czy na pewno usunąć stronę z webring?')) return;

    try {
      const res = await fetch(`/api/webring?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Strona usunięta z webring!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Czy na pewno usunąć ten wątek?')) return;

    try {
      const res = await fetch(`/api/forum/threads?threadId=${threadId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Wątek usunięty!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) {
      setMessage('Tytuł i treść są wymagane!');
      return;
    }

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNews),
      });

      if (res.ok) {
        setMessage('News dodany!');
        setNewNews({
          title: '',
          content: '',
          excerpt: '',
          image_url: '',
          author: 'Admin',
          category: 'Niesamowite Historie',
        });
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleToggleNewsPublished = async (newsItem: any) => {
    try {
      const res = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newsItem.id,
          is_published: !newsItem.is_published,
        }),
      });

      if (res.ok) {
        setMessage(newsItem.is_published ? 'News ukryty!' : 'News opublikowany!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Czy na pewno usunąć ten news?')) return;

    try {
      const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('News usunięty!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ============= STYLES =============
  const windowStyle: React.CSSProperties = {
    background: '#c0c0c0',
    border: '3px outset #fff',
    maxWidth: '900px',
    margin: '10px auto',
    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
  };

  const titleBarStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
    padding: '4px 8px',
    color: '#fff',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const contentStyle: React.CSSProperties = {
    padding: '15px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
    border: '2px outset #fff',
    padding: '6px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const inputStyle: React.CSSProperties = {
    border: '2px inset #808080',
    padding: '4px 8px',
    background: '#fff',
    width: '100%',
    marginBottom: '8px',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive
      ? 'linear-gradient(180deg, #c0c0c0 0%, #e0e0e0 100%)'
      : 'linear-gradient(180deg, #a0a0a0 0%, #808080 100%)',
    border: '2px outset #fff',
    padding: '8px 20px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? 'none' : '2px outset #fff',
    marginBottom: isActive ? '-2px' : '0',
    position: 'relative' as const,
    zIndex: isActive ? 1 : 0,
  });

  // ============= LOADING STATE =============
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#008080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p>Sprawdzanie sesji...</p>
        </div>
      </div>
    );
  }

  // ============= LOGIN SCREEN =============
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#008080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      }}>
        <div style={windowStyle}>
          <div style={titleBarStyle}>
            <span>🔐</span>
            <span>Bezpieczne Logowanie - KUPMAX Admin</span>
          </div>
          <div style={contentStyle}>
            <div style={{
              background: '#ffffcc',
              border: '1px solid #ccaa00',
              padding: '8px',
              marginBottom: '15px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span>Połączenie zabezpieczone • Google OAuth 2.0</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '64px' }}>🔒</span>
              <h2 style={{ margin: '15px 0', color: '#000080' }}>Panel Administracyjny</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Zaloguj się przez Google, aby uzyskać dostęp
              </p>
            </div>

            <button
              onClick={() => signIn('google')}
              style={{
                ...buttonStyle,
                width: '100%',
                padding: '12px 20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#fff',
                border: '2px solid #4285f4',
                color: '#333',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Zaloguj przez Google
            </button>

            <div style={{
              marginTop: '20px',
              padding: '10px',
              background: '#f0f0f0',
              border: '1px solid #808080',
              fontSize: '10px',
              color: '#666',
            }}>
              <p style={{ margin: 0 }}>🔒 Informacje bezpieczeństwa:</p>
              <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                <li>Logowanie przez Google OAuth 2.0</li>
                <li>Dostęp tylko dla autoryzowanych emaili</li>
                <li>Sesja chroniona przez Google</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= ACCESS DENIED =============
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#008080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      }}>
        <div style={windowStyle}>
          <div style={{ ...titleBarStyle, background: 'linear-gradient(90deg, #800000 0%, #cc0000 100%)' }}>
            <span>⛔</span>
            <span>Brak Dostępu</span>
          </div>
          <div style={contentStyle}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '64px' }}>🚫</span>
              <h2 style={{ color: '#cc0000', margin: '15px 0' }}>Odmowa Dostępu</h2>
              <p style={{ marginBottom: '10px' }}>
                Zalogowano jako: <strong>{session.user?.email}</strong>
              </p>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Ten email nie ma uprawnień administratora.
              </p>
              <button
                onClick={() => signOut()}
                style={{ ...buttonStyle, background: '#ff6666' }}
              >
                Wyloguj się
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= MAIN ADMIN PANEL =============
  return (
    <div style={{
      minHeight: '100vh',
      background: '#008080',
      padding: '10px',
      fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={windowStyle}>
        <div style={titleBarStyle}>
          <span>⚙️</span>
          <span>Panel Administracyjny KupMax</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', background: '#00aa00', padding: '2px 6px' }}>
              🔓 {session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              style={{
                background: '#ff6666',
                border: '2px outset #fff',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>

        <div style={contentStyle}>
          <div style={{ marginBottom: '15px' }}>
            <Link href="/" style={{ color: '#000080', fontWeight: 'bold' }}>
              ◄ Powrót do strony głównej
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '0', flexWrap: 'wrap' }}>
            <button style={tabStyle(activeTab === 'advertisement')} onClick={() => setActiveTab('advertisement')}>
              📢 Reklama
            </button>
            <button style={tabStyle(activeTab === 'radio')} onClick={() => setActiveTab('radio')}>
              📻 Radio
            </button>
            <button style={tabStyle(activeTab === 'guestbook')} onClick={() => setActiveTab('guestbook')}>
              💬 Guestbook
            </button>
            <button style={tabStyle(activeTab === 'webring')} onClick={() => setActiveTab('webring')}>
              🔗 Webring
            </button>
            <button style={tabStyle(activeTab === 'forum')} onClick={() => setActiveTab('forum')}>
              💬 Forum
            </button>
            <button style={tabStyle(activeTab === 'news')} onClick={() => setActiveTab('news')}>
              📰 News
            </button>
          </div>

          {/* Tab content */}
          <div style={{
            border: '2px inset #808080',
            background: '#e0e0e0',
            padding: '15px',
            minHeight: '300px',
          }}>
            {message && (
              <div style={{
                background: '#ffff00',
                border: '1px solid #000',
                padding: '8px',
                marginBottom: '10px',
                textAlign: 'center',
              }}>
                {message}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Ładowanie...</div>
            ) : (
              <>
                {/* ADVERTISEMENT TAB */}
                {activeTab === 'advertisement' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📢 Zarządzanie Reklamą
                    </h3>

                    {currentAd && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                        <legend style={{ fontWeight: 'bold', color: '#006600' }}>✅ Aktualna reklama</legend>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          <div style={{ width: '200px', flexShrink: 0 }}>
                            <div style={{
                              width: '100%',
                              height: '120px',
                              background: '#f0f0f0',
                              border: '2px inset #808080',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}>
                              {currentAd.image_url ? (
                                <img src={currentAd.image_url} alt={currentAd.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '40px' }}>📷</span>
                              )}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p><strong>Tytuł:</strong> {currentAd.title}</p>
                            <p><strong>Reklamodawca:</strong> {currentAd.advertiser_name}</p>
                            {currentAd.end_date && (
                              <p>
                                <strong>Wygasa:</strong> {new Date(currentAd.end_date).toLocaleDateString('pl-PL')}
                                {getDaysUntilExpiry(currentAd.end_date)! <= 3 && (
                                  <span style={{ color: '#cc0000', marginLeft: '8px' }}>⚠️ Wkrótce!</span>
                                )}
                              </p>
                            )}
                            <button onClick={() => handleDeleteAdvertisement(currentAd.id)} style={{ ...buttonStyle, background: '#ff6666' }}>
                              🗑️ Usuń
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )}

                    <fieldset style={{ border: '2px groove #fff', padding: '10px' }}>
                      <legend style={{ fontWeight: 'bold' }}>➕ Dodaj nową reklamę</legend>
                      <form onSubmit={handleSaveAdvertisement}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Obrazek:</label>
                          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '8px' }} />}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytuł *:</label>
                            <input type="text" value={newAd.title} onChange={(e) => setNewAd({ ...newAd, title: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Reklamodawca *:</label>
                            <input type="text" value={newAd.advertiser_name} onChange={(e) => setNewAd({ ...newAd, advertiser_name: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Link:</label>
                            <input type="text" value={newAd.link_url} onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Data wygaśnięcia:</label>
                            <input type="date" value={newAd.end_date} onChange={(e) => setNewAd({ ...newAd, end_date: e.target.value })} style={inputStyle} />
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px', background: '#90EE90' }}>
                          📢 Zapisz reklamę
                        </button>
                      </form>
                    </fieldset>

                    {allAds.length > 0 && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px', marginTop: '15px' }}>
                        <legend style={{ fontWeight: 'bold' }}>📋 Wszystkie reklamy ({allAds.length})</legend>
                        {allAds.map((ad) => (
                          <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '5px', background: ad.is_active ? '#ccffcc' : '#f5f5f5', border: '1px solid #ccc' }}>
                            <span style={{ flex: 1 }}>{ad.title}</span>
                            {ad.is_active ? (
                              <span style={{ background: '#00aa00', color: '#fff', padding: '2px 8px', fontSize: '11px' }}>AKTYWNA</span>
                            ) : (
                              <button onClick={() => handleActivateAdvertisement(ad.id)} style={{ ...buttonStyle, fontSize: '11px', padding: '4px 8px' }}>Aktywuj</button>
                            )}
                            <button onClick={() => handleDeleteAdvertisement(ad.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}>🗑️</button>
                          </div>
                        ))}
                      </fieldset>
                    )}
                  </div>
                )}

                {/* RADIO TAB */}
                {activeTab === 'radio' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📻 Zarządzanie stacjami radiowymi ({stations.length})
                    </h3>

                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nową stację</legend>
                      <form onSubmit={handleAddStation}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa:</label>
                            <input type="text" value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL streamu:</label>
                            <input type="text" value={newStation.url} onChange={(e) => setNewStation({ ...newStation, url: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Gatunek:</label>
                            <input type="text" value={newStation.genre} onChange={(e) => setNewStation({ ...newStation, genre: e.target.value })} style={inputStyle} />
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>+ Dodaj stację</button>
                      </form>
                    </fieldset>

                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                      <thead>
                        <tr style={{ background: '#000080', color: '#fff' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nazwa</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Gatunek</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations.map((station, i) => (
                          <tr key={station.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0' }}>
                            <td style={{ padding: '8px' }}>{station.name}</td>
                            <td style={{ padding: '8px' }}>{station.genre}</td>
                            <td style={{ padding: '8px' }}>
                              <button onClick={() => handleDeleteStation(station.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '12px', padding: '4px 8px' }}>Usuń</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* GUESTBOOK TAB */}
                {activeTab === 'guestbook' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      💬 Wpisy w księdze gości ({guestbookEntries.length})
                    </h3>
                    {guestbookEntries.length === 0 ? (
                      <p style={{ color: '#666', textAlign: 'center' }}>Brak wpisów</p>
                    ) : (
                      guestbookEntries.map((entry, i) => (
                        <div key={entry.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0', padding: '10px', marginBottom: '5px', border: '1px solid #ccc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{entry.name || entry.nickname || 'Anonim'}</strong>
                            <button onClick={() => handleDeleteGuestbookEntry(entry.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '2px 6px' }}>🗑️</button>
                          </div>
                          <p style={{ margin: '5px 0', color: '#333' }}>{entry.message}</p>
                          <small style={{ color: '#666' }}>{new Date(entry.timestamp || entry.date).toLocaleString('pl-PL')}</small>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* WEBRING TAB */}
                {activeTab === 'webring' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      🔗 Zarządzanie Webring ({webringSites.length})
                    </h3>

                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nową stronę</legend>
                      <form onSubmit={handleAddWebsiteSite}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa *:</label>
                            <input type="text" value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL *:</label>
                            <input type="text" value={newSite.url} onChange={(e) => setNewSite({ ...newSite, url: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Opis:</label>
                            <input type="text" value={newSite.description} onChange={(e) => setNewSite({ ...newSite, description: e.target.value })} style={inputStyle} />
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>+ Dodaj stronę</button>
                      </form>
                    </fieldset>

                    {webringSites.map((site) => (
                      <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '5px', background: '#fff', border: '1px solid #ccc' }}>
                        <span style={{ flex: 1 }}><a href={site.url} target="_blank" rel="noopener noreferrer">{site.name}</a></span>
                        <button onClick={() => handleDeleteWebringSite(site.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* FORUM TAB */}
                {activeTab === 'forum' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      💬 Zarządzanie Forum ({forumThreads.length} wątków)
                    </h3>
                    {forumThreads.map((thread) => (
                      <div key={thread.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '5px', background: '#fff', border: '1px solid #ccc' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{thread.title}</strong>
                          <br />
                          <small style={{ color: '#666' }}>przez {thread.author?.nickname || 'Anonim'} • {thread.replyCount || 0} odpowiedzi</small>
                        </div>
                        <button onClick={() => handleDeleteThread(thread.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* NEWS TAB */}
                {activeTab === 'news' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📰 Zarządzanie News ({newsList.length})
                    </h3>

                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>➕ Dodaj nowy artykuł</legend>
                      <form onSubmit={handleAddNews}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytuł *:</label>
                            <input type="text" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select value={newNews.category} onChange={(e) => setNewNews({ ...newNews, category: e.target.value })} style={{ ...inputStyle, height: '30px' }}>
                              {NEWS_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Treść *:</label>
                          <textarea value={newNews.content} onChange={(e) => setNewNews({ ...newNews, content: e.target.value })} style={{ ...inputStyle, height: '100px' }} />
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px', background: '#90EE90' }}>📰 Opublikuj</button>
                      </form>
                    </fieldset>

                    {newsList.map((newsItem) => (
                      <div key={newsItem.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '5px', background: newsItem.is_published ? '#fff' : '#f5f5f5', border: '1px solid #ccc' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{newsItem.title}</strong>
                          <br />
                          <small style={{ color: '#666' }}>{newsItem.category} • {new Date(newsItem.created_at).toLocaleDateString('pl-PL')}</small>
                        </div>
                        <button onClick={() => handleToggleNewsPublished(newsItem)} style={{ ...buttonStyle, fontSize: '11px', padding: '4px 8px', background: newsItem.is_published ? '#ffaa00' : '#90EE90' }}>
                          {newsItem.is_published ? 'Ukryj' : 'Publikuj'}
                        </button>
                        <button onClick={() => handleDeleteNews(newsItem.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#fff', marginTop: '20px', fontSize: '12px' }}>
        KupMax Admin Panel v3.0 | 2024 | 🔐 Google OAuth
      </div>
    </div>
  );
}
