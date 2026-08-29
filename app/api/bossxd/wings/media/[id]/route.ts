import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../../../lib/aws-s3.js';

export const dynamic = 'force-dynamic';

type Shot = { id: string; title: string; imageUrl: string };

/**
 * Stały adres zdjęcia spod skrzydeł.
 * Kubełek jest prywatny (bezpośredni link = 403), a podpis żyje godzinę,
 * więc podpisujemy na świeżo przy każdym wyświetleniu.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await s3Service.loadJsonData('bossxd-wings', { shots: [] });
  const shots = ((res.data as { shots: Shot[] })?.shots) || [];
  const shot = shots.find((s) => s.id === id);

  if (!shot?.imageUrl) {
    return NextResponse.json({ error: 'Nie ma takiego zdjęcia' }, { status: 404 });
  }

  const key = decodeURIComponent(new URL(shot.imageUrl).pathname.replace(/^\//, ''));
  const signed = await s3Service.getDownloadUrl(key, key.split('/').pop() || 'zdjecie', 3600);

  if (!signed?.success || !signed.url) {
    return NextResponse.json({ error: 'Nie udało się otworzyć zdjęcia' }, { status: 500 });
  }

  return NextResponse.redirect(signed.url, 302);
}
