import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/admin-auth';
import { getForumUser } from '@/lib/forum-auth';
import { createModelUpload, isModelKey, signedModelUrl } from '@/lib/forum-models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET ?k=klucz: model 3D (przekierowanie na podpisany link, ważny godzinę)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('k') || '';
  const url = isModelKey(key) ? await signedModelUrl(key) : null;
  if (!url) return NextResponse.json({ success: false, error: 'Nie ma takiego modelu' }, { status: 404 });
  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', 'private, max-age=3000');
  return res;
}

// POST: daje jednorazowy link do wgrania modelu .glb prosto do Supabase
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby dodać model 3D.' }, { status: 401 });
    const limit = checkRateLimit(`forum-model:${me.user.id}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'Za dużo modeli naraz. Odpocznij chwilę.' }, { status: 429 });
    return NextResponse.json({ success: true, ...(await createModelUpload(me.user.id)) });
  } catch (error) {
    logger.error('forum model upload:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się przygotować wgrywania.' }, { status: 500 });
  }
}
