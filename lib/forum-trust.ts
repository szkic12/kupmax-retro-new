// Sito przed ogłupianiem (K9).
// Każdy głos ma wagę: nowe konto 0,2, z czasem do 1, a dobra trafność względem pieczęci Brata daje do 3.
// Kawałek uznany za fałsz albo wpis usunięty przez moderację obniża na stałe sufit wagi autora.
// AI nie głosuje. Kilka kont z jednego urządzenia/IP liczy się jak jedna osoba.
import { createHash } from 'crypto';
import { forumDb } from '@/lib/forum-db';

type Row = Record<string, any>;

export const MAX_TRUST = 3;
const NEW_TRUST = 0.2;
const MIN_TRUST = 0.05;
const FALSE_PENALTY = 0.25;   // sufit w dół za każdy kawałek uznany za fałsz
const REMOVED_PENALTY = 1;    // sufit w dół za każdy wpis usunięty przez moderację
const MIN_CEILING = 0.3;
const PEOPLE_START = 2;       // na start wystarczą 2 osoby…
const PEOPLE_LATER = 3;       // …a 3, gdy forum się rozkręci
const ACTIVE_FOR_LATER = 30;  // tylu aktywnych ludzi z listkiem 🌿+ w 30 dni
const DONE_PEOPLE = 2;        // wariant „sprawdzony w praktyce”: 2 osoby…
const DONE_WEIGHT = 2;        // …o łącznej wadze 2

export const ipHash = (ip: string) => createHash('sha256').update(`kupmax-forum-glos:${ip}`).digest('hex').slice(0, 32);

// 🌱 nowy, 🌿 pewny, 🌳 sprawdzony (pokazujemy listki, nie liczby)
export function leaf(trust: number) {
  if (trust >= 1.5) return { icon: '🌳', label: 'sprawdzony: często trafia' };
  if (trust >= 0.5) return { icon: '🌿', label: 'pewny' };
  return { icon: '🌱', label: 'nowy' };
}

export function computeTrust(p: Row) {
  const days = (Date.now() - new Date(p.created_at || Date.now()).getTime()) / 86400000;
  const age = days < 3 ? NEW_TRUST : days < 14 ? 0.5 : 1;
  // Trafność liczona z ostrożnym założeniem 50/50, póki jest mało pieczęci
  const acc = (p.seal_hits + 1) / (p.seal_total + 2);
  const accFactor = p.seal_total >= 3 ? (acc >= 0.5 ? 1 + 2 * ((acc - 0.5) / 0.5) : acc * 2) : 1;
  const ceiling = Math.max(MIN_CEILING, MAX_TRUST - FALSE_PENALTY * (p.false_claims || 0) - REMOVED_PENALTY * (p.removed_count || 0));
  return Math.round(Math.max(MIN_TRUST, Math.min(ceiling, age * accFactor)) * 100) / 100;
}

export async function refreshTrust(userId: string | null) {
  if (!userId) return null;
  const { data: p } = await forumDb.from('forum_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!p) return null;
  const trust = computeTrust(p);
  if (trust !== Number(p.trust)) await forumDb.from('forum_profiles').update({ trust }).eq('user_id', userId);
  return trust;
}

// Licznik kary: delta +1/-1 w wybranej kolumnie profilu, potem nowa waga
export async function bumpPenalty(userId: string | null, column: 'false_claims' | 'removed_count', delta: number) {
  if (!userId) return;
  const { data: p } = await forumDb.from('forum_profiles').select(column).eq('user_id', userId).maybeSingle();
  if (!p) return;
  await forumDb.from('forum_profiles').update({ [column]: Math.max(0, ((p as Row)[column] || 0) + delta) }).eq('user_id', userId);
  await refreshTrust(userId);
}

// Ile osób musi potwierdzić: 2 na start, 3 gdy w 30 dni głosowało 30 ludzi z listkiem 🌿 albo wyższym
let peopleCache: { value: number; at: number } | null = null;
export async function peopleNeeded() {
  if (peopleCache && Date.now() - peopleCache.at < 10 * 60 * 1000) return peopleCache.value;
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: votes } = await forumDb.from('forum_claim_votes').select('user_id').gte('created_at', since).limit(20000);
  const users = [...new Set((votes || []).map((v) => v.user_id))];
  let active = 0;
  if (users.length >= ACTIVE_FOR_LATER) {
    const { count } = await forumDb.from('forum_profiles').select('user_id', { count: 'exact', head: true }).in('user_id', users).gte('trust', 0.5);
    active = count || 0;
  }
  const value = active >= ACTIVE_FOR_LATER ? PEOPLE_LATER : PEOPLE_START;
  peopleCache = { value, at: Date.now() };
  return value;
}

// Werdykt z ważonych głosów (pieczęć Brata zawsze wygrywa)
export function verdictOf(c: Row, s: { pYes: number; pNo: number; pDone: number; wyes: number; wno: number; wdone: number }, need: number) {
  if (c.seal === 'tak') return c.kind === 'wariant' ? 'praktyka' : 'sprawdzone';
  if (c.seal === 'nie') return 'falsz';
  if (c.kind === 'wariant') return s.pDone >= DONE_PEOPLE && s.wdone >= DONE_WEIGHT ? 'praktyka' : null;
  if (s.pYes >= need && s.wyes >= need && s.wyes >= 3 * s.wno) return 'sprawdzone';
  if (s.pNo >= need && s.wno >= need && s.wno >= 3 * s.wyes) return 'falsz';
  return null;
}

// Przelicza głosy kawałka: liczby osób, ważone sumy, werdykt i karę dla autora za fałsz
export async function recountClaim(claimId: string) {
  const { data: claim } = await forumDb.from('forum_claims').select('*').eq('id', claimId).maybeSingle();
  if (!claim) return null;
  const { data: votes } = await forumDb.from('forum_claim_votes').select('user_id, vote, ip_hash').eq('claim_id', claimId);
  const ids = [...new Set((votes || []).map((v) => v.user_id))];
  const { data: profs } = ids.length ? await forumDb.from('forum_profiles').select('user_id, trust').in('user_id', ids) : { data: [] };
  const trust = new Map((profs || []).map((p) => [p.user_id, Number(p.trust) || NEW_TRUST]));

  // Jedno urządzenie/IP = jedna osoba: liczy się głos najmocniejszego konta z tej grupy
  const groups = new Map<string, { vote: string; w: number }>();
  for (const v of votes || []) {
    const key = v.ip_hash || v.user_id;
    const w = trust.get(v.user_id) ?? NEW_TRUST;
    const prev = groups.get(key);
    if (!prev || w > prev.w) groups.set(key, { vote: v.vote, w });
  }
  const s = { pYes: 0, pNo: 0, pDone: 0, wyes: 0, wno: 0, wdone: 0 };
  for (const g of groups.values()) {
    if (g.vote === 'tak') { s.pYes++; s.wyes += g.w; }
    if (g.vote === 'nie') { s.pNo++; s.wno += g.w; }
    if (g.vote === 'dziala') { s.pDone++; s.wdone += g.w; }
  }
  const round = (x: number) => Math.round(x * 100) / 100;
  const count = (v: string) => (votes || []).filter((x) => x.vote === v).length;
  const verdict = verdictOf(claim, s, await peopleNeeded());

  // Kara za fałsz: raz, i cofnięta, gdy kawałek przestanie być fałszem
  const shouldPenalize = verdict === 'falsz' && !claim.is_ai && !!claim.author_id;
  const { data: updated } = await forumDb.from('forum_claims').update({
    yes: count('tak'), no: count('nie'), done: count('dziala'),
    wyes: round(s.wyes), wno: round(s.wno), wdone: round(s.wdone),
    verdict,
    verdict_at: verdict !== claim.verdict ? new Date().toISOString() : claim.verdict_at,
    penalized: shouldPenalize,
  }).eq('id', claimId).select('*').single();
  if (shouldPenalize !== !!claim.penalized) await bumpPenalty(claim.author_id, 'false_claims', shouldPenalize ? 1 : -1);
  return updated;
}

// Pieczęć Brata: ustawia werdykt i rozlicza trafność wszystkich, którzy głosowali ✅/❌
export async function setSeal(claimId: string, seal: 'tak' | 'nie' | null) {
  await forumDb.from('forum_claims').update({ seal, seal_at: seal ? new Date().toISOString() : null }).eq('id', claimId);
  const { data: votes } = await forumDb.from('forum_claim_votes').select('user_id, vote, scored').eq('claim_id', claimId).in('vote', ['tak', 'nie']);
  for (const v of votes || []) {
    const next = seal ? (v.vote === seal ? 'hit' : 'miss') : null;
    if (next === v.scored) continue;
    const { data: p } = await forumDb.from('forum_profiles').select('seal_hits, seal_total').eq('user_id', v.user_id).maybeSingle();
    if (p) {
      const hits = p.seal_hits - (v.scored === 'hit' ? 1 : 0) + (next === 'hit' ? 1 : 0);
      const total = p.seal_total - (v.scored ? 1 : 0) + (next ? 1 : 0);
      await forumDb.from('forum_profiles').update({ seal_hits: Math.max(0, hits), seal_total: Math.max(0, total) }).eq('user_id', v.user_id);
      await refreshTrust(v.user_id);
    }
    await forumDb.from('forum_claim_votes').update({ scored: next }).eq('claim_id', claimId).eq('user_id', v.user_id);
  }
  return recountClaim(claimId);
}

// Czy kawałek przeszedł przez sito i może iść do nauki (K10)
export const passedSieve = (c: Row) => c.seal === 'tak' || c.verdict === 'sprawdzone' || c.verdict === 'praktyka';
