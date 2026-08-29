import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3';

export const dynamic = 'force-dynamic';

type Track = { id: string; title: string; artist: string; url: string };

/**
 * Adres całej stacji — jeden stały link „Radio BOSSXD".
 *
 * Zwykły odtwarzacz (VLC, telefon, cudza strona) nie zna naszej playlisty,
 * więc podajemy mu kolejny utwór po kolei i przekierowujemy na plik.
 * Po skończeniu utworu odtwarzacz wraca po następny — to daje efekt radia.
 *
 * ?i=<numer> pozwala wskazać konkretną pozycję; bez tego lecimy po kolei
 * według czasu (co odświeżenie inny utwór).
 */
export async function GET(req: NextRequest) {
  const res = await s3Service.loadJsonData('radio-playlist', { tracks: [] });
  const tracks = ((res.data as { tracks: Track[] })?.tracks) || [];

  if (!tracks.length) {
    return NextResponse.json({ error: 'Playlista jest pusta' }, { status: 404 });
  }

  const raw = req.nextUrl.searchParams.get('i');
  const idx =
    raw !== null && Number.isFinite(Number(raw))
      ? ((Number(raw) % tracks.length) + tracks.length) % tracks.length
      : Math.floor(Date.now() / 1000) % tracks.length;

  const track = tracks[idx];
  const key = decodeURIComponent(new URL(track.url).pathname.replace(/^\//, ''));
  const signed = await s3Service.getDownloadUrl(key, `${track.title}.mp3`, 3600);

  if (!signed?.success || !signed.url) {
    return NextResponse.json({ error: 'Nie udało się otworzyć pliku' }, { status: 500 });
  }

  return NextResponse.redirect(signed.url, 302);
}
