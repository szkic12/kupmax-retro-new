import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export type Shot = {
  id: string;
  title: string;   // podpis pokazywany pod skrzydłami
  imageUrl: string;
  addedAt: string;
};

const EMPTY: { shots: Shot[] } = { shots: [] };

async function load() {
  const r = await s3Service.loadJsonData('bossxd-wings', EMPTY);
  return (r.data as { shots: Shot[] }) || EMPTY;
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
    const shot: Shot = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: String(body.title || 'Bez tytułu').slice(0, 120),
      imageUrl: String(body.imageUrl || ''),
      addedAt: new Date().toISOString(),
    };
    if (!shot.imageUrl) {
      return NextResponse.json({ error: 'Brak zdjęcia' }, { status: 400 });
    }
    data.shots.push(shot);
  } else if (action === 'remove') {
    data.shots = data.shots.filter((l) => l.id !== body.id);
  } else if (action === 'move') {
    // Kolejność decyduje, w jakiej kolejności zdjęcia przechodzą pod skrzydłami.
    const i = data.shots.findIndex((l) => l.id === body.id);
    const j = i + (body.dir === 'up' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < data.shots.length) {
      [data.shots[i], data.shots[j]] = [data.shots[j], data.shots[i]];
    }
  } else if (action === 'title') {
    // Podpis pojawia się pod skrzydłami razem ze zdjęciem.
    const s = data.shots.find((x) => x.id === body.id);
    if (s) s.title = String(body.title || '').slice(0, 120);
  } else {
    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  }

  await s3Service.saveJsonData('bossxd-wings', data);
  return NextResponse.json({ success: true, ...data });
}
