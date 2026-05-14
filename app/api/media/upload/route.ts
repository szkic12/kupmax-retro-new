import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import S3Service from '../../../../lib/aws-s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES: Record<string, string[]> = {
  music: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/x-m4a'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

const MAX_SIZE: Record<string, number> = {
  music: 50 * 1024 * 1024,   // 50MB
  video: 500 * 1024 * 1024,  // 500MB
  image: 10 * 1024 * 1024,   // 10MB
};

const BUCKET_NAME = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const AWS_REGION = (process.env.AWS_REGION || 'eu-central-1').trim();

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminToken(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'image';

  if (!file) {
    return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
  }

  const allowed = ALLOWED_TYPES[folder];
  if (!allowed) {
    return NextResponse.json({ error: 'Nieprawidłowy folder' }, { status: 400 });
  }

  // Akceptuj też audio/* bez jawnego type (niektóre przeglądarki)
  if (!allowed.includes(file.type) && file.type !== '') {
    return NextResponse.json({ error: `Niedozwolony typ: ${file.type}` }, { status: 400 });
  }

  if (file.size > MAX_SIZE[folder]) {
    return NextResponse.json({ error: `Plik za duży (max ${MAX_SIZE[folder] / 1024 / 1024}MB)` }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const s3Key = `media/${folder}/${Date.now()}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
  }));

  const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

  return NextResponse.json({ success: true, url, s3Key });
}
