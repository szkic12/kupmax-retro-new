// Wątek z odpowiedziami w kształcie dla strony: wspólne dla API (/api/forum/posts) i dla strony renderowanej na serwerze (Google, K12).
import { forumDb, toThread, toPost, visibleCategories } from '@/lib/forum-db';
import { aiCanCheck } from '@/lib/forum-ai';
import { claimsForThread } from '@/lib/forum-claims';

type Row = Record<string, any>;

export async function loadThread(row: Row, opts: { viewerId?: string; from?: number; limit?: number } = {}) {
  const from = opts.from || 0, limit = opts.limit || 50;
  const { data: rows, count, error } = await forumDb.from('forum_posts').select('*', { count: 'exact' })
    .eq('thread_id', row.id).in('status', ['widoczny', 'usuniety'])
    .order('created_at', { ascending: true })
    .range(from, from + limit - 1);
  if (error) throw error;
  // Licznik „poprawił AI” i listek zaufania przy nickach autorów
  const authorIds = [...new Set((rows || []).map((p: any) => p.author_id).filter(Boolean))];
  const { data: profs } = authorIds.length
    ? await forumDb.from('forum_profiles').select('user_id, ai_wins, trust').in('user_id', authorIds)
    : { data: [] };
  const wins = new Map<string, number>((profs || []).map((p: any) => [p.user_id, p.ai_wins || 0]));
  const trust = new Map<string, number>((profs || []).map((p: any) => [p.user_id, Number(p.trust) || 0]));
  const { data: cat } = await forumDb.from('forum_categories').select('is_adult').eq('id', row.category_id).maybeSingle();
  const aiOff = !!cat?.is_adult;
  // Twierdzenia przy odpowiedziach + pełna odpowiedź (K7) + karty (K8)
  const { claims, summary, cards } = aiOff ? { claims: [], summary: null, cards: [] } : await claimsForThread(row, opts.viewerId);
  const posts = (rows || []).map((p: any) => ({ ...toPost(p, wins, trust), claims: claims.filter((c) => c.postId === p.id) }));
  // Telefony do fachowców: ile potwierdziło odpowiedź AI (✔), ile mówi „tak się nie robi” (✖); podpisy tylko za zgodą
  const { data: calls } = await forumDb.from('forum_calls').select('verdict, consent_name, label').eq('thread_id', row.id).not('verdict', 'is', null);
  const experts = (calls || []).length ? {
    tak: (calls || []).filter((c: any) => c.verdict === 'tak').map((c: any) => c.label),
    nie: (calls || []).filter((c: any) => c.verdict === 'nie').map((c: any) => c.label),
  } : null;
  const thread = {
    ...toThread(row),
    experts,
    aiOff,
    aiCan: aiCanCheck(row, rows || [], aiOff),
    claimsWait: !aiOff && (rows || []).some((p: any) => p.status === 'widoczny' && !p.claims_at),
    summary,
    cards,
  };
  return { thread, posts, total: count || 0 };
}

// Dla Google: tylko widoczny wątek spoza strefy 18+ (stare linki thread_123 też)
export async function publicThreadRow(id: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const { data } = await forumDb.from('forum_threads').select('*').eq(isUuid ? 'id' : 'legacy_id', id).eq('status', 'widoczny').maybeSingle();
  if (!data) return null;
  const cats = await visibleCategories(false);
  return cats.some((c: any) => c.id === data.category_id) ? data : null;
}
