import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken, checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { sanitizeInput } from '@/lib/sanitize';
import { verifyRecaptcha } from '@/lib/recaptcha';

// Wyłącz cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_DATA = {
  categories: [],
  threads: [],
  posts: []
};

// Pobierz dane forum
async function getForumData() {
  const result = await s3Service.loadJsonData('forum', DEFAULT_DATA);
  return result.data || DEFAULT_DATA;
}

// Zapisz dane forum
async function saveForumData(data: any) {
  return await s3Service.saveJsonData('forum', data);
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

    const forumData = await getForumData();

    // Sprawdź czy wątek istnieje
    const thread = forumData.threads.find((t: any) => t.id === threadId);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Pobierz posty
    let posts = forumData.posts.filter((post: any) => post.threadId === threadId);

    // Sortuj od najstarszych
    posts.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Paginacja
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    // Zwiększ licznik wyświetleń
    thread.views = (thread.views || 0) + 1;
    await saveForumData(forumData);

    return NextResponse.json(
      {
        success: true,
        posts: paginatedPosts,
        thread: thread,
        pagination: {
          page,
          limit,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limit)
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

    const { threadId, message: rawMessage, author: rawAuthor, recaptchaToken } = await req.json();

    // reCAPTCHA v3 weryfikacja
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) {
      return NextResponse.json(
        { success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Spróbuj ponownie.' },
        { status: 403 }
      );
    }

    // Walidacja
    if (!threadId || !rawMessage || !rawAuthor) {
      return NextResponse.json(
        { success: false, error: 'Thread ID, message, and author are required' },
        { status: 400 }
      );
    }

    // Sanitize message input
    const message = sanitizeInput(rawMessage, 5000);

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty after sanitization' },
        { status: 400 }
      );
    }

    const forumData = await getForumData();

    // Sprawdź czy wątek istnieje
    const thread = forumData.threads.find((t: any) => t.id === threadId);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { success: false, error: 'Thread is locked' },
        { status: 400 }
      );
    }

    // Sanitize author nickname
    const sanitizedNickname = sanitizeInput(rawAuthor.nickname || 'Anonim', 40);

    // Utwórz nowy post
    const newPost = {
      id: `post_${Date.now()}`,
      threadId,
      author: {
        nickname: sanitizedNickname || 'Anonim',
        avatar: rawAuthor.avatar || '👤'
      },
      message,
      date: new Date().toISOString(),
      isAnswer: false
    };

    // Dodaj post
    forumData.posts.push(newPost);

    // Zaktualizuj wątek
    thread.replyCount = (thread.replyCount || 0) + 1;
    thread.lastActivity = new Date().toISOString();

    // Zaktualizuj kategorię
    const category = forumData.categories.find((cat: any) => cat.id === thread.categoryId);
    if (category) {
      category.lastActivity = new Date().toISOString();
    }

    // Zapisz
    const saveResult = await saveForumData(forumData);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save post' },
        { status: 500 }
      );
    }

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

    const forumData = await getForumData();

    // Znajdź post
    const postIndex = forumData.posts.findIndex((p: any) => String(p.id) === String(postId));
    if (postIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = forumData.posts[postIndex];

    // Usuń post
    forumData.posts.splice(postIndex, 1);

    // Zaktualizuj licznik odpowiedzi w wątku
    const thread = forumData.threads.find((t: any) => t.id === post.threadId);
    if (thread) {
      thread.replyCount = Math.max(0, (thread.replyCount || 1) - 1);
    }

    // Zapisz
    const saveResult = await saveForumData(forumData);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete post' },
        { status: 500 }
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
