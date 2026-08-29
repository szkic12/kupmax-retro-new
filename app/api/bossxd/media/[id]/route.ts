import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../../lib/aws-s3.js';

export const dynamic = 'force-dynamic';

type Leaf = { id: string; title: string; videoUrl: string; posterUrl: string };

/**
 * Stały adres filmu albo klatki z listka.
 *
 * Kubełek S3 jest prywatny — bezpośredni link zwraca 403. Podpisany adres
 * żyje tylko godzinę, więc podpisujemy go na świeżo przy każdym odtworzeniu
 * i przekierowujemy. Dzięki temu adres w kodzie strony nigdy nie wygasa.
 *
 * ?k=poster → klatka, bez tego → film.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wantPoster = req.nextUrl.searchParams.get('k') === 'poster';

  const res = await s3Service.loadJsonData('bossxd-leaves', { leaves: [] });
  const leaves = ((res.data as { leaves: Leaf[] })?.leaves) || [];
  const leaf = leaves.find((l) => l.id === id);

  if (!leaf) {
    return NextResponse.json({ error: 'Nie ma takiego listka' }, { status: 404 });
  }

  const src = wantPoster ? leaf.posterUrl : leaf.videoUrl;
  if (!src) {
    return NextResponse.json({ error: 'Brak pliku' }, { status: 404 });
  }

  const key = decodeURIComponent(new URL(src).pathname.replace(/^\//, ''));
  const signed = await s3Service.getDownloadUrl(key, key.split('/').pop() || 'plik', 3600);

  if (!signed?.success || !signed.url) {
    return NextResponse.json({ error: 'Nie udało się otworzyć pliku' }, { status: 500 });
  }

  return NextResponse.redirect(signed.url, 302);
}
