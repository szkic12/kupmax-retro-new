import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { firestore, FieldValue, auth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { validateUrl, validateUrls } from '@/lib/validate-url';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      modelUrl, fileName, title, description, category,
      shopUrl, backgroundMusicUrl, embeddedVideoUrl,
      thumbnailUrl, galleryImageUrls, availableForDownload,
      showInShorts,
    } = body;

    if (!modelUrl || !fileName || !title) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: modelUrl, fileName, title' },
        { status: 400 }
      );
    }

    // Walidacja URLi — tylko https z dozwolonych hostów
    const urlsToValidate = [
      modelUrl, shopUrl, backgroundMusicUrl,
      embeddedVideoUrl, thumbnailUrl,
    ].filter(Boolean);

    const galleryArray: string[] = Array.isArray(galleryImageUrls)
      ? galleryImageUrls
      : (galleryImageUrls || '').split(',').map((u: string) => u.trim()).filter(Boolean);

    if (!validateUrls(urlsToValidate) || !validateUrls(galleryArray)) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowy URL — tylko https z dozwolonych domen' },
        { status: 400 }
      );
    }

    // Pobierz prawdziwy Firebase UID z emaila sesji
    let uploaderId = 'admin-kupmax';
    let uploaderName = session.user.name || 'KupMax';
    let uploaderPhotoURL: string | null = session.user.image || null;
    try {
      const firebaseUser = await auth.getUserByEmail(session.user.email!);
      uploaderId = firebaseUser.uid;
      uploaderName = firebaseUser.displayName || uploaderName;
      uploaderPhotoURL = firebaseUser.photoURL || uploaderPhotoURL;
    } catch (e) {
      // fallback — zostaje 'admin-kupmax'
    }

    const docData = {
      modelUrl,
      title,
      displayName: title,
      category: category || 'Art',
      userDescription: description || '',
      uploaderId,
      uploaderName,
      uploaderPhotoURL,
      createdAt: FieldValue.serverTimestamp(),
      funnyVotes: 0,
      whatIsItVotes: 0,
      commentsCount: 0,
      originalFormat: fileName.split('.').pop()?.toLowerCase() || 'glb',
      needsConversion: false,
      shopUrl: shopUrl || '',
      backgroundMusicUrl: backgroundMusicUrl || '',
      embeddedVideoUrl: embeddedVideoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      galleryImageUrls: galleryArray,
      availableForDownload: availableForDownload || false,
      showInShorts: showInShorts === true,
    };

    const docRef = await firestore.collection('models3D').add(docData);
    logger.log(`Model added to Firestore: ${docRef.id}`);

    return NextResponse.json({ success: true, firestoreId: docRef.id, modelUrl });
  } catch (error: any) {
    logger.error('models3d POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
    logger.error('models3d GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
