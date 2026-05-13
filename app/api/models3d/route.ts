import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { firestore } from '@/lib/firebase-admin';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

// POST /api/models3d — zapisuje metadata do Firestore po uploadzie (S3 lub Firebase Storage)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { modelUrl, fileName, title, description, category, shopUrl, availableForDownload } = body;

    if (!modelUrl || !fileName || !title) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: modelUrl, fileName, title' },
        { status: 400 }
      );
    }

    const docData = {
      modelUrl,
      title,
      displayName: title,
      category: category || 'Art',
      userDescription: description || '',
      uploaderId: 'admin-kupmax',
      uploaderName: 'KupMax',
      createdAt: new Date(),
      funnyVotes: 0,
      whatIsItVotes: 0,
      commentsCount: 0,
      originalFormat: fileName.split('.').pop()?.toLowerCase() || 'glb',
      needsConversion: false,
      shopUrl: shopUrl || '',
      availableForDownload: availableForDownload || false,
    };

    const docRef = await firestore.collection('models3D').add(docData);

    return NextResponse.json({
      success: true,
      firestoreId: docRef.id,
      modelUrl,
    });
  } catch (error: any) {
    console.error('models3d POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/models3d — lista modeli z Firestore
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await firestore
      .collection('models3D')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const models = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
