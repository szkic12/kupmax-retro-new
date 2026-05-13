import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://kupmax.pl';
const WEBSUB_HUB = 'https://hub.switchboard.pub';
const FEED_URL = `${SITE_URL}/api/rss`;

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

// GET — weryfikacja subskrypcji od huba (hub wysyła challenge, my go odsyłamy)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const topic = searchParams.get('hub.topic');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' || mode === 'unsubscribe') {
    if (topic !== FEED_URL) {
      return new NextResponse('Invalid topic', { status: 404 });
    }
    // Odsyłamy challenge — to potwierdza że jesteśmy właścicielem feeda
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse('WebSub endpoint aktywny', { status: 200 });
}

// POST — admin wywołuje aby pingować hub o nowej treści
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Ping do WebSub huba — informuje subskrybentów że feed się zaktualizował
    const body = new URLSearchParams({
      'hub.mode': 'publish',
      'hub.url': FEED_URL,
    });

    const res = await fetch(WEBSUB_HUB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (res.ok || res.status === 204) {
      logger.log(`WebSub ping sent to ${WEBSUB_HUB} for ${FEED_URL}`);
      return NextResponse.json({ success: true, message: 'Hub powiadomiony o nowej treści' });
    }

    const text = await res.text();
    logger.error(`WebSub ping failed: ${res.status} ${text}`);
    return NextResponse.json({ success: false, error: `Hub odpowiedział: ${res.status}` }, { status: 502 });

  } catch (error: any) {
    logger.error('WebSub ping error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 10;
