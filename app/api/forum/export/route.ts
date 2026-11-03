import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { runExport, readManifest, downloadLinks } from '@/lib/forum-export';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const DAY_MS = 12 * 60 * 60 * 1000; // najwyżej co 12 h: ręczne „zrób teraz” w dzień nie blokuje nocnej paczki

// GET ?cron=1: nocne zadanie Vercela. Bez sekretu, ale paczka powstaje najwyżej raz na 12 godzin.
// GET (admin): ostatnia paczka z liczbami i linkami do pobrania.
export async function GET(req: NextRequest) {
  try {
    if (new URL(req.url).searchParams.get('cron')) {
      const last = await readManifest();
      if (last && Date.now() - new Date(last.at).getTime() < DAY_MS) return NextResponse.json({ success: true, skipped: true, date: last.date });
      const manifest = await runExport();
      return NextResponse.json({ success: true, date: manifest.date });
    }
    if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
    const manifest = await readManifest();
    return NextResponse.json({ success: true, manifest, links: manifest ? await downloadLinks(manifest) : {} });
  } catch (error) {
    logger.error('forum export GET:', error);
    return NextResponse.json({ success: false, error: 'Błąd eksportu' }, { status: 500 });
  }
}

// POST (admin): zrób paczkę teraz
export async function POST(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const manifest = await runExport();
    return NextResponse.json({ success: true, manifest, links: await downloadLinks(manifest) });
  } catch (error) {
    logger.error('forum export POST:', error);
    return NextResponse.json({ success: false, error: 'Błąd eksportu' }, { status: 500 });
  }
}
