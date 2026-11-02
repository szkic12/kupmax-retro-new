'use client';
// Okienko logowania i profilu forum. Gość widzi logowanie, nowy użytkownik zakłada profil, reszta widzi pasek „piszesz jako”.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { forumFetch } from '@/lib/forum-client';

const AVATARS = ['👤', '😀', '😎', '🤓', '🧑‍💻', '👨‍🎤', '👩‍🔬', '🧙', '🤖', '👾', '🎮', '💀', '🐱', '🐶', '🦊'];

export default function ForumAuth({ me, why = 'pisać i nagrywać' }) {
  const [editing, setEditing] = useState(false);

  if (me.loading) return <div className="forum-auth">⏳ Sprawdzam, kim jesteś…</div>;
  if (!me.session) return <LoginBox why={why} />;
  if (!me.profile || editing) {
    return <ProfileBox me={me} onDone={() => { setEditing(false); me.refresh(); }} />;
  }
  return (
    <>
    {me.notices?.length > 0 && <Notices me={me} />}
    <div className="forum-auth forum-auth-bar">
      <span>Piszesz jako <b>{me.profile.avatar} {me.profile.nick}</b>{me.profile.ai_wins > 0 && <> · 🏆 AI przyznało ci rację {me.profile.ai_wins}×</>}</span>
      <span className="forum-auth-actions">
        <button type="button" onClick={() => setEditing(true)}>✏️ profil</button>
        <button type="button" onClick={() => supabase.auth.signOut()}>wyloguj</button>
      </span>
      <Styles />
    </div>
    </>
  );
}

// Powiadomienie: moderacja usunęła wpis autora, z powodem i drogą odwołania (DSA art. 17)
function Notices({ me }) {
  const seen = async () => {
    await forumFetch('/api/forum/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seenNotices: true }) });
    me.refresh();
  };
  return (
    <div className="forum-auth forum-notice" role="alert">
      <h3>⚠️ Moderacja usunęła {me.notices.length === 1 ? 'twój wpis' : `twoje wpisy (${me.notices.length})`}</h3>
      {me.notices.map((n, i) => (
        <div key={i} className="forum-notice-item">
          <b>{n.kind}:</b> „{n.what}”<br />
          <b>Powód:</b> {n.reason}<br />
          <small>{new Date(n.at).toLocaleString('pl-PL')}</small>
        </div>
      ))}
      <p className="forum-auth-hint">
        Nie zgadzasz się? Napisz na <a href="mailto:kontakt@kupmax.pl?subject=Odwołanie od usunięcia wpisu na forum">kontakt@kupmax.pl</a>, sprawdzimy jeszcze raz.
        Masz też prawo do sądu i pozasądowego rozstrzygania sporów. Więcej w <a href="/forum/zasady">zasadach forum</a>.
      </p>
      <div className="forum-auth-actions"><button type="button" onClick={seen}>Rozumiem</button></div>
    </div>
  );
}

function LoginBox({ why }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [withPassword, setWithPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!email.includes('@')) return setErr('Wpisz adres e-mail.');
    setBusy(true);
    try {
      if (withPassword) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setErr('Zły e-mail albo hasło.');
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.href },
        });
        if (error) setErr('Nie udało się wysłać linku. Spróbuj za chwilę.');
        else setMsg('📬 Link poleciał na maila. Kliknij go i wrócisz prosto tutaj.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="forum-auth" onSubmit={submit}>
      <h3>🔑 Zaloguj się, żeby {why}</h3>
      <p className="forum-auth-hint">
        Czytać i słuchać może każdy. Konto jest wspólne z bossxd.com i ai.kupmax.pl, więc jeśli tam je masz, wpisz ten sam e-mail.
      </p>
      <input type="email" placeholder="twój e-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      {withPassword && (
        <input type="password" placeholder="hasło" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      )}
      {err && <div className="forum-auth-err">⚠️ {err}</div>}
      {msg && <div className="forum-auth-ok">{msg}</div>}
      <div className="forum-auth-actions">
        <button type="submit" disabled={busy}>
          {busy ? '⏳' : withPassword ? 'Zaloguj' : '📧 Wyślij link na maila'}
        </button>
        <button type="button" className="forum-auth-link" onClick={() => setWithPassword(!withPassword)}>
          {withPassword ? 'wolę link na maila' : 'mam hasło'}
        </button>
      </div>
      <Styles />
    </form>
  );
}

function ProfileBox({ me, onDone }) {
  const p = me.profile;
  const [nick, setNick] = useState(p?.nick || '');
  const [avatar, setAvatar] = useState(p?.avatar || '👤');
  const [acceptTerms, setAcceptTerms] = useState(!!p);
  const [consentTraining, setConsentTraining] = useState(p?.consent_training || false);
  const [adult, setAdult] = useState(!!p?.adult_confirmed_at);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (!acceptTerms) return setErr('Zaakceptuj regulamin forum.');
    setBusy(true);
    try {
      const res = await forumFetch('/api/forum/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick, avatar, acceptTerms, consentTraining, adult }),
      });
      const json = await res.json();
      if (json.success) onDone();
      else setErr(json.error || 'Nie udało się zapisać.');
    } catch {
      setErr('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="forum-auth" onSubmit={save}>
      <h3>{p ? '✏️ Twój profil na forum' : '👋 Jeszcze jeden krok: jak mamy cię nazywać?'}</h3>
      <p className="forum-auth-hint">Zalogowano: {me.email}</p>
      <input type="text" placeholder="nick (2–40 znaków)" value={nick} maxLength={40} onChange={(e) => setNick(e.target.value)} />
      <div className="forum-auth-avatars">
        {AVATARS.map((a) => (
          <button type="button" key={a} className={a === avatar ? 'on' : ''} onClick={() => setAvatar(a)}>{a}</button>
        ))}
      </div>

      <label>
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
        Akceptuję <a href="/forum/zasady" target="_blank" rel="noreferrer">zasady forum</a>: bez obrażania, bez cudzych danych, bez pornografii. Wpisy łamiące zasady usuwamy z podaniem powodu.
      </label>
      <label>
        <input type="checkbox" checked={consentTraining} onChange={(e) => setConsentTraining(e.target.checked)} />
        Moje wpisy (sam tekst, bez nagrań głosu) mogą uczyć model AI kupmax. Dobrowolne, możesz to wyłączyć w każdej chwili.
      </label>
      <label>
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        Mam ukończone 18 lat. Odblokowuje 🔞 Strefę 18+.
      </label>

      {err && <div className="forum-auth-err">⚠️ {err}</div>}
      <div className="forum-auth-actions">
        <button type="submit" disabled={busy}>{busy ? '⏳' : 'Zapisz'}</button>
        <button type="button" className="forum-auth-link" onClick={() => supabase.auth.signOut()}>wyloguj</button>
      </div>
      <Styles />
    </form>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .forum-auth {
        background: #c0c0c0;
        border: 2px solid;
        border-color: #fff #808080 #808080 #fff;
        padding: 14px 16px;
        margin: 0 0 16px;
        color: #000;
        font-family: 'MS Sans Serif', Tahoma, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .forum-auth h3 { margin: 0; font-size: 16px; color: #000080; }
      .forum-auth-hint { margin: 0; font-size: 13px; color: #333; }
      .forum-auth input[type='email'],
      .forum-auth input[type='password'],
      .forum-auth input[type='text'] {
        padding: 8px;
        font-size: 15px;
        border: 2px inset #fff;
        background: #fff;
        color: #000;
        max-width: 420px;
      }
      .forum-auth label { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.4; }
      .forum-auth label input { margin-top: 2px; flex: none; }
      .forum-auth a { color: #000080; }
      .forum-auth-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .forum-auth button {
        padding: 6px 14px;
        background: #c0c0c0;
        border: 2px solid;
        border-color: #fff #808080 #808080 #fff;
        cursor: pointer;
        font-size: 14px;
        color: #000;
      }
      .forum-auth button:disabled { opacity: 0.6; }
      .forum-auth .forum-auth-link { border-color: transparent; background: none; text-decoration: underline; color: #000080; }
      .forum-auth-avatars { display: flex; flex-wrap: wrap; gap: 4px; }
      .forum-auth-avatars button { padding: 4px 6px; font-size: 18px; }
      .forum-auth-avatars button.on { border-color: #808080 #fff #fff #808080; background: #fff; }
      .forum-auth-err { color: #cc0000; font-size: 14px; }
      .forum-auth-ok { color: #006400; font-size: 14px; }
      .forum-notice { background: #ffffcc; }
      .forum-notice-item { background: #fff; border: 1px solid #c0c0c0; padding: 8px; font-size: 13px; line-height: 1.5; }
      .forum-auth-bar { flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: wrap; padding: 8px 12px; }
    `}</style>
  );
}
