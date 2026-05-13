import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { firestore } from '@/lib/firebase-admin';
import S3Service from '@/lib/aws-s3';
import { randomUUID } from 'crypto';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

// Kategorie Vibe3D (muszą pasować do listy w apce)
const VIBE3D_CATEGORIES = [
  'Sztuka',
  'Jedzenie',
  'Natura',
  'Zwierzęta',
  'Pojazdy',
  'Architektura',
  'Ludzie',
  'Technologia',
  'Sport',
  'Inne',
];

// POST /api/models3d — upload GLB na S3 + zapis do Firestore
export async function POST(req: NextRequest) {
  try {
    // Auth check — tylko zalogowany admin
    const session = await getServerSession();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { s3Key, fileName, fileSize, title, description, category, shopUrl, availableForDownload } = body;

    if (!s3Key || !fileName || !title) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: s3Key, fileName, title' },
        { status: 400 }
      );
    }

    // Pobierz publiczny URL pliku z S3
    const modelUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Zapisz do Firebase Firestore models3D
    const docData = {
      modelUrl,
      title,
      displayName: title,
      category: category || 'Inne',
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
