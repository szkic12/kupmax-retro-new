import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/admin-auth';
import { forumDb, visibleCategories } from '@/lib/forum-db';
import { getForumUser, isAdult } from '@/lib/forum-auth';
import { toClaim } from '@/lib/forum-claims';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
// Fakt: ✅ tak / ❌ nie. Wariant: tylko 👨‍🍳 „zrobiłem, działa”, bo w wariancie nie ma zwycięzcy.
const ALLOWED: Record<string, string[]> = { fakt: ['tak', 'nie'], wariant: ['dziala'] };

// POST { claimId, vote } — vote null cofa głos. Ten sam głos drugi raz też cofa.
export async function POST(req: NextRequest) {
  try {
    const me = await getForumUser(req);
    if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się, żeby oceniać.' }, { status: 401 });
    if (!checkRateLimit(`forum-vote:${me.user.id}`, 60, 10 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Za dużo ocen naraz. Odpocznij chwilę.' }, { status: 429 });
    }

    const { claimId, vote } = await req.json();
    if (!UUID.test(claimId || '')) return NextResponse.json({ success: false, error: 'Złe twierdzenie.' }, { status: 400 });

    const { data: claim } = await forumDb.from('forum_claims').select('*').eq('id', claimId).maybeSingle();
    if (!claim) return NextResponse.json({ success: false, error: 'Nie ma takiego twierdzenia.' }, { status: 404 });
    // Kawałek z odpowiedzi: wpis i wątek muszą być widoczne dla tego człowieka. Wpis dorzucony na kartę: wystarczy jego status.
    if (claim.status !== 'widoczny') return NextResponse.json({ success: false, error: 'Ten wpis nie jest już widoczny.' }, { status: 404 });
    if (claim.post_id) {
      const [{ data: post }, { data: thread }] = await Promise.all([
        forumDb.from('forum_posts').select('status').eq('id', claim.post_id).maybeSingle(),
        forumDb.from('forum_threads').select('category_id, status').eq('id', claim.thread_id).maybeSingle(),
      ]);
      const cats = await visibleCategories(isAdult(me));
      if (post?.status !== 'widoczny' || thread?.status !== 'widoczny' || !cats.some((c: any) => c.id === thread.category_id)) {
        return NextResponse.json({ success: false, error: 'Ten wpis nie jest już widoczny.' }, { status: 404 });
      }
    }
    if (claim.author_id === me.user.id) {
      return NextResponse.json({ success: false, error: 'Swoich twierdzeń nie oceniasz. Niech ocenią inni.' }, { status: 403 });
    }
    if (vote !== null && !ALLOWED[claim.kind]?.includes(vote)) {
      return NextResponse.json({ success: false, error: 'Zły głos.' }, { status: 400 });
    }

    const { data: prev } = await forumDb.from('forum_claim_votes').select('vote').eq('claim_id', claimId).eq('user_id', me.user.id).maybeSingle();
    const next = vote === null || prev?.vote === vote ? null : vote;
    if (next) {
      const { error } = await forumDb.from('forum_claim_votes').upsert({ claim_id: claimId, user_id: me.user.id, vote: next, created_at: new Date().toISOString() });
      if (error) throw error;
    } else if (prev) {
      await forumDb.from('forum_claim_votes').delete().eq('claim_id', claimId).eq('user_id', me.user.id);
    }

    // Liczniki przeliczamy z głosów, więc zawsze się zgadzają
    const { data: all } = await forumDb.from('forum_claim_votes').select('vote').eq('claim_id', claimId);
    const count = (v: string) => (all || []).filter((x) => x.vote === v).length;
    const { data: updated, error } = await forumDb.from('forum_claims')
      .update({ yes: count('tak'), no: count('nie'), done: count('dziala') })
      .eq('id', claimId).select('*').single();
    if (error) throw error;

    return NextResponse.json({ success: true, claim: toClaim(updated, next || undefined) });
  } catch (error) {
    logger.error('forum claim vote:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się zapisać oceny.' }, { status: 500 });
  }
}
