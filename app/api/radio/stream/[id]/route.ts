import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../../lib/aws-s3';

export const dynamic = 'force-dynamic';

type Track = { id: string; title: string; artist: string; url: string };

/**
 * Stały adres utworu z playlisty.
 *
 * Kubełek S3 jest prywatny, więc bezpośredni link do pliku zwraca 403.
 * Podpisany adres działa tylko godzinę — dla radia grającego bez przerwy
 * to za mało. Dlatego przy każdym odtworzeniu podpisujemy adres na nowo
 * i przekierowujemy. Dzięki temu link do wklejenia nigdy nie wygasa.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await s3Service.loadJsonData('radio-playlist', { tracks: [] });
  const tracks = ((res.data as { tracks: Track[] })?.tracks) || [];
  const track = tracks.find((t) => t.id === id);

  if (!track) {
    return NextResponse.json({ error: 'Nie ma takiego utworu' }, { status: 404 });
  }

  // Klucz S3 wyciągamy z zapisanego adresu pliku.
  const key = decodeURIComponent(new URL(track.url).pathname.replace(/^\//, ''));
  const signed = await s3Service.getDownloadUrl(key, `${track.title}.mp3`, 3600);

  if (!signed?.success || !signed.url) {
    return NextResponse.json({ error: 'Nie udało się otworzyć pliku' }, { status: 500 });
  }

  return NextResponse.redirect(signed.url, 302);
}
