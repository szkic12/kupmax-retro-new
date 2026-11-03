import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { forumDb } from '@/lib/forum-db';
import { isCategory, reasonText } from '@/lib/forum-moderation';
import { bumpPenalty, setSeal, isStale, shelfMap } from '@/lib/forum-trust';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID = /^[0-9a-f-]{36}$/i;
const COLS = 'id, author_nick, author_avatar, body, status, removed_reason, removed_at, created_at, photos, model, voice_url';
const CLAIM_COLS = 'id, author_nick, body, status, removed_reason, removed_at, created_at, photos, voice_url, drawer, forum_cards(slug, name)';
const TABLE: Record<string, string> = { thread: 'forum_threads', post: 'forum_posts', claim: 'forum_claims' };

// GET: zgłoszenia + ostatnie wpisy ze wszystkich kategorii (także 18+ i usunięte), tylko dla Brata
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const [reports, threads, posts, claims, pending] = await Promise.all([
      forumDb.from('forum_reports').select('*').order('status', { ascending: true }).order('created_at', { ascending: false }).limit(100),
      forumDb.from('forum_threads').select(`${COLS}, title, category_id`).order('created_at', { ascending: false }).limit(40),
      forumDb.from('forum_posts').select(`${COLS}, thread_id, is_ai`).order('created_at', { ascending: false }).limit(40),
      forumDb.from('forum_claims').select(CLAIM_COLS).is('post_id', null).order('created_at', { ascending: false }).limit(40),
      // Kolejka do pieczęci: kawałki ludzi bez pieczęci (AI i tak nie idzie do nauki); sporne i z głosami na górze
      forumDb.from('forum_claims').select('id, kind, body, condition, quote, author_nick, author_id, is_ai, thread_id, post_id, yes, no, done, wyes, wno, wdone, verdict, seal, created_at, forum_cards(slug, name)')
        .eq('status', 'widoczny').is('seal', null).eq('is_ai', false).order('created_at', { ascending: false }).limit(300),
    ]);
    if (reports.error) throw reports.error;

    // Podgląd zgłoszonych wpisów (mogą być starsze niż ostatnie 40)
    const ids = (t: string) => [...new Set((reports.data || []).filter((r) => r.target_type === t).map((r) => r.target_id))];
    const [rt, rp, rc] = await Promise.all([
      ids('thread').length ? forumDb.from('forum_threads').select(`${COLS}, title, category_id`).in('id', ids('thread')) : { data: [] },
      ids('post').length ? forumDb.from('forum_posts').select(`${COLS}, thread_id`).in('id', ids('post')) : { data: [] },
      ids('claim').length ? forumDb.from('forum_claims').select(CLAIM_COLS).in('id', ids('claim')) : { data: [] },
    ]);
    const byId = new Map<string, any>([...(rt.data || []), ...(rp.data || []), ...(rc.data || [])].map((x: any) => [x.id, x]));

    return NextResponse.json({
      success: true,
      reports: (reports.data || []).map((r) => ({ ...r, target: byId.get(r.target_id) || null })),
      threads: threads.data || [],
      posts: posts.data || [],
      claims: claims.data || [],
      queue: [...(await staleQueue()), ...sealQueue(pending.data || [])],
    });
  } catch (error) {
    logger.error('forum moderacja GET:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}

// Timer wątpliwości: kawałki po terminie przydatności (najkrótszy termin to 12 miesięcy) wracają na górę kolejki
async function staleQueue() {
  const cut = new Date(Date.now() - 12 * 30.44 * 86400000).toISOString();
  const { data } = await forumDb.from('forum_claims')
    .select('id, kind, body, condition, quote, author_nick, author_id, is_ai, thread_id, post_id, yes, no, done, wyes, wno, wdone, verdict, seal, checked_at, created_at, forum_cards(slug, name), forum_threads(category_id)')
    .eq('status', 'widoczny').lt('checked_at', cut).limit(200);
  const shelf = await shelfMap();
  return (data || [])
    .filter((c: any) => isStale(c, c.forum_threads?.category_id ? shelf.get(c.forum_threads.category_id) : undefined))
    .map((c: any) => ({ ...c, stale: true }))
    .slice(0, 20);
}

// Najpierw sporne (są ✅ i ❌), potem tuż przy progu, potem z największą liczbą głosów
function sealQueue(rows: any[]) {
  const disputed = (c: any) => c.yes > 0 && c.no > 0;
  const near = (c: any) => !c.verdict;
  return rows
    .sort((a, b) => Number(disputed(b)) - Number(disputed(a)) || Number(near(b)) - Number(near(a)) || (b.yes + b.no + b.done) - (a.yes + a.no + a.done))
    .slice(0, 60);
}

// POST: usun | przywroc | zostaw | pieczec. Usunięcie zapisuje powód widoczny dla autora (DSA art. 17).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!(await verifyAdminToken(req, body))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const { action, targetType, targetId, category, note, seal } = body;
    const table = TABLE[targetType];
    if (!table || !UUID.test(targetId || '')) {
      return NextResponse.json({ success: false, error: 'Zły wpis' }, { status: 400 });
    }
    const now = new Date().toISOString();
    let decision = '';

    // Pieczęć Brata na kawałku wiedzy (sito K9): ✔ prawda / ✖ fałsz / null = zdejmij
    if (action === 'pieczec') {
      if (targetType !== 'claim' || ![null, 'tak', 'nie'].includes(seal ?? null)) return NextResponse.json({ success: false, error: 'Zła pieczęć' }, { status: 400 });
      const claim = await setSeal(targetId, seal ?? null);
      return NextResponse.json({ success: true, claim });
    }

    // Kara dla autora (niższy sufit wagi głosu) tylko przy zmianie widoczny ↔ usunięty
    const { data: before } = await forumDb.from(table).select('status, author_id').eq('id', targetId).maybeSingle();

    if (action === 'usun') {
      if (!isCategory(category)) return NextResponse.json({ success: false, error: 'Wybierz powód' }, { status: 400 });
      decision = reasonText(category, note);
      const { error } = await forumDb.from(table).update({ status: 'usuniety', removed_reason: decision, removed_at: now }).eq('id', targetId);
      if (error) throw error;
      if (before?.status === 'widoczny') await bumpPenalty(before.author_id, 'removed_count', 1);
    } else if (action === 'przywroc') {
      decision = 'Przywrócono po ponownym sprawdzeniu.';
      const { error } = await forumDb.from(table).update({ status: 'widoczny', removed_reason: null, removed_at: null }).eq('id', targetId);
      if (error) throw error;
      if (before?.status === 'usuniety') await bumpPenalty(before.author_id, 'removed_count', -1);
    } else if (action === 'zostaw') {
      decision = `Wpis zostaje: nie łamie zasad forum ani prawa.${note ? ` ${String(note).slice(0, 500)}` : ''}`;
    } else {
      return NextResponse.json({ success: false, error: 'Zła akcja' }, { status: 400 });
    }

    // Wszystkie otwarte zgłoszenia tego wpisu dostają decyzję
    if (action !== 'przywroc') {
      await forumDb.from('forum_reports')
        .update({ status: action === 'usun' ? 'usuniete' : 'zostaje', decision, decided_at: now })
        .eq('target_id', targetId).eq('status', 'nowe');
    }
    return NextResponse.json({ success: true, decision });
  } catch (error) {
    logger.error('forum moderacja POST:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}
