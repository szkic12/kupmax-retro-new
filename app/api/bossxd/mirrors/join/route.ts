import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../../lib/aws-s3.js';
import { notify } from '@/lib/telegram';
import { getClientIP, checkRateLimit } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Voice = {
  id: string; title: string; audioUrl: string; wave: number[];
  addedAt: string; key?: string; bio?: string; approved?: boolean;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Dołączenie własnego głosu — bez logowania i bez uprawnień admina.
 *
 * Nagranie trafia do lustra od razu (żeby człowiek zobaczył swoje miejsce),
 * ale wizytówka czeka na zatwierdzenie Brata w panelrudy.
 * W zamian osoba dostaje sekret, którym otwiera SWOJE lustro — cudzych nie.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(`voice:${ip}`, 10, 60 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many recordings from this network. Try again later.' },
      { status: 429, headers: CORS }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.audioUrl) {
    return NextResponse.json({ error: 'No recording received' }, { status: 400, headers: CORS });
  }

  // Adres przychodzi od użytkownika, więc musi wskazywać dokładnie na plik,
  // który sami przed chwilą zapisaliśmy w media/voices/. Bez tego ktoś podałby
  // adres cudzego pliku z kubełka i czytałby go przez naszą trasę.
  const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
  const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();
  const allowed = new RegExp(
    `^https://${BUCKET}\\.s3\\.${REGION}\\.amazonaws\\.com/media/voices/[A-Za-z0-9_-]+\\.(webm|ogg|m4a|mp3|wav)$`
  );
  if (!allowed.test(String(body.audioUrl))) {
    return NextResponse.json({ error: 'Invalid recording' }, { status: 400, headers: CORS });
  }

  const res = await s3Service.loadJsonData('bossxd-mirrors', { voices: [] });
  const data = (res.data as { voices: Voice[] }) || { voices: [] };

  const key = `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  const voice: Voice = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(body.title || 'Ktoś').slice(0, 40),
    audioUrl: String(body.audioUrl),
    wave: Array.isArray(body.wave) ? body.wave.slice(0, 64).map(Number) : [],
    addedAt: new Date().toISOString(),
    key,
    bio: String(body.bio || '').slice(0, 200),
    approved: false,
  };

  data.voices.push(voice);
  await s3Service.saveJsonData('bossxd-mirrors', data);

  const n = data.voices.length;
  const waiting = n % 2 === 1;
  notify(
    'voice',
    voice.title,
    waiting
      ? `Nagrał(a) głos — lustro ${Math.ceil(n / 2)} czeka na parę.${voice.bio ? ` „${voice.bio}"` : ''}`
      : `Nagrał(a) głos — lustro ${n / 2} pełne, brama otwarta.${voice.bio ? ` „${voice.bio}"` : ''}`,
    'https://www.kupmax.pl/panelrudy'
  ).catch(() => { /* powiadomienie nie może wywrócić zapisu */ });

  return NextResponse.json(
    { success: true, id: voice.id, key, mirror: Math.ceil(n / 2), waiting },
    { headers: CORS }
  );
}
