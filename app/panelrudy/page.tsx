'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

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

  // Edit/Create mode for ads
  const [editingAd, setEditingAd] = useState<any>(null);
  const [creatingAd, setCreatingAd] = useState(false);

  // Advertisement form
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    link_url: '',
    advertiser_name: '',
    advertiser_email: '',
    end_date: '',
  });

  // Slides for new/editing ad
  const [adSlides, setAdSlides] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Guestbook edit
  const [editingGuestbookEntry, setEditingGuestbookEntry] = useState<any>(null);

  // New station form
  const [newStation, setNewStation] = useState({ name: '', url: '', genre: '' });

  // New webring site form
  const [newSite, setNewSite] = useState({ name: '', url: '', description: '', category: '', icon: ':)' });

  // Webring edit
  const [editingWebringSite, setEditingWebringSite] = useState<any>(null);

  // News form
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    author: 'Admin',
    category: 'Niesamowite Historie',
  });

  // News edit
  const [editingNews, setEditingNews] = useState<any>(null);

  // Forum edit
  const [editingThread, setEditingThread] = useState<any>(null);

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

  // ============= ADVERTISEMENT HANDLERS =============
  const handleStartCreateAd = () => {
    setCreatingAd(true);
    setEditingAd(null);
    setNewAd({
      title: '',
      description: '',
      link_url: '',
      advertiser_name: '',
      advertiser_email: '',
      end_date: '',
    });
    setAdSlides([]);
  };

  const handleStartEditAd = (ad: any) => {
    setEditingAd(ad);
    setCreatingAd(false);
    setNewAd({
      title: ad.title || '',
      description: ad.description || '',
      link_url: ad.link_url || '',
      advertiser_name: ad.advertiser_name || '',
      advertiser_email: ad.advertiser_email || '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setAdSlides(ad.slides || []);
  };

  const handleCancelEdit = () => {
    setEditingAd(null);
    setCreatingAd(false);
    setAdSlides([]);
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Dodaj nowy slajd do listy
        setAdSlides([...adSlides, {
          id: `temp_${Date.now()}`,
          image_url: data.url,
          title: '',
          order_index: adSlides.length,
          isNew: true,
        }]);
        setMessage('Obrazek dodany!');
      } else {
        setMessage('Błąd uploadu: ' + (data.error || 'Nieznany błąd'));
      }
    } catch (error) {
      setMessage('Błąd sieci podczas uploadu');
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveSlide = (index: number) => {
    setAdSlides(adSlides.filter((_, i) => i !== index));
  };

  const handleUpdateSlideTitle = (index: number, title: string) => {
    const updated = [...adSlides];
    updated[index].title = title;
    setAdSlides(updated);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === adSlides.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...adSlides];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    // Update order_index
    updated.forEach((slide, i) => slide.order_index = i);
    setAdSlides(updated);
  };

  const handleSaveAdvertisement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAd.title || !newAd.advertiser_name) {
      setMessage('Tytuł i nazwa reklamodawcy są wymagane!');
      return;
    }

    if (adSlides.length === 0) {
      setMessage('Dodaj przynajmniej jeden obrazek do reklamy!');
      return;
    }

    try {
      let adId = editingAd?.id;

      // Jeśli tworzymy nową reklamę
      if (creatingAd) {
        const res = await fetch('/api/advertisement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newAd,
            image_url: adSlides[0]?.image_url || '', // Pierwszy obrazek jako główny
            end_date: newAd.end_date || null,
          }),
        });

        if (!res.ok) {
          setMessage('Błąd tworzenia reklamy');
          return;
        }

        const data = await res.json();
        adId = data.advertisement.id;
      } else if (editingAd) {
        // Aktualizujemy istniejącą
        const res = await fetch('/api/advertisement', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAd.id,
            ...newAd,
            image_url: adSlides[0]?.image_url || editingAd.image_url,
            end_date: newAd.end_date || null,
          }),
        });

        if (!res.ok) {
          setMessage('Błąd aktualizacji reklamy');
          return;
        }
      }

      // Zapisz slajdy
      if (adId && adId !== 'default') {
        // Usuń stare slajdy (tylko przy edycji)
        if (editingAd && editingAd.slides) {
          for (const oldSlide of editingAd.slides) {
            if (!adSlides.find(s => s.id === oldSlide.id)) {
              await fetch(`/api/advertisement/slides?id=${oldSlide.id}`, { method: 'DELETE' });
            }
          }
        }

        // Dodaj/aktualizuj slajdy
        for (let i = 0; i < adSlides.length; i++) {
          const slide = adSlides[i];
          if (slide.isNew || slide.id?.startsWith('temp_')) {
            // Nowy slajd
            await fetch('/api/advertisement/slides', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                advertisement_id: adId,
                image_url: slide.image_url,
                title: slide.title || '',
                order_index: i,
              }),
            });
          } else {
            // Aktualizuj istniejący
            await fetch('/api/advertisement/slides', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: slide.id,
                title: slide.title || '',
                order_index: i,
              }),
            });
          }
        }
      }

      setMessage(creatingAd ? 'Reklama utworzona!' : 'Reklama zaktualizowana!');
      handleCancelEdit();
      fetchData();
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Czy na pewno usunąć tę reklamę i wszystkie jej obrazki?')) return;

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

  // ============= OTHER HANDLERS =============
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

  const handleEditGuestbookEntry = (entry: any) => {
    setEditingGuestbookEntry({ ...entry });
  };

  const handleSaveGuestbookEntry = async () => {
    if (!editingGuestbookEntry) return;

    try {
      const res = await fetch('/api/guestbook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGuestbookEntry.id,
          name: editingGuestbookEntry.name,
          message: editingGuestbookEntry.message,
        }),
      });

      if (res.ok) {
        setMessage('Wpis zaktualizowany!');
        setEditingGuestbookEntry(null);
        fetchData();
      } else {
        setMessage('Błąd aktualizacji');
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleCancelEditGuestbook = () => {
    setEditingGuestbookEntry(null);
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

  const handleEditWebringSite = (site: any) => {
    setEditingWebringSite({ ...site });
  };

  const handleSaveWebringSite = async () => {
    if (!editingWebringSite) return;

    try {
      const res = await fetch('/api/webring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWebringSite.id,
          name: editingWebringSite.name,
          url: editingWebringSite.url,
          description: editingWebringSite.description,
          category: editingWebringSite.category,
          icon: editingWebringSite.icon,
        }),
      });

      if (res.ok) {
        setMessage('Strona zaktualizowana!');
        setEditingWebringSite(null);
        fetchData();
      } else {
        setMessage('Błąd aktualizacji');
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleCancelEditWebring = () => {
    setEditingWebringSite(null);
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

  const handleEditNews = (newsItem: any) => {
    setEditingNews({ ...newsItem });
  };

  const handleSaveNews = async () => {
    if (!editingNews) return;

    try {
      const res = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNews.id,
          title: editingNews.title,
          content: editingNews.content,
          excerpt: editingNews.excerpt,
          category: editingNews.category,
          author: editingNews.author,
        }),
      });

      if (res.ok) {
        setMessage('News zaktualizowany!');
        setEditingNews(null);
        fetchData();
      } else {
        setMessage('Błąd aktualizacji');
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleCancelEditNews = () => {
    setEditingNews(null);
  };

  const handleEditThread = (thread: any) => {
    setEditingThread({ ...thread });
  };

  const handleSaveThread = async () => {
    if (!editingThread) return;

    try {
      const res = await fetch('/api/forum/threads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: editingThread.id,
          title: editingThread.title,
          message: editingThread.message,
        }),
      });

      if (res.ok) {
        setMessage('Wątek zaktualizowany!');
        setEditingThread(null);
        fetchData();
      } else {
        setMessage('Błąd aktualizacji');
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleCancelEditThread = () => {
    setEditingThread(null);
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
    maxWidth: '950px',
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
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? 'none' : '2px outset #fff',
    marginBottom: isActive ? '-2px' : '0',
    position: 'relative' as const,
    zIndex: isActive ? 1 : 0,
    fontSize: '12px',
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
              📝 Guestbook
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
                <button onClick={() => setMessage('')} style={{ marginLeft: '10px', cursor: 'pointer' }}>✕</button>
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
                      📢 Zarządzanie Reklamami (Slider)
                    </h3>

                    {/* Create/Edit Form */}
                    {(creatingAd || editingAd) && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#ffffcc' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>
                          {creatingAd ? '➕ Nowa reklama' : '✏️ Edytuj reklamę'}
                        </legend>
                        <form onSubmit={handleSaveAdvertisement}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytuł reklamy *:</label>
                              <input type="text" value={newAd.title} onChange={(e) => setNewAd({ ...newAd, title: e.target.value })} style={inputStyle} placeholder="np. Anna Fotografia" />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Reklamodawca *:</label>
                              <input type="text" value={newAd.advertiser_name} onChange={(e) => setNewAd({ ...newAd, advertiser_name: e.target.value })} style={inputStyle} placeholder="np. Anna Juszczak" />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Link (gdzie prowadzi):</label>
                              <input type="text" value={newAd.link_url} onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })} style={inputStyle} placeholder="https://..." />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Data wygaśnięcia:</label>
                              <input type="date" value={newAd.end_date} onChange={(e) => setNewAd({ ...newAd, end_date: e.target.value })} style={inputStyle} />
                            </div>
                          </div>

                          {/* Slides section */}
                          <div style={{ marginTop: '15px', padding: '10px', background: '#fff', border: '1px solid #999' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#000080' }}>🖼️ Obrazki (slider) - min. 1</h4>

                            <div style={{ marginBottom: '10px' }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleSlideImageUpload}
                                disabled={uploadingImage}
                                style={{ marginRight: '10px' }}
                              />
                              {uploadingImage && <span>⏳ Wysyłanie...</span>}
                            </div>

                            {adSlides.length === 0 ? (
                              <p style={{ color: '#666', fontStyle: 'italic' }}>Brak obrazków. Dodaj przynajmniej jeden!</p>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {adSlides.map((slide, index) => (
                                  <div key={slide.id} style={{
                                    width: '150px',
                                    background: '#f0f0f0',
                                    border: '1px solid #999',
                                    padding: '5px',
                                  }}>
                                    <div style={{
                                      width: '100%',
                                      height: '80px',
                                      overflow: 'hidden',
                                      marginBottom: '5px',
                                    }}>
                                      <img
                                        src={slide.image_url}
                                        alt={slide.title || `Slajd ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Podpis (opcj.)"
                                      value={slide.title || ''}
                                      onChange={(e) => handleUpdateSlideTitle(index, e.target.value)}
                                      style={{ ...inputStyle, fontSize: '10px', marginBottom: '5px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                                      <button type="button" onClick={() => handleMoveSlide(index, 'up')} disabled={index === 0} style={{ ...buttonStyle, padding: '2px 6px', fontSize: '10px' }}>◀</button>
                                      <button type="button" onClick={() => handleMoveSlide(index, 'down')} disabled={index === adSlides.length - 1} style={{ ...buttonStyle, padding: '2px 6px', fontSize: '10px' }}>▶</button>
                                      <button type="button" onClick={() => handleRemoveSlide(index)} style={{ ...buttonStyle, padding: '2px 6px', fontSize: '10px', background: '#ff6666' }}>✕</button>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '3px' }}>
                                      #{index + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button type="submit" style={{ ...buttonStyle, background: '#90EE90' }}>
                              💾 {creatingAd ? 'Utwórz reklamę' : 'Zapisz zmiany'}
                            </button>
                            <button type="button" onClick={handleCancelEdit} style={buttonStyle}>
                              Anuluj
                            </button>
                          </div>
                        </form>
                      </fieldset>
                    )}

                    {/* Current active ad */}
                    {currentAd && !creatingAd && !editingAd && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                        <legend style={{ fontWeight: 'bold', color: '#006600' }}>✅ Aktywna reklama na stronie</legend>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {(currentAd.slides || []).slice(0, 4).map((slide: any, i: number) => (
                              <div key={slide.id || i} style={{
                                width: '60px',
                                height: '40px',
                                background: '#f0f0f0',
                                border: '1px solid #999',
                                overflow: 'hidden',
                              }}>
                                <img src={slide.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                            {(currentAd.slides || []).length > 4 && (
                              <div style={{ width: '60px', height: '40px', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                                +{currentAd.slides.length - 4}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: '0 0 5px 0' }}><strong>{currentAd.title}</strong></p>
                            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Reklamodawca: {currentAd.advertiser_name}</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                              Obrazków: {(currentAd.slides || []).length}
                              {currentAd.end_date && (
                                <span style={{ marginLeft: '10px' }}>
                                  | Wygasa: {new Date(currentAd.end_date).toLocaleDateString('pl-PL')}
                                  {getDaysUntilExpiry(currentAd.end_date)! <= 3 && <span style={{ color: '#cc0000' }}> ⚠️</span>}
                                </span>
                              )}
                            </p>
                          </div>
                          <button onClick={() => handleStartEditAd(currentAd)} style={{ ...buttonStyle, background: '#87CEEB' }}>✏️ Edytuj</button>
                        </div>
                      </fieldset>
                    )}

                    {/* Add new button */}
                    {!creatingAd && !editingAd && (
                      <button onClick={handleStartCreateAd} style={{ ...buttonStyle, background: '#90EE90', marginBottom: '15px' }}>
                        ➕ Dodaj nową reklamę
                      </button>
                    )}

                    {/* Bank of ads */}
                    {!creatingAd && !editingAd && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px' }}>
                        <legend style={{ fontWeight: 'bold' }}>🏦 Bank reklam ({allAds.length})</legend>
                        {allAds.length === 0 ? (
                          <p style={{ color: '#666', textAlign: 'center' }}>Brak reklam. Utwórz pierwszą!</p>
                        ) : (
                          allAds.map((ad) => (
                            <div key={ad.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px',
                              marginBottom: '8px',
                              background: ad.is_active ? '#ccffcc' : '#fff',
                              border: ad.is_active ? '2px solid #00aa00' : '1px solid #ccc',
                            }}>
                              {/* Mini slider preview */}
                              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                {(ad.slides || []).slice(0, 3).map((slide: any, i: number) => (
                                  <div key={slide.id || i} style={{
                                    width: '40px',
                                    height: '30px',
                                    background: '#f0f0f0',
                                    border: '1px solid #999',
                                    overflow: 'hidden',
                                  }}>
                                    <img src={slide.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ))}
                                {(ad.slides || []).length === 0 && (
                                  <div style={{ width: '40px', height: '30px', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                    ?
                                  </div>
                                )}
                              </div>

                              <div style={{ flex: 1 }}>
                                <strong>{ad.title}</strong>
                                <br />
                                <small style={{ color: '#666' }}>
                                  {ad.advertiser_name} • {(ad.slides || []).length} obr.
                                  {ad.end_date && ` • do ${new Date(ad.end_date).toLocaleDateString('pl-PL')}`}
                                </small>
                              </div>

                              {ad.is_active ? (
                                <span style={{ background: '#00aa00', color: '#fff', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold' }}>
                                  ✓ AKTYWNA
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleActivateAdvertisement(ad.id)}
                                  style={{ ...buttonStyle, fontSize: '11px', padding: '4px 10px', background: '#90EE90' }}
                                >
                                  Aktywuj
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEditAd(ad)}
                                style={{ ...buttonStyle, fontSize: '11px', padding: '4px 8px', background: '#87CEEB' }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteAdvertisement(ad.id)}
                                style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}
                              >
                                🗑️
                              </button>
                            </div>
                          ))
                        )}
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
                      📝 Wpisy w księdze gości ({guestbookEntries.length})
                    </h3>

                    {/* Edit form */}
                    {editingGuestbookEntry && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#ffffcc' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>✏️ Edytuj wpis</legend>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa użytkownika:</label>
                          <input
                            type="text"
                            value={editingGuestbookEntry.name || ''}
                            onChange={(e) => setEditingGuestbookEntry({ ...editingGuestbookEntry, name: e.target.value })}
                            style={inputStyle}
                            maxLength={50}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Wiadomość:</label>
                          <textarea
                            value={editingGuestbookEntry.message || ''}
                            onChange={(e) => setEditingGuestbookEntry({ ...editingGuestbookEntry, message: e.target.value })}
                            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                            maxLength={500}
                          />
                          <small style={{ color: '#666' }}>{editingGuestbookEntry.message?.length || 0}/500 znaków</small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={handleSaveGuestbookEntry} style={{ ...buttonStyle, background: '#90EE90' }}>
                            💾 Zapisz
                          </button>
                          <button onClick={handleCancelEditGuestbook} style={buttonStyle}>
                            Anuluj
                          </button>
                        </div>
                      </fieldset>
                    )}

                    {guestbookEntries.length === 0 ? (
                      <p style={{ color: '#666', textAlign: 'center' }}>Brak wpisów</p>
                    ) : (
                      guestbookEntries.map((entry, i) => (
                        <div key={entry.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0', padding: '10px', marginBottom: '5px', border: '1px solid #ccc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong>{entry.name || entry.nickname || 'Anonim'}</strong>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleEditGuestbookEntry(entry)} style={{ ...buttonStyle, background: '#87CEEB', fontSize: '11px', padding: '2px 6px' }}>✏️</button>
                              <button onClick={() => handleDeleteGuestbookEntry(entry.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '2px 6px' }}>🗑️</button>
                            </div>
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

                    {/* Edit form */}
                    {editingWebringSite && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#ffffcc' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>✏️ Edytuj stronę</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa *:</label>
                            <input
                              type="text"
                              value={editingWebringSite.name || ''}
                              onChange={(e) => setEditingWebringSite({ ...editingWebringSite, name: e.target.value })}
                              style={inputStyle}
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL *:</label>
                            <input
                              type="text"
                              value={editingWebringSite.url || ''}
                              onChange={(e) => setEditingWebringSite({ ...editingWebringSite, url: e.target.value })}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Opis:</label>
                            <input
                              type="text"
                              value={editingWebringSite.description || ''}
                              onChange={(e) => setEditingWebringSite({ ...editingWebringSite, description: e.target.value })}
                              style={inputStyle}
                              maxLength={200}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <input
                              type="text"
                              value={editingWebringSite.category || ''}
                              onChange={(e) => setEditingWebringSite({ ...editingWebringSite, category: e.target.value })}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Ikona (emoji):</label>
                            <input
                              type="text"
                              value={editingWebringSite.icon || ''}
                              onChange={(e) => setEditingWebringSite({ ...editingWebringSite, icon: e.target.value })}
                              style={{ ...inputStyle, width: '60px' }}
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          <button onClick={handleSaveWebringSite} style={{ ...buttonStyle, background: '#90EE90' }}>
                            💾 Zapisz
                          </button>
                          <button onClick={handleCancelEditWebring} style={buttonStyle}>
                            Anuluj
                          </button>
                        </div>
                      </fieldset>
                    )}

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
                        <span style={{ fontSize: '18px' }}>{site.icon || '🌐'}</span>
                        <div style={{ flex: 1 }}>
                          <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>{site.name}</a>
                          {site.description && <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>{site.description}</p>}
                        </div>
                        <span style={{ fontSize: '10px', color: '#999', background: '#f0f0f0', padding: '2px 6px' }}>{site.category || 'General'}</span>
                        <button onClick={() => handleEditWebringSite(site)} style={{ ...buttonStyle, background: '#87CEEB', fontSize: '11px', padding: '4px 8px' }}>✏️</button>
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

                    {/* Edit form */}
                    {editingThread && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#ffffcc' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>✏️ Edytuj wątek</legend>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytuł wątku:</label>
                          <input
                            type="text"
                            value={editingThread.title || ''}
                            onChange={(e) => setEditingThread({ ...editingThread, title: e.target.value })}
                            style={inputStyle}
                            maxLength={100}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Treść:</label>
                          <textarea
                            value={editingThread.message || ''}
                            onChange={(e) => setEditingThread({ ...editingThread, message: e.target.value })}
                            style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                            maxLength={5000}
                          />
                          <small style={{ color: '#666' }}>{editingThread.message?.length || 0}/5000 znaków</small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={handleSaveThread} style={{ ...buttonStyle, background: '#90EE90' }}>
                            💾 Zapisz
                          </button>
                          <button onClick={handleCancelEditThread} style={buttonStyle}>
                            Anuluj
                          </button>
                        </div>
                      </fieldset>
                    )}

                    {forumThreads.length === 0 ? (
                      <p style={{ color: '#666', textAlign: 'center' }}>Brak wątków</p>
                    ) : (
                      forumThreads.map((thread) => (
                        <div key={thread.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '5px', background: '#fff', border: '1px solid #ccc' }}>
                          <div style={{ flex: 1 }}>
                            <strong>{thread.title}</strong>
                            <br />
                            <small style={{ color: '#666' }}>przez {thread.author?.nickname || 'Anonim'} • {thread.replyCount || 0} odpowiedzi</small>
                          </div>
                          <button onClick={() => handleEditThread(thread)} style={{ ...buttonStyle, background: '#87CEEB', fontSize: '11px', padding: '4px 8px' }}>✏️</button>
                          <button onClick={() => handleDeleteThread(thread.id)} style={{ ...buttonStyle, background: '#ff6666', fontSize: '11px', padding: '4px 8px' }}>🗑️</button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* NEWS TAB */}
                {activeTab === 'news' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📰 Zarządzanie News ({newsList.length})
                    </h3>

                    {/* Edit form */}
                    {editingNews && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#ffffcc' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>✏️ Edytuj artykuł</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Tytuł:</label>
                            <input
                              type="text"
                              value={editingNews.title || ''}
                              onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select
                              value={editingNews.category || ''}
                              onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value })}
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
                              value={editingNews.author || ''}
                              onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })}
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Treść:</label>
                          <textarea
                            value={editingNews.content || ''}
                            onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                            style={{ ...inputStyle, height: '150px', resize: 'vertical' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          <button onClick={handleSaveNews} style={{ ...buttonStyle, background: '#90EE90' }}>
                            💾 Zapisz
                          </button>
                          <button onClick={handleCancelEditNews} style={buttonStyle}>
                            Anuluj
                          </button>
                        </div>
                      </fieldset>
                    )}

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
                          <small style={{ color: '#666' }}>{newsItem.category} • {newsItem.author} • {new Date(newsItem.created_at).toLocaleDateString('pl-PL')}</small>
                        </div>
                        <button onClick={() => handleEditNews(newsItem)} style={{ ...buttonStyle, background: '#87CEEB', fontSize: '11px', padding: '4px 8px' }}>✏️</button>
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
        KupMax Admin Panel v4.0 | 2024 | 🔐 Google OAuth
      </div>
    </div>
  );
}
