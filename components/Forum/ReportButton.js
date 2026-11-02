'use client';
// „🚩 zgłoś” przy każdym wpisie (DSA art. 16). Może zgłosić każdy, także bez konta.
import { useEffect, useState } from 'react';
import { forumFetch } from '@/lib/forum-client';

const CATS = [
  ['nielegalne', 'Treść niezgodna z prawem'],
  ['obraza', 'Obrażanie, nękanie, mowa nienawiści'],
  ['dane', 'Cudze dane osobowe albo wizerunek bez zgody'],
  ['nagosc', 'Pornografia albo nagość'],
  ['spam', 'Spam, reklama bez zgody, oszustwo'],
  ['dzieci', 'Treść zagrażająca dzieciom'],
  ['inne', 'Inne złamanie zasad forum'],
];

export default function ReportButton({ targetType, targetId, email: myEmail }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="report-btn" onClick={() => setOpen(true)} title="Zgłoś ten wpis moderacji">🚩 zgłoś</button>
      {open && <ReportDialog targetType={targetType} targetId={targetId} myEmail={myEmail} onClose={() => setOpen(false)} />}
      <style jsx global>{`
        .report-btn { background: none; border: none; color: #666; font-size: 12px; cursor: pointer; padding: 2px 4px; }
        .report-btn:hover { color: #c00; text-decoration: underline; }
      `}</style>
    </>
  );
}

function ReportDialog({ targetType, targetId, myEmail, onClose }) {
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState(myEmail || '');
  const [goodFaith, setGoodFaith] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const kids = category === 'dzieci';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async (e) => {
    e.preventDefault();
    setErr('');
    if (!category) return setErr('Wybierz, co jest nie tak.');
    setBusy(true);
    try {
      let recaptchaToken = '';
      try {
        const { getRecaptchaToken } = await import('@/lib/recaptcha-client');
        recaptchaToken = await getRecaptchaToken('forum_report');
      } catch { /* serwer odpowie komunikatem */ }
      const res = await forumFetch('/api/forum/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, category, details, email, goodFaith, recaptchaToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) setDone(true);
      else setErr(json.error || 'Nie udało się wysłać.');
    } catch {
      setErr('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rep-back" onClick={onClose}>
      <form className="rep-win" onClick={(e) => e.stopPropagation()} onSubmit={send} role="dialog" aria-modal="true" aria-label="Zgłoś wpis">
        <div className="rep-title"><span>🚩 Zgłoś wpis</span><button type="button" onClick={onClose} aria-label="Zamknij">✕</button></div>
        {done ? (
          <div className="rep-body">
            <p>✅ Zgłoszenie dotarło. Sprawdzimy wpis i damy znać mailem, co postanowiliśmy.</p>
            <button type="button" onClick={onClose}>Zamknij</button>
          </div>
        ) : (
          <div className="rep-body">
            <fieldset>
              <legend>Co jest nie tak?</legend>
              {CATS.map(([id, label]) => (
                <label key={id}><input type="radio" name="cat" checked={category === id} onChange={() => setCategory(id)} /> {label}</label>
              ))}
            </fieldset>
            {kids && (
              <p className="rep-warn">
                Jeśli dziecku grozi niebezpieczeństwo teraz, dzwoń <b>112</b>. Materiały z wykorzystaniem dzieci zgłoś też na <a href="https://dyzurnet.pl" target="_blank" rel="noreferrer">dyzurnet.pl</a>.
                Tutaj nie musisz podawać maila.
              </p>
            )}
            <label className="rep-col">
              Dlaczego? {category === 'nielegalne' && 'Napisz, jakie prawo łamie ten wpis.'}
              <textarea rows={4} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Opisz krótko, co jest nie tak." />
            </label>
            <label className="rep-col">
              Twój e-mail {kids ? '(nieobowiązkowy)' : '(napiszemy, co zrobiliśmy)'}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label>
              <input type="checkbox" checked={goodFaith} onChange={(e) => setGoodFaith(e.target.checked)} />
              Zgłaszam w dobrej wierze. Według mojej wiedzy to, co piszę, jest prawdą.
            </label>
            {err && <p className="rep-err">⚠️ {err}</p>}
            <div className="rep-actions">
              <button type="submit" disabled={busy}>{busy ? '⏳' : 'Wyślij zgłoszenie'}</button>
              <button type="button" onClick={onClose}>Anuluj</button>
            </div>
          </div>
        )}
      </form>
      <style jsx global>{`
        .rep-back { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .rep-win { background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; width: 100%; max-width: 460px; max-height: 100%; overflow: auto; color: #000; font-family: 'MS Sans Serif', Tahoma, sans-serif; }
        .rep-title { background: #000080; color: #fff; padding: 4px 6px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; position: sticky; top: 0; }
        .rep-title button { background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; width: 24px; height: 22px; padding: 0; cursor: pointer; }
        .rep-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; font-size: 14px; }
        .rep-body fieldset { border: 2px groove #fff; padding: 8px; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .rep-body label { display: flex; gap: 6px; align-items: flex-start; line-height: 1.35; }
        .rep-body .rep-col { flex-direction: column; gap: 4px; }
        .rep-body textarea, .rep-body input[type=email] { width: 100%; box-sizing: border-box; padding: 6px; font-size: 14px; border: 2px inset #fff; background: #fff; color: #000; }
        .rep-body button { padding: 6px 14px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 14px; color: #000; }
        .rep-actions { display: flex; gap: 8px; }
        .rep-warn { margin: 0; background: #ffffcc; border: 1px solid #c0a000; padding: 8px; font-size: 13px; }
        .rep-err { margin: 0; color: #c00; }
      `}</style>
    </div>
  );
}
