import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { notify } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Powiadomienie o nowych użytkownikach Vibe3D (2026-08-20, prośba Brata:
// "żebym wiedział, czy ktoś nowy nie wszedł na vibe3d").
//
// Wywoływane przez panelrudy przy otwarciu zakładki Vibe3D — sprawdza,
// ilu użytkowników przybyło od ostatniego zajrzenia i wysyła jedną
// zbiorczą wiadomość, nie po jednej na osobę.
export async function POST(req: Request) {
  try {
    const { since } = await req.json().catch(() => ({ since: null }));

    let query = firestore.collection('users').orderBy('createdAt', 'desc').limit(50);
    const snap = await query.get();

    type NewUser = { nick: string; at: string };
    const users: NewUser[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      const at = d.createdAt?.toDate?.()?.toISOString?.() ?? null;
      if (!at) return;
      if (since && at <= since) return;
      users.push({ nick: d.nickname || d.customName || 'ktoś nowy', at });
    });

    if (users.length > 0) {
      const nicks = users.slice(0, 5).map((u) => u.nick).join(', ');
      const more = users.length > 5 ? ` i ${users.length - 5} więcej` : '';
      await notify(
        'chat',
        'Vibe3D',
        `${users.length === 1 ? 'Nowy użytkownik' : `Nowych użytkowników: ${users.length}`} — ${nicks}${more}`,
        'https://www.kupmax.pl/panelrudy'
      );
    }

    return NextResponse.json({
      ok: true,
      count: users.length,
      newest: users[0]?.at ?? since ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'blad' },
      { status: 500 }
    );
  }
}
