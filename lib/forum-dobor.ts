// Dobór fachowców do problemów z forum (📞 Telefony) — na serwerze, bez laptopa.
// Firmy z regionu Brata leżą w zamkniętej tabeli forum_firmy. Haiku wybiera branże, a my losujemy specjalistów
// z Wrocławia i Opola, potem z dolnośląskiego i opolskiego. Pomijamy „nie dzwonić” i dzwonionych w ostatnim miesiącu.
import { forumDb } from '@/lib/forum-db';
import { ask } from '@/lib/forum-ai';
import { logger } from '@/lib/logger';
import { stanFachowcow } from '@/lib/forum-experts';
import { shelfMap } from '@/lib/forum-trust';

type Row = Record<string, any>;
const MIASTA = ['Wrocław', 'Opole'];
const WOJ = ['dolnośląskie', 'opolskie'];
const OD = '2026-11-03'; // starsze wątki to rozmowy o stronie, nie problemy
// Kolejność Brata: od góry katalogu, medytacja na końcu
export const KOLEJNOSC = ['dom', 'zrob-to-sam', 'auto', 'komputery', 'praca', 'urzedy', 'zdrowie', 'glowa', 'dzieci', 'zwierzeta',
  'kuchnia', 'ogrod', 'muzyka', 'gry', 'podroze', 'retro', 'kupmax', 'o-wszystkim', 'medytacja'];

const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let branzeCache: { list: string[]; at: number } | null = null;
async function listaBranz() {
  if (branzeCache && Date.now() - branzeCache.at < 60 * 60 * 1000) return branzeCache.list;
  const out: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await forumDb.from('forum_branze').select('name').gte('firms', 5).order('name').range(from, from + 999);
    out.push(...(data || []).map((b) => b.name));
    if (!data || data.length < 1000) break;
  }
  branzeCache = { list: out, at: Date.now() };
  return out;
}

const SCHEMA = { type: 'object', properties: { branze: { type: 'array', items: { type: 'string' } } }, required: ['branze'], additionalProperties: false };

export async function wybierzBranze(t: Row) {
  const lista = await listaBranz();
  const out = await ask([{
    type: 'text',
    text: `PROBLEM Z FORUM (kategoria ${t.category_id}): ${t.title}\n${String(t.body || '').slice(0, 800)}\n\n`
      + 'Wybierz z poniższej listy 2–4 branże firm, do których warto zadzwonić i zapytać fachowca o ten problem, OD NAJBARDZIEJ KONKRETNEJ '
      + '(np. najpierw „Hydraulicy”, a dopiero na końcu ogólne „Budowlane usługi”). Przepisz nazwy dokładnie tak, jak stoją na liście. '
      + 'Wybieraj usługi i rzemieślników, którzy na co dzień robią takie rzeczy, a nie producentów i hurtownie, chyba że problem dotyczy produkcji albo zakupu.\n\n'
      + `LISTA BRANŻ:\n${lista.join('\n')}`,
  }], 'Dobierasz fachowców do problemów z forum. Odpowiadasz tylko nazwami z listy.', 1500, { model: 'claude-haiku-5-5', schema: SCHEMA });
  const zbior = new Set(lista);
  return ((JSON.parse(out || '{"branze":[]}').branze || []) as string[]).filter((b) => zbior.has(b)).slice(0, 4);
}

async function kandydaci(branze: string[], ile: number, wykluczone: Set<string>) {
  const wynik: Row[] = [];
  for (const b of branze) {
    for (const [col, vals] of [['miasto', MIASTA], ['woj', WOJ]] as const) {
      const { data } = await forumDb.from('forum_firmy').select('*').contains('branze', [b]).in(col, vals as unknown as string[]).limit(300);
      // Specjaliści (1–3 branże) przed firmami „od wszystkiego”, z ofertą przed bez, a w środku losowo
      const rows = shuffle(data || []).sort((x, y) => Number(y.branze.length <= 3) - Number(x.branze.length <= 3) || Number(!!y.oferta) - Number(!!x.oferta));
      for (const r of rows) {
        if (wykluczone.has(r.phone) || wynik.some((w) => w.phone === r.phone)) continue;
        // Branża, dla której wybraliśmy firmę, idzie na początek (z niej robi się podpis „fachowiec (hydraulicy)”)
        wynik.push({ ...r, branza: [b, ...r.branze.filter((x: string) => x !== b)].join('; ') });
        if (wynik.length >= ile) return wynik;
      }
    }
  }
  return wynik;
}

// Lista rozmów: problemy bez kompletu rozmów (mniej niż 3 odebrane i nic nie czeka) po kolei z katalogu Brata
export async function zaplanuj(opts: { dzien?: string; watkow?: number; naProblem?: number; watek?: string } = {}) {
  const dzien = opts.dzien || new Date().toISOString().slice(0, 10);
  const [{ data: kats }, { data: watki }, { data: calls }, { data: blok }] = await Promise.all([
    forumDb.from('forum_categories').select('id, is_adult'),
    forumDb.from('forum_threads').select('id, title, body, category_id, created_at').eq('status', 'widoczny').gte('created_at', OD).order('created_at').limit(500),
    forumDb.from('forum_calls').select('thread_id, status, verdict, called_at').limit(10000),
    forumDb.from('forum_contacts').select('phone').or(`do_not_call.eq.true,last_called_at.gt.${new Date(Date.now() - 30 * 86400000).toISOString()}`).limit(100000),
  ]);
  const adult = new Set((kats || []).filter((k) => k.is_adult).map((k) => k.id));
  const otwarte = new Map<string, number>(), poWatku = new Map<string, Row[]>();
  (calls || []).forEach((c) => {
    if (['do_zrobienia', 'oddzwoni'].includes(c.status)) otwarte.set(c.thread_id, (otwarte.get(c.thread_id) || 0) + 1);
    poWatku.set(c.thread_id, [...(poWatku.get(c.thread_id) || []), c]);
  });
  const shelf = await shelfMap();
  // Dzwonimy, dopóki nie ma 3 zgodnych fachowców, a po terminie przydatności kategorii od nowa
  const trzebaDzwonic = (w: Row) => {
    const s = stanFachowcow(poWatku.get(w.id) || [], shelf.get(w.category_id));
    return !s.werdykt || s.przeterminowane;
  };
  const doZrobienia = (watki || [])
    .filter((w) => !adult.has(w.category_id) && (opts.watek ? w.id === opts.watek : true) && trzebaDzwonic(w) && !otwarte.get(w.id))
    .sort((a, b) => (KOLEJNOSC.indexOf(a.category_id) + 1 || 99) - (KOLEJNOSC.indexOf(b.category_id) + 1 || 99) || a.created_at.localeCompare(b.created_at))
    .slice(0, opts.watkow || 5);

  const uzyte = new Set((blok || []).map((b) => b.phone));
  const plan: Row[] = [];
  for (const w of doZrobienia) {
    try {
      const branze = await wybierzBranze(w);
      const firmy = await kandydaci(branze, opts.naProblem || 4, uzyte);
      for (const f of firmy) {
        uzyte.add(f.phone);
        const { data: k, error } = await forumDb.from('forum_contacts').upsert({
          phone: f.phone, name: f.name, branza: f.branza, oferta: f.oferta, miasto: f.miasto, osoba: f.osoba, od_roku: f.od_roku, zrodlo: f.zrodlo,
        }, { onConflict: 'phone' }).select('id, do_not_call').single();
        if (error || !k || k.do_not_call) continue;
        await forumDb.from('forum_calls').upsert({ thread_id: w.id, contact_id: k.id, plan_date: dzien }, { onConflict: 'thread_id,contact_id' });
        plan.push({ thread: w.title, firma: f.name, miasto: f.miasto, branza: branze[0] });
      }
    } catch (e) {
      logger.error('forum dobór:', e);
    }
  }
  return { dzien, problemow: doZrobienia.length, rozmow: plan.length, plan };
}

// 1 rozmowa, 2–4 rozmowy (ale 12–14 rozmów), 5+ rozmów
const rozmow = (n: number) => `${n} ${n === 1 ? 'rozmowa' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'rozmowy' : 'rozmów'}`;

const esc = (s: string) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

// Poranny mail do Brata z listą na dziś (Resend)
export async function wyslijMail() {
  const key = process.env.RESEND_API_KEY;
  // Lista telefonów idzie na skrzynkę firmową (decyzja Brata 04.11: maile od forum na kupmax, nie na Gmaila)
  const to = process.env.FORUM_TELEFONY_MAIL || process.env.ADMIN_EMAIL || 'kontakt@kupmax.pl';
  if (!key) return { sent: false, reason: 'brak RESEND_API_KEY' };
  const { data: calls } = await forumDb.from('forum_calls')
    .select('id, status, forum_contacts(name, phone, miasto, osoba, branza), forum_threads(id, title, status)')
    .in('status', ['do_zrobienia', 'oddzwoni']).order('created_at').limit(200);
  const grupy = new Map<string, Row>();
  for (const c of (calls || []) as Row[]) {
    if (c.forum_threads?.status !== 'widoczny') continue;
    const g = grupy.get(c.forum_threads.id) || { title: c.forum_threads.title, id: c.forum_threads.id, firmy: [] as Row[] };
    g.firmy.push({ ...c.forum_contacts, oddzwoni: c.status === 'oddzwoni' });
    grupy.set(c.forum_threads.id, g);
  }
  if (!grupy.size) return { sent: false, reason: 'nic do dzwonienia' };
  const n = [...grupy.values()].reduce((s, g) => s + g.firmy.length, 0);
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px">
    <h2 style="color:#000080">📞 Dzień dobry, Dziadek! ${rozmow(n)} na dziś</h2>
    <p style="background:#fffbe6;padding:8px;border:1px solid #d9a400">Na początku: przedstaw się, powiedz, że numer jest z publicznego rejestru firm, i że prosisz o fachową opinię do darmowego forum. Niczego nie sprzedajesz.</p>
    ${[...grupy.values()].map((g) => `<h3 style="margin:18px 0 6px">❓ <a href="https://www.kupmax.pl/forum/thread/${g.id}">${esc(g.title)}</a></h3>
      ${g.firmy.map((f: Row) => `<p style="margin:6px 0;padding:8px;border:1px solid #ccc">
        <b>${esc(f.name)}</b>${f.osoba ? ` · ${esc(f.osoba)}` : ''}${f.miasto ? ` · ${esc(f.miasto)}` : ''}${f.oddzwoni ? ' · 🔁 miał oddzwonić' : ''}<br>
        <small>${esc(String(f.branza || '').split(';')[0])}</small><br>
        <a href="tel:+48${f.phone}" style="display:inline-block;margin-top:6px;padding:8px 14px;background:#b8f0b8;color:#000;text-decoration:none;font-weight:bold;border:1px solid #6b6">📞 Zadzwoń ${f.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>`).join('')}
      <p style="margin:8px 0 0"><a href="https://www.kupmax.pl/forum/thread/${g.id}" style="font-size:15px;font-weight:bold">➡️ Otwórz problem i zapisz rozmowy</a> <small>(ramka „📞 Fachowcy” pod pytaniem)</small></p>`).join('')}
  </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Forum kupmax <powiadomienia@bossxd.com>', to: [to], subject: `📞 ${rozmow(n)} na dziś: ${[...grupy.values()][0].title.slice(0, 60)}`, html }),
  });
  return { sent: res.ok, reason: res.ok ? '' : `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
}
