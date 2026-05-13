import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { firestore } from '@/lib/firebase-admin';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kupmax.vibe3d';
const SITE_URL = 'https://kupmax.pl';

interface ModelData {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  shopUrl: string;
  uploaderName: string;
  funnyVotes: number;
  whatIsItVotes: number;
  commentsCount: number;
  createdAt: string | null;
}

async function getModel(id: string): Promise<ModelData | null> {
  try {
    const doc = await firestore.collection('models3D').doc(id).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return {
      id: doc.id,
      title: d.displayName || d.title || 'Model 3D',
      description: d.userDescription || '',
      category: d.category || '',
      thumbnailUrl: d.thumbnailUrl || '',
      shopUrl: d.shopUrl || '',
      uploaderName: d.uploaderName || 'KupMax',
      funnyVotes: d.funnyVotes || 0,
      whatIsItVotes: d.whatIsItVotes || 0,
      commentsCount: d.commentsCount || 0,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const model = await getModel(id);
  if (!model) return { title: 'Model nie znaleziony — KupMax' };

  return {
    title: `${model.title} — Vibe3D / KupMax`,
    description: model.description || `Model 3D w kategorii ${model.category}. Pobierz aplikację Vibe3D i oglądaj w AR!`,
    alternates: {
      canonical: `${SITE_URL}/vibe3d/${model.id}`,
    },
    openGraph: {
      title: model.title,
      description: model.description || 'Model 3D dostępny w aplikacji Vibe3D',
      images: model.thumbnailUrl ? [{ url: model.thumbnailUrl }] : [],
      url: `${SITE_URL}/vibe3d/${model.id}`,
      type: 'article',
      publishedTime: model.createdAt || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: model.title,
      description: model.description || 'Model 3D w Vibe3D',
      images: model.thumbnailUrl ? [model.thumbnailUrl] : [],
    },
  };
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = await getModel(id);
  if (!model) notFound();

  const date = model.createdAt
    ? new Date(model.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nagłówek */}
      <header style={{ background: '#111', borderBottom: '1px solid #222', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none' }}>KupMax</a>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ color: '#888', fontSize: '14px' }}>Vibe3D</span>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Miniatura */}
        {model.thumbnailUrl ? (
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', background: '#111', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={model.thumbnailUrl}
              alt={model.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ borderRadius: '16px', marginBottom: '32px', background: '#111', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
            🧊
          </div>
        )}

        {/* Kategoria */}
        {model.category && (
          <span style={{ background: '#00ff8822', color: '#00ff88', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {model.category}
          </span>
        )}

        {/* Tytuł */}
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '16px 0 8px', lineHeight: 1.2 }}>
          {model.title}
        </h1>

        {/* Meta */}
        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 24px' }}>
          Dodał: {model.uploaderName}{date ? ` · ${date}` : ''}
        </p>

        {/* Opis */}
        {model.description && (
          <p style={{ color: '#aaa', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
            {model.description}
          </p>
        )}

        {/* Statystyki */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', padding: '16px', background: '#111', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{model.funnyVotes}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>😄 Śmieszne</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{model.whatIsItVotes}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>🤔 Co to jest?</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a78bfa' }}>{model.commentsCount}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>💬 Komentarze</div>
          </div>
        </div>

        {/* CTA — pobierz apkę */}
        <div style={{ background: 'linear-gradient(135deg, #00ff8811, #0066ff11)', border: '1px solid #00ff8833', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
            Oglądaj model w 3D i AR
          </h2>
          <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
            Pobierz aplikację Vibe3D na Androida i obracaj model w rękach lub umieść go w swoim pokoju przez AR.
          </p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: '#00ff88', color: '#000', fontWeight: 'bold', padding: '14px 32px', borderRadius: '50px', fontSize: '16px', textDecoration: 'none' }}
          >
            ▶ Pobierz Vibe3D (Android)
          </a>
          {model.shopUrl && (
            <div style={{ marginTop: '16px' }}>
              <a
                href={model.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00ff88', fontSize: '14px' }}
              >
                🛒 Kup oryginał →
              </a>
            </div>
          )}
        </div>

        {/* Link do RSS */}
        <div style={{ textAlign: 'center', padding: '16px', color: '#555', fontSize: '13px' }}>
          <a href="/api/rss" style={{ color: '#555' }}>📡 Subskrybuj RSS</a>
          {' · '}
          <a href="/" style={{ color: '#555' }}>kupmax.pl</a>
        </div>

      </main>
    </div>
  );
}
