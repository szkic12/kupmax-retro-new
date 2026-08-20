import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../lib/aws-s3.js';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Które okienka otwierają się przy wejściu na kupmax.pl (2026-08-20).
// Wcześniej zaszyte na sztywno w app/page.tsx — Brat: "chcę suwakiem
// pokazywać to, co uważam za stosowne: dziś forum, jutro zdjęcia".
const DEFAULTS: Record<string, boolean> = {
  reklama: true,
  news: false,
  shop: false,
  image: false,
  video: false,
  model3d: false,
  character: false,
  chat: false,
  privateChat: false,
  forum: false,
  webring: false,
  guestbook: false,
  photos: false,
  downloads: false,
  radio: false,
  tetris: false,
  bulletin: false,
};

export async function GET() {
  try {
    const result = await s3Service.loadJsonData('window-settings', DEFAULTS);
    // Braki uzupełniamy domyślnymi — gdyby doszło nowe okno, nie wywali się.
    return NextResponse.json({ ...DEFAULTS, ...(result.data || {}) });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminToken(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }
  try {
    const body = await req.json();
    // Przepuszczamy tylko znane klucze i tylko wartości true/false.
    const clean: Record<string, boolean> = {};
    for (const k of Object.keys(DEFAULTS)) clean[k] = body[k] === true;
    await s3Service.saveJsonData('window-settings', clean);
    return NextResponse.json({ ok: true, settings: clean });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Nie udało się zapisać' },
      { status: 500 }
    );
  }
}
