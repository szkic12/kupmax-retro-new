import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';
import { notify } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export type Voice = {
  id: string;
  title: string;    // czyj to głos — pokazywane pod lustrem
  audioUrl: string;
  wave: number[];   // kształt fali, rysowany w tafli
  addedAt: string;
};

const EMPTY: { voices: Voice[] } = { voices: [] };

async function load() {
  const r = await s3Service.loadJsonData('bossxd-mirrors', EMPTY);
  return (r.data as { voices: Voice[] }) || EMPTY;
}

export async function GET() {
  const data = await load();
  return NextResponse.json(data, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// Strona bossxd.com stoi na innej domenie — bez tego przeglądarka zablokuje odczyt.
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;
  const data = await load();

  if (action === 'add') {
    const voice: Voice = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: String(body.title || 'Bez tytułu').slice(0, 120),
      audioUrl: String(body.audioUrl || ''),
      wave: Array.isArray(body.wave) ? body.wave.slice(0, 64).map(Number) : [],
      addedAt: new Date().toISOString(),
    };
    if (!voice.audioUrl) {
      return NextResponse.json({ error: 'Brak nagrania' }, { status: 400 });
    }
    data.voices.push(voice);

    // Brat dostaje znać, gdy lustro dostaje głos — i czy czeka jeszcze na parę.
    const n = data.voices.length;
    const waiting = n % 2 === 1;
    notify(
      'voice',
      voice.title || 'nowy głos',
      waiting
        ? `Lustro ${Math.ceil(n / 2)} czeka na drugi głos.`
        : `Lustro ${n / 2} pełne — brama otwarta.`,
      'https://bossxd.com/'
    ).catch(() => { /* powiadomienie nie może wywrócić zapisu */ });
  } else if (action === 'remove') {
    data.voices = data.voices.filter((l) => l.id !== body.id);
  } else if (action === 'move') {
    // Kolejność decyduje, kto z kim tworzy parę: 1+2 to pierwsze lustro, 3+4 drugie.
    const i = data.voices.findIndex((l) => l.id === body.id);
    const j = i + (body.dir === 'up' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < data.voices.length) {
      [data.voices[i], data.voices[j]] = [data.voices[j], data.voices[i]];
    }
  } else if (action === 'title') {
    // Podpis pojawia się pod lustrem.
    const s = data.voices.find((x) => x.id === body.id);
    if (s) s.title = String(body.title || '').slice(0, 120);
  } else {
    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  }

  await s3Service.saveJsonData('bossxd-mirrors', data);
  return NextResponse.json({ success: true, ...data });
}
