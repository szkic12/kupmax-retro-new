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

// POST/PUT/DELETE - przekieruj do ai.kupmax.pl/admin/blog
// Edycja postów odbywa się tylko przez panel ai.kupmax.pl
export async function POST() {
  return NextResponse.json(
    { error: 'Dodawanie postów możliwe tylko przez ai.kupmax.pl/admin/blog' },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Edycja postów możliwa tylko przez ai.kupmax.pl/admin/blog' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Usuwanie postów możliwe tylko przez ai.kupmax.pl/admin/blog' },
    { status: 403 }
  );
}
