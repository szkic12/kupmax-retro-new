import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { notify } from '@/lib/telegram';
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sanitizeInput } from '@/lib/sanitize';
import { forumDb } from '@/lib/forum-db';
import { getForumUser } from '@/lib/forum-auth';
import { CATEGORIES, isCategory } from '@/lib/forum-moderation';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST: zgłoszenie wpisu (DSA art. 16). Może zgłosić każdy, także bez konta.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    if (!checkRateLimit(`forum-report:${ip}`, 10, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Za dużo zgłoszeń. Spróbuj później albo napisz na kontakt@kupmax.pl.' }, { status: 429 });
    }
    const { targetType, targetId, category, details: rawDetails, email: rawEmail, goodFaith, recaptchaToken } = await req.json();

    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) return NextResponse.json({ success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Odśwież stronę.' }, { status: 403 });

    if (!['thread', 'post', 'claim'].includes(targetType) || !UUID.test(targetId || '') || !isCategory(category)) {
      return NextResponse.json({ success: false, error: 'Złe zgłoszenie.' }, { status: 400 });
    }
    const details = sanitizeInput(String(rawDetails || ''), 2000).trim();
    const me = await getForumUser(req);
    const email = String(rawEmail || me?.user.email || '').trim().slice(0, 200);

    // Przy treściach z dziećmi nie wymagamy danych zgłaszającego (art. 16 ust. 2 lit. c)
    if (category !== 'dzieci') {
      if (details.length < 10) return NextResponse.json({ success: false, error: 'Napisz krótko, co jest nie tak (min. 10 znaków).' }, { status: 400 });
      if (!EMAIL.test(email)) return NextResponse.json({ success: false, error: 'Podaj e-mail, żebyśmy mogli dać znać, co zrobiliśmy.' }, { status: 400 });
      if (!goodFaith) return NextResponse.json({ success: false, error: 'Potwierdź, że zgłaszasz w dobrej wierze.' }, { status: 400 });
    }

    const table = targetType === 'thread' ? 'forum_threads' : targetType === 'post' ? 'forum_posts' : 'forum_claims';
    const cols = targetType === 'thread' ? 'id, title' : targetType === 'post' ? 'id, thread_id, body' : 'id, thread_id, body, forum_cards(slug)';
    const { data: target } = await forumDb.from(table).select(cols).eq('id', targetId).maybeSingle();
    if (!target) return NextResponse.json({ success: false, error: 'Nie ma takiego wpisu.' }, { status: 404 });
    const threadId = targetType === 'thread' ? (target as any).id : (target as any).thread_id || null;
    const link = threadId ? `https://www.kupmax.pl/forum/thread/${threadId}` : `https://www.kupmax.pl/forum/karta/${(target as any).forum_cards?.slug || ''}`;

    const { error } = await forumDb.from('forum_reports').insert({
      target_type: targetType,
      target_id: targetId,
      thread_id: threadId,
      category,
      details: details || null,
      reporter_id: me?.user.id || null,
      reporter_email: EMAIL.test(email) ? email : null,
      good_faith: !!goodFaith,
    });
    if (error) throw error;

    notify('report', CATEGORIES[category], details || (target as any).title || (target as any).body || '', link).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('forum report:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się wysłać zgłoszenia. Napisz na kontakt@kupmax.pl.' }, { status: 500 });
  }
}
