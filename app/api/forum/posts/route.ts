import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken, checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { sanitizeInput } from '@/lib/sanitize';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { forumDb, toThread, toPost, visibleCategories } from '@/lib/forum-db';
import { getForumUser, isAdult } from '@/lib/forum-auth';
import { voiceFields, MAX_BODY } from '@/lib/forum-voice';
import { photoKeys } from '@/lib/forum-photos';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // lektor czyta dłuższe wpisy kawałkami

// Wątek widoczny i z kategorii, którą ten człowiek może oglądać (18+ tylko po bramce wieku)
async function findThread(threadId: string, adult: boolean) {
  const { data } = await forumDb.from('forum_threads').select('*')
    .eq('id', threadId).eq('status', 'widoczny').maybeSingle();
  if (!data) return null;
  const cats = await visibleCategories(adult);
  return cats.some((c: any) => c.id === data.category_id) ? data : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Sprawdź czy wątek istnieje (stare linki thread_123 też działają)
    const adult = isAdult(await getForumUser(req));
    const isUuid = /^[0-9a-f-]{36}$/i.test(threadId);
    let row = isUuid ? await findThread(threadId, adult) : null;
    if (!isUuid) {
      const { data } = await forumDb.from('forum_threads').select('id').eq('legacy_id', threadId).maybeSingle();
      if (data) row = await findThread(data.id, adult);
    }
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Pobierz posty, od najstarszych
    const from = (page - 1) * limit;
    const { data: rows, count, error } = await forumDb.from('forum_posts').select('*', { count: 'exact' })
      .eq('thread_id', row.id).eq('status', 'widoczny')
      .order('created_at', { ascending: true })
      .range(from, from + limit - 1);
    if (error) throw error;
    const paginatedPosts = (rows || []).map(toPost);
    const total = count || 0;

    // Zwiększ licznik wyświetleń
    await forumDb.from('forum_threads').update({ views: (row.views || 0) + 1 }).eq('id', row.id);
    const thread = toThread({ ...row, views: (row.views || 0) + 1 });

    return NextResponse.json(
      {
        success: true,
        posts: paginatedPosts,
        thread: thread,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    logger.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 posts per minute per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`forum-post:${clientIP}`, 5, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zbyt wiele postów. Poczekaj chwilę.' },
        { status: 429 }
      );
    }

    // Odpowiadać mogą tylko zalogowani z profilem forum
    const me = await getForumUser(req);
    if (!me?.profile) {
      return NextResponse.json(
        { success: false, error: 'Zaloguj się, żeby odpowiedzieć.' },
        { status: 401 }
      );
    }

    const { threadId, message: rawMessage, recaptchaToken, voiceKey, voiceMode, voiceSeconds, photos } = await req.json();

    // reCAPTCHA v3 weryfikacja
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) {
      return NextResponse.json(
        { success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Spróbuj ponownie.' },
        { status: 403 }
      );
    }

    // Walidacja
    if (!threadId || !rawMessage) {
      return NextResponse.json(
        { success: false, error: 'Thread ID and message are required' },
        { status: 400 }
      );
    }

    // Sanitize message input
    const message = sanitizeInput(rawMessage, MAX_BODY);

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty after sanitization' },
        { status: 400 }
      );
    }

    // Sprawdź czy wątek istnieje
    const thread = await findThread(threadId, isAdult(me));
    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Zdjęcia: tylko własne, najwyżej 5
    const photoList = photoKeys(me.user.id, photos);
    if (!Array.isArray(photoList)) {
      return NextResponse.json({ success: false, error: photoList.error }, { status: 400 });
    }

    // Głos: klucz nagrania albo lektor czytający tekst
    const voice = await voiceFields(me.user.id, { voiceKey, voiceMode, voiceSeconds }, message);
    if ('error' in voice) {
      return NextResponse.json({ success: false, error: voice.error }, { status: 400 });
    }

    // Utwórz nowy post (licznik odpowiedzi i ostatnią aktywność liczy baza)
    const { data: row, error } = await forumDb.from('forum_posts').insert({
      thread_id: thread.id,
      author_id: me.user.id,
      author_nick: me.profile.nick,
      author_avatar: me.profile.avatar,
      body: message,
      ...voice,
      photos: photoList,
    }).select().single();
    if (error) {
      logger.error('Forum insert post:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save post' },
        { status: 500 }
      );
    }
    const newPost = toPost(row);

    return NextResponse.json({
      success: true,
      post: newPost
    });
  } catch (error) {
    logger.error('Error creating forum post:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Admin auth required for deleting posts
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Nie kasujemy z bazy: post dostaje status „usunięty” (ślad dla DSA i do cofnięcia)
    const { data: row, error } = await forumDb.from('forum_posts')
      .update({ status: 'usuniety', removed_reason: searchParams.get('reason') || 'usunięte przez moderację' })
      .eq('id', postId).select('id').maybeSingle();
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete post' },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
