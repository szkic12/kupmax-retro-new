'use client';
// Karta wiedzy (K8): jedna rzecz, 4 szuflady. Kawałki trafiają tu same z odpowiedzi na forum,
// a każdy zalogowany może dorzucić swoją wiedzę tekstem, głosem albo zdjęciem. Pusta szuflada = zaproszenie.
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ForumAuth from '@/components/Forum/ForumAuth';
import VoiceRecorder, { voicePayload } from '@/components/Forum/VoiceRecorder';
import VoicePlayer from '@/components/Forum/VoicePlayer';
import PhotoPicker from '@/components/Forum/PhotoPicker';
import PhotoGallery from '@/components/Forum/PhotoGallery';
import ReportButton from '@/components/Forum/ReportButton';
import { ClaimRow, ClaimStyles } from '@/components/Forum/Claims';
import { forumFetch, useForumMe } from '@/lib/forum-client';

const DRAWERS = [
  ['rozpoznac', '👁️', 'Jak rozpoznać', 'Po czym poznać'],
  ['gdzie', '📍', 'Gdzie znaleźć', 'Gdzie znaleźć albo kupić'],
  ['uzyc', '🔨', 'Jak użyć', 'Jak użyć'],
  ['pulapki', '⚠️', 'Pułapki', 'Na co uważać przy'],
];

// Karta wiedzy. initial = karta wyrenderowana na serwerze (Google widzi szuflady od razu).
export default function CardView({ initial }) {
  const { slug } = useParams();
  const me = useForumMe();
  const [data, setData] = useState(initial || null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(null); // szuflada, do której ktoś dorzuca

  const load = async () => {
    try {
      const res = await forumFetch(`/api/forum/cards?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error || 'Nie ma takiej karty.');
    } catch {
      setError('Błąd ładowania karty.');
    }
  };
  useEffect(() => { load(); }, [slug, me.profile?.user_id]);

  const onVoted = (c) => setData((d) => ({
    ...d,
    drawers: Object.fromEntries(Object.entries(d.drawers).map(([k, list]) => [k, list.map((x) => (x.id === c.id ? { ...x, ...c } : x))])),
  }));

  const name = data?.card?.name || '';
  const total = data ? Object.values(data.drawers).reduce((n, l) => n + l.length, 0) : 0;

  return (
    <div className="card-page">
      <div className="window">
        <div className="title-bar"><span>🗂️ {name || 'Karta wiedzy'}</span><Link href="/forum/karty" className="close-btn">✕</Link></div>
        <div className="content">
          <p className="crumbs"><Link href="/forum">💬 Forum</Link> › <Link href="/forum/karty">🗂️ Karty wiedzy</Link></p>
          {error && <p className="err">⚠️ {error}</p>}
          {!data && !error && <p>⏳ Ładowanie…</p>}
          {data && (
            <>
              <h1>{name.charAt(0).toUpperCase() + name.slice(1)}</h1>
              <p className="lead">
                Wiedza z forum o tym, czym jest <b>{name}</b>, zebrana w 4 szufladach. Kawałki trafiają tu same z odpowiedzi
                (szufladę wybiera AI), a każdy może je ocenić albo dorzucić swoje. Najlepiej ocenione są na górze.
              </p>
              {DRAWERS.map(([id, icon, label, ask]) => {
                const items = data.drawers[id] || [];
                return (
                  <section key={id} className={`drawer${items.length ? '' : ' empty'}`}>
                    <h2>{icon} {label} <small>({items.length})</small></h2>
                    {items.length === 0 && (
                      <p className="hole">🕳️ Pusto. Wiesz, {ask.toLowerCase()} {name}? Dorzuć, przyda się innym.</p>
                    )}
                    <ul className="cl-list">
                      {items.map((c) => (
                        <ClaimRow key={c.id} claim={c} me={me} onVoted={onVoted} showAuthor>
                          {c.voiceUrl && <VoicePlayer url={c.voiceUrl} mode={c.voiceMode} seconds={c.voiceSeconds} />}
                          {c.photos?.length > 0 && <PhotoGallery photos={c.photos} />}
                          <div className="src">
                            {c.source
                              ? <Link href={`/forum/thread/${c.source.threadId}`}>z wątku: {c.source.title}</Link>
                              : <span>dorzucone na kartę</span>}
                            {c.direct && <ReportButton targetType="claim" targetId={c.id} email={me.email} />}
                          </div>
                        </ClaimRow>
                      ))}
                    </ul>
                    {adding === id
                      ? <AddForm slug={slug} drawer={id} label={`${icon} ${label}`} name={name} me={me} onDone={() => { setAdding(null); load(); }} onCancel={() => setAdding(null)} />
                      : <button type="button" className="btn-add" onClick={() => setAdding(id)}>➕ Dorzuć do „{label}”</button>}
                  </section>
                );
              })}
              {total > 0 && <p className="note">Kawałki z wątków wycięło z odpowiedzi AI, a podpis wskazuje autora. Liczy się zawsze oryginalny wpis w wątku.</p>}
            </>
          )}
        </div>
      </div>
      <ClaimStyles />
      <style jsx global>{`
        .card-page { min-height: 100vh; background: #008080; padding: 20px 12px; font-family: 'MS Sans Serif', Tahoma, sans-serif; }
        .card-page .window { max-width: 900px; margin: 0 auto; background: #c0c0c0; border: 3px outset #fff; }
        .card-page .title-bar { background: linear-gradient(90deg, #000080 0%, #1084d0 100%); color: #fff; padding: 4px 8px; font-weight: bold; display: flex; justify-content: space-between; }
        .card-page .close-btn { color: #fff; text-decoration: none; }
        .card-page .content { padding: 16px; background: #fff; margin: 4px; }
        .card-page .crumbs { font-size: 13px; margin: 0 0 8px; }
        .card-page h1 { margin: 4px 0 6px; font-size: 26px; color: #000080; }
        .card-page .lead, .card-page .note { font-size: 13px; color: #444; line-height: 1.45; }
        .card-page .drawer { border: 2px groove #ddd; padding: 10px; margin: 14px 0; background: #fbfbfb; }
        .card-page .drawer.empty { background: #fffdf0; border-style: dashed; }
        .card-page .drawer h2 { margin: 0 0 6px; font-size: 17px; }
        .card-page .drawer h2 small { color: #777; font-weight: normal; }
        .card-page .hole { font-size: 14px; color: #6a5a00; margin: 4px 0 8px; }
        .card-page .src { display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap; font-size: 12px; color: #666; margin-top: 4px; }
        .card-page .btn-add { margin-top: 8px; padding: 6px 12px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 13px; color: #000; }
        .card-page .err { color: #c00; }
      `}</style>
    </div>
  );
}

function AddForm({ slug, drawer, label, name, me, onDone, onCancel }) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState({ mode: 'wlasny', key: null, seconds: null });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const addSpoken = (t) => setText((x) => (x ? `${x}\n\n${t}` : t));

  if (!me.profile) return <div className="add-form"><ForumAuth me={me} why="dorzucić wiedzę" /></div>;

  const send = async (e) => {
    e.preventDefault();
    setErr('');
    if (text.trim().length < 10) return setErr('Napisz albo powiedz trochę więcej.');
    setBusy(true);
    try {
      let recaptchaToken = '';
      try {
        const { getRecaptchaToken } = await import('@/lib/recaptcha-client');
        recaptchaToken = await getRecaptchaToken('forum_card');
      } catch { /* serwer odpowie komunikatem */ }
      const res = await forumFetch('/api/forum/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, drawer, message: text, photos: photos.map((p) => p.key), recaptchaToken, ...voicePayload(voice) }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) onDone();
      else setErr(json.error || 'Nie wyszło.');
    } catch {
      setErr('Błąd sieci.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-form" onSubmit={send}>
      <h3>Dorzucasz do „{label}”: {name}</h3>
      <VoiceRecorder voice={voice} onChange={setVoice} onText={addSpoken} />
      <textarea rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Co wiesz? Konkretnie, z własnego doświadczenia." />
      <PhotoPicker photos={photos} onChange={setPhotos} />
      <p className="add-info">AI potnie wpis na kawałki do oceny. Jeśli nie znajdzie w nim konkretu o tej rzeczy, poprosi o więcej.</p>
      {err && <p className="add-err">⚠️ {err}</p>}
      <div className="add-actions">
        <button type="submit" disabled={busy}>{busy ? '⏳ AI czyta…' : '📨 Dorzuć'}</button>
        <button type="button" onClick={onCancel}>Anuluj</button>
      </div>
      <style jsx>{`
        .add-form { margin-top: 10px; padding: 10px; background: #f0f0f0; border: 2px inset #fff; display: flex; flex-direction: column; gap: 8px; }
        h3 { margin: 0; font-size: 15px; }
        textarea { width: 100%; box-sizing: border-box; padding: 6px; font-size: 14px; border: 2px inset #fff; }
        .add-info { font-size: 12px; color: #555; margin: 0; }
        .add-err { color: #c00; margin: 0; font-size: 13px; }
        .add-actions { display: flex; gap: 8px; }
        .add-actions button { padding: 6px 14px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; color: #000; }
      `}</style>
    </form>
  );
}
