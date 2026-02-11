import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - pobierz newsy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    // Jeśli nie all, pokaż tylko opublikowane
    if (!all) {
      query = query.eq('is_published', true);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching news:', error);
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }

    return NextResponse.json({ news: data || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - dodaj nowy news
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, image_url, author, is_published } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Tytuł i treść są wymagane' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('news')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        image_url: image_url || null,
        author: author || 'Admin',
        is_published: is_published !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating news:', error);
      return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
    }

    return NextResponse.json({ news: data, message: 'News dodany!' });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - aktualizuj news
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, excerpt, image_url, author, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID newsa jest wymagane' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (author !== undefined) updateData.author = author;
    if (is_published !== undefined) updateData.is_published = is_published;

    const { data, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating news:', error);
      return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
    }

    return NextResponse.json({ news: data, message: 'News zaktualizowany!' });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - usuń news
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID newsa jest wymagane' }, { status: 400 });
    }

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting news:', error);
      return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
    }

    return NextResponse.json({ message: 'News usunięty!' });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
