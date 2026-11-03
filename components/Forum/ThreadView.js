'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ForumAuth from '@/components/Forum/ForumAuth';
import VoiceRecorder, { voicePayload } from '@/components/Forum/VoiceRecorder';
import VoicePlayer from '@/components/Forum/VoicePlayer';
import PhotoPicker from '@/components/Forum/PhotoPicker';
import PhotoGallery from '@/components/Forum/PhotoGallery';
import ModelPicker from '@/components/Forum/ModelPicker';
import ModelView from '@/components/Forum/Model3D';
import ReportButton from '@/components/Forum/ReportButton';
import { ClaimList, FullAnswer, leafOf } from '@/components/Forum/Claims';
import CardText from '@/components/Forum/CardText';
import Fachowcy from '@/components/Forum/Fachowcy';
import { forumFetch, useForumMe } from '@/lib/forum-client';

// Poprawianie własnego wpisu (tytuł tylko przy wątku)
function EditBox({ title, message, onSave, onCancel }) {
  const [t, setT] = useState(title || '');
  const [m, setM] = useState(message || '');
  const [voice, setVoice] = useState({ mode: 'wlasny', key: null, seconds: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    setBusy(true); setErr('');
    // Nowe nagranie zastępuje stare; bez nowego nagrania głos zostaje ten sam
    const e = await onSave(t, m, voice.key || voice.mode === 'lektor' ? voicePayload(voice) : null);
    setBusy(false);
    if (e) setErr(e);
  };
  return (
    <div className="edit-box">
      <b>🎤 Nagraj jeszcze raz (zastąpi stare nagranie i tekst)</b>
      <VoiceRecorder voice={voice} onChange={setVoice} onText={(x) => setM(x)} />
      {title !== undefined && <input value={t} onChange={(e) => setT(e.target.value)} maxLength={100} placeholder="Tytuł" />}
      <textarea rows={6} value={m} onChange={(e) => setM(e.target.value)} maxLength={12000} />
      {err && <p className="edit-err">⚠️ {err}</p>}
      <div className="edit-actions">
        <button type="button" onClick={save} disabled={busy}>{busy ? '⏳' : '💾 Zapisz poprawkę'}</button>
        <button type="button" onClick={onCancel}>Anuluj</button>
      </div>
      <small>Możesz nagrać od nowa albo tylko poprawić tekst. Kawałki tego wpisu AI rozbierze od nowa.</small>
    </div>
  );
}

// Zasada Brata: „potwierdzone” dopiero po 3 zgodnych fachowcach. Z datą, bo wiedza się starzeje, i z „sprawdź u” (tylko za zgodą).
const MIESIACE = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
function Potwierdzenie({ experts: e }) {
  if (!e) return null;
  const d = e.kiedy ? new Date(e.kiedy) : null;
  const kiedy = d ? `${MIESIACE[d.getMonth()]} ${d.getFullYear()}` : '';
  const sprawdz = e.sprawdzU?.length > 0 && (
    <ul className="pw-lista">
      {e.sprawdzU.map((x, i) => <li key={i}>📞 {x.label}{x.odRoku ? `, w branży od ${x.odRoku}` : ''}</li>)}
    </ul>
  );
  if (e.werdykt === 'tak') {
    return (
      <div className={`pw-box ok${e.przeterminowane ? ' stary' : ''}`}>
        <b>✅ Potwierdzone przez {e.tak.length} fachowców · {kiedy}</b>
        <p>
          {e.przeterminowane
            ? `Tak było w ${d.getFullYear()}. Od tamtej pory mogło się zmienić, więc dzwonimy do fachowców jeszcze raz.`
            : `Fachowcy z wieloletnim doświadczeniem niezależnie potwierdzili odpowiedź. Tak było w ${d.getFullYear()}; jeśli czytasz to później, sprawdź u nich, czy coś się nie zmieniło.`}
        </p>
        {sprawdz}
      </div>
    );
  }
  if (e.werdykt === 'nie') {
    return (
      <div className="pw-box zle">
        <b>❌ {e.nie.length} fachowców mówi: odpowiedź AI jest zła · {kiedy}</b>
        <p>Nie rób tak, jak napisało AI. Co mówią fachowcy, przeczytasz w odpowiedziach z 📞 poniżej.</p>
        {sprawdz}
      </div>
    );
  }
  return (
    <div className="pw-box wtoku">
      <b>📞 W trakcie sprawdzania u fachowców: {Math.max(e.tak.length, e.nie.length)}/3</b>
      <p>Odpowiedź uznamy za pewną dopiero, gdy co najmniej 3 fachowców niezależnie powie to samo.</p>
    </div>
  );
}

// Strona wątku. initial = treść wyrenderowana na serwerze (Google widzi pytanie i odpowiedzi od razu).
export default function ThreadView({ initial }) {
  const params = useParams();
  const threadId = params.id;
  const me = useForumMe();

  const [thread, setThread] = useState(initial?.thread || null);
  const [posts, setPosts] = useState(initial?.posts || []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState('');

  // Reply form
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyData, setReplyData] = useState({
    message: ''
  });
  const [voice, setVoice] = useState({ mode: 'wlasny', key: null, seconds: null });
  const [photos, setPhotos] = useState([]);
  const [model, setModel] = useState(null);
  const [correcting, setCorrecting] = useState(null); // { id, n }: poprawka odpowiedzi AI
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const aiRunning = useRef(false);
  const [editing, setEditing] = useState(null); // 'thread' albo id odpowiedzi, którą autor poprawia
  const saveEdit = async (payload) => {
    const res = await forumFetch('/api/forum/edycja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    if (!json.success) return json.error || 'Nie udało się zapisać.';
    setEditing(null);
    // Od razu na ekranie (pełne odświeżenie dojdzie zaraz)
    const teraz = new Date().toISOString();
    if (payload.threadId) setThread((t) => ({ ...t, title: payload.title, message: payload.message, editedAt: teraz }));
    else setPosts((ps) => ps.map((x) => (x.id === payload.postId ? { ...x, message: payload.message, editedAt: teraz, claims: [] } : x)));
    aiAuto.current = 0; // poprawiona odpowiedź zostanie rozebrana od nowa
    fetchThread();
    return null;
  };
  const aiAuto = useRef(0); // ile razy strona sama zawołała AI (bezpiecznik przed pętlą)
  const [claimVotes, setClaimVotes] = useState({}); // świeże oceny twierdzeń po kliknięciu
  const getClaim = (c) => claimVotes[c.id] || c;
  const cardOf = (id) => (id && thread?.cards?.find((c) => c.id === id)) || null;
  const onVoted = (c) => setClaimVotes((v) => ({ ...v, [c.id]: c }));
  const formRef = useRef(null);
  const addSpoken = (text) => setReplyData((r) => ({ ...r, message: r.message ? `${r.message}\n\n${text}` : text }));

  useEffect(() => {
    document.body.style.overflow = 'auto';
    fetchThread();
    fetchCategories();
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [threadId, me.profile?.adult_confirmed_at]);

  const fetchThread = async () => {
    try {
      const response = await forumFetch(`/api/forum/posts?threadId=${threadId}`);
      const data = await response.json();

      if (data.success) {
        setThread(data.thread);
        setPosts(data.posts);
        // Coś czeka na AI (nowy wątek, odpowiedź autora, poprawka do oceny): uruchom
        setClaimVotes({});
        const pending = data.thread.aiWait || data.thread.claimsWait || data.posts.some((p) => ['czeka', 'sprawdza'].includes(p.correctionStatus));
        if (pending && aiAuto.current < 3) { aiAuto.current += 1; runAi(false); }
      } else if (data.removed) {
        setError(`Wątek „${data.title}” usunęła moderacja. Powód: ${data.reason || 'złamanie zasad forum'}`);
      } else {
        setError(data.error || 'Nie znaleziono wątku');
      }
    } catch (err) {
      setError('Błąd ładowania wątku');
    } finally {
      setLoading(false);
    }
  };

  // AI w wątku: wykonuje to, co czeka, albo (ask) odpowiada na prośbę „czego brakuje”
  const runAi = async (ask) => {
    if (aiRunning.current) return;
    aiRunning.current = true;
    setAiBusy(true);
    setAiMsg('');
    try {
      const res = await forumFetch('/api/forum/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, ask }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) setAiMsg(json.error || 'AI chwilowo nie odpowiada.');
      else if (json.nothingToAdd) setAiMsg('🤖 AI przeczytało odpowiedzi i nie ma nic do dodania.');
    } catch {
      setAiMsg('AI chwilowo nie odpowiada.');
    } finally {
      aiRunning.current = false;
      setAiBusy(false);
      fetchThread();
    }
  };

  const startCorrection = (post, n) => {
    setCorrecting({ id: post.id, n });
    setShowReplyForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const fetchCategories = async () => {
    try {
      const response = await forumFetch('/api/forum/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      logger.error('Error fetching categories:', err);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!replyData.message.trim()) {
      setError('Wpisz treść odpowiedzi!');
      return;
    }
    if (!me.profile) {
      setError('Najpierw się zaloguj.');
      return;
    }

    setReplyLoading(true);

    try {
      // reCAPTCHA v3 token
      let recaptchaToken = '';
      try {
        const { getRecaptchaToken } = await import('@/lib/recaptcha-client');
        recaptchaToken = await getRecaptchaToken('forum_post');
      } catch (e) {
        console.warn('reCAPTCHA failed to load:', e);
      }

      const response = await forumFetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          message: replyData.message,
          recaptchaToken,
          ...voicePayload(voice),
          photos: photos.map((p) => p.key),
          model: model ? { key: model.key, name: model.name, size: model.size, pins: model.pins } : undefined,
          correctsPostId: correcting?.id,
        })
      });

      const data = await response.json();

      if (data.success) {
        setReplyData({ ...replyData, message: '' });
        setVoice({ mode: voice.mode, key: null, seconds: null });
        setPhotos([]);
        setModel(null);
        setCorrecting(null);
        setShowReplyForm(false);
        fetchThread(); // Refresh posts
      } else {
        setError(data.error || 'Błąd dodawania odpowiedzi');
      }
    } catch (err) {
      setError('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  // Prosta funkcja do parsowania emotikonów tekstowych
  const parseEmojis = (text) => {
    if (!text) return '';
    return text
      .replace(/:D/g, '😄')
      .replace(/:\)/g, '🙂')
      .replace(/;\)/g, '😉')
      .replace(/:P/g, '😛')
      .replace(/:\(/g, '😢')
      .replace(/<3/g, '❤️')
      .replace(/:O/g, '😮')
      .replace(/:\//g, '😕')
      .replace(/8\)/g, '😎');
  };

  if (loading) {
    return (
      <div className="thread-page">
        <div className="window">
          <div className="title-bar">
            <span>⏳ Ładowanie...</span>
          </div>
          <div className="content loading-content">
            <div className="loading-spinner">⏳</div>
            <p>Ładowanie wątku...</p>
          </div>
        </div>
        <style jsx>{`
          .thread-page {
            min-height: 100vh;
            background: #008080;
            padding: 20px;
            font-family: 'MS Sans Serif', Tahoma, sans-serif;
          }
          .window {
            max-width: 900px;
            margin: 0 auto;
            background: #c0c0c0;
            border: 3px outset #fff;
          }
          .title-bar {
            background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
            color: #fff;
            padding: 4px 8px;
            font-weight: bold;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .loading-spinner {
            font-size: 48px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="thread-page">
        <div className="window">
          <div className="title-bar">
            <span>❌ Błąd</span>
          </div>
          <div className="content error-content">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <Link href="/forum" className="btn">Powrót do forum</Link>
          </div>
        </div>
        <style jsx>{`
          .thread-page {
            min-height: 100vh;
            background: #008080;
            padding: 20px;
            font-family: 'MS Sans Serif', Tahoma, sans-serif;
          }
          .window {
            max-width: 600px;
            margin: 0 auto;
            background: #c0c0c0;
            border: 3px outset #fff;
          }
          .title-bar {
            background: linear-gradient(90deg, #800000 0%, #d04010 100%);
            color: #fff;
            padding: 4px 8px;
            font-weight: bold;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 8px 20px;
            background: #c0c0c0;
            border: 2px outset #fff;
            color: #000;
            text-decoration: none;
            font-weight: bold;
          }
          .btn:hover {
            background: #d0d0d0;
          }
        `}</style>
      </div>
    );
  }

  const category = getCategory(thread?.categoryId);

  return (
    <div className="thread-page">
      <div className="window">
        <div className="title-bar">
          <span>💬 {thread?.title}</span>
          <Link href="/forum" className="close-btn">✕</Link>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link href="/">🏠 Strona główna</Link>
            <span> › </span>
            <Link href="/forum">💬 Forum</Link>
            {category && (
              <>
                <span> › </span>
                <span>{category.icon} {category.name}</span>
              </>
            )}
          </div>

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          {/* Main thread post */}
          <div className="thread-header">
            <h1>{thread?.title}</h1>
            <div className="thread-meta">
              <span>📁 {category?.name || 'Brak kategorii'}</span>
              <span>👁️ {thread?.views || 0} wyświetleń</span>
              <span>💬 {thread?.replyCount || 0} odpowiedzi</span>
            </div>
          </div>

          <div className="post main-post">
            <div className="post-author">
              <div className="author-avatar">{thread?.author?.avatar || '👤'}</div>
              <div className="author-name">{thread?.author?.nickname || 'Anonim'}</div>
              <div className="author-badge">Autor</div>
            </div>
            <div className="post-content">
              <div className="post-date">
                📅 {formatDate(thread?.date)}{thread?.editedAt && <small className="edited" title={`Poprawione ${formatDate(thread.editedAt)}`}> (edytowano)</small>}
                {thread?.mine && editing !== 'thread' && <button type="button" className="edit-btn" onClick={() => setEditing('thread')}>✏️ popraw</button>}
                <ReportButton targetType="thread" targetId={thread?.id} email={me.email} />
              </div>
              <VoicePlayer url={thread?.voiceUrl} mode={thread?.voiceMode} seconds={thread?.voiceSeconds} />
              {editing === 'thread'
                ? <EditBox title={thread.title} message={thread.message} onSave={(t, m, v) => saveEdit({ threadId: thread.id, title: t, message: m, ...(v || {}) })} onCancel={() => setEditing(null)} />
                : (
                  <div className="post-message">
                    <CardText text={parseEmojis(thread?.message)} cards={thread?.cards} />
                  </div>
                )}
              <PhotoGallery photos={thread?.photos} />
              <ModelView model={thread?.model} />
            </div>
          </div>

          <Potwierdzenie experts={thread?.experts} />
          {me.admin && thread?.id && !thread.aiOff && <Fachowcy threadId={thread.id} onChange={fetchThread} />}

          <FullAnswer summary={thread?.summary} me={me} get={getClaim} onVoted={onVoted} cardOf={cardOf} />

          {/* Replies */}
          {posts.length > 0 && (
            <div className="replies-section">
              <h2>💬 Odpowiedzi ({posts.length})</h2>
              {posts.map((post, index) => (
                <div key={post.id} id={`p-${post.id}`} className={`post reply-post${post.isAi ? ' ai-post' : ''}`}>
                  <div className="post-author">
                    <div className="author-avatar">{post.author?.avatar || '👤'}</div>
                    <div className="author-name">
                      {post.author?.nickname || 'Anonim'}
                      {post.authorTrust != null && <span className="leaf" title={leafOf(post.authorTrust).label}> {leafOf(post.authorTrust).icon}</span>}
                    </div>
                    {post.isAi && <div className="ai-badge">🤖 AI, może się mylić</div>}
                    {post.authorWins > 0 && <div className="ai-wins" title="Ile razy AI przyznało mu rację">🏆 trafne poprawki AI: {post.authorWins}</div>}
                    <div className="reply-number">#{index + 1}</div>
                  </div>
                  {post.removed ? (
                  <div className="post-content">
                    <div className="post-removed">
                      🚫 Wpis usunięty przez moderację.<br />
                      <small>Powód: {post.removedReason || 'złamanie zasad forum'}</small>
                    </div>
                  </div>
                  ) : (
                  <div className="post-content">
                    <div className="post-date">
                      📅 {formatDate(post.date)}{post.editedAt && <small className="edited" title={`Poprawione ${formatDate(post.editedAt)}`}> (edytowano)</small>}
                      {post.mine && editing !== post.id && <button type="button" className="edit-btn" onClick={() => setEditing(post.id)}>✏️ popraw</button>}
                      <ReportButton targetType="post" targetId={post.id} email={me.email} />
                    </div>
                    {post.expertLabel && <div className="expert-label" title="Brat zadzwonił do fachowca i opowiada, co usłyszał">{post.expertLabel}</div>}
                    {post.isAi && thread?.experts && (
                      <div className="expert-verdict">
                        {thread.experts.tak.length > 0 && <span className="yes" title={thread.experts.tak.join('\n')}>📞 ✔ {thread.experts.tak.length} {thread.experts.tak.length === 1 ? 'fachowiec potwierdza' : 'fachowców potwierdza'}</span>}
                        {thread.experts.nie.length > 0 && <span className="no" title={thread.experts.nie.join('\n')}>📞 ✖ {thread.experts.nie.length} {thread.experts.nie.length === 1 ? 'fachowiec mówi' : 'fachowców mówi'}: tak się nie robi</span>}
                      </div>
                    )}
                    {post.correctsPostId && (
                      <a className="fix-ref" href={`#p-${post.correctsPostId}`}>
                        ✏️ Poprawka do odpowiedzi AI #{posts.findIndex((x) => x.id === post.correctsPostId) + 1}
                      </a>
                    )}
                    <VoicePlayer url={post.voiceUrl} mode={post.voiceMode} seconds={post.voiceSeconds} />
                    {editing === post.id
                      ? <EditBox message={post.message} onSave={(_, m, v) => saveEdit({ postId: post.id, message: m, ...(v || {}) })} onCancel={() => setEditing(null)} />
                      : (
                        <div className="post-message">
                          <CardText text={parseEmojis(post.message)} cards={thread?.cards} />
                        </div>
                      )}
                    <PhotoGallery photos={post.photos} />
                    <ModelView model={post.model} />
                    <ClaimList claims={post.claims} me={me} get={getClaim} onVoted={onVoted} cardOf={cardOf} />
                    {['czeka', 'sprawdza'].includes(post.correctionStatus) && <div className="fix-verdict wait">⏳ AI sprawdza tę poprawkę…</div>}
                    {post.correctionStatus === 'przyjeta' && <div className="fix-verdict yes">✅ AI przyznało rację. {post.correctionNote}</div>}
                    {post.correctionStatus === 'odrzucona' && <div className="fix-verdict no">🤔 AI się nie zgadza: {post.correctionNote} <small>Oceńcie sami.</small></div>}
                    {post.isAi && (
                      <div className="ai-actions">
                        {post.aiAsks && <span className="ai-hint">👉 AI dopytuje. Gdy autor wątku odpisze, AI dopasuje odpowiedź do tego, co ma.</span>}
                        {me.profile && <button type="button" className="btn-fix" onClick={() => startCorrection(post, index + 1)}>🎤 popraw AI</button>}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI w wątku */}
          {!thread?.aiOff && (aiBusy || thread?.aiWait || aiMsg || (thread?.aiCan && me.profile)) && (
            <div className="ai-bar">
              {aiBusy || thread?.aiWait ? (
                <span>{thread?.aiWait ? '🤖 AI czyta wątek i pisze… to trwa zwykle pół minuty.' : '🔬 AI rozkłada odpowiedzi na kawałki…'}</span>
              ) : (
                <>
                  {aiMsg && <span>{aiMsg}</span>}
                  {thread?.aiCan && me.profile && (
                    <button type="button" className="btn" onClick={() => runAi(true)}>
                      {posts.some((p) => p.isAi) ? '🤖 Zapytaj AI, czego tu brakuje' : '🤖 Poproś AI o odpowiedź'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reply button / form */}
          {!thread?.isLocked && (
            <div className="reply-section">
              {!showReplyForm ? (
                <button
                  className="btn btn-reply"
                  onClick={() => setShowReplyForm(true)}
                >
                  🎤 Odpowiedz głosem albo tekstem
                </button>
              ) : (
                <div className="reply-form-container" ref={formRef}>
                  <ForumAuth me={me} why="odpowiedzieć" />
                  {me.profile && <h3>{correcting ? `✏️ Poprawiasz odpowiedź AI #${correcting.n}` : '✍️ Twoja odpowiedź'}</h3>}
                  {me.profile && correcting && (
                    <p className="fix-info">
                      Powiedz albo napisz, co AI pomyliło albo co w praktyce działa lepiej. AI przeczyta poprawkę i odpowie, czy przyznaje rację.
                      Każda przyjęta poprawka to punkt dla ciebie: 🏆 przy twoim nicku.{' '}
                      <button type="button" className="link-btn" onClick={() => setCorrecting(null)}>to nie poprawka</button>
                    </p>
                  )}
                  {me.profile && <form onSubmit={handleReplySubmit}>
                    <div className="form-group">
                      <label>Powiedz to głosem (albo pisz niżej):</label>
                      <VoiceRecorder voice={voice} onChange={setVoice} onText={addSpoken} />
                    </div>
                    <div className="form-group">
                      <label>Wiadomość:</label>
                      <textarea
                        value={replyData.message}
                        onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                        placeholder="Napisz swoją odpowiedź... Możesz używać emotikonów :) :D ;) :P :( <3"
                        maxLength={12000}
                        rows={6}
                      />
                      <span className="char-count">{replyData.message.length}/12000</span>
                    </div>
                    <div className="form-group">
                      <label>Zdjęcia (do 5):</label>
                      <PhotoPicker photos={photos} onChange={setPhotos} />
                    </div>
                    <div className="form-group">
                      <label>Model 3D z pinezkami:</label>
                      <ModelPicker model={model} onChange={setModel} />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={replyLoading}>
                        {replyLoading ? '⏳ Wysyłanie...' : '📨 Wyślij odpowiedź'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setShowReplyForm(false); setCorrecting(null); }}
                      >
                        Anuluj
                      </button>
                    </div>
                  </form>}
                </div>
              )}
            </div>
          )}

          {thread?.isLocked && (
            <div className="locked-notice">
              🔒 Ten wątek jest zamknięty. Nie można dodawać odpowiedzi.
            </div>
          )}
        </div>

        <div className="status-bar">
          <span>💬 Wątek: {thread?.title}</span>
        </div>
      </div>

      <style jsx>{`
        .thread-page {
          min-height: 100vh;
          background: #008080;
          padding: 20px;
          font-family: 'MS Sans Serif', Tahoma, sans-serif;
        }

        .window {
          max-width: 900px;
          margin: 0 auto;
          background: #c0c0c0;
          border: 3px outset #fff;
        }

        .title-bar {
          background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
          color: #fff;
          padding: 4px 8px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-btn {
          background: #c0c0c0;
          border: 2px outset #fff;
          color: #000;
          text-decoration: none;
          padding: 0 6px;
          font-size: 12px;
        }

        .close-btn:hover {
          background: #d0d0d0;
        }

        .content {
          padding: 15px;
        }

        .breadcrumb {
          margin-bottom: 15px;
          font-size: 12px;
        }

        .breadcrumb a {
          color: #000080;
          text-decoration: none;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .error-box {
          background: #ffcccc;
          border: 2px solid #ff0000;
          padding: 10px;
          margin-bottom: 15px;
          color: #cc0000;
        }

        .thread-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #808080;
        }

        .thread-header h1 {
          font-size: 20px;
          margin: 0 0 10px 0;
        }

        .thread-meta {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #666;
          flex-wrap: wrap;
        }

        .post {
          display: flex;
          gap: 15px;
          background: #fff;
          border: 2px solid #808080;
          margin-bottom: 10px;
        }

        .main-post {
          border-color: #000080;
          border-width: 3px;
        }

        .post-author {
          width: 100px;
          flex-shrink: 0;
          padding: 15px;
          background: #e0e0e0;
          text-align: center;
          border-right: 1px solid #808080;
        }

        .author-avatar {
          font-size: 40px;
          margin-bottom: 5px;
        }

        .author-name {
          font-weight: bold;
          font-size: 12px;
          word-break: break-word;
        }

        .author-badge {
          background: #000080;
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          margin-top: 5px;
          display: inline-block;
        }

        .reply-number {
          color: #666;
          font-size: 10px;
          margin-top: 5px;
        }

        .post-removed { color: #666; font-style: italic; padding: 8px 0; font-size: 14px; }
        .ai-post { background: #eef3ff; }
        .edit-btn { background: none; border: none; color: #000080; font-size: 12px; cursor: pointer; padding: 2px 4px; }
        .edit-btn:hover { text-decoration: underline; }
        .edited { color: #777; font-size: 11px; }
        .edit-box { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; padding: 8px; background: #fffbe6; border: 1px solid #d9a400; }
        .edit-box input, .edit-box textarea { width: 100%; box-sizing: border-box; padding: 6px; font-size: 14px; border: 2px inset #fff; font-family: inherit; }
        .edit-box small { color: #555; font-size: 12px; }
        .edit-actions { display: flex; gap: 8px; }
        .edit-actions button { padding: 6px 12px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; color: #000; }
        .edit-err { color: #c00; margin: 0; font-size: 13px; }
        .pw-box { margin: 14px 0; padding: 10px 12px; border: 2px solid; font-size: 14px; line-height: 1.45; }
        .pw-box p { margin: 6px 0 0; }
        .pw-box.ok { background: #e8f8e8; border-color: #4a4; color: #063; }
        .pw-box.ok.stary { background: #fff6e0; border-color: #d9a400; color: #5a3d00; }
        .pw-box.zle { background: #fde8e8; border-color: #c55; color: #700; }
        .pw-box.wtoku { background: #f4f4f4; border-color: #aaa; color: #333; }
        .pw-lista { margin: 6px 0 0; padding-left: 18px; }
        .expert-label { display: inline-block; font-size: 12px; background: #fff3d6; border: 1px solid #d9a400; color: #5a3d00; padding: 2px 8px; margin-bottom: 6px; }
        .expert-verdict { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; font-size: 12px; }
        .expert-verdict span { padding: 2px 8px; border: 1px solid; border-radius: 10px; }
        .expert-verdict .yes { background: #e6f7e6; border-color: #6b6; color: #040; }
        .expert-verdict .no { background: #fde8e8; border-color: #d88; color: #800; }
        .ai-badge { font-size: 11px; background: #000080; color: #fff; padding: 2px 6px; margin-top: 4px; text-align: center; }
        .ai-wins { font-size: 11px; color: #806000; margin-top: 4px; text-align: center; }
        .ai-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
        .ai-hint { font-size: 13px; color: #333; flex: 1; min-width: 180px; }
        .btn-fix { padding: 6px 12px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 13px; color: #000; }
        .fix-ref { display: inline-block; font-size: 12px; color: #000080; margin-bottom: 6px; }
        .fix-verdict { margin-top: 10px; padding: 8px; font-size: 13px; border: 1px solid; line-height: 1.4; }
        .fix-verdict.wait { background: #f4f4f4; border-color: #aaa; }
        .fix-verdict.yes { background: #e8ffe8; border-color: #4a4; }
        .fix-verdict.no { background: #fff6e0; border-color: #c90; }
        .ai-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 12px 0; padding: 10px; background: #eef3ff; border: 2px inset #fff; font-size: 14px; }
        .fix-info { font-size: 13px; background: #ffffcc; border: 1px solid #c0a000; padding: 8px; margin: 0 0 10px; line-height: 1.4; }
        .link-btn { background: none; border: none; color: #000080; text-decoration: underline; cursor: pointer; padding: 0; font-size: 13px; }
        .post-content {
          flex: 1;
          padding: 15px;
        }

        .post-date {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #666;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .post-message {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .replies-section {
          margin-top: 30px;
        }

        .replies-section h2 {
          font-size: 16px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #808080;
        }

        .reply-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #808080;
        }

        .btn {
          padding: 8px 20px;
          border: 2px outset #fff;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          background: #c0c0c0;
          color: #000;
        }

        .btn:hover {
          background: #d0d0d0;
        }

        .btn-reply {
          background: linear-gradient(180deg, #90EE90 0%, #228B22 100%);
          color: #000;
        }

        .btn-reply:hover {
          background: linear-gradient(180deg, #98FB98 0%, #32CD32 100%);
        }

        .reply-form-container {
          background: #f0f0f0;
          border: 2px groove #fff;
          padding: 15px;
        }

        .reply-form-container h3 {
          margin: 0 0 15px 0;
          font-size: 14px;
        }

        .profile-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .avatar-picker {
          flex: 1;
          min-width: 200px;
        }

        .avatar-picker label,
        .nickname-input label,
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 12px;
        }

        .avatars {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .avatar-btn {
          width: 32px;
          height: 32px;
          font-size: 18px;
          background: #fff;
          border: 2px solid #808080;
          cursor: pointer;
          padding: 0;
        }

        .avatar-btn:hover {
          background: #ffffcc;
        }

        .avatar-btn.selected {
          background: #000080;
          border-color: #000080;
        }

        .nickname-input {
          flex: 1;
          min-width: 200px;
        }

        .nickname-input input {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 100px;
          box-sizing: border-box;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 10px;
          color: #666;
          margin-top: 3px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #c0c0c0;
        }

        .locked-notice {
          background: #ffffcc;
          border: 2px solid #808000;
          padding: 15px;
          text-align: center;
          margin-top: 20px;
        }

        .status-bar {
          background: #c0c0c0;
          border-top: 2px solid #808080;
          padding: 4px 8px;
          font-size: 11px;
        }

        .status-bar span {
          border: 1px inset #808080;
          padding: 2px 8px;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .thread-page {
            padding: 10px;
          }

          .post {
            flex-direction: column;
          }

          .post-author {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #808080;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
          }

          .author-avatar {
            font-size: 30px;
            margin-bottom: 0;
          }

          .thread-meta {
            flex-direction: column;
            gap: 5px;
          }

          .profile-row {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
