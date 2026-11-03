import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAdminToken } from '@/lib/admin-auth';
import { forumDb } from '@/lib/forum-db';
import { ask } from '@/lib/forum-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SCHEMA = { type: 'object', properties: { problemy: { type: 'array', items: { type: 'string' } } }, required: ['problemy'], additionalProperties: false };

// GET ?kat=dom — niewykorzystane podpowiedzi problemów do nagrania (tylko Brat)
export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  const kat = new URL(req.url).searchParams.get('kat') || 'dom';
  const { data } = await forumDb.from('forum_podpowiedzi').select('id, title').eq('category_id', kat).eq('used', false).order('created_at').limit(20);
  return NextResponse.json({ success: true, podpowiedzi: data || [] });
}

// POST { kat } — AI wymyśla 8 nowych, życiowych problemów, których jeszcze nie ma na forum. POST { uzyj: id } — odhacza podpowiedź.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!(await verifyAdminToken(req, body))) return NextResponse.json({ success: false, error: 'Brak dostępu' }, { status: 401 });
  try {
    if (body.uzyj) {
      await forumDb.from('forum_podpowiedzi').update({ used: true }).eq('id', String(body.uzyj));
      return NextResponse.json({ success: true });
    }
    const kat = String(body.kat || 'dom');
    const [{ data: cat }, { data: watki }, { data: stare }] = await Promise.all([
      forumDb.from('forum_categories').select('name, description, is_adult').eq('id', kat).maybeSingle(),
      forumDb.from('forum_threads').select('title').eq('category_id', kat).eq('status', 'widoczny').limit(300),
      forumDb.from('forum_podpowiedzi').select('title').eq('category_id', kat).limit(500),
    ]);
    if (!cat || cat.is_adult) return NextResponse.json({ success: false, error: 'Zła kategoria' }, { status: 400 });
    const byly = [...(watki || []), ...(stare || [])].map((x) => x.title);
    const out = await ask([{
      type: 'text',
      text: `Kategoria forum: ${cat.name} (${cat.description}).\n\nPodaj 8 konkretnych, życiowych problemów, z którymi zwykli ludzie w Polsce naprawdę się mierzą w tej dziedzinie `
        + 'i o które warto zapytać doświadczonego fachowca przez telefon. Każdy jako krótkie pytanie, tak jak człowiek by je powiedział (do 12 słów), '
        + 'np. „Cieknie syfon pod zlewem, co zrobić?”. Różne tematy, od codziennych po rzadsze. Bez powtórek z listy poniżej.\n\n'
        + `JUŻ BYŁY:\n${byly.slice(0, 300).join('\n') || '(nic)'}`,
    }], 'Podsuwasz tematy na forum z poradami. Tylko pytania, bez komentarzy.', 1500, { model: 'claude-haiku-5-5', schema: SCHEMA });
    const nowe = ((JSON.parse(out || '{"problemy":[]}').problemy || []) as string[])
      .map((t) => t.trim().slice(0, 200)).filter((t) => t && !byly.some((b) => b.toLowerCase() === t.toLowerCase())).slice(0, 8);
    if (nowe.length) await forumDb.from('forum_podpowiedzi').insert(nowe.map((title) => ({ category_id: kat, title })));
    const { data } = await forumDb.from('forum_podpowiedzi').select('id, title').eq('category_id', kat).eq('used', false).order('created_at').limit(20);
    return NextResponse.json({ success: true, podpowiedzi: data || [] });
  } catch (error) {
    logger.error('forum podpowiedzi:', error);
    return NextResponse.json({ success: false, error: 'AI chwilowo nie podpowiada' }, { status: 500 });
  }
}
