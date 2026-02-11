import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../lib/aws-s3.js';

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
    const { threadId, message, author } = await req.json();

    // Walidacja
    if (!threadId || !message || !author) {
      return NextResponse.json(
        { success: false, error: 'Thread ID, message, and author are required' },
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

    // Utwórz nowy post
    const newPost = {
      id: `post_${Date.now()}`,
      threadId,
      author: {
        nickname: author.nickname?.substring(0, 40) || 'Anonim',
        avatar: author.avatar || '👤'
      },
      message: message.substring(0, 5000),
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
