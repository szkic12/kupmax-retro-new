import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - pobierz wszystkie zdjęcia z galerii admina
export async function GET() {
  try {
    const { data: photos, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching gallery photos:', error);
      return NextResponse.json({ photos: [], error: error.message });
    }

    return NextResponse.json({ photos: photos || [], success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ photos: [], error: 'Internal server error' });
  }
}

// POST - dodaj nowe zdjęcie (tylko admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Admin auth required
    const isAdmin = await verifyAdminToken(request, body);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { title, image_url, description, category } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url jest wymagane' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('gallery_photos')
      .insert({
        title: title || '',
        image_url,
        description: description || '',
        category: category || 'general',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating gallery photo:', error);
      return NextResponse.json(
        { error: 'Błąd dodawania zdjęcia: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ photo: data, success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - usuń zdjęcie
export async function DELETE(request: NextRequest) {
  try {
    // Admin auth required
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID jest wymagane' }, { status: 400 });
    }

    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting gallery photo:', error);
      return NextResponse.json(
        { error: 'Błąd usuwania zdjęcia' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
