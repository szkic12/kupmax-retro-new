import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mapowanie kategorii BlogPost -> news format
const CATEGORY_MAP: Record<string, string> = {
  'PORADNIK': 'Eksperckie Poradniki',
  'HISTORIA': 'Niesamowite Historie',
  'TECHNOLOGIA': 'Nowoczesne Technologie',
  'BIZNES': 'Eksperckie Poradniki',
  'INSPIRACJA': 'Niesamowite Historie',
  'AKTUALNOSCI': 'Nowoczesne Technologie',
};

// Mapowanie kategorii news -> BlogPost format
const CATEGORY_REVERSE_MAP: Record<string, string> = {
  'Eksperckie Poradniki': 'PORADNIK',
  'Niesamowite Historie': 'HISTORIA',
  'Nowoczesne Technologie': 'TECHNOLOGIA',
};

// ID admina dla postów z panelrudy (kontakt@kupmax.pl)
const ADMIN_AUTHOR_ID = 'cm6i9zjn40000v8rk7wexuvlw';

// GET - pobierz newsy z tabeli BlogPost
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Pobierz z BlogPost zamiast news
    let query = supabase
      .from('BlogPost')
      .select(`
        id,
        title,
        content,
        excerpt,
        "coverImage",
        category,
        status,
        views,
        likes,
        "createdAt",
        "updatedAt",
        author:User!authorId(name)
      `)
      .order('createdAt', { ascending: false });

    // Jeśli nie all, pokaż tylko opublikowane
    if (!all) {
      query = query.eq('status', 'PUBLISHED');
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching news from BlogPost:', error);
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }

    // Mapuj BlogPost na format oczekiwany przez stronę /news
    const news = (data || []).map((post: Record<string, unknown>) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || (typeof post.content === 'string' ? post.content.substring(0, 150) + '...' : ''),
      image_url: post.coverImage,
      author: (post.author as { name?: string })?.name || 'Admin',
      category: CATEGORY_MAP[post.category as string] || 'Niesamowite Historie',
      is_published: post.status === 'PUBLISHED',
      views: post.views || 0,
      likes: post.likes || 0,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }));

    return NextResponse.json({ news }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - dodaj nowy post do BlogPost (z panelrudy)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, image_url, category, is_published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Mapuj kategorię na format BlogPost
    const blogCategory = CATEGORY_REVERSE_MAP[category] || 'HISTORIA';

    const { data, error } = await supabase
      .from('BlogPost')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        coverImage: image_url || null,
        category: blogCategory,
        status: is_published !== false ? 'PUBLISHED' : 'DRAFT',
        authorId: ADMIN_AUTHOR_ID,
        views: 0,
        likes: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating BlogPost:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Zwróć w formacie news
    const news = {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      image_url: data.coverImage,
      author: 'Admin',
      category: CATEGORY_MAP[data.category] || category,
      is_published: data.status === 'PUBLISHED',
      views: data.views,
      likes: data.likes,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };

    return NextResponse.json({ news, success: true }, { status: 201 });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - aktualizuj post w BlogPost
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, excerpt, image_url, category, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Mapuj kategorię na format BlogPost
    const blogCategory = category ? (CATEGORY_REVERSE_MAP[category] || 'HISTORIA') : undefined;

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (image_url !== undefined) updateData.coverImage = image_url;
    if (blogCategory) updateData.category = blogCategory;
    if (is_published !== undefined) updateData.status = is_published ? 'PUBLISHED' : 'DRAFT';

    const { data, error } = await supabase
      .from('BlogPost')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating BlogPost:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    // Zwróć w formacie news
    const news = {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      image_url: data.coverImage,
      author: 'Admin',
      category: CATEGORY_MAP[data.category] || 'Niesamowite Historie',
      is_published: data.status === 'PUBLISHED',
      views: data.views,
      likes: data.likes,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };

    return NextResponse.json({ news, success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - usuń post z BlogPost
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('BlogPost')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting BlogPost:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
