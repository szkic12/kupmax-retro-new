import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getClientIP, checkRateLimit } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();
const MAX = 15 * 1024 * 1024;   // 15 MB — bruminacja to kilkadziesiąt sekund
const OK_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Osobne wejście na nagrania z bossxd.com — bez uprawnień admina.
 * Trzyma się wąsko: tylko dźwięk, tylko do folderu z głosami, z limitem.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(`vupload:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj za godzinę.' }, { status: 429, headers: CORS });
  }

  const { fileType, fileSize } = await req.json().catch(() => ({}));

  if (!OK_TYPES.includes(String(fileType))) {
    return NextResponse.json({ error: 'To nie jest nagranie dźwiękowe' }, { status: 400, headers: CORS });
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX) {
    return NextResponse.json({ error: 'Nagranie jest za duże (max 15 MB)' }, { status: 400, headers: CORS });
  }

  const ext = String(fileType).includes('webm') ? 'webm'
    : String(fileType).includes('ogg') ? 'ogg'
    : String(fileType).includes('wav') ? 'wav'
    : String(fileType).includes('mp4') || String(fileType).includes('m4a') ? 'm4a'
    : 'mp3';

  // Nazwę nadajemy sami — nazwa pliku od użytkownika nigdy nie trafia do klucza.
  const s3Key = `media/voices/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: String(fileType) }),
    { expiresIn: 300 }
  );

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  return NextResponse.json({ success: true, presignedUrl, publicUrl }, { headers: CORS });
}
