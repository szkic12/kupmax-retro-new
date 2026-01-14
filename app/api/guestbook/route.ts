import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../lib/aws-s3.js';

// Wyłącz cache dla tego route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Domyślne wpisy (używane gdy S3 jest puste)
const DEFAULT_ENTRIES = [
  {
    id: '1',
    name: 'RetroFan',
    message: 'Love this Windows 95 vibes! Brings back so many memories! 💾',
    timestamp: Date.now() - 3600000,
    approved: true,
  },
  {
    id: '2',
    name: 'WebSurfer98',
    message: 'This is the coolest retro website I\'ve seen! The games are awesome! 🕹️',
    timestamp: Date.now() - 7200000,
    approved: true,
  },
  {
    id: '3',
    name: 'NostalgiaKid',
    message: 'Takes me back to the good old days of dial-up and GeoCities! 🌐',
    timestamp: Date.now() - 10800000,
    approved: true,
  },
];

// Pobierz wpisy z S3
async function getGuestbookEntries() {
  const result = await s3Service.loadJsonData('guestbook', DEFAULT_ENTRIES);
  return result.data || DEFAULT_ENTRIES;
}

// Zapisz wpisy do S3
async function saveGuestbookEntries(entries: any[]) {
  return await s3Service.saveJsonData('guestbook', entries);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '15');

    const guestbookEntries = await getGuestbookEntries();

    // Get approved entries, sorted by newest first
    const entries = guestbookEntries
      .filter((entry: any) => entry.approved)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return NextResponse.json(
      { success: true, entries },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Error fetching guestbook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guestbook entries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || body.nickname;
    const message = body.message;

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const guestbookEntries = await getGuestbookEntries();

    const newEntry = {
      id: Date.now().toString(),
      name: name.substring(0, 50),
      message: message.substring(0, 500),
      timestamp: Date.now(),
      approved: true, // Auto-approve for now
    };

    guestbookEntries.push(newEntry);

    // Keep only last 100 entries
    const sortedEntries = guestbookEntries
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 100);

    // Zapisz do S3
    const saveResult = await saveGuestbookEntries(sortedEntries);

    if (!saveResult.success) {
      return NextResponse.json(
        { error: 'Failed to save to S3' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error('Error saving guestbook entry:', error);
    return NextResponse.json(
      { error: 'Failed to save entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    let guestbookEntries = await getGuestbookEntries();
    const initialLength = guestbookEntries.length;

    guestbookEntries = guestbookEntries.filter((entry: any) => String(entry.id) !== String(id));

    if (guestbookEntries.length === initialLength) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Zapisz do S3
    await saveGuestbookEntries(guestbookEntries);

    return NextResponse.json({
      success: true,
      message: 'Entry deleted'
    });
  } catch (error) {
    console.error('Error deleting guestbook entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
