'use client';
// 📞 Fachowcy: dzwonienie do fachowców o problem z forum. Używane w panelrudy (Telefony) i pod problemem na forum
// (ramka widoczna tylko dla Brata: konto forum z adminskim mailem albo sesja panelu).
import { useCallback, useEffect, useState } from 'react';
import VoiceRecorder, { voicePayload } from '@/components/Forum/VoiceRecorder';
import { forumFetch } from '@/lib/forum-client';

const btn = { padding: '6px 10px', background: '#c0c0c0', border: '2px solid', borderColor: '#fff #808080 #808080 #fff', cursor: 'pointer', fontSize: 13, color: '#000' };
export const CALL_STATUS = { do_zrobienia: '⏳ do zrobienia', odebral: '✅ rozmowa', nie_odebral: '📵 nie odebrał', oddzwoni: '🔁 oddzwoni / później', nie_dzwonic: '⛔ nie dzwonić', pominiete: '— pominięte' };

// Ramka pod problemem na forum: dobierz numery, zadzwoń, zapisz rozmowę
export default function Fachowcy({ threadId, onChange }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const j = await (await forumFetch(`/api/forum/telefony?thread=${threadId}`, { cache: 'no-store' })).json().catch(() => ({}));
    setD(j.success ? j : null);
  }, [threadId]);
  useEffect(() => { load(); }, [load]);
  if (!d) return null; // nie Brat albo błąd: ramki nie ma
  const calls = d.groups?.[0]?.calls || [];
  const otwarte = calls.filter((c) => ['do_zrobienia', 'oddzwoni'].includes(c.status)).length;
  const dobierz = async () => {
    setBusy(true); setMsg('');
    const j = await (await forumFetch('/api/forum/telefony/dobierz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dobierz', watek: threadId }) })).json().catch(() => ({}));
    setBusy(false);
    setMsg(j.success ? (j.rozmow ? `✅ Dobrane: ${j.rozmow} fachowców.` : 'Nie trzeba więcej: problem ma już 3 zgodnych fachowców albo ktoś czeka na telefon.') : `⚠️ ${j.error || 'Błąd'}`);
    load();
  };
  const odswiez = () => { load(); onChange?.(); };
  return (
    <div className="fach-box">
      <div className="fach-head">
        <b>📞 Fachowcy do tego problemu</b> <small>(widzisz tylko ty)</small>
      </div>
      <p className="fach-info">Na początku rozmowy: przedstaw się, powiedz, że numer jest z publicznego rejestru firm, i że prosisz o fachową opinię do darmowego forum. Niczego nie sprzedajesz. Podpis imieniem albo firmą tylko za zgodą.</p>
      {otwarte === 0 && (
        <button type="button" style={{ ...btn, background: '#b8f0b8', fontWeight: 'bold' }} disabled={busy} onClick={dobierz}>
          {busy ? '⏳ AI dobiera fachowców…' : calls.length ? '📞 Dobierz kolejnych fachowców' : '📞 Dobierz numery do tego problemu'}
        </button>
      )}
      {msg && <p className="fach-info">{msg}</p>}
      {calls.map((c) => <CallRow key={c.id} c={c} onDone={odswiez} />)}
      <style jsx global>{`
        .fach-box { margin: 14px 0; padding: 10px; border: 2px dashed #000080; background: #f3f6ff; }
        .fach-head small { color: #555; font-weight: normal; }
        .fach-info { font-size: 12px; color: #444; margin: 6px 0; line-height: 1.4; }
      `}</style>
    </div>
  );
}

export function CallRow({ c, onDone }) {
  const k = c.contact || {};
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState(c.verdict || '');
  const [consent, setConsent] = useState(!!c.consent_name);
  const [label, setLabel] = useState(c.label || [k.osoba, k.name, k.miasto].filter(Boolean).join(', '));
  const [message, setMessage] = useState('');
  const [voice, setVoice] = useState({ mode: 'wlasny', key: null, seconds: null });
  const [busy, setBusy] = useState(false);
  const post = async (payload) => {
    setBusy(true);
    const res = await forumFetch('/api/forum/telefony', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: c.id, ...payload }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!j.success) return alert(j.error || 'Nie wyszło');
    setOpen(false);
    onDone();
  };
  const done = !['do_zrobienia', 'oddzwoni'].includes(c.status);
  return (
    <div style={{ background: done ? '#f3f3f3' : '#fff', border: '1px solid #ccc', padding: 8, margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span><b>{k.name}</b>{k.osoba ? ` · ${k.osoba}` : ''}{k.miasto ? ` · ${k.miasto}` : ''}<br /><small>{String(k.branza || '').slice(0, 120)}</small></span>
        <span style={{ fontSize: 12 }}>{CALL_STATUS[c.status]}{c.verdict ? (c.verdict === 'tak' ? ' · ✔ potwierdził' : ' · ✖ tak się nie robi') : ''}</span>
      </div>
      {k.oferta && <p style={{ margin: '4px 0', fontSize: 11, color: '#666' }}>{String(k.oferta).slice(0, 200)}</p>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <a href={`tel:+48${k.phone}`} style={{ ...btn, background: '#b8f0b8', textDecoration: 'none', color: '#000', fontWeight: 'bold' }}>📞 Zadzwoń {k.phone?.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
        <button style={btn} disabled={busy} onClick={() => setOpen(!open)}>✅ Odebrał: zapisz rozmowę</button>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'status', status: 'nie_odebral' })}>📵 Nie odebrał</button>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'status', status: 'oddzwoni' })}>🔁 Później</button>
        <button style={{ ...btn, background: '#ffb0b0' }} disabled={busy} onClick={() => confirm('Już nigdy nie dzwonić do tej firmy?') && post({ action: 'status', status: 'nie_dzwonic' })}>⛔ Nie dzwonić</button>
      </div>
      {open && (
        <div style={{ marginTop: 8, padding: 8, background: '#f6f6f6', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <b>Co fachowiec na odpowiedź AI?</b>
          <label><input type="radio" checked={verdict === 'tak'} onChange={() => setVerdict('tak')} /> ✔ zgadza się</label>
          <label><input type="radio" checked={verdict === 'nie'} onChange={() => setVerdict('nie')} /> ✖ tak się nie robi</label>
          <label><input type="radio" checked={verdict === ''} onChange={() => setVerdict('')} /> bez zdania</label>
          <label><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> zgodził się na podpis</label>
          {consent && <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} style={{ padding: 4 }} placeholder="Imię, firma, miasto" />}
          <b>Co powiedział? (swoimi słowami, głosem albo tekstem; idzie na forum pod problem)</b>
          <VoiceRecorder voice={voice} onChange={setVoice} onText={(t) => setMessage((m) => (m ? `${m}\n\n${t}` : t))} />
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Np. Pan Marek mówi, że przy starym pionie najpierw zakręca się zawór pod licznikiem…" style={{ padding: 6 }} />
          <button style={{ ...btn, background: '#b8f0b8', alignSelf: 'flex-start' }} disabled={busy} onClick={() => post({ action: 'odpowiedz', verdict, consentName: consent, label, message, ...voicePayload(voice) })}>
            {busy ? '⏳' : '💾 Zapisz rozmowę'}
          </button>
        </div>
      )}
    </div>
  );
}

