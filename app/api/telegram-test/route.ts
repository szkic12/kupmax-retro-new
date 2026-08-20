import { NextResponse } from 'next/server';
import { notify } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// Przycisk "Wyślij test" w panelrudy — sprawdza, czy Telegram działa,
// bez czekania aż ktoś naprawdę napisze (2026-08-20).
export async function POST() {
  const configured = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: 'Brak tokenu albo chat id w ustawieniach Vercel.' },
      { status: 400 }
    );
  }
  const sent = await notify(
    'test',
    'KupMax',
    'Działa. Od teraz dostajesz wiadomość, gdy ktoś napisze na czacie, zada pytanie albo złoży zamówienie.',
    'https://www.kupmax.pl/panelrudy'
  );
  return NextResponse.json(
    sent ? { ok: true } : { ok: false, error: 'Telegram odrzucił wiadomość — sprawdź token i chat id.' },
    { status: sent ? 200 : 500 }
  );
}
