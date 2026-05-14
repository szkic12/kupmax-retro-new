'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

type MediaFolder = 'music' | 'video' | 'image';

function MediaTab() {
  const [folder, setFolder] = useState<MediaFolder>('music');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploads, setUploads] = useState<{ url: string; name: string; folder: string }[]>([]);

  const folderConfig = {
    music: { label: '🎵 Muzyka', accept: 'audio/*', ext: 'MP3, WAV, OGG, FLAC', maxMB: 50 },
    video: { label: '🎬 Film', accept: 'video/*', ext: 'MP4, WebM, MOV', maxMB: 500 },
    image: { label: '🖼️ Miniaturka', accept: 'image/*', ext: 'JPG, PNG, WebP, GIF', maxMB: 10 },
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('⏳ Generowanie URL...');
    try {
      // Krok 1: pobierz presigned URL z API
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, folder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Krok 2: wgraj plik bezpośrednio do S3 (omija limit Vercel)
      setMsg('⏳ Wysyłanie do S3...');
      const s3Res = await fetch(data.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error('Błąd uploadu do S3');

      setUploads(prev => [{ url: data.publicUrl, name: file.name, folder }, ...prev]);
      setMsg('✅ Wgrano! Kliknij "Kopiuj URL" i wklej do formularza 3D.');
    } catch (err: any) {
      setMsg('❌ ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const cfg = folderConfig[folder];

  return (
    <>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>🎵 Media Library — muzyka, filmy, miniatury</h3>
      <p style={{ fontSize: '11px', color: '#555', marginBottom: '12px' }}>
        Wgraj plik, skopiuj URL, wklej do pola <strong>backgroundMusicUrl</strong>, <strong>embeddedVideoUrl</strong> lub <strong>thumbnailUrl</strong> w formularzu 3D.
      </p>

      {/* Wybór folderu */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(Object.keys(folderConfig) as MediaFolder[]).map(f => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            style={{
              padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
              border: '2px outset #808080',
              background: folder === f ? '#000080' : '#c0c0c0',
              color: folder === f ? '#fff' : '#000',
              fontWeight: folder === f ? 'bold' : 'normal',
            }}
          >
            {folderConfig[f].label}
          </button>
        ))}
      </div>

      {/* Upload */}
      <div style={{ background: '#f0f0f0', border: '2px inset #808080', padding: '14px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          <strong>{cfg.label}</strong> — dozwolone: {cfg.ext} — max {cfg.maxMB}MB
        </div>
        <input
          type="file"
          accept={cfg.accept}
          disabled={uploading}
          onChange={handleUpload}
          style={{ fontSize: '12px' }}
        />
        {msg && (
          <div style={{
            marginTop: '8px', padding: '6px 10px', fontSize: '12px',
            background: msg.startsWith('✅') ? '#d4edda' : msg.startsWith('❌') ? '#f8d7da' : '#fff3cd',
            border: '1px solid #ccc', borderRadius: '3px',
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* Lista wgranych */}
      {uploads.length > 0 && (
        <div>
          <h4 style={{ fontSize: '12px', margin: '0 0 8px' }}>Wgrane w tej sesji:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {uploads.map((u, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #ccc', padding: '8px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>
                  {u.folder === 'music' ? '🎵' : u.folder === 'video' ? '🎬' : '🖼️'} {u.name}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(u.url); setMsg('✅ URL skopiowany!'); }}
                  style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', background: '#006600', color: '#fff', border: '2px outset #808080' }}
                >
                  📋 Kopiuj URL
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

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
  const [pollData, setPollData] = useState<any>(null);
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

  // AI News generator
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('blog');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Forum edit
  const [editingThread, setEditingThread] = useState<any>(null);

  // RSS
  const [rssSources, setRssSources] = useState<any[]>([]);
  const [rssItems, setRssItems] = useState<any[]>([]);
  const [loadingRss, setLoadingRss] = useState(false);
  const [newRssSource, setNewRssSource] = useState({ name: '', url: '', category: 'Tech' });

  // Trends
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendCategory, setTrendCategory] = useState('general');

  // Gallery (Moje Zdjecia)
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [newGalleryPhoto, setNewGalleryPhoto] = useState({ title: '', image_url: '', description: '' });

  // 3D Objects (Vibe3D / Firebase)
  const [models3d, setModels3d] = useState<any[]>([]);
  const [models3dLoading, setModels3dLoading] = useState(false);
  const [models3dMessage, setModels3dMessage] = useState('');
  const [new3dModel, setNew3dModel] = useState({ title: '', description: '', category: 'Art', shopUrl: '', backgroundMusicUrl: '', embeddedVideoUrl: '', thumbnailUrl: '', galleryImageUrls: '', availableForDownload: false });
  const [selected3dFile, setSelected3dFile] = useState<File | null>(null);
  const [uploading3d, setUploading3d] = useState(false);
  const [upload3dProgress, setUpload3dProgress] = useState(0);
  const [editing3dModel, setEditing3dModel] = useState<any | null>(null);
  const [saving3dEdit, setSaving3dEdit] = useState(false);
  const VIBE3D_CATEGORIES = ['Art', 'Body', 'Epic Fail', 'Ghost Object', 'Glitch', 'Randomize Chaos', 'Secret Face', 'Live', 'Games'];

  const NEWS_CATEGORIES = ['Niesamowite Historie', 'Nowoczesne Technologie', 'Eksperckie Poradniki'];

  // Simple formatting helpers for news content
  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('textarea[data-news-content]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const content = newNews.content;

    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'h2':
        newText = `\n## ${selectedText || 'Nagłówek sekcji'}\n`;
        cursorOffset = 4;
        break;
      case 'h3':
        newText = `\n### ${selectedText || 'Podtytuł'}\n`;
        cursorOffset = 5;
        break;
      case 'bold':
        newText = `**${selectedText || 'pogrubiony tekst'}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'kursywa'}*`;
        cursorOffset = 1;
        break;
      case 'list':
        newText = `\n- ${selectedText || 'Element listy'}\n- Kolejny element\n- Jeszcze jeden\n`;
        cursorOffset = 3;
        break;
      case 'link':
        newText = `[${selectedText || 'tekst linku'}](https://example.com)`;
        cursorOffset = 1;
        break;
      case 'quote':
        newText = `\n> ${selectedText || 'Cytat lub ważna myśl'}\n`;
        cursorOffset = 3;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setNewNews({ ...newNews, content: newContent });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
    }, 10);
  };

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
      } else if (activeTab === 'poll') {
        const res = await fetch('/api/poll');
        const data = await res.json();
        setPollData(data.poll || null);
      } else if (activeTab === 'rss') {
        // Pobierz źródła RSS
        const resSources = await fetch('/api/news/rss?action=sources');
        const dataSources = await resSources.json();
        setRssSources(dataSources.sources || []);
      } else if (activeTab === '3d') {
        setModels3dLoading(true);
        fetch('/api/models3d').then(r => r.json()).then(d => {
          if (d.success) setModels3d(d.models);
          setModels3dLoading(false);
        }).catch(() => setModels3dLoading(false));
      } else if (activeTab === 'gallery') {
        // Pobierz zdjęcia z galerii
        const resGallery = await fetch('/api/gallery-photos');
        const dataGallery = await resGallery.json();
        setGalleryPhotos(dataGallery.photos || []);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
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

  const handleReplaceSlideImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
    setMessage('Wysyłanie nowego obrazka...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/advertisement/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Podmień obrazek w slajdzie
        const updated = [...adSlides];
        updated[index] = {
          ...updated[index],
          image_url: data.url,
          isNew: true, // Oznacz jako nowy żeby zapisać do bazy
        };
        setAdSlides(updated);
        setMessage('Obrazek podmieniony!');
      } else {
        setMessage('Błąd uploadu: ' + (data.error || 'Nieznany błąd'));
      }
    } catch (error) {
      setMessage('Błąd sieci podczas uploadu');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
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
        // Jeśli edytujemy "default" reklamę - utwórz nową zamiast aktualizować
        if (editingAd.id === 'default') {
          const res = await fetch('/api/advertisement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newAd,
              image_url: adSlides[0]?.image_url || '',
              end_date: newAd.end_date || null,
            }),
          });

          if (!res.ok) {
            setMessage('Błąd tworzenia reklamy');
            return;
          }

          const data = await res.json();
          adId = data.advertisement.id;
        } else {
          // Aktualizujemy istniejącą reklamę
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
          adId = editingAd.id;
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
        // Jeśli edytowaliśmy domyślną reklamę, wszystkie slajdy są nowe
        const isFromDefaultAd = editingAd?.id === 'default';

        for (let i = 0; i < adSlides.length; i++) {
          const slide = adSlides[i];
          // Slajd jest nowy jeśli: ma flagę isNew, zaczyna się od temp_, lub pochodzi z domyślnej reklamy
          const isNewSlide = slide.isNew || slide.id?.startsWith('temp_') || isFromDefaultAd || !slide.id?.includes('-');

          if (isNewSlide) {
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
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(`Błąd: ${data.message || res.statusText}`);
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

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) {
      setMessage('Wpisz temat artykułu!');
      return;
    }

    setGeneratingAi(true);
    setMessage('🤖 AI pisze artykuł...');

    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          language: 'pl',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Wypełnij formularz wygenerowanym artykułem
        setNewNews({
          ...newNews,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
        });
        setMessage('✅ Artykuł wygenerowany! Możesz go edytować przed publikacją.');
        setShowAiGenerator(false);
        setAiPrompt('');
      } else {
        setMessage('❌ Błąd: ' + (data.error || 'Nie udało się wygenerować'));
      }
    } catch (error) {
      setMessage('❌ Błąd sieci');
    } finally {
      setGeneratingAi(false);
    }
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

  // RSS handlers
  const handleFetchRssItems = async () => {
    setLoadingRss(true);
    setMessage('📡 Pobieram artykuły z RSS...');
    try {
      const res = await fetch('/api/news/rss?action=fetch');
      const data = await res.json();
      if (data.items) {
        setRssItems(data.items);
        setMessage(`✅ Pobrano ${data.items.length} artykułów!`);
      }
    } catch (error) {
      setMessage('❌ Błąd pobierania RSS');
    } finally {
      setLoadingRss(false);
    }
  };

  const handleAddRssSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRssSource.name || !newRssSource.url) {
      setMessage('Nazwa i URL są wymagane!');
      return;
    }

    setMessage('Sprawdzam źródło RSS...');
    try {
      const res = await fetch('/api/news/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRssSource),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Źródło dodane!');
        setNewRssSource({ name: '', url: '', category: 'Tech' });
        fetchData();
      } else {
        setMessage('❌ ' + (data.error || 'Błąd dodawania'));
      }
    } catch (error) {
      setMessage('❌ Błąd sieci');
    }
  };

  const handleDeleteRssSource = async (id: string) => {
    if (!confirm('Czy na pewno usunąć to źródło?')) return;
    try {
      const res = await fetch(`/api/news/rss?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Źródło usunięte!');
        fetchData();
      }
    } catch (error) {
      setMessage('Błąd sieci');
    }
  };

  const handleUseRssForArticle = (item: any) => {
    setActiveTab('news');
    setAiPrompt(`Napisz artykuł na temat: "${item.title}"\n\nŹródło: ${item.source}\nLink: ${item.link}\n\nKontekst: ${item.description}`);
    setShowAiGenerator(true);
    setMessage('💡 Użyj AI żeby napisać artykuł na ten temat!');
  };

  // Trends handlers
  const handleFetchTrends = async () => {
    setLoadingTrends(true);
    setMessage('🔮 Szukam aktualnych trendów...');
    try {
      const res = await fetch(`/api/news/trends?category=${trendCategory}`);
      const data = await res.json();
      if (data.trends) {
        setTrends(data.trends);
        setMessage(`✅ Znaleziono ${data.trends.length} trendów! (źródło: ${data.source})`);
      }
    } catch (error) {
      setMessage('❌ Błąd pobierania trendów');
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleUseTrendForArticle = (trend: any) => {
    setActiveTab('news');
    setAiPrompt(`Napisz artykuł na temat: "${trend.title}"\n\nDlaczego to ciekawe: ${trend.why}\n\nUnikalny kąt: ${trend.angle}\n\nTagi: ${trend.tags?.join(', ')}`);
    setShowAiGenerator(true);
    setMessage('💡 Użyj AI żeby napisać artykuł na ten temat!');
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
            <button style={tabStyle(activeTab === 'poll')} onClick={() => setActiveTab('poll')}>
              📊 Sonda
            </button>
            <button style={tabStyle(activeTab === 'rss')} onClick={() => setActiveTab('rss')}>
              📡 Inspiracje
            </button>
            <button style={tabStyle(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>
              📷 Moje Zdjecia
            </button>
            <button style={tabStyle(activeTab === '3d')} onClick={() => setActiveTab('3d')}>
              🧊 3D Objects
            </button>
            <button style={tabStyle(activeTab === 'media')} onClick={() => setActiveTab('media')}>
              🎵 Media
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
                                      position: 'relative',
                                    }}>
                                      <img
                                        src={slide.image_url}
                                        alt={slide.title || `Slajd ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                      {/* Przycisk podmiany obrazka */}
                                      <label style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        background: '#4444ff',
                                        color: '#fff',
                                        padding: '2px 5px',
                                        fontSize: '9px',
                                        cursor: 'pointer',
                                        borderRadius: '3px',
                                      }}>
                                        🔄
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleReplaceSlideImage(index, e)}
                                          disabled={uploadingImage}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
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

                {/* POLL TAB */}
                {activeTab === 'poll' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📊 Sonda - Wyniki głosowania
                    </h3>

                    {pollData ? (
                      <div>
                        <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#f0f8ff' }}>
                          <legend style={{ fontWeight: 'bold', color: '#000080' }}>📋 Aktualna sonda</legend>

                          <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                              {pollData.question}
                            </p>
                            <p style={{ fontSize: '11px', color: '#666' }}>
                              ID: {pollData.id} | Utworzono: {new Date(pollData.created_at).toLocaleString('pl-PL')}
                            </p>
                          </div>

                          <div style={{ background: '#fff', border: '2px inset #808080', padding: '15px', marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>
                              📈 Wyniki głosowania (łącznie: {pollData.total_votes || 0} głosów)
                            </h4>

                            {pollData.options && pollData.options.map((option: string) => {
                              const votes = pollData.votes?.[option] || 0;
                              const totalVotes = pollData.total_votes || 1;
                              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                              return (
                                <div key={option} style={{ marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{option}</span>
                                    <span>{votes} głosów ({percentage}%)</span>
                                  </div>
                                  <div style={{
                                    height: '20px',
                                    background: '#e0e0e0',
                                    border: '1px solid #808080',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${percentage}%`,
                                      background: 'linear-gradient(90deg, #000080 0%, #0000cc 100%)',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                            💡 Status: {pollData.is_active ? '✅ Aktywna' : '❌ Nieaktywna'}
                          </div>
                        </fieldset>

                        <div style={{ textAlign: 'center', padding: '20px', background: '#fffacd', border: '2px solid #ffd700' }}>
                          <p style={{ fontSize: '12px', margin: 0 }}>
                            🔧 Funkcja tworzenia nowych sond będzie dostępna wkrótce!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', border: '2px inset #808080' }}>
                        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>📊 Brak aktywnej sondy</p>
                        <p style={{ fontSize: '11px', color: '#999' }}>Stwórz nową sondę aby wyświetlić wyniki</p>
                      </div>
                    )}
                  </div>
                )}

                {/* RSS/INSPIRACJE TAB */}
                {activeTab === 'rss' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📡 Inspiracje - RSS Agregator
                    </h3>

                    {/* Dodaj źródło */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>➕ Dodaj źródło RSS</legend>
                      <form onSubmit={handleAddRssSource}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa *:</label>
                            <input
                              type="text"
                              value={newRssSource.name}
                              onChange={(e) => setNewRssSource({ ...newRssSource, name: e.target.value })}
                              placeholder="np. TechCrunch"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL RSS *:</label>
                            <input
                              type="text"
                              value={newRssSource.url}
                              onChange={(e) => setNewRssSource({ ...newRssSource, url: e.target.value })}
                              placeholder="https://example.com/feed.xml"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select
                              value={newRssSource.category}
                              onChange={(e) => setNewRssSource({ ...newRssSource, category: e.target.value })}
                              style={{ ...inputStyle, height: '30px' }}
                            >
                              <option value="Tech">Tech</option>
                              <option value="News">News</option>
                              <option value="Blog">Blog</option>
                              <option value="Science">Science</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>+ Dodaj źródło</button>
                      </form>
                    </fieldset>

                    {/* Lista źródeł */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>📋 Twoje źródła ({rssSources.length})</legend>
                      {rssSources.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center' }}>Brak źródeł RSS</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {rssSources.map((source) => (
                            <span
                              key={source.id}
                              style={{
                                background: '#fff',
                                padding: '4px 8px',
                                border: '1px solid #ccc',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              {source.name}
                              <button
                                onClick={() => handleDeleteRssSource(source.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f00', fontSize: '10px' }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </fieldset>

                    {/* Pobierz artykuły */}
                    <div style={{ marginBottom: '15px' }}>
                      <button
                        onClick={handleFetchRssItems}
                        disabled={loadingRss}
                        style={{ ...buttonStyle, background: loadingRss ? '#ccc' : '#87CEEB' }}
                      >
                        {loadingRss ? '⏳ Pobieram...' : '🔄 Pobierz najnowsze artykuły'}
                      </button>
                    </div>

                    {/* Lista artykułów */}
                    {rssItems.length > 0 && (
                      <fieldset style={{ border: '2px groove #fff', padding: '10px' }}>
                        <legend style={{ fontWeight: 'bold' }}>📰 Najnowsze artykuły ({rssItems.length})</legend>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          {rssItems.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                background: i % 2 === 0 ? '#fff' : '#f5f5f5',
                                padding: '10px',
                                marginBottom: '5px',
                                border: '1px solid #ddd'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontWeight: 'bold', color: '#000080', textDecoration: 'none' }}
                                  >
                                    {item.title}
                                  </a>
                                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                                    {item.description?.substring(0, 150)}...
                                  </p>
                                  <small style={{ color: '#999' }}>
                                    📰 {item.source} • {new Date(item.pubDate).toLocaleDateString('pl-PL')}
                                  </small>
                                </div>
                                <button
                                  onClick={() => handleUseRssForArticle(item)}
                                  style={{ ...buttonStyle, background: '#90EE90', fontSize: '11px', whiteSpace: 'nowrap' }}
                                  title="Użyj tego tematu do napisania artykułu z AI"
                                >
                                  ✨ Napisz
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    <p style={{ marginTop: '15px', fontSize: '11px', color: '#666' }}>
                      💡 Tip: Kliknij "✨ Napisz" przy artykule żeby użyć go jako inspiracji do własnego artykułu z pomocą AI!
                    </p>

                    {/* TRENDY AI */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginTop: '20px', background: '#f5f0ff' }}>
                      <legend style={{ fontWeight: 'bold', color: '#800080' }}>🔮 Trendy AI - O czym teraz pisać?</legend>

                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select
                          value={trendCategory}
                          onChange={(e) => setTrendCategory(e.target.value)}
                          style={{ ...inputStyle, height: '30px', width: 'auto' }}
                        >
                          <option value="general">🌍 Ogólne</option>
                          <option value="tech">💻 Technologia</option>
                          <option value="health">🌿 Zdrowie naturalne</option>
                          <option value="retro">📺 Retro/Nostalgia</option>
                          <option value="diy">🔧 DIY/Majsterkowanie</option>
                        </select>
                        <button
                          onClick={handleFetchTrends}
                          disabled={loadingTrends}
                          style={{ ...buttonStyle, background: loadingTrends ? '#ccc' : '#DDA0DD' }}
                        >
                          {loadingTrends ? '⏳ Szukam...' : '🔮 Znajdź trendy'}
                        </button>
                      </div>

                      {trends.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                          {trends.map((trend, i) => (
                            <div
                              key={i}
                              style={{
                                background: '#fff',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderLeft: '4px solid #800080'
                              }}
                            >
                              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                                {trend.title}
                              </div>
                              <p style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
                                💡 {trend.why}
                              </p>
                              <p style={{ fontSize: '11px', color: '#800080', marginBottom: '8px' }}>
                                🎯 {trend.angle}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                  {trend.tags?.map((tag: string, j: number) => (
                                    <span key={j} style={{ fontSize: '9px', background: '#e0e0e0', padding: '2px 5px', borderRadius: '3px' }}>
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleUseTrendForArticle(trend)}
                                  style={{ ...buttonStyle, background: '#90EE90', fontSize: '10px', padding: '3px 8px' }}
                                >
                                  ✨ Napisz
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
                        🤖 AI analizuje aktualne trendy i sugeruje unikalne kąty na artykuły. Twoja perspektywa = oryginalność!
                      </p>
                    </fieldset>
                  </div>
                )}

                {/* NEWS TAB */}
                {activeTab === 'news' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      📰 Zarządzanie News ({newsList.length})
                    </h3>

                    {/* AI Generator */}
                    {showAiGenerator && (
                      <fieldset style={{ border: '2px groove #fff', padding: '15px', marginBottom: '15px', background: '#e6f3ff' }}>
                        <legend style={{ fontWeight: 'bold', color: '#000080' }}>🤖 Napisz z AI</legend>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>O czym chcesz napisać?</label>
                          <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="np. Najnowsze trendy w technologii retro, Jak zacząć przygodę z programowaniem, Wspomnienia z ery Windows 95..."
                            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                            disabled={generatingAi}
                          />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Styl artykułu:</label>
                          <select
                            value={aiStyle}
                            onChange={(e) => setAiStyle(e.target.value)}
                            style={{ ...inputStyle, height: '30px', width: 'auto' }}
                            disabled={generatingAi}
                          >
                            <option value="blog">📝 Blogowy (osobisty, angażujący)</option>
                            <option value="news">📰 Newsowy (profesjonalny, obiektywny)</option>
                            <option value="tech">💻 Techniczny (szczegółowy, branżowy)</option>
                            <option value="casual">😊 Luźny (przyjacielski, z humorem)</option>
                            <option value="retro">💾 Retro (nostalgiczny, lata 90)</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleGenerateWithAi}
                            disabled={generatingAi}
                            style={{ ...buttonStyle, background: generatingAi ? '#ccc' : '#90EE90' }}
                          >
                            {generatingAi ? '⏳ Generuję...' : '✨ Generuj artykuł'}
                          </button>
                          <button
                            onClick={() => { setShowAiGenerator(false); setAiPrompt(''); }}
                            disabled={generatingAi}
                            style={buttonStyle}
                          >
                            Anuluj
                          </button>
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                          💡 Tip: AI wygeneruje artykuł, który możesz potem edytować przed publikacją.
                        </p>
                      </fieldset>
                    )}

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

                      {/* AI Button */}
                      {!showAiGenerator && (
                        <button
                          type="button"
                          onClick={() => setShowAiGenerator(true)}
                          style={{ ...buttonStyle, background: '#e6f3ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          🤖 Napisz z AI
                        </button>
                      )}

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
                          {/* Formatting toolbar */}
                          <div style={{ display: 'flex', gap: '3px', marginBottom: '5px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => insertFormatting('h2')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px' }} title="Nagłówek sekcji">H2</button>
                            <button type="button" onClick={() => insertFormatting('h3')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px' }} title="Podtytuł">H3</button>
                            <button type="button" onClick={() => insertFormatting('bold')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px', fontWeight: 'bold' }} title="Pogrubienie">B</button>
                            <button type="button" onClick={() => insertFormatting('italic')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px', fontStyle: 'italic' }} title="Kursywa">I</button>
                            <button type="button" onClick={() => insertFormatting('list')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px' }} title="Lista punktowana">• Lista</button>
                            <button type="button" onClick={() => insertFormatting('link')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px' }} title="Link">🔗 Link</button>
                            <button type="button" onClick={() => insertFormatting('quote')} style={{ ...buttonStyle, padding: '3px 8px', fontSize: '11px' }} title="Cytat">„ Cytat</button>
                          </div>
                          <textarea
                            data-news-content="true"
                            value={newNews.content}
                            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                            style={{ ...inputStyle, height: '200px', fontFamily: 'monospace', fontSize: '13px' }}
                            placeholder="Pisz swój artykuł tutaj...&#10;&#10;Używaj Markdown:&#10;## Nagłówek sekcji&#10;### Podtytuł&#10;**pogrubienie**&#10;*kursywa*&#10;- lista&#10;> cytat"
                          />
                          <small style={{ color: '#666', display: 'block', marginTop: '3px' }}>
                            💡 Formatowanie: **pogrubienie**, *kursywa*, ## nagłówek, - lista, &gt; cytat, [link](url)
                          </small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" style={{ ...buttonStyle, background: '#90EE90' }}>📰 Opublikuj</button>
                          {newNews.title && (
                            <button
                              type="button"
                              onClick={() => setNewNews({ title: '', content: '', excerpt: '', image_url: '', author: 'Admin', category: 'Niesamowite Historie' })}
                              style={buttonStyle}
                            >
                              🗑️ Wyczyść
                            </button>
                          )}
                        </div>
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

                {/* ============= GALLERY TAB ============= */}
                {activeTab === 'gallery' && (
                  <>
                    <h3 style={{ margin: '0 0 15px', fontWeight: 'bold', fontSize: '16px' }}>📷 Moje Zdjecia (dla /photos)</h3>

                    {/* Add new photo form */}
                    <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '4px', marginBottom: '15px', border: '2px inset #808080' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>Dodaj nowe zdjecie (wklej link z S3):</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Tytul zdjecia"
                          value={newGalleryPhoto.title}
                          onChange={(e) => setNewGalleryPhoto({ ...newGalleryPhoto, title: e.target.value })}
                          style={{ padding: '8px', border: '2px inset #808080', fontFamily: 'Tahoma, sans-serif' }}
                        />
                        <input
                          type="text"
                          placeholder="URL zdjecia (np. https://s3.amazonaws.com/...)"
                          value={newGalleryPhoto.image_url}
                          onChange={(e) => setNewGalleryPhoto({ ...newGalleryPhoto, image_url: e.target.value })}
                          style={{ padding: '8px', border: '2px inset #808080', fontFamily: 'Tahoma, sans-serif' }}
                        />
                        <textarea
                          placeholder="Opis (opcjonalnie)"
                          value={newGalleryPhoto.description}
                          onChange={(e) => setNewGalleryPhoto({ ...newGalleryPhoto, description: e.target.value })}
                          style={{ padding: '8px', border: '2px inset #808080', fontFamily: 'Tahoma, sans-serif', minHeight: '60px' }}
                        />
                        <button
                          onClick={async () => {
                            if (!newGalleryPhoto.image_url) {
                              setMessage('Podaj URL zdjecia!');
                              return;
                            }
                            try {
                              const res = await fetch('/api/gallery-photos', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(newGalleryPhoto),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setMessage('Zdjecie dodane!');
                                setNewGalleryPhoto({ title: '', image_url: '', description: '' });
                                // Refresh list
                                const resGallery = await fetch('/api/gallery-photos');
                                const dataGallery = await resGallery.json();
                                setGalleryPhotos(dataGallery.photos || []);
                              } else {
                                setMessage('Blad: ' + (data.error || 'Nieznany blad'));
                              }
                            } catch (err) {
                              setMessage('Blad dodawania zdjecia');
                            }
                          }}
                          style={{ ...buttonStyle, background: '#90EE90' }}
                        >
                          ➕ Dodaj Zdjecie
                        </button>
                      </div>
                    </div>

                    {/* Photo list */}
                    <div style={{ background: '#fff', padding: '10px', border: '2px inset #808080' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>Twoje zdjecia ({galleryPhotos.length}):</h4>
                      {galleryPhotos.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Brak zdjec. Dodaj swoje pierwsze zdjecie!</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                          {galleryPhotos.map((photo: any) => (
                            <div key={photo.id} style={{ border: '2px outset #808080', padding: '5px', background: '#f0f0f0' }}>
                              <div style={{ width: '100%', height: '100px', background: '#ddd', overflow: 'hidden', marginBottom: '5px' }}>
                                {photo.image_url && (
                                  <img
                                    src={photo.image_url}
                                    alt={photo.title || 'Photo'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                )}
                              </div>
                              <p style={{ fontSize: '11px', margin: '0 0 5px', fontWeight: 'bold' }}>{photo.title || 'Bez tytulu'}</p>
                              <button
                                onClick={async () => {
                                  if (confirm('Na pewno usunac?')) {
                                    try {
                                      await fetch(`/api/gallery-photos?id=${photo.id}`, { method: 'DELETE' });
                                      setMessage('Zdjecie usuniete!');
                                      // Refresh
                                      const resGallery = await fetch('/api/gallery-photos');
                                      const dataGallery = await resGallery.json();
                                      setGalleryPhotos(dataGallery.photos || []);
                                    } catch (err) {
                                      setMessage('Blad usuwania');
                                    }
                                  }
                                }}
                                style={{ ...buttonStyle, background: '#ff6666', fontSize: '10px', padding: '3px 6px' }}
                              >
                                🗑️ Usun
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === '3d' && (
                  <>
                    <h3 style={{ margin: '0 0 10px', fontSize: '14px' }}>🧊 Dodaj Model 3D (S3 + Firebase)</h3>

                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={async () => {
                          setModels3dMessage('⏳ Pingowanie WebSub...');
                          try {
                            const res = await fetch('/api/websub', { method: 'POST' });
                            const data = await res.json();
                            setModels3dMessage(data.success ? '✅ WebSub: subskrybenci powiadomieni!' : `❌ WebSub: ${data.error}`);
                          } catch {
                            setModels3dMessage('❌ WebSub: błąd sieci');
                          }
                        }}
                        style={{ ...buttonStyle, background: '#6600cc', color: '#fff', padding: '5px 12px', fontSize: '11px' }}
                      >
                        📡 Ping WebSub (powiadom subskrybentów)
                      </button>
                      <button
                        onClick={async () => {
                          const lastModel = models3d[0];
                          if (!lastModel) { setModels3dMessage('❌ Nostr: brak modeli'); return; }
                          setModels3dMessage('⏳ Publikowanie na Nostr...');
                          try {
                            const res = await fetch('/api/nostr', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: lastModel.displayName || lastModel.title,
                                content: lastModel.userDescription || 'Nowy model 3D w aplikacji Vibe3D!',
                                url: 'https://kupmax.pl',
                              }),
                            });
                            const data = await res.json();
                            setModels3dMessage(data.success ? `✅ ${data.message}` : `❌ Nostr: ${data.error}`);
                          } catch {
                            setModels3dMessage('❌ Nostr: błąd sieci');
                          }
                        }}
                        style={{ ...buttonStyle, background: '#7c3aed', color: '#fff', padding: '5px 12px', fontSize: '11px' }}
                      >
                        🔮 Publikuj na Nostr
                      </button>
                      <a href="/api/rss" target="_blank" style={{ fontSize: '11px', color: '#0066cc' }}>🔗 Podgląd RSS</a>
                    </div>

                    {models3dMessage && (
                      <div style={{ padding: '8px 12px', marginBottom: '10px', background: models3dMessage.startsWith('✅') ? '#d4edda' : '#f8d7da', border: '1px solid', borderColor: models3dMessage.startsWith('✅') ? '#c3e6cb' : '#f5c6cb', borderRadius: '4px', fontSize: '12px' }}>
                        {models3dMessage}
                      </div>
                    )}

                    {/* Formularz upload */}
                    <div style={{ background: '#fff', border: '2px inset #808080', padding: '15px', marginBottom: '15px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>TYTUŁ *</label>
                          <input
                            type="text"
                            value={new3dModel.title}
                            onChange={(e) => setNew3dModel({ ...new3dModel, title: e.target.value })}
                            placeholder="np. Balon z podpisem"
                            style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>KATEGORIA VIBE3D</label>
                          <select
                            value={new3dModel.category}
                            onChange={(e) => setNew3dModel({ ...new3dModel, category: e.target.value })}
                            style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                          >
                            {VIBE3D_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>OPIS</label>
                        <input
                          type="text"
                          value={new3dModel.description}
                          onChange={(e) => setNew3dModel({ ...new3dModel, description: e.target.value })}
                          placeholder="Krótki opis modelu..."
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>LINK DO SKLEPU (opcjonalnie)</label>
                        <input
                          type="text"
                          value={new3dModel.shopUrl}
                          onChange={(e) => setNew3dModel({ ...new3dModel, shopUrl: e.target.value })}
                          placeholder="https://ai.kupmax.pl/product/..."
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>MUZYKA TŁA (URL mp3)</label>
                        <input
                          type="text"
                          value={new3dModel.backgroundMusicUrl}
                          onChange={(e) => setNew3dModel({ ...new3dModel, backgroundMusicUrl: e.target.value })}
                          placeholder="https://kupmax-downloads.s3...pl.mp3"
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>WIDEO / TELEDYSK (URL mp4 lub YouTube)</label>
                        <input
                          type="text"
                          value={new3dModel.embeddedVideoUrl}
                          onChange={(e) => setNew3dModel({ ...new3dModel, embeddedVideoUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=... lub URL mp4"
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>MINIATURKA (URL obrazka — thumbnailUrl)</label>
                        <input
                          type="text"
                          value={new3dModel.thumbnailUrl}
                          onChange={(e) => setNew3dModel({ ...new3dModel, thumbnailUrl: e.target.value })}
                          placeholder="https://... jpg/png miniaturka modelu"
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>GALERIA ZDJĘĆ (URLe oddzielone przecinkiem)</label>
                        <textarea
                          value={new3dModel.galleryImageUrls}
                          onChange={(e) => setNew3dModel({ ...new3dModel, galleryImageUrls: e.target.value })}
                          placeholder={'https://.../foto1.jpg, https://.../foto2.jpg'}
                          rows={3}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '2px inset #808080', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                        <span style={{ fontSize: '10px', color: '#666' }}>Wklej URLe do zdjęć modelu z różnych kątów, oddzielone przecinkami</span>
                      </div>
                      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="availableForDownload"
                          checked={new3dModel.availableForDownload}
                          onChange={(e) => setNew3dModel({ ...new3dModel, availableForDownload: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="availableForDownload" style={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Dostępny do pobrania na kupmax.pl/downloads
                        </label>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>PLIK GLB *</label>
                        <input
                          type="file"
                          accept=".glb,.gltf,.obj"
                          onChange={(e) => setSelected3dFile(e.target.files?.[0] || null)}
                          style={{ fontSize: '12px' }}
                        />
                        {selected3dFile && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                            {selected3dFile.name} ({(selected3dFile.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        )}
                      </div>

                      {uploading3d && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ background: '#e0e0e0', border: '2px inset #808080', height: '20px', borderRadius: '2px' }}>
                            <div style={{ background: '#0000ff', height: '100%', width: `${upload3dProgress}%`, transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>{upload3dProgress}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        disabled={!selected3dFile || !new3dModel.title || uploading3d}
                        onClick={async () => {
                          if (!selected3dFile || !new3dModel.title) return;
                          setUploading3d(true);
                          setUpload3dProgress(0);
                          setModels3dMessage('');
                          try {
                            let modelUrl = '';

                            if (new3dModel.availableForDownload) {
                              // === ŚCIEŻKA A: S3 publiczny (downloads/) — do pobrania przez wszystkich ===
                              setModels3dMessage('⏳ Upload na S3 (publiczny)...');

                              const presRes = await fetch('/api/downloads/presigned-url', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  fileName: selected3dFile.name,
                                  fileType: selected3dFile.type || 'model/gltf-binary',
                                  fileSize: selected3dFile.size,
                                }),
                              });
                              const presData = await presRes.json();
                              if (!presData.success) throw new Error(presData.error);

                              await new Promise<void>((resolve, reject) => {
                                const xhr = new XMLHttpRequest();
                                xhr.upload.addEventListener('progress', (e) => {
                                  if (e.lengthComputable) setUpload3dProgress(Math.round((e.loaded / e.total) * 100));
                                });
                                xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`S3 error ${xhr.status}`)));
                                xhr.addEventListener('error', () => reject(new Error('S3 upload failed')));
                                xhr.open('PUT', presData.uploadUrl);
                                xhr.setRequestHeader('Content-Type', selected3dFile.type || 'model/gltf-binary');
                                xhr.send(selected3dFile);
                              });

                              modelUrl = `https://kupmax-downloads.s3.eu-central-1.amazonaws.com/${presData.s3Key}`;

                              await fetch('/api/downloads/save-metadata', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  s3Key: presData.s3Key,
                                  fileName: selected3dFile.name,
                                  fileSize: selected3dFile.size,
                                  fileType: selected3dFile.type || 'model/gltf-binary',
                                  description: new3dModel.description,
                                  category: '3D Objects',
                                }),
                              });
                            } else {
                              // === ŚCIEŻKA B: Firebase Storage prywatny (models3d/) — tylko apka widzi ===
                              setModels3dMessage('⏳ Upload do Firebase Storage (prywatny)...');
                              setUpload3dProgress(20);

                              const formData = new FormData();
                              formData.append('file', selected3dFile);

                              const uploadRes = await fetch('/api/models3d/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              setUpload3dProgress(80);
                              const uploadData = await uploadRes.json();
                              if (!uploadData.success) throw new Error(uploadData.error);
                              modelUrl = uploadData.firebaseUrl;
                            }

                            // === WSPÓLNY KROK: metadata do Firestore ===
                            setModels3dMessage('⏳ Zapisuję do Firestore...');
                            const fbRes = await fetch('/api/models3d', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                modelUrl,
                                fileName: selected3dFile.name,
                                title: new3dModel.title,
                                description: new3dModel.description,
                                category: new3dModel.category,
                                shopUrl: new3dModel.shopUrl,
                                backgroundMusicUrl: new3dModel.backgroundMusicUrl,
                                embeddedVideoUrl: new3dModel.embeddedVideoUrl,
                                thumbnailUrl: new3dModel.thumbnailUrl,
                                galleryImageUrls: new3dModel.galleryImageUrls,
                                availableForDownload: new3dModel.availableForDownload,
                              }),
                            });
                            const fbData = await fbRes.json();
                            if (!fbData.success) throw new Error(fbData.error);

                            setUpload3dProgress(100);
                            const where = new3dModel.availableForDownload
                              ? 'S3 publiczny + /downloads'
                              : 'Firebase Storage prywatny';
                            setModels3dMessage(`✅ Dodano! (${where}) ID: ${fbData.firestoreId}`);
                            setNew3dModel({ title: '', description: '', category: 'Art', shopUrl: '', backgroundMusicUrl: '', embeddedVideoUrl: '', thumbnailUrl: '', galleryImageUrls: '', availableForDownload: false });
                            setSelected3dFile(null);
                            setUpload3dProgress(0);
                            const listRes = await fetch('/api/models3d');
                            const listData = await listRes.json();
                            if (listData.success) setModels3d(listData.models);
                          } catch (err: any) {
                            setModels3dMessage('❌ Błąd: ' + err.message);
                          } finally {
                            setUploading3d(false);
                          }
                        }}
                        style={{ ...buttonStyle, background: uploading3d ? '#999' : '#006600', color: '#fff', padding: '8px 20px', fontSize: '13px', cursor: !selected3dFile || !new3dModel.title || uploading3d ? 'not-allowed' : 'pointer' }}
                      >
                        {uploading3d ? `⏳ Uploading... ${upload3dProgress}%` : '🚀 Dodaj Model (S3 + Firebase)'}
                      </button>
                    </div>

                    {/* Modal edycji modelu */}
                    {editing3dModel && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#c0c0c0', border: '3px outset #fff', padding: '16px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
                          <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff', padding: '4px 8px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>✏️ Edytuj model</span>
                            <button onClick={() => setEditing3dModel(null)} style={{ background: '#c0c0c0', border: '2px outset #fff', cursor: 'pointer', padding: '0 6px', color: '#000' }}>✕</button>
                          </div>
                          {[
                            { label: 'Tytuł', key: 'title' },
                            { label: 'Opis', key: 'userDescription' },
                            { label: 'Model URL (.glb)', key: 'modelUrl' },
                            { label: 'Thumbnail URL', key: 'thumbnailUrl' },
                            { label: 'Shop URL', key: 'shopUrl' },
                            { label: 'Background Music URL', key: 'backgroundMusicUrl' },
                            { label: 'Video URL', key: 'embeddedVideoUrl' },
                          ].map(({ label, key }) => (
                            <div key={key} style={{ marginBottom: '8px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>{label}:</label>
                              <input
                                type="text"
                                value={editing3dModel[key] || ''}
                                onChange={(e) => setEditing3dModel({ ...editing3dModel, [key]: e.target.value })}
                                style={{ width: '100%', padding: '4px', border: '2px inset #808080', fontFamily: 'inherit', fontSize: '12px', boxSizing: 'border-box' as const }}
                              />
                            </div>
                          ))}
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>Kategoria:</label>
                            <select
                              value={editing3dModel.category || 'Art'}
                              onChange={(e) => setEditing3dModel({ ...editing3dModel, category: e.target.value })}
                              style={{ padding: '4px', border: '2px inset #808080', fontFamily: 'inherit', fontSize: '12px' }}
                            >
                              {VIBE3D_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setEditing3dModel(null)}
                              style={{ ...buttonStyle, padding: '6px 14px', fontSize: '12px' }}
                            >
                              Anuluj
                            </button>
                            <button
                              disabled={saving3dEdit}
                              onClick={async () => {
                                setSaving3dEdit(true);
                                try {
                                  const res = await fetch(`/api/models3d/${editing3dModel.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: editing3dModel.title,
                                      userDescription: editing3dModel.userDescription,
                                      category: editing3dModel.category,
                                      modelUrl: editing3dModel.modelUrl,
                                      shopUrl: editing3dModel.shopUrl,
                                      backgroundMusicUrl: editing3dModel.backgroundMusicUrl,
                                      embeddedVideoUrl: editing3dModel.embeddedVideoUrl,
                                      thumbnailUrl: editing3dModel.thumbnailUrl,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setModels3d(prev => prev.map(m => m.id === editing3dModel.id ? { ...m, ...editing3dModel } : m));
                                    setEditing3dModel(null);
                                    setModels3dMessage('✅ Model zaktualizowany!');
                                  } else {
                                    setModels3dMessage('❌ Błąd: ' + data.error);
                                  }
                                } catch {
                                  setModels3dMessage('❌ Błąd sieci');
                                } finally {
                                  setSaving3dEdit(false);
                                }
                              }}
                              style={{ ...buttonStyle, background: '#006600', color: '#fff', padding: '6px 14px', fontSize: '12px', cursor: saving3dEdit ? 'not-allowed' : 'pointer' }}
                            >
                              {saving3dEdit ? '⏳ Zapisuję...' : '💾 Zapisz'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista modeli */}
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px' }}>
                      Modele w Firebase ({models3d.length}):
                      {models3dLoading && ' ⏳'}
                    </h4>
                    {models3d.length === 0 && !models3dLoading && (
                      <p style={{ fontSize: '12px', color: '#666' }}>Brak modeli. Dodaj pierwszy!</p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {models3d.map((model: any) => (
                        <div key={model.id} style={{ background: '#fff', border: '2px solid #003399', padding: '8px', fontSize: '11px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🧊 {model.title || model.displayName}
                          </div>
                          <div style={{ color: '#666', marginBottom: '4px' }}>{model.category}</div>
                          <div style={{ color: '#999', marginBottom: '6px', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {model.modelUrl}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                            <button
                              onClick={() => navigator.clipboard.writeText(model.modelUrl).then(() => setModels3dMessage('✅ URL skopiowany!'))}
                              style={{ ...buttonStyle, fontSize: '10px', padding: '2px 6px' }}
                            >
                              📋 Kopiuj URL
                            </button>
                            <button
                              onClick={() => setEditing3dModel({ ...model, userDescription: model.userDescription || model.description || '' })}
                              style={{ ...buttonStyle, fontSize: '10px', padding: '2px 6px', background: '#003399', color: '#fff' }}
                            >
                              ✏️ Edytuj
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Usunąć model "${model.title || model.displayName}"?`)) return;
                                try {
                                  const res = await fetch(`/api/models3d/${model.id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    setModels3d(prev => prev.filter(m => m.id !== model.id));
                                    setModels3dMessage('✅ Model usunięty!');
                                  } else {
                                    setModels3dMessage('❌ Błąd: ' + data.error);
                                  }
                                } catch {
                                  setModels3dMessage('❌ Błąd sieci');
                                }
                              }}
                              style={{ ...buttonStyle, fontSize: '10px', padding: '2px 6px', background: '#cc0000', color: '#fff' }}
                            >
                              🗑️ Usuń
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'media' && (
                  <MediaTab />
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
