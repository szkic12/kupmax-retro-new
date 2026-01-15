'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RetroEmoji, EmojiPicker, EmojiParser, EmojiType, emojiToCode } from '../../components/RetroEmoji';

export default function RetroAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('advertisement');
  const [stations, setStations] = useState<any[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [webringSites, setWebringSites] = useState<any[]>([]);
  const [forumThreads, setForumThreads] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [adHistory, setAdHistory] = useState<any[]>([]);
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

  // Simple password check (in production use proper auth)
  const ADMIN_PASSWORD = 'kupmax2024';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setMessage('Zalogowano pomyslnie!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('Bledne haslo!');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'advertisement') {
        // Pobierz aktywną reklamę
        const res = await fetch('/api/advertisement');
        const data = await res.json();
        setCurrentAd(data.advertisement || null);

        // Pobierz wszystkie reklamy
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
      setMessage('Obrazek, tytul i nazwa reklamodawcy sa wymagane!');
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
        setMessage('Blad zapisywania reklamy');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleUpdateAdvertisement = async () => {
    if (!currentAd || !currentAd.id) return;

    try {
      const res = await fetch('/api/advertisement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAd),
      });

      if (res.ok) {
        setMessage('Reklama zaktualizowana!');
        fetchData();
      } else {
        setMessage('Blad aktualizacji reklamy');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Czy na pewno usunac reklame?')) return;

    try {
      const res = await fetch(`/api/advertisement?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Reklama usunieta!');
        fetchData();
      } else {
        setMessage('Blad usuwania reklamy');
      }
    } catch (error) {
      setMessage('Blad sieci');
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
      } else {
        setMessage('Blad aktywacji reklamy');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  // Upload image handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Nieprawidlowy typ pliku! Dozwolone: JPG, PNG, WebP, GIF');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Plik za duzy! Maksymalny rozmiar: 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    setMessage('Wysylanie obrazka...');

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
        setMessage('Obrazek wgrany pomyslnie!');
      } else {
        setMessage('Blad uploadu: ' + (data.error || 'Nieznany blad'));
        setImagePreview(null);
      }
    } catch (error) {
      setMessage('Blad sieci podczas uploadu');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Oblicz dni do wygasniecia
  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.url || !newStation.genre) {
      setMessage('Wypelnij wszystkie pola!');
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
      } else {
        setMessage('Blad dodawania stacji');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleAddWebsiteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.url) {
      setMessage('Nazwa i URL sa wymagane!');
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
      } else {
        setMessage('Blad dodawania strony');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm('Czy na pewno usunac stacje?')) return;

    try {
      const res = await fetch(`/api/radio/stations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Stacja usunieta!');
        fetchData();
      } else {
        setMessage('Blad usuwania');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteGuestbookEntry = async (id: string) => {
    if (!confirm('Czy na pewno usunac wpis?')) return;

    try {
      const res = await fetch(`/api/guestbook?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Wpis usuniety!');
        fetchData();
      } else {
        setMessage('Blad usuwania wpisu');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteWebringSite = async (id: string) => {
    if (!confirm('Czy na pewno usunac strone z webring?')) return;

    try {
      const res = await fetch(`/api/webring?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Strona usunieta z webring!');
        fetchData();
      } else {
        setMessage('Blad usuwania strony');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten watek?')) return;

    try {
      const res = await fetch(`/api/forum/threads?threadId=${threadId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Watek usuniety!');
        fetchData();
      } else {
        setMessage('Blad usuwania watku');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  // News handlers
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) {
      setMessage('Tytul i tresc sa wymagane!');
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
      } else {
        setMessage('Blad dodawania newsa');
      }
    } catch (error) {
      setMessage('Blad sieci');
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
      } else {
        setMessage('Blad aktualizacji');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Czy na pewno usunac ten news?')) return;

    try {
      const res = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('News usuniety!');
        fetchData();
      } else {
        setMessage('Blad usuwania newsa');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  // Retro styles
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

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#008080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      }}>
        <div style={windowStyle}>
          <div style={titleBarStyle}>
            <span>🔐</span>
            <span>Retro Admin - Logowanie</span>
          </div>
          <div style={contentStyle}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <img
                  src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='50' font-size='50'>🔑</text></svg>"
                  alt="Key"
                  style={{ width: '64px', height: '64px' }}
                />
              </div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Haslo administratora:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Wprowadz haslo..."
              />
              {message && (
                <div style={{
                  background: message.includes('pomyslnie') ? '#00ff00' : '#ff0000',
                  color: message.includes('pomyslnie') ? '#000' : '#fff',
                  padding: '8px',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}>
                  {message}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="submit" style={buttonStyle}>
                  OK
                </button>
                <Link href="/" style={{ ...buttonStyle, textDecoration: 'none', color: '#000' }}>
                  Anuluj
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
          <span>Panel Administracyjny KupMax Retro</span>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setIsLoggedIn(false)}
              style={{
                background: '#c0c0c0',
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
          {/* Back link */}
          <div style={{ marginBottom: '15px' }}>
            <Link href="/" style={{ color: '#000080', fontWeight: 'bold' }}>
              ◄ Powrot do strony glownej
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
              <div style={{ textAlign: 'center', padding: '40px' }}>
                Ladowanie...
              </div>
            ) : (
              <>
                {/* Advertisement Tab */}
                {activeTab === 'advertisement' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📢 Zarzadzanie Reklama
                    </h3>

                    {/* Current advertisement */}
                    {currentAd && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                        <legend style={{ fontWeight: 'bold', color: '#006600' }}>✅ Aktualna reklama</legend>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          {/* Preview */}
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
                                <img
                                  src={currentAd.image_url}
                                  alt={currentAd.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: '40px' }}>📷</span>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p><strong>Tytul:</strong> {currentAd.title}</p>
                            <p><strong>Reklamodawca:</strong> {currentAd.advertiser_name}</p>
                            {currentAd.link_url && (
                              <p><strong>Link:</strong> <a href={currentAd.link_url} target="_blank" rel="noopener noreferrer" style={{ color: '#000080' }}>{currentAd.link_url}</a></p>
                            )}
                            {currentAd.description && (
                              <p><strong>Opis:</strong> {currentAd.description}</p>
                            )}

                            {/* Status wygasania */}
                            {currentAd.end_date && (
                              <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                background: getDaysUntilExpiry(currentAd.end_date)! <= 3 ? '#ffcccc' :
                                           getDaysUntilExpiry(currentAd.end_date)! <= 7 ? '#ffffcc' : '#ccffcc',
                                border: '1px solid #999',
                              }}>
                                {getDaysUntilExpiry(currentAd.end_date)! > 0 ? (
                                  <span>⏰ Wygasa za: <strong>{getDaysUntilExpiry(currentAd.end_date)} dni</strong> ({new Date(currentAd.end_date).toLocaleDateString('pl-PL')})</span>
                                ) : (
                                  <span style={{ color: '#cc0000' }}>⚠️ <strong>REKLAMA WYGASLA!</strong></span>
                                )}
                              </div>
                            )}
                            {!currentAd.end_date && (
                              <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>
                                ℹ️ Brak daty wygasniecia - reklama bezterminowa
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Edit current ad inline */}
                        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #999' }}>
                          <p style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>Szybka edycja:</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px' }}>Data wygasniecia:</label>
                              <input
                                type="date"
                                value={currentAd.end_date ? currentAd.end_date.split('T')[0] : ''}
                                onChange={(e) => setCurrentAd({ ...currentAd, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                style={{ ...inputStyle, marginBottom: 0 }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                              <button onClick={handleUpdateAdvertisement} style={{ ...buttonStyle, background: '#90EE90' }}>
                                💾 Zapisz zmiany
                              </button>
                              <button
                                onClick={() => handleDeleteAdvertisement(currentAd.id)}
                                style={{ ...buttonStyle, background: '#ff6666' }}
                              >
                                🗑️ Usun
                              </button>
                            </div>
                          </div>
                        </div>
                      </fieldset>
                    )}

                    {!currentAd && (
                      <div style={{
                        background: '#ffffcc',
                        border: '2px dashed #cc6600',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '15px'
                      }}>
                        <span style={{ fontSize: '40px' }}>📢</span>
                        <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Brak aktywnej reklamy</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>Dodaj nowa reklame ponizej</p>
                      </div>
                    )}

                    {/* Add new advertisement form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px' }}>
                      <legend style={{ fontWeight: 'bold' }}>➕ Dodaj nowa reklame (zastapi aktualna)</legend>
                      <form onSubmit={handleSaveAdvertisement}>
                        {/* Image upload section */}
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>Obrazek reklamy *:</label>
                          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {/* Upload button & preview */}
                            <div style={{
                              width: '200px',
                              height: '130px',
                              border: '2px dashed #808080',
                              background: imagePreview || newAd.image_url ? '#f8f8f8' : '#e8e8e8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: uploadingImage ? 'wait' : 'pointer',
                            }}>
                              {(imagePreview || newAd.image_url) ? (
                                <img
                                  src={imagePreview || newAd.image_url}
                                  alt="Preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ textAlign: 'center', padding: '10px' }}>
                                  <span style={{ fontSize: '30px' }}>📷</span>
                                  <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
                                    {uploadingImage ? 'Wysylanie...' : 'Kliknij aby wybrac'}
                                  </p>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  opacity: 0,
                                  cursor: uploadingImage ? 'wait' : 'pointer',
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#666' }}>
                                Dozwolone formaty: JPG, PNG, WebP, GIF<br />
                                Maksymalny rozmiar: 5MB
                              </p>
                              {newAd.image_url && (
                                <div style={{
                                  background: '#ccffcc',
                                  padding: '5px 8px',
                                  border: '1px solid #00aa00',
                                  fontSize: '11px',
                                  wordBreak: 'break-all'
                                }}>
                                  <strong>Wgrany:</strong> {newAd.image_url.split('/').pop()}
                                </div>
                              )}
                              {(imagePreview || newAd.image_url) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setNewAd({ ...newAd, image_url: '' });
                                  }}
                                  style={{ ...buttonStyle, marginTop: '8px', fontSize: '11px', padding: '4px 8px', background: '#ffcccc' }}
                                >
                                  Usun obrazek
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytul/Haslo *:</label>
                            <input
                              type="text"
                              value={newAd.title}
                              onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Super Promocja!"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa reklamodawcy *:</label>
                            <input
                              type="text"
                              value={newAd.advertiser_name}
                              onChange={(e) => setNewAd({ ...newAd, advertiser_name: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Anna Juszczak"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Link (klikniecie otwiera):</label>
                            <input
                              type="text"
                              value={newAd.link_url}
                              onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                              style={inputStyle}
                              placeholder="https://strona-reklamodawcy.pl"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Email reklamodawcy:</label>
                            <input
                              type="email"
                              value={newAd.advertiser_email}
                              onChange={(e) => setNewAd({ ...newAd, advertiser_email: e.target.value })}
                              style={inputStyle}
                              placeholder="kontakt@firma.pl"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Data wygasniecia:</label>
                            <input
                              type="date"
                              value={newAd.end_date}
                              onChange={(e) => setNewAd({ ...newAd, end_date: e.target.value })}
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Opis (opcjonalny):</label>
                          <textarea
                            value={newAd.description}
                            onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                            style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
                            placeholder="Krotki opis reklamy..."
                          />
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px', background: '#90EE90' }}>
                          📢 Zapisz i aktywuj reklame
                        </button>
                      </form>
                    </fieldset>

                    {/* All advertisements list */}
                    {allAds.length > 1 && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px', marginTop: '15px' }}>
                        <legend style={{ fontWeight: 'bold' }}>📋 Wszystkie reklamy ({allAds.length})</legend>
                        <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
                          Kliknij "Aktywuj" aby przełączyć na wybraną reklamę
                        </p>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {allAds.map((ad) => (
                            <div
                              key={ad.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px',
                                marginBottom: '5px',
                                background: ad.is_active ? '#ccffcc' : '#f5f5f5',
                                border: ad.is_active ? '2px solid #00aa00' : '1px solid #ccc',
                              }}
                            >
                              {/* Thumbnail */}
                              <div style={{
                                width: '60px',
                                height: '40px',
                                background: '#e0e0e0',
                                border: '1px solid #999',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}>
                                {ad.image_url ? (
                                  <img
                                    src={ad.image_url}
                                    alt={ad.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    📷
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 'bold', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ad.title}
                                </p>
                                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
                                  {ad.advertiser_name}
                                </p>
                              </div>

                              {/* Status */}
                              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                {ad.is_active ? (
                                  <span style={{
                                    background: '#00aa00',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                  }}>
                                    ✓ AKTYWNA
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleActivateAdvertisement(ad.id)}
                                    style={{
                                      ...buttonStyle,
                                      background: '#4CAF50',
                                      color: '#fff',
                                      padding: '4px 10px',
                                      fontSize: '11px',
                                    }}
                                  >
                                    ▶ Aktywuj
                                  </button>
                                )}
                              </div>

                              {/* Delete */}
                              {!ad.is_active && (
                                <button
                                  onClick={() => handleDeleteAdvertisement(ad.id)}
                                  style={{
                                    ...buttonStyle,
                                    background: '#ff6666',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {/* Info box */}
                    <div style={{
                      marginTop: '15px',
                      padding: '10px',
                      background: '#e0e0ff',
                      border: '1px solid #000080',
                      fontSize: '12px'
                    }}>
                      <strong>ℹ️ Jak to dziala:</strong>
                      <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                        <li>Tylko jedna reklama moze byc aktywna naraz</li>
                        <li>Dodanie nowej reklamy automatycznie zastapi aktualna</li>
                        <li>Poprzednie reklamy sa zapisywane na liscie</li>
                        <li>Kliknij "Aktywuj" aby przywrocic stara reklame</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Radio Tab */}
                {activeTab === 'radio' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Zarzadzanie stacjami radiowymi ({stations.length})
                    </h3>

                    {/* Add new station form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nowa stacje</legend>
                      <form onSubmit={handleAddStation}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa:</label>
                            <input
                              type="text"
                              value={newStation.name}
                              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Radio Retro"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL streamu:</label>
                            <input
                              type="text"
                              value={newStation.url}
                              onChange={(e) => setNewStation({ ...newStation, url: e.target.value })}
                              style={inputStyle}
                              placeholder="http://..."
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Gatunek:</label>
                            <input
                              type="text"
                              value={newStation.genre}
                              onChange={(e) => setNewStation({ ...newStation, genre: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Rock"
                            />
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>
                          + Dodaj stacje
                        </button>
                      </form>
                    </fieldset>

                    {/* Stations list */}
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '400px' }}>
                      <thead>
                        <tr style={{ background: '#000080', color: '#fff' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nazwa</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Gatunek</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations.map((station, i) => (
                          <tr key={station.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.id}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.name}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.genre}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <button
                                onClick={() => handleDeleteStation(station.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                }}
                              >
                                Usun
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {/* Guestbook Tab */}
                {activeTab === 'guestbook' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Wpisy w ksiedze gosci ({guestbookEntries.length})
                    </h3>
                    <div>
                      {guestbookEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          Brak wpisow w ksiedze gosci
                        </div>
                      ) : (
                        guestbookEntries.map((entry, i) => (
                          <div
                            key={entry.id}
                            style={{
                              background: i % 2 === 0 ? '#fff' : '#f0f0f0',
                              padding: '10px',
                              marginBottom: '5px',
                              border: '1px solid #ccc',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '5px' }}>
                              <div>
                                <strong>{entry.name || entry.nickname || 'Anonim'}</strong>
                                <br />
                                <small style={{ color: '#666' }}>{new Date(entry.timestamp || entry.date).toLocaleString('pl-PL')}</small>
                              </div>
                              <button
                                onClick={() => handleDeleteGuestbookEntry(entry.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                }}
                              >
                                🗑️ Usun
                              </button>
                            </div>
                            <p style={{ margin: '8px 0 0 0', color: '#333', wordBreak: 'break-word' }}>{entry.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Webring Tab */}
                {activeTab === 'webring' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Zarzadzanie Webring ({webringSites.length} stron)
                    </h3>

                    {/* Add new site form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nowa strone</legend>
                      <form onSubmit={handleAddWebsiteSite}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa strony *:</label>
                            <input
                              type="text"
                              value={newSite.name}
                              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Moja Strona Retro"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL *:</label>
                            <input
                              type="text"
                              value={newSite.url}
                              onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                              style={inputStyle}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Opis:</label>
                            <input
                              type="text"
                              value={newSite.description}
                              onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                              style={inputStyle}
                              placeholder="Krotki opis strony"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select
                              value={newSite.category}
                              onChange={(e) => setNewSite({ ...newSite, category: e.target.value })}
                              style={{ ...inputStyle, height: '30px' }}
                            >
                              <option value="">Wybierz kategorie</option>
                              <option value="Retro">Retro</option>
                              <option value="Aesthetic">Aesthetic</option>
                              <option value="Archive">Archive</option>
                              <option value="Museum">Museum</option>
                              <option value="Personal">Personal</option>
                              <option value="Gaming">Gaming</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Emotka:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: '#fff', border: '2px inset #808080' }}>
                              {(['smile', 'laugh', 'sad', 'wink', 'tongue', 'love', 'cool', 'angry', 'surprise', 'think'] as EmojiType[]).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setNewSite({ ...newSite, icon: emojiToCode[type] })}
                                  style={{
                                    background: newSite.icon === emojiToCode[type] ? '#000080' : '#f0f0f0',
                                    border: '1px solid #808080',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    borderRadius: '2px',
                                  }}
                                  title={emojiToCode[type]}
                                >
                                  <RetroEmoji type={type} size={28} />
                                </button>
                              ))}
                            </div>
                            <small style={{ color: '#666', fontSize: '10px' }}>Wybrana: {newSite.icon}</small>
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>
                          + Dodaj strone do Webring
                        </button>
                      </form>
                    </fieldset>

                    {/* Sites list */}
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ background: '#000080', color: '#fff' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Ikona</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nazwa</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Kategoria</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webringSites.map((site, i) => (
                          <tr key={site.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <EmojiParser text={site.icon || ':)'} emojiSize={32} />
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ color: '#000080' }}>
                                {site.name}
                              </a>
                              <br />
                              <small style={{ color: '#666' }}>{site.description}</small>
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{site.category}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <span style={{
                                background: site.approved ? '#00aa00' : '#ffaa00',
                                color: '#fff',
                                padding: '2px 6px',
                                fontSize: '11px',
                              }}>
                                {site.approved ? 'Aktywna' : 'Oczekuje'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <button
                                onClick={() => handleDeleteWebringSite(site.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                }}
                              >
                                🗑️ Usun
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <Link
                        href="/webring"
                        target="_blank"
                        style={{
                          ...buttonStyle,
                          display: 'inline-block',
                          textDecoration: 'none',
                          color: '#000',
                        }}
                      >
                        Zobacz katalog webring
                      </Link>
                    </div>
                  </div>
                )}

                {/* Forum Section */}
                {activeTab === 'forum' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Zarzadzanie Forum ({forumThreads.length} watkow)
                    </h3>

                    <div style={{ marginBottom: '15px' }}>
                      <Link
                        href="/forum"
                        target="_blank"
                        style={{
                          ...buttonStyle,
                          display: 'inline-block',
                          textDecoration: 'none',
                          color: '#000',
                          marginRight: '10px',
                        }}
                      >
                        Zobacz forum
                      </Link>
                    </div>

                    {/* Threads list */}
                    <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '12px' }}>
                      <thead style={{ background: '#e0e0e0', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ ...cellStyle, textAlign: 'left', width: '40%' }}>Tytul</th>
                          <th style={{ ...cellStyle, textAlign: 'left', width: '15%' }}>Autor</th>
                          <th style={{ ...cellStyle, textAlign: 'left', width: '15%' }}>Kategoria</th>
                          <th style={{ ...cellStyle, textAlign: 'center', width: '10%' }}>Odpowiedzi</th>
                          <th style={{ ...cellStyle, textAlign: 'center', width: '10%' }}>Wyswietlenia</th>
                          <th style={{ ...cellStyle, textAlign: 'center', width: '10%' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forumThreads.map((thread) => (
                          <tr key={thread.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={cellStyle}>
                              <div>
                                <strong>{thread.title}</strong>
                                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                  <EmojiParser text={thread.message.substring(0, 80) + '...'} emojiSize={16} />
                                </div>
                              </div>
                            </td>
                            <td style={cellStyle}>
                              {thread.author.avatar} {thread.author.nickname}
                            </td>
                            <td style={cellStyle}>{thread.categoryId}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{thread.replyCount || 0}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>{thread.views || 0}</td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteThread(thread.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                }}
                              >
                                🗑️ Usun
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {/* News Section - BossXD style categories */}
                {activeTab === 'news' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📰 Zarzadzanie News ({newsList.length} artykulow)
                    </h3>

                    <div style={{ marginBottom: '15px' }}>
                      <Link
                        href="/news"
                        target="_blank"
                        style={{
                          ...buttonStyle,
                          display: 'inline-block',
                          textDecoration: 'none',
                          color: '#000',
                          marginRight: '10px',
                        }}
                      >
                        Zobacz strone News
                      </Link>
                    </div>

                    {/* Add new news form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>➕ Dodaj nowy artykul</legend>
                      <form onSubmit={handleAddNews}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytul *:</label>
                            <input
                              type="text"
                              value={newNews.title}
                              onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                              style={inputStyle}
                              placeholder="Tytul artykulu"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select
                              value={newNews.category}
                              onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
                              style={{ ...inputStyle, height: '30px' }}
                            >
                              {NEWS_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Autor:</label>
                            <input
                              type="text"
                              value={newNews.author}
                              onChange={(e) => setNewNews({ ...newNews, author: e.target.value })}
                              style={inputStyle}
                              placeholder="Admin"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Obrazek URL:</label>
                            <input
                              type="text"
                              value={newNews.image_url}
                              onChange={(e) => setNewNews({ ...newNews, image_url: e.target.value })}
                              style={inputStyle}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tresc artykulu *:</label>
                          <textarea
                            value={newNews.content}
                            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                            style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                            placeholder="Pelna tresc artykulu..."
                          />
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Zajawka (opcjonalnie):</label>
                          <input
                            type="text"
                            value={newNews.excerpt}
                            onChange={(e) => setNewNews({ ...newNews, excerpt: e.target.value })}
                            style={inputStyle}
                            placeholder="Krotki opis - jesli puste, wygeneruje z tresci"
                          />
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px', background: '#90EE90' }}>
                          📰 Opublikuj artykul
                        </button>
                      </form>
                    </fieldset>

                    {/* News list */}
                    <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '12px' }}>
                        <thead style={{ background: '#e0e0e0', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ ...cellStyle, textAlign: 'left', width: '35%' }}>Tytul</th>
                            <th style={{ ...cellStyle, textAlign: 'left', width: '20%' }}>Kategoria</th>
                            <th style={{ ...cellStyle, textAlign: 'left', width: '10%' }}>Autor</th>
                            <th style={{ ...cellStyle, textAlign: 'center', width: '10%' }}>Status</th>
                            <th style={{ ...cellStyle, textAlign: 'center', width: '10%' }}>Wyswietlenia</th>
                            <th style={{ ...cellStyle, textAlign: 'center', width: '15%' }}>Akcje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newsList.map((newsItem) => (
                            <tr key={newsItem.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={cellStyle}>
                                <div>
                                  <strong>{newsItem.title}</strong>
                                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                    {new Date(newsItem.created_at).toLocaleDateString('pl-PL')}
                                  </div>
                                </div>
                              </td>
                              <td style={cellStyle}>
                                <span style={{
                                  background: newsItem.category === 'Niesamowite Historie' ? '#000080' :
                                             newsItem.category === 'Nowoczesne Technologie' ? '#008000' : '#800000',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                }}>
                                  {newsItem.category}
                                </span>
                              </td>
                              <td style={cellStyle}>{newsItem.author}</td>
                              <td style={{ ...cellStyle, textAlign: 'center' }}>
                                <span style={{
                                  background: newsItem.is_published ? '#00aa00' : '#999',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                }}>
                                  {newsItem.is_published ? '✓ Aktywny' : 'Ukryty'}
                                </span>
                              </td>
                              <td style={{ ...cellStyle, textAlign: 'center' }}>{newsItem.views || 0}</td>
                              <td style={{ ...cellStyle, textAlign: 'center' }}>
                                <button
                                  onClick={() => handleToggleNewsPublished(newsItem)}
                                  style={{
                                    ...buttonStyle,
                                    background: newsItem.is_published ? '#ffaa00' : '#4CAF50',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    marginRight: '4px',
                                  }}
                                >
                                  {newsItem.is_published ? '👁️ Ukryj' : '✓ Publikuj'}
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(newsItem.id)}
                                  style={{
                                    ...buttonStyle,
                                    background: '#ff6666',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                  }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Info about categories */}
                    <div style={{
                      marginTop: '15px',
                      padding: '10px',
                      background: '#e0e0ff',
                      border: '1px solid #000080',
                      fontSize: '12px'
                    }}>
                      <strong>ℹ️ Kategorie w stylu BossXD:</strong>
                      <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                        <li><span style={{ color: '#000080' }}>📚 Niesamowite Historie</span> - niezwykle przypadki i fenomenalne wydarzenia</li>
                        <li><span style={{ color: '#008000' }}>💻 Nowoczesne Technologie</span> - najnowsze trendy i innowacje</li>
                        <li><span style={{ color: '#800000' }}>📖 Eksperckie Poradniki</span> - praktyczne wskazowki i tutoriale</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        color: '#fff',
        marginTop: '20px',
        fontSize: '12px',
      }}>
        KupMax Retro Admin Panel v1.0 | 2024
      </div>
    </div>
  );
}
