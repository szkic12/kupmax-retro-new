import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { forumDb } from '@/lib/forum-db';
import { isCategory, reasonText } from '@/lib/forum-moderation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID = /^[0-9a-f-]{36}$/i;
const COLS = 'id, author_nick, author_avatar, body, status, removed_reason, removed_at, created_at, photos, model, voice_url';

// GET: zgłoszenia + ostatnie wpisy ze wszystkich kategorii (także 18+ i usunięte), tylko dla Brata
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const [reports, threads, posts] = await Promise.all([
      forumDb.from('forum_reports').select('*').order('status', { ascending: true }).order('created_at', { ascending: false }).limit(100),
      forumDb.from('forum_threads').select(`${COLS}, title, category_id`).order('created_at', { ascending: false }).limit(40),
      forumDb.from('forum_posts').select(`${COLS}, thread_id, is_ai`).order('created_at', { ascending: false }).limit(40),
    ]);
    if (reports.error) throw reports.error;

    // Podgląd zgłoszonych wpisów (mogą być starsze niż ostatnie 40)
    const ids = (t: string) => [...new Set((reports.data || []).filter((r) => r.target_type === t).map((r) => r.target_id))];
    const [rt, rp] = await Promise.all([
      ids('thread').length ? forumDb.from('forum_threads').select(`${COLS}, title, category_id`).in('id', ids('thread')) : { data: [] },
      ids('post').length ? forumDb.from('forum_posts').select(`${COLS}, thread_id`).in('id', ids('post')) : { data: [] },
    ]);
    const byId = new Map<string, any>([...(rt.data || []), ...(rp.data || [])].map((x: any) => [x.id, x]));

    return NextResponse.json({
      success: true,
      reports: (reports.data || []).map((r) => ({ ...r, target: byId.get(r.target_id) || null })),
      threads: threads.data || [],
      posts: posts.data || [],
    });
  } catch (error) {
    logger.error('forum moderacja GET:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}

// POST: usun | przywroc | zostaw. Usunięcie zapisuje powód widoczny dla autora (DSA art. 17).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!(await verifyAdminToken(req, body))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const { action, targetType, targetId, category, note } = body;
    if (!['thread', 'post'].includes(targetType) || !UUID.test(targetId || '')) {
      return NextResponse.json({ success: false, error: 'Zły wpis' }, { status: 400 });
    }
    const table = targetType === 'thread' ? 'forum_threads' : 'forum_posts';
    const now = new Date().toISOString();
    let decision = '';

    if (action === 'usun') {
      if (!isCategory(category)) return NextResponse.json({ success: false, error: 'Wybierz powód' }, { status: 400 });
      decision = reasonText(category, note);
      const { error } = await forumDb.from(table).update({ status: 'usuniety', removed_reason: decision, removed_at: now }).eq('id', targetId);
      if (error) throw error;
    } else if (action === 'przywroc') {
      decision = 'Przywrócono po ponownym sprawdzeniu.';
      const { error } = await forumDb.from(table).update({ status: 'widoczny', removed_reason: null, removed_at: null }).eq('id', targetId);
      if (error) throw error;
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
