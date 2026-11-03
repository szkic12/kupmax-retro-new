'use client';
// Twierdzenia (K7): kawałki odpowiedzi z ocenami i pełna odpowiedź złożona z najlepszych kawałków.
// 📏 fakt: ✅ prawda / ❌ fałsz. 🎨 wariant: 👨‍🍳 „zrobiłem, działa” (bez zwycięzcy, więc nie ma czego manipulować).
import { useState } from 'react';
import Link from 'next/link';
import { forumFetch } from '@/lib/forum-client';

// Listek zaufania (sito K9): pokazujemy poziom, nie liczbę
export function leafOf(trust) {
  const t = Number(trust) || 0;
  if (t >= 1.5) return { icon: '🌳', label: 'sprawdzony: jego oceny często trafiają' };
  if (t >= 0.5) return { icon: '🌿', label: 'pewny' };
  return { icon: '🌱', label: 'nowy: jego głos waży jeszcze mało' };
}

function VerdictBadge({ claim }) {
  // Timer wątpliwości: po terminie przydatności pytamy, czy dalej aktualne
  if (claim.stale && claim.checkedAt) {
    return <span className="cl-verdict stale" title="Wiedza się starzeje. Potwierdź ✅, jeśli dalej działa, albo daj ❌, jeśli już nie.">⏳ sprawdzone w {new Date(claim.checkedAt).getFullYear()}: czy dalej aktualne?</span>;
  }
  if (claim.seal === 'tak') return <span className="cl-verdict ok" title="Zatwierdzone przez moderatora kupmax">✔ zatwierdzone</span>;
  if (claim.seal === 'nie') return <span className="cl-verdict bad" title="Moderator kupmax uznał za nieprawdę">✖ fałsz (zatwierdzone)</span>;
  if (claim.verdict === 'sprawdzone') return <span className="cl-verdict ok" title="Potwierdziło kilka niezależnych osób">✅ sprawdzone przez ludzi</span>;
  if (claim.verdict === 'praktyka') return <span className="cl-verdict ok" title="Kilka osób zrobiło i działa">👨‍🍳 sprawdzone w praktyce</span>;
  if (claim.verdict === 'falsz') return <span className="cl-verdict bad" title="Kilka niezależnych osób uznało za nieprawdę">❌ uznane za fałsz</span>;
  return null;
}

export function ClaimRow({ claim, me, onVoted, showAuthor, card, children }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const own = !!me.profile && claim.authorId && claim.authorId === me.profile.user_id;

  const vote = async (v) => {
    setErr('');
    if (!me.profile) return setErr('Zaloguj się, żeby oceniać.');
    if (own) return setErr('Swoich twierdzeń nie oceniasz.');
    setBusy(true);
    try {
      const res = await forumFetch('/api/forum/claims/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: claim.id, vote: v }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) onVoted(json.claim);
      else setErr(json.error || 'Nie wyszło.');
    } catch {
      setErr('Błąd sieci.');
    } finally {
      setBusy(false);
    }
  };

  const btn = (v, label, n, title) => (
    <button type="button" className={`cl-vote${claim.myVote === v ? ' on' : ''}`} disabled={busy} onClick={() => vote(v)} title={title}>
      {label} <b>{n}</b>
    </button>
  );

  return (
    <li className={`cl-row ${claim.kind}${claim.disputed ? ' disputed' : ''}`}>
      <span className="cl-kind" title={claim.kind === 'fakt' ? 'Fakt: prawda albo fałsz' : 'Wariant: zależy, czego chcesz'}>
        {claim.kind === 'fakt' ? '📏' : '🎨'}
      </span>
      <div className="cl-main">
        <div className="cl-text">
          {claim.condition && <span className="cl-cond">{claim.condition}: </span>}
          {claim.body}
          {showAuthor && <span className="cl-author"> ({claim.isAi ? '🤖 ' : ''}{claim.author})</span>}
          {card && <Link className="cl-card" href={`/forum/karta/${card.slug}`} title="Karta wiedzy">🗂️ {card.name}</Link>}
        </div>
        {children}
        <VerdictBadge claim={claim} />
        {claim.disputed && !claim.verdict && !claim.seal && <div className="cl-warn">⚠️ Sporne: więcej osób uważa to za nieprawdę.</div>}
        <div className="cl-votes">
          {claim.kind === 'fakt' ? (
            <>
              {btn('tak', '✅', claim.yes, 'To prawda')}
              {btn('nie', '❌', claim.no, 'To nieprawda')}
            </>
          ) : (
            btn('dziala', '👨‍🍳 zrobiłem, działa', claim.done, 'Sprawdziłem w praktyce, działa')
          )}
          {err && <span className="cl-err">{err}</span>}
        </div>
      </div>
    </li>
  );
}

// Pod odpowiedzią: zwinięta lista kawałków
export function ClaimList({ claims, me, get, onVoted, cardOf = () => null }) {
  if (!claims?.length) return null;
  return (
    <details className="cl-box">
      <summary>🔬 Rozłożone na kawałki ({claims.length}): oceń każdy osobno</summary>
      <ul className="cl-list">
        {claims.map((c) => <ClaimRow key={c.id} claim={get(c)} me={me} onVoted={onVoted} card={cardOf(c.cardId)} />)}
      </ul>
      <p className="cl-note">Na kawałki rozłożyło AI. W razie wątpliwości liczy się oryginał wyżej.</p>
      <ClaimStyles />
    </details>
  );
}

// Nad odpowiedziami: pełna odpowiedź z najlepszych kawałków, z podpisami autorów
export function FullAnswer({ summary, me, get, onVoted, cardOf = () => null }) {
  if (!summary?.groups?.length) return null;
  return (
    <section className="fa-box" id="pelna">
      <h2>📋 Pełna odpowiedź z kawałków</h2>
      <p className="cl-note">
        AI wybrało i ułożyło kawałki z odpowiedzi poniżej. Nie dopisało nic od siebie, a przy każdym kawałku jest jego autor.
        Fakty, które ludzie uznali za nieprawdę, same stąd znikają.
      </p>
      {summary.groups.map((g, i) => (
        <div key={i} className="fa-group">
          <h3>{g.title}</h3>
          <ul className="cl-list">
            {g.claims.map((c) => <ClaimRow key={c.id} claim={get(c)} me={me} onVoted={onVoted} showAuthor card={cardOf(c.cardId)} />)}
          </ul>
        </div>
      ))}
      {summary.missing && <p className="fa-missing">🕳️ Czego jeszcze brakuje: {summary.missing} <b>Wiesz? Dopisz odpowiedź.</b></p>}
      <ClaimStyles />
    </section>
  );
}

export function ClaimStyles() {
  return (
    <style jsx global>{`
      .cl-box { margin-top: 12px; border: 1px solid #b0b0b0; background: #fafafa; padding: 6px 8px; }
      .cl-box > summary { cursor: pointer; font-size: 13px; color: #000080; padding: 4px 0; }
      .cl-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .cl-row { display: flex; gap: 8px; align-items: flex-start; background: #fff; border: 1px solid #ddd; padding: 6px 8px; }
      .cl-row.wariant { border-left: 3px solid #c070c0; }
      .cl-row.fakt { border-left: 3px solid #4070c0; }
      .cl-row.disputed { opacity: 0.7; }
      .cl-row.disputed .cl-text { text-decoration: line-through; text-decoration-color: #c00; }
      .cl-kind { font-size: 16px; line-height: 1.3; }
      .cl-main { flex: 1; min-width: 0; }
      .cl-text { font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
      .cl-cond { color: #803080; font-style: italic; }
      .cl-author { color: #666; font-size: 12px; }
      .cl-card { display: inline-block; margin-left: 6px; font-size: 11px; color: #005000; background: #e6f4e6; border: 1px solid #9c9; border-radius: 10px; padding: 0 6px; text-decoration: none; white-space: nowrap; }
      .cl-card:hover { text-decoration: underline; }
      .cl-warn { font-size: 12px; color: #a00; margin-top: 2px; }
      .cl-verdict { display: inline-block; font-size: 11px; margin-top: 3px; padding: 1px 6px; border-radius: 8px; border: 1px solid; }
      .cl-verdict.ok { background: #e6f7e6; border-color: #6b6; color: #040; }
      .cl-verdict.bad { background: #fde8e8; border-color: #d88; color: #800; }
      .cl-verdict.stale { background: #fff4d6; border-color: #d9a400; color: #6a4a00; }
      .cl-votes { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
      .cl-vote { background: #e8e8e8; border: 1px solid #aaa; border-radius: 12px; padding: 2px 10px; font-size: 12px; cursor: pointer; color: #000; }
      .cl-vote.on { background: #fff3b0; border-color: #c90; }
      .cl-vote:disabled { cursor: progress; }
      .cl-err { font-size: 12px; color: #c00; }
      .cl-note { font-size: 12px; color: #555; margin: 6px 0 0; line-height: 1.4; }
      .fa-box { background: #fffff0; border: 2px solid #c0a000; padding: 12px; margin: 16px 0; }
      .fa-box h2 { margin: 0 0 4px; font-size: 18px; color: #000080; }
      .fa-group h3 { font-size: 15px; margin: 12px 0 2px; }
      .fa-missing { font-size: 13px; margin: 12px 0 0; padding: 8px; background: #fff; border: 1px dashed #c0a000; line-height: 1.4; }
    `}</style>
  );
}
