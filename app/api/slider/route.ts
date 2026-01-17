import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - pobierz wszystkie slajdy
export async function GET() {
  try {
    const { data: slides, error } = await supabase
      .from('slider_slides')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ slides: slides || [] });
  } catch (error) {
    console.error('Error fetching slides:', error);
    return NextResponse.json({ slides: [] });
  }
}

// POST - dodaj nowy slajd
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, image_url, link_url, order_index } = body;

    if (!title || !image_url) {
      return NextResponse.json(
        { error: 'Tytuł i obrazek są wymagane' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('slider_slides')
      .insert({
        title,
        image_url,
        link_url: link_url || '#',
        order_index: order_index || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ slide: data, success: true });
  } catch (error) {
    console.error('Error creating slide:', error);
    return NextResponse.json(
      { error: 'Błąd tworzenia slajdu' },
      { status: 500 }
    );
  }
}

// PUT - aktualizuj slajd
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, image_url, link_url, order_index, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID slajdu jest wymagane' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('slider_slides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ slide: data, success: true });
  } catch (error) {
    console.error('Error updating slide:', error);
    return NextResponse.json(
      { error: 'Błąd aktualizacji slajdu' },
      { status: 500 }
    );
  }
}

// DELETE - usuń slajd
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID slajdu jest wymagane' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('slider_slides')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting slide:', error);
    return NextResponse.json(
      { error: 'Błąd usuwania slajdu' },
      { status: 500 }
    );
  }
}
