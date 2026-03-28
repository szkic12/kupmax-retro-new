import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// Rate limiting: map of IP -> { count, resetAt }
const adUploadRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isAdUploadRateLimited(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = adUploadRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    adUploadRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limiting check
    if (isAdUploadRateLimited(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Maximum 10 uploads per minute.' },
        { status: 429 }
      );
    }

    // Admin auth required for uploading advertisements
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

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
      logger.error('Supabase upload error:', error);
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
    logger.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
