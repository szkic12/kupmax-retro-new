import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapowanie kategorii BlogPost -> news format
const CATEGORY_MAP: Record<string, string> = {
  'PORADNIK': 'Eksperckie Poradniki',
  'HISTORIA': 'Niesamowite Historie',
  'TECHNOLOGIA': 'Nowoczesne Technologie',
  'BIZNES': 'Eksperckie Poradniki',
  'INSPIRACJA': 'Niesamowite Historie',
  'AKTUALNOSCI': 'Nowoczesne Technologie',
};

export const dynamic = 'force-dynamic';

// GET - pobierz pojedynczy news po ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Pobierz z BlogPost
    const { data: post, error } = await supabase
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
      .eq('id', id)
      .eq('status', 'PUBLISHED')
      .single();

    if (error || !post) {
      logger.error('Error fetching news by ID:', error);
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Zwieksz licznik wyswietlen
    await supabase
      .from('BlogPost')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', id);

    // Mapuj na format news
    const news = {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || (typeof post.content === 'string' ? post.content.substring(0, 150) + '...' : ''),
      image_url: post.coverImage,
      author: (post.author as { name?: string })?.name || 'Admin',
      category: CATEGORY_MAP[post.category as string] || 'Niesamowite Historie',
      is_published: post.status === 'PUBLISHED',
      views: (post.views || 0) + 1,
      likes: post.likes || 0,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    };

    return NextResponse.json({ news });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
