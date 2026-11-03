import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { forumDb } from '@/lib/forum-db';
import { getForumUser } from '@/lib/forum-auth';
import { sanitizeInput } from '@/lib/sanitize';
import { voiceFields, MAX_BODY } from '@/lib/forum-voice';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/i;
const STATUSES = ['do_zrobienia', 'odebral', 'nie_odebral', 'oddzwoni', 'nie_dzwonic', 'pominiete'];

// GET: lista na dziś (i zaległe „do zrobienia”/„oddzwoni”), pogrupowana po problemach. Tylko Brat.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: calls, error } = await forumDb.from('forum_calls')
      .select('*, forum_contacts(*), forum_threads(id, title, body, category_id, status)')
      // Lista na dziś i jutro (wieczorem robi się lista na jutro), zaległe „do zrobienia”/„oddzwoni” i wszystko, do czego dzwoniłeś dziś
      .or(`plan_date.gte.${today},status.in.(do_zrobienia,oddzwoni),called_at.gte.${today}T00:00:00`)
      .order('created_at').limit(300);
    if (error) throw error;
    const threadIds = [...new Set((calls || []).map((c) => c.thread_id))];
    const { data: ai } = threadIds.length
      ? await forumDb.from('forum_posts').select('thread_id, body, created_at').in('thread_id', threadIds).eq('is_ai', true).eq('status', 'widoczny').order('created_at', { ascending: false })
      : { data: [] };
    const groups = new Map<string, any>();
    for (const c of calls || []) {
      if (c.forum_threads?.status !== 'widoczny') continue;
      const g = groups.get(c.thread_id) || {
        thread: { id: c.thread_id, title: c.forum_threads.title, body: String(c.forum_threads.body || '').slice(0, 400), category: c.forum_threads.category_id },
        ai: (ai || []).find((p) => p.thread_id === c.thread_id)?.body?.slice(0, 600) || null,
        calls: [],
      };
      g.calls.push({ ...c, contact: c.forum_contacts, forum_contacts: undefined, forum_threads: undefined });
      groups.set(c.thread_id, g);
    }
    return NextResponse.json({ success: true, today, groups: [...groups.values()] });
  } catch (error) {
    logger.error('forum telefony GET:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}

// POST { action: 'status', callId, status } | { action: 'odpowiedz', callId, verdict, consentName, label, message, voice… }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!(await verifyAdminToken(req, body))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    const { action, callId } = body;
    if (!UUID.test(callId || '')) return NextResponse.json({ success: false, error: 'Zła rozmowa' }, { status: 400 });
    const { data: call } = await forumDb.from('forum_calls').select('*, forum_contacts(*)').eq('id', callId).maybeSingle();
    if (!call) return NextResponse.json({ success: false, error: 'Nie ma takiej rozmowy' }, { status: 404 });
    const now = new Date().toISOString();

    if (action === 'status') {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ success: false, error: 'Zły status' }, { status: 400 });
      await forumDb.from('forum_calls').update({ status: body.status, ...(body.status !== 'do_zrobienia' && body.status !== 'pominiete' ? { called_at: now } : {}) }).eq('id', callId);
      if (!['do_zrobienia', 'pominiete'].includes(body.status)) await forumDb.from('forum_contacts').update({ last_called_at: now }).eq('id', call.contact_id);
      // „Nie dzwońcie więcej” = na zawsze i we wszystkich zaplanowanych rozmowach
      if (body.status === 'nie_dzwonic') {
        await forumDb.from('forum_contacts').update({ do_not_call: true }).eq('id', call.contact_id);
        await forumDb.from('forum_calls').update({ status: 'pominiete' }).eq('contact_id', call.contact_id).in('status', ['do_zrobienia', 'oddzwoni']);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'odpowiedz') {
      const c = call.forum_contacts;
      const verdict = ['tak', 'nie'].includes(body.verdict) ? body.verdict : null;
      const consent = !!body.consentName;
      // Bez zgody na podpis: tylko branża i miasto
      const label = consent && body.label
        ? sanitizeInput(String(body.label), 200)
        : `fachowiec${c.branza ? ` (${String(c.branza).split(';')[0].trim().toLowerCase().slice(0, 60)})` : ''}${c.miasto ? `, ${c.miasto}` : ''}`.slice(0, 200);
      let postId: string | null = call.answer_post_id;

      // Brat opowiada (tekstem albo głosem), co powiedział fachowiec: wpis pod problemem, autorem jest Brat
      const message = sanitizeInput(String(body.message || ''), MAX_BODY).trim();
      if (message) {
        const me = await getForumUser(req);
        if (!me?.profile) return NextResponse.json({ success: false, error: 'Zaloguj się na forum na tym urządzeniu, żeby dodać odpowiedź fachowca.' }, { status: 401 });
        const voice = await voiceFields(me.user.id, { voiceKey: body.voiceKey, voiceMode: body.voiceMode, voiceSeconds: body.voiceSeconds }, message);
        if ('error' in voice) return NextResponse.json({ success: false, error: voice.error }, { status: 400 });
        const { data: post, error } = await forumDb.from('forum_posts').insert({
          thread_id: call.thread_id, author_id: me.user.id, author_nick: me.profile.nick, author_avatar: me.profile.avatar,
          body: message, ...voice, photos: [], expert_label: `📞 ${label}`,
        }).select('id').single();
        if (error) throw error;
        postId = post.id;
      }
      await forumDb.from('forum_calls').update({ status: 'odebral', verdict, consent_name: consent, label, answer_post_id: postId, called_at: call.called_at || now }).eq('id', callId);
      await forumDb.from('forum_contacts').update({ last_called_at: now }).eq('id', call.contact_id);
      return NextResponse.json({ success: true, postId });
    }
    return NextResponse.json({ success: false, error: 'Zła akcja' }, { status: 400 });
  } catch (error) {
    logger.error('forum telefony POST:', error);
    return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
  }
}
