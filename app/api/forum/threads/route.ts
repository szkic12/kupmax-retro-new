import { notify } from '@/lib/telegram';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken, checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { forumDb, toThread, visibleCategories } from '@/lib/forum-db';
import { getForumUser, isAdult } from '@/lib/forum-auth';
import { voiceFields, MAX_BODY } from '@/lib/forum-voice';
import { photoKeys } from '@/lib/forum-photos';
import { modelField } from '@/lib/forum-models';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // lektor czyta dłuższe wpisy kawałkami

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'latest';

    const cats = await visibleCategories(isAdult(await getForumUser(req)));
    const allowed = cats.map((c: any) => c.id);
    if (categoryId && !allowed.includes(categoryId)) {
      return NextResponse.json({ success: true, threads: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const order: Record<string, string> = { latest: 'last_activity', popular: 'reply_count', views: 'views' };
    const from = (page - 1) * limit;
    const { data, count, error } = await forumDb.from('forum_threads').select('*', { count: 'exact' })
      .eq('status', 'widoczny')
      .in('category_id', categoryId ? [categoryId] : allowed)
      .order('is_pinned', { ascending: false })
      .order(order[sort] || 'created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw error;
    const paginatedThreads = (data || []).map(toThread);
    const total = count || 0;

    return NextResponse.json(
      {
        success: true,
        threads: paginatedThreads,
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
    logger.error('Error fetching forum threads:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 threads per minute per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`forum-thread:${clientIP}`, 3, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many threads created. Please wait.' },
        { status: 429 }
      );
    }

    // Pisać mogą tylko zalogowani z profilem forum
    const me = await getForumUser(req);
    if (!me?.profile) {
      return NextResponse.json(
        { success: false, error: 'Zaloguj się, żeby dodać wątek.' },
        { status: 401 }
      );
    }

    const { categoryId, title, message, recaptchaToken, voiceKey, voiceMode, voiceSeconds, photos, model, ai } = await req.json();

    // reCAPTCHA v3 weryfikacja
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) {
      return NextResponse.json(
        { success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Spróbuj ponownie.' },
        { status: 403 }
      );
    }

    // Walidacja
    if (!categoryId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Category ID, title and message are required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (message.length > MAX_BODY) {
      return NextResponse.json(
        { success: false, error: 'Wpis za długi (najwyżej 12 000 znaków).' },
        { status: 400 }
      );
    }

    // Sprawdź czy kategoria istnieje (18+ tylko po bramce wieku)
    const cats = await visibleCategories(isAdult(me));
    if (!cats.some((c: any) => c.id === categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      );
    }

    // Zdjęcia: tylko własne, najwyżej 5
    const photoList = photoKeys(me.user.id, photos);
    if (!Array.isArray(photoList)) {
      return NextResponse.json({ success: false, error: photoList.error }, { status: 400 });
    }

    // Model 3D: tylko własny i naprawdę wgrany
    const modelRow = await modelField(me.user.id, model);
    if (modelRow && 'error' in modelRow) {
      return NextResponse.json({ success: false, error: modelRow.error }, { status: 400 });
    }

    // Głos: klucz nagrania albo lektor czytający tekst
    const voice = await voiceFields(me.user.id, { voiceKey, voiceMode, voiceSeconds }, message.substring(0, MAX_BODY));
    if ('error' in voice) {
      return NextResponse.json({ success: false, error: voice.error }, { status: 400 });
    }

    // Utwórz nowy wątek
    const { data: row, error } = await forumDb.from('forum_threads').insert({
      category_id: categoryId,
      title: title.substring(0, 100),
      author_id: me.user.id,
      author_nick: me.profile.nick,
      author_avatar: me.profile.avatar,
      body: message.substring(0, MAX_BODY),
      ...voice,
      photos: photoList,
      ...(modelRow ? { model: modelRow } : {}),
      // AI odpowiada od razu, chyba że autor to wyłączył; w strefie 18+ AI nie pisze
      ...(ai !== false && !cats.find((c: any) => c.id === categoryId)?.is_adult ? { ai_wait: 'odpowiedz' } : {}),
    }).select().single();
    if (error) {
      logger.error('Forum insert thread:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save thread' },
        { status: 500 }
      );
    }
    const newThread = toThread(row);

    // Powiadomienie na Telegram (2026-08-20)
    notify('forum',
      newThread.author?.nickname || 'Anonim',
      newThread.title || 'nowy wątek',
      'https://www.kupmax.pl/forum').catch(() => {});

    return NextResponse.json({
      success: true,
      thread: newThread
    });
  } catch (error) {
    logger.error('Error creating forum thread:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - edytuj wątek (dla admina)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Admin auth required for editing threads
    const isAdmin = await verifyAdminToken(req, body);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { threadId, title, message } = body;

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const changes: Record<string, string> = {};
    if (title !== undefined) changes.title = title.substring(0, 100);
    if (message !== undefined) changes.body = message.substring(0, 5000);

    const { data: row, error } = await forumDb.from('forum_threads')
      .update(changes).eq('id', threadId).select().maybeSingle();
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update thread' },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: toThread(row),
      message: 'Thread updated'
    });
  } catch (error) {
    logger.error('Error updating thread:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Admin auth required for deleting threads
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Nie kasujemy z bazy: wątek dostaje status „usunięty” (ślad dla DSA i do cofnięcia)
    const { data: row, error } = await forumDb.from('forum_threads')
      .update({ status: 'usuniety', removed_reason: searchParams.get('reason') || 'usunięte przez moderację' })
      .eq('id', threadId).select('id').maybeSingle();
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete thread' },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting thread:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
