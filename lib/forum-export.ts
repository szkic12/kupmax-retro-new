// Eksport do nauki (K10): co noc paczka z wiedzy, która przeszła przez sito (K9).
// Tylko dosłowne cytaty od ludzi, którzy zgodzili się na naukę modelu; bez kawałków pisanych przez AI
// (regulamin Anthropic zabrania trenowania innych modeli na tekstach Claude'a) i bez nagrań głosu.
// Wiedza ze strefy 18+ idzie do osobnej paczki. Format: JSONL z „messages” (user → assistant), gotowy pod QLoRA.
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { forumDb } from '@/lib/forum-db';
import { client, bucket } from '@/lib/forum-voice';
import { passedSieve } from '@/lib/forum-trust';
import { DRAWERS, type Drawer } from '@/lib/forum-cards';

type Row = Record<string, any>;
const PREFIX = 'forum/export';
const FILES = ['qa', 'karty', 'warianty'] as const;
const DRAWER_ASK: Record<Drawer, (n: string) => string> = {
  rozpoznac: (n) => `Jak rozpoznać: ${n}?`,
  gdzie: (n) => `Gdzie znaleźć albo kupić: ${n}?`,
  uzyc: (n) => `Jak użyć: ${n}?`,
  pulapki: (n) => `Na co uważać: ${n}?`,
};

// Do nauki idzie dosłowny cytat człowieka (forum_claims.quote), nie przeróbka AI z rozbioru
const line = (c: Row) => String(c.quote).trim();
const uniq = (xs: string[]) => [...new Set(xs)];
const msg = (user: string, assistant: string, meta: Row) => JSON.stringify({ messages: [{ role: 'user', content: user }, { role: 'assistant', content: assistant }], meta });

async function all(table: string, select: string, filter: (q: any) => any) {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(forumDb.from(table).select(select)).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

export async function buildExport() {
  // Kawałki, które przeszły sito, od ludzi (nie od AI)
  const claims = (await all('forum_claims', '*', (q) => q.eq('status', 'widoczny').eq('is_ai', false).or('seal.eq.tak,verdict.in.(sprawdzone,praktyka)')))
    .filter(passedSieve);

  const threadIds = [...new Set(claims.map((c) => c.thread_id).filter(Boolean))];
  const postIds = [...new Set(claims.map((c) => c.post_id).filter(Boolean))];
  const cardIds = [...new Set(claims.map((c) => c.card_id).filter(Boolean))];
  const [threads, posts, cats, cards] = await Promise.all([
    threadIds.length ? all('forum_threads', 'id, title, body, author_id, status, category_id, summary', (q) => q.in('id', threadIds)) : [],
    postIds.length ? all('forum_posts', 'id, status', (q) => q.in('id', postIds)) : [],
    all('forum_categories', 'id, is_adult', (q) => q),
    cardIds.length ? all('forum_cards', 'id, name', (q) => q.in('id', cardIds)) : [],
  ]);
  // Zgoda: autorzy kawałków i autorzy pytań (pytanie też jest ich tekstem)
  const authorIds = [...new Set([...claims.map((c) => c.author_id), ...threads.map((t) => t.author_id)].filter(Boolean))];
  const profs = authorIds.length ? await all('forum_profiles', 'user_id, consent_training', (q) => q.in('user_id', authorIds)) : [];
  const consent = new Set(profs.filter((p) => p.consent_training).map((p) => p.user_id));
  const threadById = new Map(threads.map((t) => [t.id, t]));
  const postOk = new Set(posts.filter((p) => p.status === 'widoczny').map((p) => p.id));
  const adultCat = new Set(cats.filter((c) => c.is_adult).map((c) => c.id));
  const cardName = new Map(cards.map((c) => [c.id, c.name]));

  // Zgoda autora, dosłowny cytat, widoczny wpis i wątek
  const ok = claims.filter((c) => {
    if (!c.quote) return false;
    if (!c.author_id || !consent.has(c.author_id)) return false;
    if (!c.post_id) return true; // wpis dorzucony na kartę
    const t = threadById.get(c.thread_id);
    return postOk.has(c.post_id) && t?.status === 'widoczny';
  });
  const adultOf = (c: Row) => !!c.thread_id && adultCat.has(threadById.get(c.thread_id)?.category_id);

  const packs: Record<'ogolne' | '18', Record<(typeof FILES)[number], string[]>> = {
    ogolne: { qa: [], karty: [], warianty: [] },
    '18': { qa: [], karty: [], warianty: [] },
  };

  // 1. Pytanie → pełna, sprawdzona odpowiedź (kolejność z „pełnej odpowiedzi”, tylko kawałki z sita).
  //    Pytanie jest tekstem autora wątku, więc też wymaga jego zgody.
  const byThread = new Map<string, Row[]>();
  ok.filter((c) => c.thread_id).forEach((c) => byThread.set(c.thread_id, [...(byThread.get(c.thread_id) || []), c]));
  for (const [tid, list] of byThread) {
    const t = threadById.get(tid);
    if (!t || !consent.has(t.author_id)) continue;
    const order = (t.summary?.groups || []).flatMap((g: Row) => g.claims as string[]);
    const sorted = [...list].sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib) || String(a.created_at).localeCompare(String(b.created_at));
    });
    const question = `${t.title}\n${t.body || ''}`.trim();
    packs[adultOf(list[0]) ? '18' : 'ogolne'].qa.push(msg(question, uniq(sorted.map(line)).join('\n'), { thread: tid, claims: sorted.map((c) => c.id) }));
  }

  // 2. Karty: jedna para pytanie → odpowiedź na każdą szufladę
  const byDrawer = new Map<string, Row[]>();
  ok.filter((c) => c.card_id && c.drawer && !adultOf(c)).forEach((c) => {
    const k = `${c.card_id}|${c.drawer}`;
    byDrawer.set(k, [...(byDrawer.get(k) || []), c]);
  });
  for (const [k, list] of byDrawer) {
    const [cardId, drawer] = k.split('|') as [string, Drawer];
    const name = cardName.get(cardId);
    if (!name || !(drawer in DRAWERS)) continue;
    packs.ogolne.karty.push(msg(DRAWER_ASK[drawer](name), uniq(list.map(line)).join('\n'), { card: name, drawer, claims: list.map((c) => c.id) }));
  }

  // 3. Warianty: pytanie z wątku (słowa człowieka) albo nazwa karty → cytat z wariantem
  for (const c of ok.filter((x) => x.kind === 'wariant')) {
    const about = threadById.get(c.thread_id)?.title || (c.card_id ? cardName.get(c.card_id) : null);
    if (!about) continue;
    packs[adultOf(c) ? '18' : 'ogolne'].warianty.push(msg(about, line(c), { claim: c.id }));
  }
  return packs;
}

const today = () => new Date().toISOString().slice(0, 10);

async function putJson(key: string, body: string, type = 'application/json') {
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: type }));
}

export async function readManifest(): Promise<Row | null> {
  try {
    const res = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/latest.json` }));
    return JSON.parse(await res.Body!.transformToString());
  } catch {
    return null;
  }
}

// Zapisuje paczkę dnia do S3 (prywatnie) i manifest z liczbami
export async function runExport() {
  const packs = await buildExport();
  const date = today();
  const counts: Row = {};
  for (const [pack, files] of Object.entries(packs)) {
    counts[pack] = {};
    for (const f of FILES) {
      counts[pack][f] = files[f].length;
      if (files[f].length) await putJson(`${PREFIX}/${date}/${pack}/${f}.jsonl`, files[f].join('\n') + '\n', 'application/x-ndjson');
    }
  }
  const manifest = { date, at: new Date().toISOString(), counts };
  await putJson(`${PREFIX}/${date}/manifest.json`, JSON.stringify(manifest, null, 2));
  await putJson(`${PREFIX}/latest.json`, JSON.stringify(manifest, null, 2));
  return manifest;
}

// Linki do pobrania ostatniej paczki (ważne godzinę)
export async function downloadLinks(manifest: Row) {
  const links: Row = {};
  for (const [pack, files] of Object.entries(manifest.counts || {})) {
    for (const [f, n] of Object.entries(files as Row)) {
      if (!n) continue;
      links[`${pack}/${f}.jsonl`] = await getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${manifest.date}/${pack}/${f}.jsonl` }), { expiresIn: 3600 });
    }
  }
  return links;
}
