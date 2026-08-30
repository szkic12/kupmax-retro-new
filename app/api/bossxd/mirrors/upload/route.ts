import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getClientIP, checkRateLimit } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();
const MAX = 15 * 1024 * 1024;   // 15 MB — bruminacja to kilkadziesiąt sekund
export const maxDuration = 30;
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
 *
 * Plik idzie PRZEZ NAS, a nie prosto do S3: kubełek nie przyjmuje wysyłek
 * z domeny bossxd.com (brak reguły CORS po stronie Amazona), więc przeglądarka
 * dostawała 'Failed to fetch'. Nagrania są małe, więc przepuszczenie ich
 * przez serwer nic nie kosztuje.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(`vupload:${ip}`, 40, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many attempts from this network. Try again later.' }, { status: 429, headers: CORS });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No recording received' }, { status: 400, headers: CORS });
  }

  const fileType = file.type || 'audio/webm';
  const fileSize = file.size;

  if (!OK_TYPES.includes(String(fileType))) {
    return NextResponse.json({ error: 'That is not an audio recording' }, { status: 400, headers: CORS });
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX) {
    return NextResponse.json({ error: 'Recording is too large (max 15 MB)' }, { status: 400, headers: CORS });
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

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: s3Key, Body: bytes, ContentType: String(fileType),
    }));
  } catch {
    return NextResponse.json({ error: 'Could not save the recording' }, { status: 500, headers: CORS });
  }

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  return NextResponse.json({ success: true, publicUrl }, { headers: CORS });
}
