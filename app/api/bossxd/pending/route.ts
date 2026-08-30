import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Pending = {
  id: string; kind: 'image' | 'video'; url: string; posterUrl?: string;
  title: string; author: string; addedAt: string; ip: string;
};

/** Poczekalnia — widoczna wyłącznie dla Brata w panelrudy. */
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }
  const r = await s3Service.loadJsonData('bossxd-pending', { pending: [] });
  return NextResponse.json(r.data || { pending: [] });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }

  const { action, id } = await req.json();
  const r = await s3Service.loadJsonData('bossxd-pending', { pending: [] });
  const data = (r.data as { pending: Pending[] }) || { pending: [] };
  const item = data.pending.find((p) => p.id === id);

  if (!item) {
    return NextResponse.json({ error: 'Nie ma takiej wrzutki' }, { status: 404 });
  }

  if (action === 'approve') {
    // Przyjęte trafia tam, gdzie jego miejsce: film na listek, zdjęcie na skrzydło.
    if (item.kind === 'video') {
      const lr = await s3Service.loadJsonData('bossxd-leaves', { leaves: [] });
      const leaves = (lr.data as { leaves: unknown[] }) || { leaves: [] };
      leaves.leaves.push({
        id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: `${item.title} — ${item.author}`,
        videoUrl: item.url,
        posterUrl: item.posterUrl || '',
        addedAt: new Date().toISOString(),
      });
      await s3Service.saveJsonData('bossxd-leaves', leaves);
    } else {
      const sr = await s3Service.loadJsonData('bossxd-wings', { shots: [] });
      const shots = (sr.data as { shots: unknown[] }) || { shots: [] };
      shots.shots.push({
        id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: `${item.title} — ${item.author}`,
        imageUrl: item.url,
        addedAt: new Date().toISOString(),
      });
      await s3Service.saveJsonData('bossxd-wings', shots);
    }
  } else if (action !== 'reject') {
    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  }

  // Plik w S3 zostaje — usunięcie zostawiam ręcznie, żeby nic nie przepadło przez pomyłkę.
  data.pending = data.pending.filter((p) => p.id !== id);
  await s3Service.saveJsonData('bossxd-pending', data);

  return NextResponse.json({ success: true, ...data });
}
