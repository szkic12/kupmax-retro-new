import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export type Partner = {
  id: string;
  title: string;    // nazwa firmy — pokazywana, gdy nie ma logo
  imageUrl: string; // logo
  linkUrl: string;
  addedAt: string;
};

/**
 * Przepuszczamy tylko zwykłe adresy http(s). Bez tego ktoś mógłby wpisać
 * javascript:… i logo stałoby się pułapką dla odwiedzających.
 */
function safeLink(v: unknown): string {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? s : '';
  } catch {
    return '';
  }
}

const EMPTY: { partners: Partner[] } = { partners: [] };

async function load() {
  const r = await s3Service.loadJsonData('bossxd-partners', EMPTY);
  return (r.data as { partners: Partner[] }) || EMPTY;
}

export async function GET() {
  const data = await load();
  return NextResponse.json(data, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// Strona bossxd.com stoi na innej domenie — bez tego przeglądarka zablokuje odczyt.
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;
  const data = await load();

  if (action === 'add') {
    const partner: Partner = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: String(body.title || 'Bez tytułu').slice(0, 120),
      imageUrl: String(body.imageUrl || ''),
      linkUrl: safeLink(body.linkUrl),
      addedAt: new Date().toISOString(),
    };
    if (!partner.imageUrl && !partner.title) {
      return NextResponse.json({ error: 'Potrzebne logo albo nazwa' }, { status: 400 });
    }
    data.partners.push(partner);
  } else if (action === 'remove') {
    data.partners = data.partners.filter((l) => l.id !== body.id);
  } else if (action === 'move') {
    // Kolejność decyduje o miejscu w siatce.
    const i = data.partners.findIndex((l) => l.id === body.id);
    const j = i + (body.dir === 'up' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < data.partners.length) {
      [data.partners[i], data.partners[j]] = [data.partners[j], data.partners[i]];
    }
  } else if (action === 'link') {
    const x = data.partners.find((v) => v.id === body.id);
    if (x) x.linkUrl = safeLink(body.linkUrl);
  } else if (action === 'title') {
    // Podpis pojawia się pod skrzydłami razem ze zdjęciem.
    const s = data.partners.find((x) => x.id === body.id);
    if (s) s.title = String(body.title || '').slice(0, 120);
  } else {
    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  }

  await s3Service.saveJsonData('bossxd-partners', data);
  return NextResponse.json({ success: true, ...data });
}
