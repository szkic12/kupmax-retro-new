'use client';

import { useEffect, useState, useCallback } from 'react';

interface WelcomeVideo {
  id: string;
  uid: string;
  userNickname: string;
  userAvatar: string;
  videoUrl: string;
  status: string;
  scenario: string;
  comments: Array<{ author: string; text: string }>;
  modelId: string;
  chosenProvider?: string;
  usedProvider?: string;
  createdAt: string | null;
  completedAt: string | null;
  isGuest: boolean;
}

interface Stats {
  dailyMax: number;
  currentDay: string;
  count: number;
  totalCount: number;
  falCount: number;
  replicateCount: number;
  paused: boolean;
  forceProvider: string | null;
  estimatedCostUSD: number;
  estimatedCostTodayUSD: number;
}

interface MatrixStats {
  dailyMax: number;
  currentDay: string;
  count: number;
  totalCount: number;
  paused: boolean;
  estimatedCostTodayUSD: number;
  estimatedCostTotalUSD: number;
}

type ProviderFilter = 'all' | 'fal' | 'replicate';
type UserFilter = 'all' | 'users' | 'guests';

export default function Vibe3DAdminTab() {
  const [videos, setVideos] = useState<WelcomeVideo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [matrixStats, setMatrixStats] = useState<MatrixStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<WelcomeVideo | null>(null);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [savingBudget, setSavingBudget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vibe3d-admin', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
        setStats(data.stats);
        setMatrixStats(data.matrixStats || null);
      } else {
        setError(data.error || 'Load failed');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateBudget = async (patch: Partial<Pick<Stats, 'dailyMax' | 'paused' | 'forceProvider'>>) => {
    setSavingBudget(true);
    try {
      const res = await fetch('/api/vibe3d-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateBudget', ...patch }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
      } else {
        alert('Update failed: ' + (data.error || 'unknown'));
      }
    } finally {
      setSavingBudget(false);
    }
  };

  const updateMatrixBudget = async (patch: Partial<Pick<MatrixStats, 'dailyMax' | 'paused'>>) => {
    setSavingBudget(true);
    try {
      const res = await fetch('/api/vibe3d-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateMatrix3DBudget', ...patch }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
      } else {
        alert('Matrix budget update failed: ' + (data.error || 'unknown'));
      }
    } finally {
      setSavingBudget(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Usunąć to wideo permanentnie?')) return;
    const res = await fetch('/api/vibe3d-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteVideo', videoId: id }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedVideo(null);
      await load();
    } else {
      alert('Delete failed: ' + (data.error || 'unknown'));
    }
  };

  const filtered = videos.filter((v) => {
    if (userFilter === 'users' && v.isGuest) return false;
    if (userFilter === 'guests' && !v.isGuest) return false;
    if (providerFilter === 'fal' && v.usedProvider !== 'fal') return false;
    if (providerFilter === 'replicate' && v.usedProvider !== 'replicate') return false;
    return true;
  });

  if (loading) {
    return <div style={{ padding: 20 }}>⏳ Ładowanie Vibe3D…</div>;
  }
  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>❌ Błąd: {error}</div>;
  }

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginTop: 0, color: '#000080' }}>✨ Vibe3D Admin Panel</h2>

      {/* === STATS PANEL === */}
      {stats && (
        <div
          style={{
            background: '#fff',
            border: '2px inset #808080',
            padding: 12,
            marginBottom: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          <StatCard
            label="Dzisiaj"
            value={`${stats.count} / ${stats.dailyMax}`}
            sub={`$${stats.estimatedCostTodayUSD.toFixed(2)}`}
            color={stats.count >= stats.dailyMax * 0.8 ? '#c00' : '#000080'}
          />
          <StatCard label="Total video" value={String(stats.totalCount)} sub="lifetime" />
          <StatCard
            label="fal"
            value={String(stats.falCount)}
            sub={`$${(stats.falCount * 0.2).toFixed(2)}`}
            color="#0066cc"
          />
          <StatCard
            label="Replicate"
            value={String(stats.replicateCount)}
            sub={`$${(stats.replicateCount * 0.15).toFixed(2)}`}
            color="#cc6600"
          />
          <StatCard
            label="Razem koszt"
            value={`$${stats.estimatedCostUSD.toFixed(2)}`}
            sub="szacunek"
            color="#008000"
          />
        </div>
      )}

      {/* === KILL SWITCHES === */}
      {stats && (
        <div
          style={{
            background: '#ffe',
            border: '2px inset #808080',
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>🚨 Kill Switches</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <label>
              Daily max:{' '}
              <input
                type="number"
                defaultValue={stats.dailyMax}
                min={0}
                max={10000}
                disabled={savingBudget}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v !== stats.dailyMax) updateBudget({ dailyMax: v });
                }}
                style={{ width: 80 }}
              />
            </label>
            <button
              disabled={savingBudget}
              onClick={() => updateBudget({ paused: !stats.paused })}
              style={{
                padding: '6px 14px',
                background: stats.paused ? '#c00' : '#080',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {stats.paused ? '⏸ ZATRZYMANE (kliknij żeby wznowić)' : '▶ AKTYWNE (kliknij żeby zatrzymać)'}
            </button>
            <label>
              Force provider:{' '}
              <select
                value={stats.forceProvider || ''}
                disabled={savingBudget}
                onChange={(e) =>
                  updateBudget({
                    forceProvider: (e.target.value === '' ? null : e.target.value) as 'fal' | 'replicate' | null,
                  })
                }
              >
                <option value="">auto (round-robin)</option>
                <option value="fal">fal only</option>
                <option value="replicate">replicate only</option>
              </select>
            </label>
            <button onClick={load} style={{ padding: '6px 12px' }}>🔄 Odśwież</button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>
            Dzień: <strong>{stats.currentDay}</strong> · {stats.count >= stats.dailyMax * 0.8 && (
              <span style={{ color: '#c00', fontWeight: 'bold' }}>⚠ Bliski limitu!</span>
            )}
          </p>
        </div>
      )}

      {/* === MATRIX 3D BUDGET === */}
      {matrixStats && (
        <div
          style={{
            border: '2px solid #ff69b4',
            background: '#fff0f8',
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: '0 0 8px', color: '#a0185c' }}>
            🪞 Matrix Room — Image-to-3D (fal Trellis)
          </h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              Dziś: <strong>{matrixStats.count} / {matrixStats.dailyMax}</strong>{' '}
              <span style={{ color: matrixStats.count >= matrixStats.dailyMax * 0.8 ? '#c00' : '#888' }}>
                (${matrixStats.estimatedCostTodayUSD.toFixed(2)})
              </span>
            </div>
            <div>
              Total: <strong>{matrixStats.totalCount}</strong>{' '}
              <span style={{ color: '#888' }}>(${matrixStats.estimatedCostTotalUSD.toFixed(2)} lifetime)</span>
            </div>
            <label>
              Daily max:{' '}
              <input
                type="number"
                min={0}
                max={10000}
                defaultValue={matrixStats.dailyMax}
                disabled={savingBudget}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v !== matrixStats.dailyMax) updateMatrixBudget({ dailyMax: v });
                }}
                style={{ width: 80 }}
              />
            </label>
            <button
              disabled={savingBudget}
              onClick={() => updateMatrixBudget({ paused: !matrixStats.paused })}
              style={{
                padding: '6px 14px',
                background: matrixStats.paused ? '#c00' : '#080',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {matrixStats.paused ? '⏸ ZATRZYMANE (kliknij żeby wznowić)' : '▶ AKTYWNE (kliknij żeby zatrzymać)'}
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>
            ~$0.12/duet. Limit chroni przed wybuchem rachunku. Dzień:{' '}
            <strong>{matrixStats.currentDay || '(brak — pierwszy duet dzisiaj)'}</strong>
          </p>
        </div>
      )}

      {/* === FILTERS === */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <strong>Filtruj:</strong>
        <label>
          Użytkownik:{' '}
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value as UserFilter)}>
            <option value="all">wszystko</option>
            <option value="users">tylko zalogowani</option>
            <option value="guests">tylko goście</option>
          </select>
        </label>
        <label>
          Provider:{' '}
          <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}>
            <option value="all">wszystko</option>
            <option value="fal">fal</option>
            <option value="replicate">replicate</option>
          </select>
        </label>
        <span style={{ marginLeft: 'auto', fontSize: 12 }}>
          {filtered.length} / {videos.length} video
        </span>
      </div>

      {/* === VIDEO GRID === */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {filtered.map((v) => (
          <VideoTile key={v.id} video={v} onClick={() => setSelectedVideo(v)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 30, color: '#666' }}>
            Brak video w tym filtrze.
          </div>
        )}
      </div>

      {/* === DETAIL MODAL === */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={() => deleteVideo(selectedVideo.id)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      style={{
        padding: 10,
        background: '#f0f0f0',
        border: '1px solid #ccc',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color: color || '#000', margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888' }}>{sub}</div>}
    </div>
  );
}

function VideoTile({ video, onClick }: { video: WelcomeVideo; onClick: () => void }) {
  const date = video.createdAt ? new Date(video.createdAt).toLocaleString('pl-PL') : '?';
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: '#fff',
        border: '2px outset #c0c0c0',
        padding: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {video.userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.userAvatar}
            alt=""
            width={28}
            height={28}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#888',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {video.userNickname.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
            {video.userNickname}
          </div>
          <div style={{ fontSize: 10, color: video.isGuest ? '#cc6600' : '#080' }}>
            {video.isGuest ? '👤 guest' : '✓ user'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#444', marginBottom: 4 }}>
        Status: <strong>{video.status}</strong> · {video.usedProvider || '?'}
      </div>
      <div style={{ fontSize: 10, color: '#888' }}>{date}</div>
    </div>
  );
}

function VideoDetailModal({
  video,
  onClose,
  onDelete,
}: {
  video: WelcomeVideo;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px outset #c0c0c0',
          padding: 16,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>🎬 {video.userNickname} {video.isGuest ? '👤' : '✓'}</h3>
          <button onClick={onClose} style={{ padding: '4px 12px' }}>✖ Zamknij</button>
        </div>
        {video.videoUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={video.videoUrl} controls style={{ width: '100%', maxHeight: 400, background: '#000' }} />
        )}
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <p><strong>UID:</strong> <code>{video.uid}</code></p>
          <p><strong>Provider:</strong> chosen={video.chosenProvider || '?'} → used={video.usedProvider || '?'}</p>
          <p><strong>Status:</strong> {video.status}</p>
          <p><strong>Utworzono:</strong> {video.createdAt ? new Date(video.createdAt).toLocaleString('pl-PL') : '?'}</p>
          <p><strong>Skończono:</strong> {video.completedAt ? new Date(video.completedAt).toLocaleString('pl-PL') : '—'}</p>
          <p><strong>Scenariusz:</strong></p>
          <pre style={{ background: '#f4f4f4', padding: 8, fontSize: 11, whiteSpace: 'pre-wrap' }}>
            {video.scenario}
          </pre>
          <p><strong>Komentarze z onboardingu ({video.comments.length}):</strong></p>
          <ul style={{ fontSize: 12, paddingLeft: 18 }}>
            {video.comments.map((c, i) => (
              <li key={i}>
                <strong>[{c.author}]</strong> {c.text}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onDelete}
            style={{
              padding: '8px 16px',
              background: '#c00',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🗑 Usuń wideo
          </button>
        </div>
      </div>
    </div>
  );
}
