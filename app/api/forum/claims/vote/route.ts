import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';
import { ipHash, recountClaim, refreshTrust, setSeal, touchChecked, shelfMap } from '@/lib/forum-trust';
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
      await refreshTrust(me.user.id); // waga rośnie z wiekiem konta, odświeżamy przy okazji
      const { error } = await forumDb.from('forum_claim_votes').upsert({ claim_id: claimId, user_id: me.user.id, vote: next, created_at: new Date().toISOString(), ip_hash: ipHash(getClientIP(req)) });
      if (error) throw error;
    } else if (prev) {
      // Cofnięty głos na kawałku z pieczęcią: odejmij go z trafności, zanim zniknie
      if (claim.seal) {
        const { data: v } = await forumDb.from('forum_claim_votes').select('scored').eq('claim_id', claimId).eq('user_id', me.user.id).maybeSingle();
        if (v?.scored) {
          const { data: p } = await forumDb.from('forum_profiles').select('seal_hits, seal_total').eq('user_id', me.user.id).single();
          if (p) await forumDb.from('forum_profiles').update({ seal_hits: Math.max(0, p.seal_hits - (v.scored === 'hit' ? 1 : 0)), seal_total: Math.max(0, p.seal_total - 1) }).eq('user_id', me.user.id);
          await refreshTrust(me.user.id);
        }
      }
      await forumDb.from('forum_claim_votes').delete().eq('claim_id', claimId).eq('user_id', me.user.id);
    }

    // Sito: ważone głosy, werdykt, kara za fałsz (lib/forum-trust)
    // Kawałek z pieczęcią: rozlicz zmieniony głos z trafnością (setSeal przelicza też werdykt)
    let updated = claim.seal && next ? await setSeal(claimId, claim.seal) : await recountClaim(claimId);
    // ✅ albo 👨‍🍳 na kawałku z werdyktem = „dalej aktualne”: zegar przydatności od nowa
    if ((next === 'tak' || next === 'dziala') && (updated?.verdict === 'sprawdzone' || updated?.verdict === 'praktyka')) {
      await touchChecked(claimId);
      updated = { ...updated, checked_at: new Date().toISOString() };
    }
    const { data: th } = updated?.thread_id ? await forumDb.from('forum_threads').select('category_id').eq('id', updated.thread_id).maybeSingle() : { data: null };
    const shelf = th ? (await shelfMap()).get(th.category_id) : undefined;
    return NextResponse.json({ success: true, claim: toClaim(updated, next || undefined, shelf) });
  } catch (error) {
    logger.error('forum claim vote:', error);
    return NextResponse.json({ success: false, error: 'Nie udało się zapisać oceny.' }, { status: 500 });
  }
}
