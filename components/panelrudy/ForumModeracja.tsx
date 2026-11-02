'use client';
// Panel moderacji forum (panelrudy → Forum): zgłoszenia z guzika 🚩 i ostatnie wpisy ze wszystkich kategorii.
// Usunięcie zawsze z powodem; autor widzi go przy swoim profilu, zgłaszający dostaje maila (guzik ✉️).
import { useCallback, useEffect, useState } from 'react';

const CATS: [string, string][] = [
  ['nielegalne', 'Treść niezgodna z prawem'],
  ['obraza', 'Obrażanie, nękanie, nienawiść'],
  ['dane', 'Cudze dane / wizerunek'],
  ['nagosc', 'Pornografia / nagość'],
  ['spam', 'Spam / oszustwo'],
  ['dzieci', 'Zagraża dzieciom'],
  ['inne', 'Inne złamanie zasad'],
];
const catLabel = (c: string) => CATS.find(([id]) => id === c)?.[1] || c;

type Item = any;
const btn: React.CSSProperties = { padding: '4px 10px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontSize: 12 };
const box: React.CSSProperties = { background: '#fff', border: '1px solid #999', padding: 8, marginBottom: 8, fontSize: 13 };
const when = (d: string) => (d ? new Date(d).toLocaleString('pl-PL') : '');
const snippet = (t: Item) => (t?.title ? `„${t.title}” ` : '') + String(t?.body || '').slice(0, 220);
const link = (t: Item, type: string) =>
  type === 'claim' ? `/forum/karta/${t.forum_cards?.slug || ''}` : `/forum/thread/${type === 'thread' ? t.id : t.thread_id}`;
const typeLabel = (type: string) => (type === 'thread' ? '🧵 wątek' : type === 'post' ? '💬 odpowiedź' : '🗂️ wpis na karcie');

export default function ForumModeracja() {
  const [data, setData] = useState<{ reports: Item[]; threads: Item[]; posts: Item[]; claims?: Item[]; queue?: Item[] } | null>(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState<'zgloszenia' | 'wpisy' | 'pieczec' | 'paczka'>('zgloszenia');

  const load = useCallback(async () => {
    setErr('');
    const res = await fetch('/api/forum/moderacja', { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (json.success) setData(json);
    else setErr(json.error || 'Nie udało się wczytać.');
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (action: string, targetType: string, targetId: string, category?: string, note?: string) => {
    const res = await fetch('/api/forum/moderacja', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetType, targetId, category, note }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.success) alert(json.error || 'Nie wyszło');
    await load();
    return json.decision as string | undefined;
  };

  const open = data?.reports.filter((r) => r.status === 'nowe') || [];
  const done = data?.reports.filter((r) => r.status !== 'nowe') || [];
  const recent = data ? [
    ...data.threads.map((t) => ({ ...t, _type: 'thread' })),
    ...data.posts.map((p) => ({ ...p, _type: 'post' })),
    ...(data.claims || []).map((c) => ({ ...c, _type: 'claim', title: c.forum_cards ? `karta: ${c.forum_cards.name}` : '' })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) : [];

  return (
    <fieldset style={{ border: '2px groove #fff', padding: 12, marginBottom: 16, background: '#ececec' }}>
      <legend style={{ fontWeight: 'bold', color: '#000080' }}>🚩 Moderacja forum (DSA)</legend>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <button style={{ ...btn, fontWeight: view === 'zgloszenia' ? 'bold' : 'normal' }} onClick={() => setView('zgloszenia')}>
          Zgłoszenia {open.length > 0 && <b style={{ color: '#c00' }}>({open.length} nowych)</b>}
        </button>
        <button style={{ ...btn, fontWeight: view === 'wpisy' ? 'bold' : 'normal' }} onClick={() => setView('wpisy')}>Ostatnie wpisy (też 18+)</button>
        <button style={{ ...btn, fontWeight: view === 'pieczec' ? 'bold' : 'normal' }} onClick={() => setView('pieczec')}>
          ✔ Pieczęć {data?.queue?.length ? `(${data.queue.length})` : ''}
        </button>
        <button style={{ ...btn, fontWeight: view === 'paczka' ? 'bold' : 'normal' }} onClick={() => setView('paczka')}>📦 Paczka do nauki</button>
        <button style={btn} onClick={load}>🔄</button>
        <a href="/forum/zasady" target="_blank" rel="noreferrer" style={{ fontSize: 12, alignSelf: 'center' }}>zasady forum</a>
      </div>
      {err && <p style={{ color: '#c00' }}>⚠️ {err}</p>}
      {!data && !err && <p>⏳ Wczytuję…</p>}

      {data && view === 'zgloszenia' && (
        <>
          {open.length === 0 && <p style={{ color: '#060' }}>✅ Brak nowych zgłoszeń.</p>}
          {open.map((r) => <Report key={r.id} r={r} act={act} />)}
          {done.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer' }}>Załatwione ({done.length})</summary>
              {done.map((r) => <Report key={r.id} r={r} act={act} />)}
            </details>
          )}
        </>
      )}

      {view === 'paczka' && <ExportBox />}

      {data && view === 'pieczec' && (
        <>
          <p style={{ fontSize: 12, color: '#444', margin: '0 0 8px' }}>
            Twoja pieczęć przebija głosy ludzi i uczy sito, komu ufać: kto głosował zgodnie z nią, zyskuje wagę, a kto przeciw, traci.
            Do nauki modelu idzie tylko to, co ma ✔ albo przeszło sito. Najpierw sporne, potem tuż przy progu.
          </p>
          {(data.queue || []).length === 0 && <p style={{ color: '#060' }}>✅ Nic nie czeka na pieczęć.</p>}
          {(data.queue || []).map((c) => <SealRow key={c.id} c={c} onDone={load} />)}
        </>
      )}

      {data && view === 'wpisy' && recent.map((t) => (
        <div key={t.id} style={{ ...box, opacity: t.status === 'usuniety' ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span>
              <b>{typeLabel(t._type)}</b>
              {t.category_id === 'strefa-18' && ' 🔞'} · {t.author_avatar} {t.author_nick} · {when(t.created_at)}
              {t.is_ai && ' · 🤖 AI'}{t.voice_url && ' · 🎤'}{t.photos?.length > 0 && ` · 📷${t.photos.length}`}{t.model && ' · 🧊'}
            </span>
            <a href={link(t, t._type)} target="_blank" rel="noreferrer">otwórz ↗</a>
          </div>
          <p style={{ margin: '6px 0' }}>{snippet(t)}</p>
          {t.status === 'usuniety'
            ? <Restore t={t} act={act} />
            : <Remove type={t._type} id={t.id} act={act} />}
        </div>
      ))}
    </fieldset>
  );
}

function Report({ r, act }: { r: Item; act: any }) {
  const t = r.target;
  const [decision, setDecision] = useState<string>(r.decision || '');
  const mail = (d: string) =>
    `mailto:${r.reporter_email}?subject=${encodeURIComponent('Twoje zgłoszenie na forum kupmax.pl')}&body=${encodeURIComponent(
      `Dzień dobry,\n\ndziękujemy za zgłoszenie z ${when(r.created_at)} (${catLabel(r.category)}).\n\nNasza decyzja: ${d}\n\nDecyzję podjął człowiek, bez automatów. Jeśli się nie zgadzasz, odpisz na tego maila w ciągu 6 miesięcy.\n\nZasady forum: https://www.kupmax.pl/forum/zasady\n\nKUPMAX PSA`
    )}`;
  return (
    <div style={{ ...box, borderLeft: r.status === 'nowe' ? '4px solid #c00' : '4px solid #999' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <b>🚩 {catLabel(r.category)}</b>
        <span>{when(r.created_at)}</span>
      </div>
      {r.details && <p style={{ margin: '4px 0' }}>„{r.details}”</p>}
      <p style={{ margin: '4px 0', color: '#555' }}>
        zgłasza: {r.reporter_email || 'bez maila'}{r.reporter_id ? ' (zalogowany)' : ''}{r.good_faith ? ' · w dobrej wierze ✔' : ''}
      </p>
      <div style={{ background: '#f6f6f6', padding: 6, margin: '6px 0' }}>
        {t ? (
          <>
            <small>{typeLabel(r.target_type)} · {t.author_avatar} {t.author_nick} · status: <b>{t.status}</b> · <a href={link(t, r.target_type)} target="_blank" rel="noreferrer">otwórz ↗</a></small>
            <p style={{ margin: '4px 0' }}>{snippet(t)}</p>
          </>
        ) : <small>Wpis już nie istnieje.</small>}
      </div>
      {r.status === 'nowe' && t ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Remove type={r.target_type} id={r.target_id} act={act} initial={r.category} onDone={setDecision} />
          <button style={{ ...btn, alignSelf: 'flex-start' }} onClick={async () => setDecision((await act('zostaw', r.target_type, r.target_id)) || '')}>✅ Zostaw (nie łamie zasad)</button>
        </div>
      ) : (
        <p style={{ margin: '4px 0' }}><b>Decyzja:</b> {r.decision || decision} <small>{when(r.decided_at)}</small></p>
      )}
      {(r.decision || decision) && r.reporter_email && (
        <a href={mail(r.decision || decision)} style={{ ...btn, display: 'inline-block', textDecoration: 'none', color: '#000' }}>✉️ Napisz zgłaszającemu o decyzji</a>
      )}
    </div>
  );
}

function Remove({ type, id, act, initial = 'inne', onDone }: { type: string; id: string; act: any; initial?: string; onDone?: (d: string) => void }) {
  const [cat, setCat] = useState(initial);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ fontSize: 12 }}>
        {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="notatka dla autora (opcjonalnie)" maxLength={500} style={{ flex: 1, minWidth: 160, fontSize: 12, padding: 3 }} />
      <button
        style={{ ...btn, background: '#ff9999' }}
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Usunąć ten wpis?\nPowód: ${catLabel(cat)}${note ? `\n${note}` : ''}`)) return;
          setBusy(true);
          const d = await act('usun', type, id, cat, note);
          setBusy(false);
          if (d) onDone?.(d);
        }}
      >
        🗑️ Usuń z powodem
      </button>
    </div>
  );
}

const PACK_LABEL: Record<string, string> = { qa: 'pytanie → odpowiedź', karty: 'szuflady kart', warianty: 'warianty z warunkami' };

// Paczka do nauki modelu (K10): co noc o 3:00 sama, tu podgląd, „zrób teraz” i pobieranie
function ExportBox() {
  const [d, setD] = useState<Item>(null);
  const [busy, setBusy] = useState(false);
  const show = async (res: Response) => { const j = await res.json().catch(() => ({})); setD(j.success ? j : { error: j.error || 'Błąd' }); };
  useEffect(() => { fetch('/api/forum/export', { cache: 'no-store' }).then(show); }, []);
  const now = async () => { setBusy(true); await show(await fetch('/api/forum/export', { method: 'POST' })); setBusy(false); };
  const m = d?.manifest;
  return (
    <div style={box}>
      <p style={{ marginTop: 0 }}>
        Co noc o 3:00 forum samo pakuje wiedzę, która przeszła sito (✔ albo „sprawdzone”), od ludzi ze zgodą na naukę.
        Bez kawałków AI i bez nagrań. 18+ osobno. Na laptopa: <code>node scripts/forum-pobierz-paczke.mjs</code>.
      </p>
      {!d && <p>⏳</p>}
      {d?.error && <p style={{ color: '#c00' }}>⚠️ {d.error}</p>}
      {d && !d.error && !m && <p>Jeszcze nie było paczki.</p>}
      {m && (
        <>
          <p><b>Ostatnia paczka:</b> {m.date} ({when(m.at)})</p>
          {Object.entries(m.counts as Item).map(([pack, files]: [string, any]) => (
            <p key={pack} style={{ margin: '4px 0' }}>
              <b>{pack === '18' ? '🔞 18+' : '📚 ogólna'}:</b>{' '}
              {Object.entries(files).map(([f, n]: [string, any]) => `${PACK_LABEL[f]} ${n}`).join(' · ')}
            </p>
          ))}
          <p style={{ margin: '6px 0' }}>
            {Object.entries(d.links || {}).map(([name, url]: [string, any]) => (
              <a key={name} href={url} style={{ marginRight: 12 }} download>⬇️ {name}</a>
            ))}
          </p>
        </>
      )}
      <button style={btn} disabled={busy} onClick={now}>{busy ? '⏳ Pakuję…' : '📦 Zrób paczkę teraz'}</button>
    </div>
  );
}

const VERDICT: Record<string, string> = { sprawdzone: '✅ sprawdzone', falsz: '❌ fałsz', praktyka: '👨‍🍳 sprawdzone w praktyce' };

function SealRow({ c, onDone }: { c: Item; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const seal = async (v: 'tak' | 'nie') => {
    setBusy(true);
    const res = await fetch('/api/forum/moderacja', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pieczec', targetType: 'claim', targetId: c.id, seal: v }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) alert(json.error || 'Nie wyszło');
    onDone();
  };
  const href = c.thread_id ? `/forum/thread/${c.thread_id}` : `/forum/karta/${c.forum_cards?.slug || ''}`;
  return (
    <div style={{ ...box, borderLeft: c.yes > 0 && c.no > 0 ? '4px solid #c90' : '4px solid #4070c0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <small>{c.kind === 'fakt' ? '📏 fakt' : '🎨 wariant'} · {c.is_ai ? '🤖 AI kupmax' : c.author_nick}{c.forum_cards ? ` · 🗂️ ${c.forum_cards.name}` : ''}</small>
        <a href={href} target="_blank" rel="noreferrer">otwórz ↗</a>
      </div>
      <p style={{ margin: '6px 0' }}>{c.condition && <i>{c.condition}: </i>}{c.body}</p>
      <small>
        {c.kind === 'fakt' ? `✅ ${c.yes} (waga ${c.wyes}) · ❌ ${c.no} (waga ${c.wno})` : `👨‍🍳 ${c.done} (waga ${c.wdone})`}
        {c.verdict ? ` · sito: ${VERDICT[c.verdict]}` : ' · sito: jeszcze nie rozstrzygnęło'}
      </small>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button style={{ ...btn, background: '#b8f0b8' }} disabled={busy} onClick={() => seal('tak')}>{c.kind === 'fakt' ? '✔ Prawda' : '✔ Działa'}</button>
        <button style={{ ...btn, background: '#ffb0b0' }} disabled={busy} onClick={() => seal('nie')}>{c.kind === 'fakt' ? '✖ Fałsz' : '✖ Zła rada'}</button>
      </div>
    </div>
  );
}

function Restore({ t, act }: { t: Item; act: any }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <small>🚫 usunięty {when(t.removed_at)}: {t.removed_reason}</small>
      <button style={btn} onClick={() => confirm('Przywrócić wpis?') && act('przywroc', t._type, t.id)}>↩️ Przywróć</button>
    </div>
  );
}
