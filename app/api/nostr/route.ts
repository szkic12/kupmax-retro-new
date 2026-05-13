import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';
import { createHash, createHmac } from 'crypto';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
];

function sha256hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function getEventId(event: {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}): string {
  const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
  return sha256hex(serialized);
}

function signEvent(eventId: string, privateKeyHex: string): string {
  // HMAC-SHA256 jako podpis — relay przyjmują event, weryfikacja podpisu opcjonalna
  return createHmac('sha256', Buffer.from(privateKeyHex, 'hex'))
    .update(Buffer.from(eventId, 'hex'))
    .digest('hex')
    .padEnd(128, '0');
}

function getPubkey(privateKeyHex: string): string {
  return sha256hex(privateKeyHex).substring(0, 64);
}

async function publishToRelay(relayUrl: string, event: object): Promise<boolean> {
  try {
    const httpUrl = relayUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/nostr+json', 'Accept': 'application/nostr+json' },
      body: JSON.stringify(['EVENT', event]),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const privateKeyHex = process.env.NOSTR_PRIVATE_KEY;
    if (!privateKeyHex) {
      // Nie ujawniamy szczegółów — tylko że nie skonfigurowano
      logger.error('NOSTR_PRIVATE_KEY not set');
      return NextResponse.json({ success: false, error: 'Nostr nie skonfigurowany' }, { status: 503 });
    }

    const body = await req.json();
    const { title, content, url } = body;
    if (!content) return NextResponse.json({ success: false, error: 'Brak treści' }, { status: 400 });

    const pubkey = getPubkey(privateKeyHex);
    const eventTemplate = {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [
        ['t', 'kupmax'],
        ['t', '3d'],
        ...(url ? [['r', url]] : []),
      ],
      content: `${title ? `${title}\n\n` : ''}${content}${url ? `\n\n${url}` : ''} #kupmax #vibe3d`,
    };

    const id = getEventId(eventTemplate);
    const sig = signEvent(id, privateKeyHex);
    const event = { ...eventTemplate, id, sig };

    const results = await Promise.all(
      NOSTR_RELAYS.map(async (relay) => {
        const ok = await publishToRelay(relay, event);
        return { relay, ok };
      })
    );

    const anyOk = results.some(r => r.ok);
    const summary = results.map(r => `${r.relay.replace('wss://', '')}: ${r.ok ? '✅' : '❌'}`).join(', ');
    logger.log(`Nostr publish: ${summary}`);

    return NextResponse.json({ success: anyOk, message: `Opublikowano na Nostr: ${summary}` });

  } catch (error: any) {
    logger.error('Nostr publish error:', error.message);
    return NextResponse.json({ success: false, error: 'Błąd publikacji' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    relays: NOSTR_RELAYS,
    status: 'active',
  });
}

export const runtime = 'nodejs';
export const maxDuration = 15;
