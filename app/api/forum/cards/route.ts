import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sanitizeInput } from '@/lib/sanitize';
import { forumDb } from '@/lib/forum-db';
import { getForumUser } from '@/lib/forum-auth';
import { cardPage, cardList, isDrawer, DRAWERS } from '@/lib/forum-cards';
import { splitText, claimRows } from '@/lib/forum-claims';
import { photoKeys } from '@/lib/forum-photos';
import { voiceFields } from '@/lib/forum-voice';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_ADD = 2000;

// GET ?slug= → karta z szufladami, bez slug → spis kart
export async function GET(req: NextRequest) {
  try {
    const slug = new URL(req.url).searchParams.get('slug');
    if (!slug) return NextResponse.json({ success: true, cards: await cardList() });
    const me = await getForumUser(req);
    const page = await cardPage(slug, me?.user.id);
    if (!page) return NextResponse.json({ success: false, error: 'Nie ma takiej karty.' }, { status: 404 });
    return NextResponse.json({ success: true, ...page });
  } catch (error) {
    logger.error('forum cards GET:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}

// POST { slug, drawer, message, photos, voiceKey, voiceMode, voiceSeconds, recaptchaToken }: „wiesz? dorzuć” prosto do szuflady
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby dorzucić.' }, { status: 401 });
    if (!checkRateLimit(`forum-card-add:${me.user.id}`, 10, 60 * 60 * 1000).allowed || !checkRateLimit(`forum-card-add-ip:${getClientIP(req)}`, 20, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Za dużo wpisów naraz. Spróbuj za jakiś czas.' }, { status: 429 });
    }
    const { slug, drawer, message, photos, voiceKey, voiceMode, voiceSeconds, recaptchaToken } = await req.json();
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.success) return NextResponse.json({ success: false, error: 'Weryfikacja reCAPTCHA nie powiodła się. Odśwież stronę.' }, { status: 403 });

    if (!isDrawer(drawer)) return NextResponse.json({ success: false, error: 'Zła szuflada.' }, { status: 400 });
    const { data: card } = await forumDb.from('forum_cards').select('id, name').eq('slug', String(slug || '')).maybeSingle();
    if (!card) return NextResponse.json({ success: false, error: 'Nie ma takiej karty.' }, { status: 404 });
    const text = sanitizeInput(String(message || ''), MAX_ADD).trim();
    if (text.length < 10) return NextResponse.json({ success: false, error: 'Napisz albo powiedz trochę więcej (min. 10 znaków).' }, { status: 400 });

    const photoList = photoKeys(me.user.id, photos);
    if (!Array.isArray(photoList)) return NextResponse.json({ success: false, error: photoList.error }, { status: 400 });
    const voice = await voiceFields(me.user.id, { voiceKey, voiceMode, voiceSeconds }, text);
    if ('error' in voice) return NextResponse.json({ success: false, error: voice.error }, { status: 400 });

    // AI tnie wpis na kawałki i sprawdza, czy jest w nim konkret o tej rzeczy
    const claims = await splitText(`KARTA WIEDZY: ${card.name}, szuflada: ${DRAWERS[drawer].label}`, text, me.profile.nick, { card: card.name, drawer });
    if (!claims.length) {
      return NextResponse.json({ success: false, error: `Nie znalazłem tu konkretu o „${card.name}”. Napisz, co dokładnie wiesz.` }, { status: 422 });
    }
    const rows = await claimRows(claims, { author_id: me.user.id, author_nick: me.profile.nick, is_ai: false });
    // Zdjęcia i nagranie przy pierwszym kawałku
    rows[0] = { ...rows[0], photos: photoList, ...voice };
    // Każdy wiersz musi mieć te same kolumny, inaczej baza wpisze pustkę tam, gdzie ich brakuje
    const { error } = await forumDb.from('forum_claims').insert(rows.map((r) => ({ photos: [], voice_url: null, voice_mode: null, voice_seconds: null, ...r, card_id: card.id, drawer })));
    if (error) throw error;
    return NextResponse.json({ success: true, added: rows.length });
  } catch (error) {
    logger.error('forum cards POST:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się dorzucić. Spróbuj za chwilę.' }, { status: 500 });
  }
}
