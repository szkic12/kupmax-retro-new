import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - pobierz aktualną aktywną reklamę
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching advertisement:', error);
      return NextResponse.json({ error: 'Failed to fetch advertisement' }, { status: 500 });
    }

    // Jeśli nie ma reklamy, zwróć domyślną
    if (!data) {
      return NextResponse.json({
        advertisement: {
          id: 'default',
          image_url: '/images/slider-1.jpg',
          title: 'Anna Juszczak Fotografia',
          description: 'Profesjonalna fotografia - sesje zdjęciowe, eventy, portrety.',
          link_url: 'https://www.facebook.com/annajuszczakfotografia/',
          advertiser_name: 'Anna Juszczak',
          is_active: true,
        }
      });
    }

    return NextResponse.json({ advertisement: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - dodaj nową reklamę (dezaktywuje poprzednią)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, title, description, link_url, advertiser_name, advertiser_email, end_date } = body;

    if (!image_url || !title || !advertiser_name) {
      return NextResponse.json(
        { error: 'image_url, title i advertiser_name są wymagane' },
        { status: 400 }
      );
    }

    // Najpierw dezaktywuj wszystkie aktywne reklamy i zapisz do historii
    const { data: currentAd } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .single();

    if (currentAd) {
      // Zapisz do historii
      await supabase.from('advertisement_history').insert({
        advertisement_id: currentAd.id,
        image_url: currentAd.image_url,
        title: currentAd.title,
        advertiser_name: currentAd.advertiser_name,
        link_url: currentAd.link_url,
        displayed_from: currentAd.start_date,
        displayed_until: new Date().toISOString(),
      });

      // Dezaktywuj
      await supabase
        .from('advertisements')
        .update({ is_active: false })
        .eq('id', currentAd.id);
    }

    // Dodaj nową reklamę
    const { data, error } = await supabase
      .from('advertisements')
      .insert({
        image_url,
        title,
        description,
        link_url,
        advertiser_name,
        advertiser_email,
        end_date: end_date || null,
        is_active: true,
        start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating advertisement:', error);
      return NextResponse.json({ error: 'Failed to create advertisement' }, { status: 500 });
    }

    return NextResponse.json({ advertisement: data, message: 'Reklama dodana!' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - aktualizuj istniejącą reklamę
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, image_url, title, description, link_url, advertiser_name, advertiser_email, end_date, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID reklamy jest wymagane' }, { status: 400 });
    }

    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (advertiser_name !== undefined) updateData.advertiser_name = advertiser_name;
    if (advertiser_email !== undefined) updateData.advertiser_email = advertiser_email;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('advertisements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating advertisement:', error);
      return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
    }

    return NextResponse.json({ advertisement: data, message: 'Reklama zaktualizowana!' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - usuń reklamę
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID reklamy jest wymagane' }, { status: 400 });
    }

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting advertisement:', error);
      return NextResponse.json({ error: 'Failed to delete advertisement' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reklama usunięta!' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
