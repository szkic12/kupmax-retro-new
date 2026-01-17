import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - pobierz slajdy dla reklamy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const advertisementId = searchParams.get('advertisementId');

    if (!advertisementId) {
      return NextResponse.json({ error: 'advertisementId jest wymagane' }, { status: 400 });
    }

    const { data: slides, error } = await supabase
      .from('advertisement_slides')
      .select('*')
      .eq('advertisement_id', advertisementId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ slides: slides || [] });
  } catch (error) {
    console.error('Error fetching slides:', error);
    return NextResponse.json({ slides: [] });
  }
}

// POST - dodaj slajd do reklamy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advertisement_id, image_url, title, order_index } = body;

    if (!advertisement_id || !image_url) {
      return NextResponse.json(
        { error: 'advertisement_id i image_url są wymagane' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('advertisement_slides')
      .insert({
        advertisement_id,
        image_url,
        title: title || '',
        order_index: order_index || 0,
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
    const { id, image_url, title, order_index } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID slajdu jest wymagane' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (title !== undefined) updateData.title = title;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await supabase
      .from('advertisement_slides')
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
      return NextResponse.json({ error: 'ID slajdu jest wymagane' }, { status: 400 });
    }

    const { error } = await supabase
      .from('advertisement_slides')
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
