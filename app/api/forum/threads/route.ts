import { notify } from '@/lib/telegram';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken, checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { verifyRecaptcha } from '@/lib/recaptcha';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Pytania o produkty", description: "Zadawaj pytania", icon: "🛒", threadCount: 0, lastActivity: null, color: "#4CAF50", order: 1 },
  { id: "2", name: "Wspomnienia retro", description: "Wspomnienia", icon: "📺", threadCount: 0, lastActivity: null, color: "#FF9800", order: 2 },
  { id: "3", name: "Pomoc techniczna", description: "Pomoc", icon: "🔧", threadCount: 0, lastActivity: null, color: "#2196F3", order: 3 },
  { id: "4", name: "Ogólne dyskusje", description: "Dyskusje", icon: "💬", threadCount: 0, lastActivity: null, color: "#9C27B0", order: 4 }
];

// Pobierz dane forum
async function getForumData() {
  const result = await s3Service.loadJsonData('forum', {
    categories: DEFAULT_CATEGORIES,
    threads: [],
    posts: []
  });
  return result.data || { categories: DEFAULT_CATEGORIES, threads: [], posts: [] };
}

// Zapisz dane forum
async function saveForumData(data: any) {
  logger.log('💾 Saving forum data, threads:', data.threads?.length);
  const result = await s3Service.saveJsonData('forum', data);
  logger.log('💾 Forum save result:', result);
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'latest';

    const forumData = await getForumData();
    let threads = [...forumData.threads];

    // Filtruj po kategorii
    if (categoryId) {
      threads = threads.filter((thread: any) => thread.categoryId === categoryId);
    }

    // Sortowanie
    switch (sort) {
      case 'latest':
        threads.sort((a: any, b: any) =>
          new Date(b.lastActivity || b.date).getTime() - new Date(a.lastActivity || a.date).getTime()
        );
        break;
      case 'popular':
        threads.sort((a: any, b: any) => (b.replyCount || 0) - (a.replyCount || 0));
        break;
      case 'views':
        threads.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        break;
      default:
        threads.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Paginacja
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedThreads = threads.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        success: true,
        threads: paginatedThreads,
        pagination: {
          page,
          limit,
          total: threads.length,
          totalPages: Math.ceil(threads.length / limit)
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

    const { categoryId, title, message, author, recaptchaToken } = await req.json();

    // reCAPTCHA v3 weryfikacja
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) {
      return NextResponse.json(
        { success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Spróbuj ponownie.' },
        { status: 403 }
      );
    }

    // Walidacja
    if (!categoryId || !title || !message || !author) {
      return NextResponse.json(
        { success: false, error: 'Category ID, title, message, and author are required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const forumData = await getForumData();

    // Sprawdź czy kategoria istnieje
    const category = forumData.categories.find((cat: any) => cat.id === categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      );
    }

    // Utwórz nowy wątek
    const newThread = {
      id: `thread_${Date.now()}`,
      categoryId,
      title: title.substring(0, 100),
      author: {
        nickname: author.nickname?.substring(0, 40) || 'Anonim',
        avatar: author.avatar || '👤'
      },
      message: message.substring(0, 5000),
      date: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      replyCount: 0,
      views: 0,
      isSticky: false,
      isLocked: false,
      tags: []
    };

    // Powiadomienie na Telegram (2026-08-20)
    notify('forum',
      newThread.author?.nickname || 'Anonim',
      newThread.title || 'nowy wątek',
      'https://www.kupmax.pl/forum').catch(() => {});

    // Dodaj wątek
    forumData.threads.unshift(newThread);

    // Zaktualizuj kategorię
    category.threadCount = (category.threadCount || 0) + 1;
    category.lastActivity = new Date().toISOString();

    // Zapisz
    const saveResult = await saveForumData(forumData);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save thread' },
        { status: 500 }
      );
    }

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

    const forumData = await getForumData();

    // Znajdź wątek
    const threadIndex = forumData.threads.findIndex((t: any) => String(t.id) === String(threadId));
    if (threadIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Aktualizuj tylko podane pola
    if (title !== undefined) {
      forumData.threads[threadIndex].title = title.substring(0, 100);
    }
    if (message !== undefined) {
      forumData.threads[threadIndex].message = message.substring(0, 5000);
    }

    // Zapisz
    const saveResult = await saveForumData(forumData);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update thread' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: forumData.threads[threadIndex],
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

    const forumData = await getForumData();

    // Znajdź wątek
    const threadIndex = forumData.threads.findIndex((t: any) => String(t.id) === String(threadId));
    if (threadIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    const thread = forumData.threads[threadIndex];

    // Usuń wątek
    forumData.threads.splice(threadIndex, 1);

    // Usuń posty
    forumData.posts = forumData.posts.filter((p: any) => p.threadId !== threadId);

    // Zaktualizuj kategorię
    const category = forumData.categories.find((cat: any) => cat.id === thread.categoryId);
    if (category) {
      category.threadCount = Math.max(0, (category.threadCount || 1) - 1);
    }

    // Zapisz
    const saveResult = await saveForumData(forumData);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete thread' },
        { status: 500 }
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
