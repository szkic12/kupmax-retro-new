import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Playlista własnej stacji "KUPMAX — moje utwory" (2026-08-27).
// Brat: "chciałbym mieć strumień, który mogę w panelrudy dodawać".
// Utwory leżą na S3, tu trzymamy tylko kolejność i opisy.
export type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;        // adres pliku na S3
  addedAt: string;
};

const EMPTY: { tracks: Track[] } = { tracks: [] };

async function load() {
  const r = await s3Service.loadJsonData('radio-playlist', EMPTY);
  return (r.data as { tracks: Track[] }) || EMPTY;
}

export async function GET() {
  try {
    return NextResponse.json(await load());
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = await load();

    if (body.action === 'add') {
      if (!body.url || !body.title) {
        return NextResponse.json({ error: 'Brakuje tytułu albo pliku' }, { status: 400 });
      }
      data.tracks.push({
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: String(body.title).slice(0, 120),
        artist: String(body.artist || 'BOSSXD').slice(0, 80),
        url: String(body.url),
        addedAt: new Date().toISOString(),
      });
    } else if (body.action === 'remove') {
      data.tracks = data.tracks.filter((t) => t.id !== body.id);
    } else if (body.action === 'move') {
      // Zmiana kolejności — przesuwa utwór o jedno miejsce w górę/dół.
      const i = data.tracks.findIndex((t) => t.id === body.id);
      const j = body.dir === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < data.tracks.length) {
        [data.tracks[i], data.tracks[j]] = [data.tracks[j], data.tracks[i]];
      }
    } else if (body.action === 'reorder' && Array.isArray(body.tracks)) {
      data.tracks = body.tracks;
    } else {
      return NextResponse.json({ error: 'Nieznana operacja' }, { status: 400 });
    }

    await s3Service.saveJsonData('radio-playlist', data);
    return NextResponse.json({ ok: true, tracks: data.tracks });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Nie udało się zapisać' },
      { status: 500 }
    );
  }
}
