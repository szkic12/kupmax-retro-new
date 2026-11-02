import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { forumDb, visibleCategories } from '@/lib/forum-db';
import { getForumUser, isAdult } from '@/lib/forum-auth';
import { runPendingAi, aiCanCheck } from '@/lib/forum-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // AI myśli, potem lektor czyta odpowiedź

const UUID = /^[0-9a-f-]{36}$/i;

// POST { threadId, ask? }
// - bez ask: wykonuje to, co już czeka w wątku (odpowiedź po nowym wątku, ocena poprawek). Woła to strona wątku.
// - ask: true: zalogowany prosi AI „czego tu brakuje?” (albo o odpowiedź, jeśli AI jeszcze nie pisało).
export async function POST(req: NextRequest) {
  try {
    const { threadId, ask } = await req.json();
    if (!UUID.test(threadId || '')) return NextResponse.json({ success: false, error: 'Zły wątek.' }, { status: 400 });

    const me = await getForumUser(req);
    const ip = getClientIP(req);
    if (!checkRateLimit(`forum-ai:${ip}`, 30, 10 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Za dużo próśb do AI. Spróbuj za kilka minut.' }, { status: 429 });
    }

    const { data: thread } = await forumDb.from('forum_threads').select('*').eq('id', threadId).eq('status', 'widoczny').maybeSingle();
    const cats = await visibleCategories(isAdult(me));
    const cat = thread && cats.find((c: any) => c.id === thread.category_id);
    if (!thread || !cat) return NextResponse.json({ success: false, error: 'Nie ma takiego wątku.' }, { status: 404 });

    if (ask) {
      if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby zapytać AI.' }, { status: 401 });
      if (!checkRateLimit(`forum-ai-ask:${me.user.id}`, 6, 60 * 60 * 1000).allowed) {
        return NextResponse.json({ success: false, error: 'Najwyżej 6 próśb do AI na godzinę.' }, { status: 429 });
      }
      const { data: posts } = await forumDb.from('forum_posts').select('is_ai, status, created_at, corrects_post_id').eq('thread_id', threadId);
      if (!aiCanCheck(thread, posts || [], !!cat.is_adult)) {
        return NextResponse.json({ success: false, error: 'AI już przeczytało ten wątek. Poczekaj na nowe odpowiedzi.' }, { status: 409 });
      }
      const hasAi = (posts || []).some((p: any) => p.is_ai && p.status === 'widoczny');
      await forumDb.from('forum_threads').update({ ai_wait: hasAi ? 'braki' : 'odpowiedz' }).eq('id', threadId).is('ai_wait', null);
    }

    const result = await runPendingAi(threadId, !!cat.is_adult);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('forum ai:', error);
    return NextResponse.json({ success: false, error: 'AI chwilowo nie odpowiada. Spróbuj za chwilę.' }, { status: 500 });
  }
}
