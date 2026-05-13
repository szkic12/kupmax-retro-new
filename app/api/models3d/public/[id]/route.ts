import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const doc = await firestore.collection('models3D').doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = doc.data()!;
  // Zwracamy tylko publiczne pola — bez wewnętrznych kluczy
  return NextResponse.json({
    id: doc.id,
    title: d.displayName || d.title,
    description: d.userDescription || '',
    category: d.category || '',
    thumbnailUrl: d.thumbnailUrl || '',
    shopUrl: d.shopUrl || '',
    uploaderName: d.uploaderName || 'KupMax',
    funnyVotes: d.funnyVotes || 0,
    whatIsItVotes: d.whatIsItVotes || 0,
    commentsCount: d.commentsCount || 0,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
  });
}

export const runtime = 'nodejs';
