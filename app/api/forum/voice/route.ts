import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/admin-auth';
import { getForumUser } from '@/lib/forum-auth';
import { isAudioType, isVoiceKey, signedVoiceUrl, storeAudio, transcribe, MAX_VOICE_SECONDS } from '@/lib/forum-voice';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // limit Vercela to 4,5 MB na zapytanie

// GET ?k=klucz: odsłuch, przekierowanie na podpisany link do S3
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('k') || '';
  if (!isVoiceKey(key)) return NextResponse.json({ success: false, error: 'Nie ma takiego nagrania' }, { status: 404 });
  return NextResponse.redirect(await signedVoiceUrl(key), 302);
}

// POST (multipart: audio, mode, seconds): zamienia mowę na tekst.
// Tryb „wlasny” i „zmieniony” zapisuje nagranie i zwraca klucz; „lektor” i „tekst” nagrania nie zapisują.
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby nagrywać.' }, { status: 401 });

    const limit = checkRateLimit(`forum-voice:${me.user.id}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'Za dużo nagrań naraz. Odpocznij chwilę.' }, { status: 429 });

    const form = await req.formData();
    const file = form.get('audio');
    const mode = String(form.get('mode') || 'wlasny');
    const seconds = Number(form.get('seconds')) || 0;

    if (!(file instanceof Blob) || !isAudioType(file.type)) {
      return NextResponse.json({ success: false, error: 'To nie jest nagranie.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) return NextResponse.json({ success: false, error: 'Nagranie za duże. Skróć je trochę.' }, { status: 413 });
    if (seconds > MAX_VOICE_SECONDS + 5) return NextResponse.json({ success: false, error: 'Najwyżej 10 minut.' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'Zamiana mowy na tekst nie jest jeszcze włączona.' }, { status: 503 });

    const buf = Buffer.from(await file.arrayBuffer());
    const keep = mode === 'wlasny' || mode === 'zmieniony';
    const [text, key] = await Promise.all([
      transcribe(buf, file.type),
      keep ? storeAudio(me.user.id, buf, file.type) : Promise.resolve(null),
    ]);

    return NextResponse.json({ success: true, text, key });
  } catch (error) {
    logger.error('forum voice:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się przerobić nagrania. Spróbuj jeszcze raz.' }, { status: 500 });
  }
}
