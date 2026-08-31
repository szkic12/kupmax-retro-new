import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

const ALLOWED_TYPES: Record<string, string[]> = {
  music: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/x-m4a'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
};

const MAX_SIZE: Record<string, number> = {
  music: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

// POST: zwraca presigned URL — plik idzie bezpośrednio z przeglądarki do S3
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(session.user.email)) {
    return NextResponse.json({ error: 'Rate limit: max 30 uploadów na godzinę' }, { status: 429 });
  }

  const { fileName, fileType, fileSize, folder } = await request.json();

  if (!fileName || !fileType || !folder) {
    return NextResponse.json({ error: 'Brak wymaganych pól' }, { status: 400 });
  }

  const allowed = ALLOWED_TYPES[folder];
  if (!allowed || !allowed.includes(fileType)) {
    return NextResponse.json({ error: 'Niedozwolony typ pliku' }, { status: 400 });
  }

  if (fileSize && fileSize > MAX_SIZE[folder]) {
    return NextResponse.json({ error: `Plik za duży (max ${MAX_SIZE[folder] / 1024 / 1024}MB)` }, { status: 400 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const s3Key = `media/${folder}/${Date.now()}_${safeName}`;

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: fileType }),
    { expiresIn: 300 }
  );

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

  return NextResponse.json({ success: true, presignedUrl, publicUrl, s3Key });
}
