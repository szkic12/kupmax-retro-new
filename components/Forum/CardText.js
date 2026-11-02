'use client';
// Tekst wpisu, w którym nazwy rzeczy z kart wiedzy są linkami do kart („kamieniem wodnym” → /forum/karta/kamien-wodny).
// Każda karta jest linkowana tylko raz na wpis, żeby tekst nie zrobił się niebieski.
import Link from 'next/link';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function CardText({ text, cards }) {
  if (!text || !cards?.length) return text || null;
  const forms = cards
    .flatMap((c) => [c.name, ...(c.aliases || [])].map((f) => ({ f: f.toLowerCase(), card: c })))
    .filter((x) => x.f.length >= 3)
    .sort((a, b) => b.f.length - a.f.length);
  if (!forms.length) return text;
  const byForm = new Map(forms.map((x) => [x.f, x.card]));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${forms.map((x) => esc(x.f)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const used = new Set();
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const card = byForm.get(m[0].toLowerCase());
    if (!card || used.has(card.slug)) continue;
    used.add(card.slug);
    out.push(text.slice(last, m.index));
    out.push(<Link key={m.index} href={`/forum/karta/${card.slug}`} className="card-link" title={`Karta wiedzy: ${card.name}`}>{m[0]}</Link>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return (
    <>
      {out}
      <style jsx global>{`
        .card-link { color: #005000; text-decoration: underline dotted; text-underline-offset: 3px; }
        .card-link:hover { background: #e6f4e6; }
      `}</style>
    </>
  );
}
