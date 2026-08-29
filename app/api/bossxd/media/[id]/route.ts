import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import s3Service from '../../../../../lib/aws-s3.js';

export const dynamic = 'force-dynamic';

type Leaf = { id: string; title: string; videoUrl: string; posterUrl: string };

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();

/**
 * Film albo klatka z listka — podawane przez nas, nie przekierowaniem.
 * ?k=poster → klatka, bez tego → film.
 *
 * Przekierowanie do podpisanego adresu S3 nie działa dla strony na innej
 * domenie: podpis jest związany z tym, kto pyta (przeglądarka dostawała 403),
 * a przy przekierowaniu ginie zgoda CORS. Dlatego pobieramy plik u siebie
 * i oddajemy go z właściwymi nagłówkami.
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

  const src = wantPoster ? leaf?.posterUrl : leaf?.videoUrl;
  if (!src) {
    return NextResponse.json({ error: 'Nie ma takiego pliku' }, { status: 404 });
  }

  const key = decodeURIComponent(new URL(src).pathname.replace(/^\//, ''));

  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  try {
    const obj = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await obj.Body!.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': obj.ContentType || (wantPoster ? 'image/jpeg' : 'video/mp4'),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        // Bez tego odtwarzacz nie umie przewijać filmu.
        'Accept-Ranges': 'bytes',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Nie udało się odczytać pliku' }, { status: 500 });
  }
}
