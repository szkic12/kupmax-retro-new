// Forum na Supabase (tabele forum_*). Zastępuje stary plik data/forum.json na S3.
// Mapuje wiersze z bazy na dawny kształt odpowiedzi, więc strony forum działają bez zmian.
import { createClient } from '@supabase/supabase-js';
import { publicVoiceUrl } from '@/lib/forum-voice';
import { publicPhotoUrl } from '@/lib/forum-photos';
import { publicModel } from '@/lib/forum-models';

export const forumDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#795548', '#607D8B'];

export function toCategory(c: any, i: number, stats?: { count: number; last: string | null }) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.emoji,
    isAdult: c.is_adult,
    threadCount: stats?.count || 0,
    lastActivity: stats?.last || null,
    color: COLORS[i % COLORS.length],
    order: c.sort,
  };
}

export function toThread(t: any) {
  return {
    id: t.id,
    categoryId: t.category_id,
    title: t.title,
    author: { nickname: t.author_nick, avatar: t.author_avatar },
    message: t.body,
    voiceUrl: publicVoiceUrl(t.voice_url),
    voiceMode: t.voice_mode,
    voiceSeconds: t.voice_seconds,
    photos: (t.photos || []).map(publicPhotoUrl),
    model: publicModel(t.model),
    date: t.created_at,
    lastActivity: t.last_activity,
    replyCount: t.reply_count,
    views: t.views,
    isSticky: t.is_pinned,
    isLocked: false,
    tags: [],
  };
}

export function toPost(p: any) {
  return {
    id: p.id,
    threadId: p.thread_id,
    author: { nickname: p.author_nick, avatar: p.author_avatar },
    message: p.body,
    isAi: p.is_ai,
    voiceUrl: publicVoiceUrl(p.voice_url),
    voiceMode: p.voice_mode,
    voiceSeconds: p.voice_seconds,
    photos: (p.photos || []).map(publicPhotoUrl),
    model: publicModel(p.model),
    date: p.created_at,
    isAnswer: false,
  };
}

// Kategorie, które wolno pokazać; strefa 18+ tylko dla zalogowanych po bramce wieku
export async function visibleCategories(adult = false) {
  let q = forumDb.from('forum_categories').select('*').order('sort');
  if (!adult) q = q.eq('is_adult', false);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
