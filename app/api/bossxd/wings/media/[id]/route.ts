import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import s3Service from '../../../../../../lib/aws-s3.js';

export const dynamic = 'force-dynamic';

type Shot = { id: string; title: string; imageUrl: string };

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();

/**
 * Zdjęcie spod skrzydeł — podawane przez nas, nie przekierowaniem.
 *
 * Przekierowanie do podpisanego adresu S3 nie działa dla strony na innej
 * domenie: podpis jest związany z tym, kto pyta (przeglądarka dostawała 403),
 * a przy przekierowaniu ginie zgoda CORS. Dlatego pobieramy plik u siebie
 * i oddajemy go z właściwymi nagłówkami.
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
        'Content-Type': obj.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Nie udało się odczytać zdjęcia' }, { status: 500 });
  }
}
