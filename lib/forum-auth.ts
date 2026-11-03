// Kto pisze na forum: konto Supabase (wspólne z bossxd i ai.kupmax) + profil forum (nick, zgody, 18+).
import type { NextRequest } from 'next/server';
import { forumDb } from '@/lib/forum-db';

export type ForumProfile = {
  user_id: string;
  nick: string;
  avatar: string;
  consent_training: boolean;
  adult_confirmed_at: string | null;
};

// Czyta token z nagłówka Authorization; null = gość
export async function getForumUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await forumDb.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await forumDb
    .from('forum_profiles').select('*').eq('user_id', data.user.id).maybeSingle();
  return { user: data.user, profile: (profile as ForumProfile) || null };
}

// Brat zalogowany na forum swoim adminskim mailem (ramka „📞 Fachowcy” pod problemem)
export async function isForumAdmin(req: NextRequest) {
  const { isAdminEmail } = await import('@/lib/admin-auth');
  const me = await getForumUser(req);
  return isAdminEmail(me?.user.email);
}

export const isAdult = (u: Awaited<ReturnType<typeof getForumUser>>) => !!u?.profile?.adult_confirmed_at;
