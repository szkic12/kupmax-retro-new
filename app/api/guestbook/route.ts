import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for guestbook entries (temporary)
// In production, use Supabase
let guestbookEntries: Array<{
  id: string;
  name: string;
  message: string;
  timestamp: number;
  approved: boolean;
}> = [
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
    message: 'This is the coolest retro website I\'ve seen! The Tetris game is awesome! 🕹️',
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '15');

    // Get approved entries, sorted by newest first
    const entries = guestbookEntries
      .filter((entry) => entry.approved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return NextResponse.json({ success: true, entries });
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

    const newEntry = {
      id: Date.now().toString(),
      name: name.substring(0, 50),
      message: message.substring(0, 500),
      timestamp: Date.now(),
      approved: true, // Auto-approve for now
    };

    guestbookEntries.push(newEntry);

    // Keep only last 100 entries
    if (guestbookEntries.length > 100) {
      guestbookEntries = guestbookEntries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
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
