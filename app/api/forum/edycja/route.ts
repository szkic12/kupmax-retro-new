import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/admin-auth';
import { sanitizeInput } from '@/lib/sanitize';
import { forumDb } from '@/lib/forum-db';
import { getForumUser } from '@/lib/forum-auth';
import { MAX_BODY, voiceFields } from '@/lib/forum-voice';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f-]{36}$/i;

// POST { threadId, title, message } albo { postId, message } — autor poprawia SWÓJ wpis
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby poprawić wpis.' }, { status: 401 });
    if (!checkRateLimit(`forum-edit:${me.user.id}`, 30, 10 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Za dużo poprawek naraz. Chwilę odpocznij.' }, { status: 429 });
    }
    const { threadId, postId, title: rawTitle, message: rawMessage, voiceKey, voiceMode, voiceSeconds } = await req.json();
    const message = sanitizeInput(String(rawMessage || ''), MAX_BODY).trim();
    if (!message) return NextResponse.json({ success: false, error: 'Wpis nie może być pusty.' }, { status: 400 });
    const now = new Date().toISOString();
    // Nowe nagranie (albo lektor) zastępuje stare; bez niego głos zostaje
    let voice: Record<string, any> = {};
    if (voiceKey || voiceMode === 'lektor') {
      const v = await voiceFields(me.user.id, { voiceKey, voiceMode, voiceSeconds }, message);
      if ('error' in v) return NextResponse.json({ success: false, error: v.error }, { status: 400 });
      voice = v;
    }

    if (threadId) {
      if (!UUID.test(threadId)) return NextResponse.json({ success: false, error: 'Zły wątek.' }, { status: 400 });
      const title = sanitizeInput(String(rawTitle || ''), 100).trim();
      if (title.length < 3) return NextResponse.json({ success: false, error: 'Tytuł jest za krótki.' }, { status: 400 });
      const { data: t } = await forumDb.from('forum_threads').select('author_id, status').eq('id', threadId).maybeSingle();
      if (!t || t.status !== 'widoczny') return NextResponse.json({ success: false, error: 'Nie ma takiego wątku.' }, { status: 404 });
      if (t.author_id !== me.user.id) return NextResponse.json({ success: false, error: 'Poprawiać możesz tylko swoje wpisy.' }, { status: 403 });
      const { error } = await forumDb.from('forum_threads').update({ title, body: message, edited_at: now, ...voice }).eq('id', threadId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (!UUID.test(postId || '')) return NextResponse.json({ success: false, error: 'Zły wpis.' }, { status: 400 });
    const { data: p } = await forumDb.from('forum_posts').select('author_id, status, is_ai').eq('id', postId).maybeSingle();
    if (!p || p.status !== 'widoczny') return NextResponse.json({ success: false, error: 'Nie ma takiego wpisu.' }, { status: 404 });
    if (p.is_ai || p.author_id !== me.user.id) return NextResponse.json({ success: false, error: 'Poprawiać możesz tylko swoje wpisy.' }, { status: 403 });
    // Nowa treść = nowy rozbiór: stare kawałki (i ich oceny) znikają, AI rozbierze wpis od nowa przy następnym otwarciu wątku
    await forumDb.from('forum_claims').delete().eq('post_id', postId);
    const { error } = await forumDb.from('forum_posts').update({ body: message, edited_at: now, claims_at: null, ...voice }).eq('id', postId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('forum edycja:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się zapisać poprawki.' }, { status: 500 });
  }
}
