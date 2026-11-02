'use client';
// Spis kart wiedzy (K8): każda rzecz, o której forum coś wie, z licznikiem kawałków w szufladach.
import { useEffect, useState } from 'react';
import Link from 'next/link';

const ICONS = { rozpoznac: '👁️', gdzie: '📍', uzyc: '🔨', pulapki: '⚠️' };

export default function CardsIndex() {
  const [cards, setCards] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/forum/cards').then((r) => r.json()).then((j) => setCards(j.cards || [])).catch(() => setCards([]));
  }, []);

  const list = (cards || []).filter((c) => c.name.includes(q.trim().toLowerCase()));

  return (
    <div className="cards-page">
      <div className="window">
        <div className="title-bar"><span>🗂️ Karty wiedzy</span><Link href="/forum" className="close-btn">✕</Link></div>
        <div className="content">
          <p className="crumbs"><Link href="/forum">💬 Forum</Link> › 🗂️ Karty wiedzy</p>
          <h1>Karty wiedzy</h1>
          <p className="lead">
            Każda rzecz, o której ktoś coś wie na forum, dostaje kartę z 4 szufladami: 👁️ jak rozpoznać, 📍 gdzie znaleźć,
            🔨 jak użyć i ⚠️ pułapki. Wiedza trafia tu sama z odpowiedzi, a ty możesz ją ocenić albo dorzucić swoją.
          </p>
          <input className="search" type="search" placeholder="Szukaj rzeczy…" value={q} onChange={(e) => setQ(e.target.value)} />
          {!cards && <p>⏳ Ładowanie…</p>}
          {cards && list.length === 0 && <p>{cards.length ? 'Nic takiego jeszcze nie ma.' : 'Kart jeszcze nie ma. Pojawią się, gdy ludzie zaczną odpowiadać na forum.'}</p>}
          <ul className="grid">
            {list.map((c) => (
              <li key={c.slug}>
                <Link href={`/forum/karta/${c.slug}`}>
                  <b>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</b>
                  <span>
                    {Object.entries(ICONS).map(([d, i]) => (
                      <em key={d} className={c.drawers[d] ? '' : 'none'} title={c.drawers[d] ? `${c.drawers[d]} kawałków` : 'pusta szuflada'}>{i}{c.drawers[d] || 0}</em>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style jsx global>{`
        .cards-page { min-height: 100vh; background: #008080; padding: 20px 12px; font-family: 'MS Sans Serif', Tahoma, sans-serif; }
        .cards-page .window { max-width: 900px; margin: 0 auto; background: #c0c0c0; border: 3px outset #fff; }
        .cards-page .title-bar { background: linear-gradient(90deg, #000080 0%, #1084d0 100%); color: #fff; padding: 4px 8px; font-weight: bold; display: flex; justify-content: space-between; }
        .cards-page .close-btn { color: #fff; text-decoration: none; }
        .cards-page .content { padding: 16px; background: #fff; margin: 4px; }
        .cards-page .crumbs { font-size: 13px; margin: 0 0 8px; }
        .cards-page h1 { margin: 4px 0 6px; font-size: 24px; color: #000080; }
        .cards-page .lead { font-size: 14px; color: #444; line-height: 1.45; }
        .cards-page .search { width: 100%; box-sizing: border-box; padding: 8px; font-size: 15px; border: 2px inset #fff; margin: 8px 0 12px; }
        .cards-page .grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
        .cards-page .grid a { display: flex; flex-direction: column; gap: 4px; padding: 10px; border: 2px outset #fff; background: #f4f4f4; color: #000; text-decoration: none; }
        .cards-page .grid a:hover { background: #e6f4e6; }
        .cards-page .grid b { font-size: 15px; }
        .cards-page .grid span { display: flex; gap: 8px; font-size: 12px; }
        .cards-page .grid em { font-style: normal; }
        .cards-page .grid em.none { opacity: 0.35; }
      `}</style>
    </div>
  );
}
