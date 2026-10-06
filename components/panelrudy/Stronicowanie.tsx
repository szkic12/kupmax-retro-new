'use client';

// ═══════════════════════════════════════════════════════════════════
//  STRONICOWANIE PANELU RUDY — jedno dla wszystkich zakładek (06.10.2026)
//
//  Przy 30 wpisach panel pokazywał 30 na raz, przy 200 byłoby 200.
//  Teraz każda lista: pole szukania, po 20 na stronę, przełącznik stron.
//
//    const s = useStrony(newsList, { szukaj: (n) => n.title, najnowsze: true });
//    {s.pasek}
//    {s.kawalek.map(([n, i]) => …)}   // i = miejsce w CAŁEJ liście
//    {s.strony}
//
//  `najnowsze: true` — sortuje po dacie (createdAt, created_at, addedAt…),
//  najnowsze na górze. Bez tego zostaje kolejność z listy — tam, gdzie
//  kolejność coś znaczy (listki koniczyny, zdjęcia pod skrzydłami,
//  playlista), bo przyciski „wyżej/niżej" działają na tej kolejności.
//  Dlatego `i` to zawsze numer w całej liście, nie na stronie.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, type ReactNode } from 'react';

const POLA_DATY = ['createdAt', 'created_at', 'addedAt', 'added_at', 'uploadedAt', 'uploaded_at',
  'publishedAt', 'published_at', 'timestamp', 'date', 'updatedAt', 'updated_at'];

function czas(x: unknown): number {
  if (!x || typeof x !== 'object') return 0;
  const o = x as Record<string, unknown>;
  for (const p of POLA_DATY) {
    const v = o[p];
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    if (typeof v === 'string') {
      const t = Date.parse(v);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

/** Tekst do szukania: domyślnie wszystkie pola tekstowe wpisu. */
function caly(x: unknown): string {
  if (!x || typeof x !== 'object') return String(x ?? '');
  return Object.values(x as Record<string, unknown>)
    .filter((v) => typeof v === 'string' && v.length < 2000)
    .join(' ');
}

// Pasek ma zająć cały wiersz także wtedy, gdy lista to siatka albo flex.
const CALY_WIERSZ = { gridColumn: '1 / -1', flexBasis: '100%', width: '100%' } as const;

const bezOgonkow = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

export function useStrony<T>(lista: T[] | null | undefined, opcje: {
  szukaj?: (x: T) => string;
  najnowsze?: boolean;
  naStrone?: number;
  /** Bez pola szukania (np. lista z kilkoma pozycjami). */
  bezSzukania?: boolean;
  podpowiedz?: string;
} = {}) {
  const naStrone = opcje.naStrone ?? 20;
  const [szukane, setSzukane] = useState('');
  const [strona, setStrona] = useState(1);
  const { szukaj, najnowsze } = opcje;

  const wybrane = useMemo(() => {
    const zNumerem = (lista ?? []).map((x, i) => [x, i] as [T, number]);
    const q = bezOgonkow(szukane.trim());
    const pasujace = q
      ? zNumerem.filter(([x]) => bezOgonkow(szukaj ? szukaj(x) : caly(x)).includes(q))
      : zNumerem;
    return najnowsze ? [...pasujace].sort(([a], [b]) => czas(b) - czas(a)) : pasujace;
  }, [lista, szukane, szukaj, najnowsze]);

  // Nowe szukanie = od pierwszej strony.
  useEffect(() => { setStrona(1); }, [szukane]);

  const ileStron = Math.max(1, Math.ceil(wybrane.length / naStrone));
  const teraz = Math.min(strona, ileStron);
  const kawalek = wybrane.slice((teraz - 1) * naStrone, teraz * naStrone);
  const wszystkich = (lista ?? []).length;

  const pasek: ReactNode = opcje.bezSzukania || wszystkich <= 5 ? null : (
    <div style={{ ...CALY_WIERSZ, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '0 0 10px' }}>
      <input
        type="search" value={szukane} onChange={(e) => setSzukane(e.target.value)}
        placeholder={opcje.podpowiedz ?? '🔍 Szukaj…'}
        style={{ flex: '1 1 220px', maxWidth: '360px', padding: '6px 8px', border: '2px inset #808080',
                 fontSize: '13px', background: '#fff', color: '#000' }}
      />
      <span style={{ fontSize: '12px', color: '#666' }}>
        {szukane.trim() ? `znaleziono ${wybrane.length} z ${wszystkich}` : `razem ${wszystkich}`}
        {najnowsze && ' · najnowsze na górze'}
      </span>
    </div>
  );

  const strony: ReactNode = wybrane.length <= naStrone ? null : (
    <PasekStron strona={teraz} ileStron={ileStron} setStrona={setStrona}
                od={(teraz - 1) * naStrone + 1} doo={Math.min(teraz * naStrone, wybrane.length)}
                wszystkich={wybrane.length} />
  );

  return { kawalek, pasek, strony, wszystkich, znalezionych: wybrane.length, szukane };
}

function PasekStron({ strona, ileStron, setStrona, od, doo, wszystkich }: {
  strona: number; ileStron: number; setStrona: (n: number) => void;
  od: number; doo: number; wszystkich: number;
}) {
  const btn = (wylaczony: boolean) => ({
    padding: '4px 10px', fontSize: '12px', cursor: wylaczony ? 'default' : 'pointer',
    border: '2px outset #c0c0c0', background: '#c0c0c0', color: '#000', opacity: wylaczony ? 0.45 : 1,
  });
  const idz = (n: number) => setStrona(Math.min(Math.max(1, n), ileStron));
  return (
    <div style={{ ...CALY_WIERSZ, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '12px 0 4px' }}>
      <button type="button" style={btn(strona <= 1)} disabled={strona <= 1} onClick={() => idz(1)}>« pierwsza</button>
      <button type="button" style={btn(strona <= 1)} disabled={strona <= 1} onClick={() => idz(strona - 1)}>‹ wstecz</button>
      <span style={{ fontSize: '12px', padding: '0 6px' }}>
        {od}–{doo} z {wszystkich} · strona {strona}/{ileStron}
      </span>
      <button type="button" style={btn(strona >= ileStron)} disabled={strona >= ileStron} onClick={() => idz(strona + 1)}>dalej ›</button>
      <button type="button" style={btn(strona >= ileStron)} disabled={strona >= ileStron} onClick={() => idz(ileStron)}>ostatnia »</button>
    </div>
  );
}
