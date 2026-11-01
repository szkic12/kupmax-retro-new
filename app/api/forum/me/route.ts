import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';
import { forumDb } from '@/lib/forum-db';
import { getForumUser } from '@/lib/forum-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AVATARS = ['👤', '😀', '😎', '🤓', '🧑‍💻', '👨‍🎤', '👩‍🔬', '🧙', '🤖', '👾', '🎮', '💀', '🐱', '🐶', '🦊'];

// GET: kim jestem na forum (profil albo null, jeśli trzeba go dopiero założyć)
export async function GET(req: NextRequest) {
  const me = await getForumUser(req);
  if (!me) return NextResponse.json({ success: false, error: 'Nie zalogowano' }, { status: 401 });
  return NextResponse.json({ success: true, email: me.user.email, profile: me.profile });
}

// POST: zakłada albo zmienia profil forum (nick, awatar, zgody, 18+)
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me) return NextResponse.json({ success: false, error: 'Nie zalogowano' }, { status: 401 });

    const { nick: rawNick, avatar, acceptTerms, consentTraining, adult } = await req.json();
    const nick = sanitizeInput(rawNick || '', 40).trim();
    if (nick.length < 2) {
      return NextResponse.json({ success: false, error: 'Nick musi mieć co najmniej 2 znaki.' }, { status: 400 });
    }
    if (!me.profile && !acceptTerms) {
      return NextResponse.json({ success: false, error: 'Zaakceptuj regulamin forum.' }, { status: 400 });
    }

    const row: Record<string, unknown> = {
      user_id: me.user.id,
      nick,
      avatar: AVATARS.includes(avatar) ? avatar : '👤',
      consent_training: !!consentTraining,
      updated_at: new Date().toISOString(),
    };
    // Potwierdzenie wieku zapisujemy z datą; odznaczenie zabiera dostęp do strefy 18+
    if (adult && !me.profile?.adult_confirmed_at) row.adult_confirmed_at = new Date().toISOString();
    if (!adult) row.adult_confirmed_at = null;

    const { data, error } = await forumDb
      .from('forum_profiles').upsert(row, { onConflict: 'user_id' }).select().single();
    if (error) {
      const taken = error.code === '23505';
      if (!taken) logger.error('forum profile upsert:', error);
      return NextResponse.json(
        { success: false, error: taken ? 'Ten nick jest już zajęty.' : 'Nie udało się zapisać profilu.' },
        { status: taken ? 409 : 500 }
      );
    }
    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    logger.error('forum profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
