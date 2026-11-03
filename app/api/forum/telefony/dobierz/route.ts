import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { zaplanuj, wyslijMail } from '@/lib/forum-dobor';
import { notify } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET ?cron=1: rano (cron Vercela) dobiera fachowców do nowych problemów i wysyła Bratu maila z listą.
// Bez sekretu, ale działa tylko między 3:00 a 7:00 UTC, więc nikt obcy nie zasypie skrzynki.
export async function GET(req: NextRequest) {
  if (!new URL(req.url).searchParams.get('cron')) return NextResponse.json({ success: false }, { status: 404 });
  const h = new Date().getUTCHours();
  if (h < 3 || h >= 7) return NextResponse.json({ success: true, skipped: 'poza godzinami' });
  try {
    const plan = await zaplanuj();
    const mail = await wyslijMail();
    if (mail.sent) notify('forum', 'Telefony na dziś', `${plan.rozmow} nowych rozmów, mail wysłany`, 'https://www.kupmax.pl/panelrudy').catch(() => {});
    return NextResponse.json({ success: true, plan: { rozmow: plan.rozmow }, mail });
  } catch (error) {
    logger.error('forum dobierz cron:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// POST (Brat w panelu): { action: 'dobierz', watek? } — guzik „📞 Dobierz numery”; { action: 'mail' } — wyślij listę mailem teraz
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!(await verifyAdminToken(req, body))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    if (body.action === 'mail') return NextResponse.json({ success: true, mail: await wyslijMail() });
    const plan = await zaplanuj({ watek: body.watek });
    return NextResponse.json({ success: true, ...plan });
  } catch (error) {
    logger.error('forum dobierz:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się dobrać numerów' }, { status: 500 });
  }
}
