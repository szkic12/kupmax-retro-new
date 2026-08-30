import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import s3Service from '../../../../lib/aws-s3.js';
import { notify } from '@/lib/telegram';
import { getClientIP, checkRateLimit } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BUCKET = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();

const LIMITS = {
  image: { max: 10 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { max: 50 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/quicktime'] },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Sprawdzenie po zawartości, nie po deklaracji.
 * Przeglądarka podaje typ pliku, ale każdy może go zmyślić — bez tego
 * skrypt nazwany "image/png" wjeżdżałby do poczekalni.
 */
function realKind(b: Uint8Array): 'image' | 'video' | null {
  const h = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  if (h(0xff, 0xd8, 0xff)) return 'image';                                   // jpg
  if (h(0x89, 0x50, 0x4e, 0x47)) return 'image';                             // png
  if (h(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45) return 'image';  // webp
  if (h(0x1a, 0x45, 0xdf, 0xa3)) return 'video';                             // webm
  // mp4 / mov: "ftyp" na pozycji 4
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'video';
  return null;
}

type Pending = {
  id: string;
  kind: 'image' | 'video';
  url: string;
  posterUrl?: string;
  title: string;
  author: string;
  addedAt: string;
  ip: string;
};

/**
 * Wrzutka od odwiedzającego — film do koniczyny albo zdjęcie do motyla.
 *
 * NIC nie trafia na stronę samo. Wszystko ląduje w poczekalni i czeka na
 * kliknięcie Brata w panelrudy. To strona firmowa, więc cudza treść bez
 * sprawdzenia to ryzyko, którego nie podejmujemy.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(`contrib:${ip}`, 12, 24 * 60 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many uploads from this network today. Try again tomorrow.' },
      { status: 429, headers: CORS }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const kind = String(form?.get('kind') || '');
  const author = String(form?.get('author') || '').slice(0, 40).trim();
  const title = String(form?.get('title') || '').slice(0, 120).trim();

  if (kind !== 'image' && kind !== 'video') {
    return NextResponse.json({ error: 'Unknown kind' }, { status: 400, headers: CORS });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file received' }, { status: 400, headers: CORS });
  }
  if (!author) {
    return NextResponse.json({ error: 'Please add your name' }, { status: 400, headers: CORS });
  }

  const rule = LIMITS[kind];
  const type = file.type || '';
  if (!rule.types.includes(type)) {
    return NextResponse.json(
      { error: kind === 'video' ? 'Only MP4, WebM or MOV videos' : 'Only JPG, PNG or WebP images' },
      { status: 400, headers: CORS }
    );
  }
  if (file.size <= 0 || file.size > rule.max) {
    return NextResponse.json(
      { error: `File is too large (max ${rule.max / 1024 / 1024} MB)` },
      { status: 400, headers: CORS }
    );
  }

  const ext = type.split('/')[1].replace('quicktime', 'mov').replace('jpeg', 'jpg');
  // Nazwę nadajemy sami — nazwa od użytkownika nigdy nie trafia do klucza.
  const key = `media/pending/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  const bytes = Buffer.from(await file.arrayBuffer());

  // Deklarowany typ to za mało — patrzymy, czym plik jest naprawdę.
  if (realKind(bytes) !== kind) {
    return NextResponse.json(
      { error: kind === 'video' ? 'That file is not a video' : 'That file is not an image' },
      { status: 400, headers: CORS }
    );
  }

  try {
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: type }));
  } catch {
    return NextResponse.json({ error: 'Could not save the file' }, { status: 500, headers: CORS });
  }

  // Klatka z filmu, jeśli przeglądarka ją przysłała.
  let posterUrl = '';
  const poster = form?.get('poster');
  if (kind === 'video' && poster instanceof Blob && poster.size > 0 && poster.size < 3 * 1024 * 1024) {
    const pkey = `media/pending/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET, Key: pkey,
        Body: Buffer.from(await poster.arrayBuffer()),
        ContentType: 'image/jpeg',
      }));
      posterUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${pkey}`;
    } catch { /* brak klatki nie blokuje wrzutki */ }
  }

  const res = await s3Service.loadJsonData('bossxd-pending', { pending: [] });
  const data = (res.data as { pending: Pending[] }) || { pending: [] };

  const item: Pending = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
    posterUrl,
    title: title || 'Bez tytułu',
    author,
    addedAt: new Date().toISOString(),
    ip,
  };

  data.pending.push(item);
  await s3Service.saveJsonData('bossxd-pending', data);

  notify(
    'voice',
    author,
    `Przysłał(a) ${kind === 'video' ? 'film' : 'zdjęcie'}: „${item.title}". Czeka na Twoją zgodę — ${data.pending.length} w poczekalni.`,
    'https://www.kupmax.pl/panelrudy'
  ).catch(() => { /* powiadomienie nie może wywrócić zapisu */ });

  return NextResponse.json({ success: true, waiting: data.pending.length }, { headers: CORS });
}
