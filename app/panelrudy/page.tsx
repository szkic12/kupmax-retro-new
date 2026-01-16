'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RetroEmoji, EmojiPicker, EmojiParser, EmojiType, emojiToCode } from '../../components/RetroEmoji';

export default function SecureAdminPanel() {
  // ============= 2FA AUTHENTICATION STATE =============
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'code'>('credentials');
  const [username, setUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // ============= 2FA AUTHENTICATION LOGIC =============
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyToken(token);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-token', token }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch {
      localStorage.removeItem('adminToken');
    }
    setCheckingAuth(false);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password: authPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Błąd logowania');
        setAuthLoading(false);
        return;
      }

      setSessionId(data.sessionId);
      setAuthStep('code');
    } catch {
      setAuthError('Błąd połączenia z serwerem');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Błąd weryfikacji');
        setAuthLoading(false);
        return;
      }

      localStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
    } catch {
      setAuthError('Błąd połączenia z serwerem');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', token }),
      });
    }
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setAuthStep('credentials');
    setUsername('');
    setAuthPassword('');
    setCode('');
  };

  // ============= ADMIN PANEL LOGIC =============
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

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

  const cellStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    padding: '8px',
  };

  // ============= LOADING STATE =============
  if (checkingAuth) {
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
  if (!isAuthenticated) {
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
              <span>Połączenie zabezpieczone • 2FA aktywne</span>
            </div>

            {authStep === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '48px' }}>🔑</span>
                  <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Krok 1: Dane logowania</p>
                </div>

                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  Nazwa użytkownika:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  placeholder="Wprowadź login"
                  required
                />

                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  Hasło:
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Wprowadź hasło"
                  required
                />

                {authError && (
                  <div style={{
                    background: '#ffcccc',
                    border: '1px solid #cc0000',
                    color: '#cc0000',
                    padding: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                  }}>
                    ⚠️ {authError}
                  </div>
                )}

                <button
                  type="submit"
                  style={{ ...buttonStyle, width: '100%', marginTop: '10px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Weryfikacja...' : 'Dalej →'}
                </button>
              </form>
            )}

            {authStep === 'code' && (
              <form onSubmit={handleCodeSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '48px' }}>📱</span>
                  <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Krok 2: Weryfikacja 2FA</p>
                </div>

                <div style={{
                  background: '#ccffcc',
                  border: '1px solid #00aa00',
                  padding: '8px',
                  marginBottom: '12px',
                  fontSize: '12px',
                }}>
                  ✅ Kod wysłany na email
                </div>

                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  Kod weryfikacyjny (6 cyfr):
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ ...inputStyle, fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                  placeholder="000000"
                  maxLength={6}
                  required
                />

                {authError && (
                  <div style={{
                    background: '#ffcccc',
                    border: '1px solid #cc0000',
                    color: '#cc0000',
                    padding: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                  }}>
                    ⚠️ {authError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('credentials');
                      setAuthError('');
                      setCode('');
                    }}
                    style={{ ...buttonStyle, flex: 1 }}
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    style={{ ...buttonStyle, flex: 2, background: 'linear-gradient(180deg, #90EE90 0%, #228B22 100%)' }}
                    disabled={authLoading || code.length !== 6}
                  >
                    {authLoading ? 'Weryfikacja...' : '🔓 Zaloguj'}
                  </button>
                </div>
              </form>
            )}

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
                <li>Każda próba logowania jest rejestrowana</li>
                <li>Po 5 nieudanych próbach - blokada 15 min</li>
                <li>Sesja wygasa po 24 godzinach</li>
              </ul>
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
            <span style={{ fontSize: '10px', background: '#00aa00', padding: '2px 6px' }}>🔓 Zalogowany</span>
            <button
              onClick={handleLogout}
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
        KupMax Admin Panel v2.0 | 2024 | 🔐 Zabezpieczony 2FA
      </div>
    </div>
  );
}
