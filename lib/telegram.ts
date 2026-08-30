// ═══════════════════════════════════════════════════════════════════════
//  POWIADOMIENIA NA TELEGRAM (2026-08-20)
//
//  Brat: "chcę wiedzieć o czacie, pytaniach i zamówieniach — o wszystkim,
//  co tu się dzieje". Wcześniej licznik w panelu działał tylko przy otwartej
//  karcie; to przychodzi na telefon z dźwiękiem, nawet gdy panel jest zamknięty.
//
//  Za darmo, bez limitu. Token i chat id w zmiennych środowiskowych Vercel —
//  NIGDY w kodzie.
// ═══════════════════════════════════════════════════════════════════════

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export type AlertKind = 'chat' | 'question' | 'order' | 'guestbook' | 'forum' | 'voice' | 'test';

const ICON: Record<AlertKind, string> = {
  voice: '🪞',
  chat: '💬',
  question: '❓',
  order: '🛒',
  guestbook: '📖',
  forum: '💭',
  test: '🔔',
};

const LABEL: Record<AlertKind, string> = {
  voice: 'Głos w lustrze',
  chat: 'Czat',
  question: 'Pytanie na bossxd',
  order: 'ZAMÓWIENIE',
  guestbook: 'Księga gości',
  forum: 'Forum',
  test: 'Test',
};

/** Ucina zbyt długie teksty — powiadomienie ma być do przeczytania jednym rzutem oka. */
function short(s: string, max = 220): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

/** Telegram psuje się na < > &, więc zamieniamy przed wysłaniem. */
function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Wysyła powiadomienie. Nigdy nie rzuca błędem — awaria Telegrama
 * nie może zepsuć zamówienia ani wiadomości na czacie.
 */
export async function notify(
  kind: AlertKind,
  who: string,
  text: string,
  link?: string
): Promise<boolean> {
  if (!TOKEN || !CHAT_ID) return false;   // nieskonfigurowane — po cichu pomijamy

  const parts = [
    `${ICON[kind]} <b>${esc(LABEL[kind])}</b>`,
    who ? `<b>${esc(short(who, 40))}</b>` : '',
    esc(short(text)),
    link ? `\n${link}` : '',
  ].filter(Boolean);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: parts.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      // Nie blokujemy odpowiedzi użytkownikowi dłużej niż 4 s.
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
