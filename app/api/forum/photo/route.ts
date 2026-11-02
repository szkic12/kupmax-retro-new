import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/admin-auth';
import { getForumUser } from '@/lib/forum-auth';
import { isPhotoKey, isPhotoType, signedPhotoUrl, storePhoto, MAX_PHOTO_BYTES } from '@/lib/forum-photos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET ?k=klucz: pokazuje zdjęcie (przekierowanie na podpisany link, ważny godzinę)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('k') || '';
  if (!isPhotoKey(key)) return NextResponse.json({ success: false, error: 'Nie ma takiego zdjęcia' }, { status: 404 });
  const res = NextResponse.redirect(await signedPhotoUrl(key), 302);
  res.headers.set('Cache-Control', 'private, max-age=3000');
  return res;
}

// POST (multipart: photo): wgrywa jedno zdjęcie, zwraca klucz do dołączenia przy wpisie
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby dodać zdjęcie.' }, { status: 401 });

    const limit = checkRateLimit(`forum-photo:${me.user.id}`, 30, 10 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'Za dużo zdjęć naraz. Odpocznij chwilę.' }, { status: 429 });

    const file = (await req.formData()).get('photo');
    if (!(file instanceof Blob) || !isPhotoType(file.type)) {
      return NextResponse.json({ success: false, error: 'To nie jest zdjęcie (webp, jpg albo png).' }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ success: false, error: 'Zdjęcie za duże.' }, { status: 413 });

    const key = await storePhoto(me.user.id, Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json({ success: true, key });
  } catch (error) {
    logger.error('forum photo:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się wgrać zdjęcia.' }, { status: 500 });
  }
}
