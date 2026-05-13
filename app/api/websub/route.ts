import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://kupmax.pl';
const FEED_URL = `${SITE_URL}/api/rss`;

// Dwa huby — główny Google, fallback Superfeedr
const WEBSUB_HUBS = [
  'https://pubsubhubbub.appspot.com/',
  'https://pubsubhubbub.superfeedr.com/',
];

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

async function pingHub(hubUrl: string): Promise<{ ok: boolean; status: number; text: string }> {
  const body = new URLSearchParams({
    'hub.mode': 'publish',
    'hub.url': FEED_URL,
  });

  try {
    const res = await fetch(hubUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return { ok: res.ok || res.status === 204, status: res.status, text };
  } catch (e: any) {
    return { ok: false, status: 0, text: e.message };
  }
}

// GET — weryfikacja subskrypcji od huba
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const topic = searchParams.get('hub.topic');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' || mode === 'unsubscribe') {
    if (topic !== FEED_URL) {
      return new NextResponse('Invalid topic', { status: 404 });
    }
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse('WebSub endpoint aktywny', { status: 200 });
}

// POST — ping do hubów
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const results = await Promise.all(WEBSUB_HUBS.map(async (hub) => {
      const r = await pingHub(hub);
      logger.log(`WebSub ping ${hub}: ${r.status} ${r.text.substring(0, 100)}`);
      return { hub, ...r };
    }));

    const anyOk = results.some(r => r.ok);
    const summary = results.map(r => `${r.hub.replace('https://', '')}: ${r.ok ? '✅' : `❌${r.status}`}`).join(', ');

    if (anyOk) {
      return NextResponse.json({ success: true, message: `Powiadomiono: ${summary}` });
    }

    return NextResponse.json({ success: false, error: `Wszystkie huby zawiodły: ${summary}` }, { status: 502 });

  } catch (error: any) {
    logger.error('WebSub ping error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 15;
