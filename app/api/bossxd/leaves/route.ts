import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export type Leaf = {
  id: string;
  title: string;
  videoUrl: string;   // plik wgrany do S3
  posterUrl: string;  // klatka pokazywana na listku
  addedAt: string;
};

const EMPTY: { leaves: Leaf[] } = { leaves: [] };

async function load() {
  const r = await s3Service.loadJsonData('bossxd-leaves', EMPTY);
  return (r.data as { leaves: Leaf[] }) || EMPTY;
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
    const leaf: Leaf = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: String(body.title || 'Bez tytułu').slice(0, 120),
      videoUrl: String(body.videoUrl || ''),
      posterUrl: String(body.posterUrl || ''),
      addedAt: new Date().toISOString(),
    };
    if (!leaf.videoUrl) {
      return NextResponse.json({ error: 'Brak filmu' }, { status: 400 });
    }
    data.leaves.push(leaf);
  } else if (action === 'remove') {
    data.leaves = data.leaves.filter((l) => l.id !== body.id);
  } else if (action === 'move') {
    // Zmiana kolejności — decyduje, na którym listku film wyrośnie.
    const i = data.leaves.findIndex((l) => l.id === body.id);
    const j = i + (body.dir === 'up' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < data.leaves.length) {
      [data.leaves[i], data.leaves[j]] = [data.leaves[j], data.leaves[i]];
    }
  } else {
    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  }

  await s3Service.saveJsonData('bossxd-leaves', data);
  return NextResponse.json({ success: true, ...data });
}
