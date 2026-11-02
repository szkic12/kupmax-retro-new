// Karty wiedzy (K8): rzecz z forum (np. „kamień wodny”) z 4 szufladami.
// Kawałki wiedzy z odpowiedzi (twierdzenia K7) trafiają do szuflad same, a ludzie mogą dorzucać prosto na kartę.
import { forumDb } from '@/lib/forum-db';
import { publicPhotoUrl } from '@/lib/forum-photos';
import { publicVoiceUrl } from '@/lib/forum-voice';
import { toClaim } from '@/lib/forum-claims';

export const DRAWERS = {
  rozpoznac: { icon: '👁️', label: 'Jak rozpoznać' },
  gdzie: { icon: '📍', label: 'Gdzie znaleźć' },
  uzyc: { icon: '🔨', label: 'Jak użyć' },
  pulapki: { icon: '⚠️', label: 'Pułapki' },
} as const;
export type Drawer = keyof typeof DRAWERS;
export const isDrawer = (d: unknown): d is Drawer => typeof d === 'string' && d in DRAWERS;

const PL: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[ąćęłńóśźż]/g, (c) => PL[c]).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const cleanName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);

// Nazwy istniejących kart, żeby AI przypinało do nich, zamiast tworzyć duplikaty
export async function knownCardNames(limit = 300) {
  const { data } = await forumDb.from('forum_cards').select('name').order('updated_at', { ascending: false }).limit(limit);
  return (data || []).map((c) => c.name);
}

// Karta po nazwie: znajdź albo załóż, dopisz nowe odmiany słowa
export async function ensureCard(rawName: string, forms: string[] = []) {
  const name = cleanName(rawName);
  const slug = slugify(name);
  if (name.length < 2 || slug.length < 2) return null;
  // Odmiana musi mieć tyle słów co nazwa: samo „kamień” nie może prowadzić do karty „kamień wodny”
  const words = (x: string) => x.split(' ').length;
  const newForms = [...new Set(forms.map(cleanName).filter((f) => f.length >= 2 && f !== name && words(f) >= words(name)))].slice(0, 10);
  const { data: found } = await forumDb.from('forum_cards').select('id, aliases').eq('slug', slug).maybeSingle();
  if (found) {
    const aliases = [...new Set([...(found.aliases || []), ...newForms])].slice(0, 30);
    await forumDb.from('forum_cards').update({ aliases, updated_at: new Date().toISOString() }).eq('id', found.id);
    return found.id as string;
  }
  const { data, error } = await forumDb.from('forum_cards').insert({ slug, name, aliases: newForms }).select('id').single();
  if (error) {
    // Ktoś założył tę samą kartę w tej samej chwili
    const { data: again } = await forumDb.from('forum_cards').select('id').eq('slug', slug).maybeSingle();
    return (again?.id as string) || null;
  }
  return data.id as string;
}

// Karty, do których prowadzą słowa w wątku (do podlinkowania tekstu)
export async function cardsForThread(cardIds: string[]) {
  const ids = [...new Set(cardIds.filter(Boolean))];
  if (!ids.length) return [];
  const { data } = await forumDb.from('forum_cards').select('id, slug, name, aliases').in('id', ids);
  return (data || []).map((c) => ({ id: c.id, slug: c.slug, name: c.name, aliases: c.aliases || [] }));
}

const score = (c: any) => c.yes - c.no + c.done;

// Strona karty: szuflady z kawałkami (z wątków i dorzuconymi), posortowane od najlepiej ocenionych
export async function cardPage(slug: string, userId?: string) {
  const { data: card } = await forumDb.from('forum_cards').select('*').eq('slug', slug).maybeSingle();
  if (!card) return null;
  const { data: rows } = await forumDb.from('forum_claims').select('*').eq('card_id', card.id).eq('status', 'widoczny').limit(400);

  // Kawałki z wątków: tylko z widocznych odpowiedzi w widocznych wątkach spoza 18+
  const postIds = [...new Set((rows || []).map((c) => c.post_id).filter(Boolean))];
  const { data: posts } = postIds.length
    ? await forumDb.from('forum_posts').select('id, thread_id, photos, status, forum_threads!inner(title, status, forum_categories!inner(is_adult))').in('id', postIds)
    : { data: [] };
  const okPost = new Map<string, any>();
  (posts || []).forEach((p: any) => {
    if (p.status === 'widoczny' && p.forum_threads?.status === 'widoczny' && !p.forum_threads?.forum_categories?.is_adult) okPost.set(p.id, p);
  });
  const claims = (rows || []).filter((c) => !c.post_id || okPost.has(c.post_id));

  const votes = new Map<string, string>();
  if (userId && claims.length) {
    const { data } = await forumDb.from('forum_claim_votes').select('claim_id, vote').eq('user_id', userId).in('claim_id', claims.map((c) => c.id));
    (data || []).forEach((v) => votes.set(v.claim_id, v.vote));
  }

  const drawers = Object.fromEntries((Object.keys(DRAWERS) as Drawer[]).map((d) => [d, [] as any[]]));
  for (const c of claims.sort((a, b) => score(b) - score(a))) {
    if (!c.drawer || !(c.drawer in drawers)) continue;
    const p = c.post_id ? okPost.get(c.post_id) : null;
    drawers[c.drawer].push({
      ...toClaim(c, votes.get(c.id)),
      source: p ? { threadId: p.thread_id, title: p.forum_threads.title } : null,
      // Zdjęcia: dorzucone do karty albo z odpowiedzi, z której pochodzi kawałek
      photos: (c.photos?.length ? c.photos : p?.photos || []).slice(0, 3).map(publicPhotoUrl),
      voiceUrl: publicVoiceUrl(c.voice_url),
      voiceMode: c.voice_mode,
      voiceSeconds: c.voice_seconds,
      direct: !c.post_id,
    });
  }
  return { card: { id: card.id, slug: card.slug, name: card.name, aliases: card.aliases }, drawers };
}

// Spis kart z liczbą kawałków w szufladach
export async function cardList() {
  const [{ data: cards }, { data: claims }] = await Promise.all([
    forumDb.from('forum_cards').select('id, slug, name, updated_at').order('name').limit(1000),
    forumDb.from('forum_claims').select('card_id, drawer').not('card_id', 'is', null).eq('status', 'widoczny').limit(10000),
  ]);
  const count = new Map<string, Record<string, number>>();
  (claims || []).forEach((c) => {
    const m = count.get(c.card_id) || {};
    m[c.drawer] = (m[c.drawer] || 0) + 1;
    count.set(c.card_id, m);
  });
  return (cards || []).map((c) => ({ slug: c.slug, name: c.name, drawers: count.get(c.id) || {} })).filter((c) => Object.keys(c.drawers).length);
}
