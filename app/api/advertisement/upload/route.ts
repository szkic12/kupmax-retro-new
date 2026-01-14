import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
    }

    // Walidacja typu pliku
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Walidacja rozmiaru (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Plik za duży. Maksymalny rozmiar: 5MB' },
        { status: 400 }
      );
    }

    // Generuj unikalną nazwę pliku
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `ad_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload do Supabase Storage
    const { data, error } = await supabase.storage
      .from('advertisements')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Błąd uploadu: ' + error.message },
        { status: 500 }
      );
    }

    // Pobierz publiczny URL
    const { data: { publicUrl } } = supabase.storage
      .from('advertisements')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
