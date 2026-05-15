import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { firestore, storageBucket } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { validateUrl } from '@/lib/validate-url';
import S3Service from '@/lib/aws-s3';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const { title, userDescription, category, modelUrl, shopUrl, backgroundMusicUrl, embeddedVideoUrl, thumbnailUrl, showInShorts } = body;

    const urlsToValidate = [modelUrl, shopUrl, backgroundMusicUrl, embeddedVideoUrl, thumbnailUrl].filter(Boolean);
    for (const url of urlsToValidate) {
      if (!validateUrl(url)) {
        return NextResponse.json(
          { success: false, error: `Nieprawidłowy URL: ${url}` },
          { status: 400 }
        );
      }
    }

    // Whitelist — tylko te pola może admin edytować
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) { updateData.title = title.substring(0, 100); updateData.displayName = title.substring(0, 100); }
    if (modelUrl !== undefined) updateData.modelUrl = modelUrl;
    if (userDescription !== undefined) updateData.userDescription = userDescription.substring(0, 1000);
    if (category !== undefined) updateData.category = category;
    if (shopUrl !== undefined) updateData.shopUrl = shopUrl;
    if (backgroundMusicUrl !== undefined) updateData.backgroundMusicUrl = backgroundMusicUrl;
    if (embeddedVideoUrl !== undefined) updateData.embeddedVideoUrl = embeddedVideoUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (showInShorts !== undefined) updateData.showInShorts = showInShorts === true;
    // Pola systemowe (funnyVotes, whatIsItVotes, commentsCount, uploaderId) są ignorowane

    await firestore.collection('models3D').doc(id).update(updateData);
    logger.log(`Model ${id} updated`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('models3d PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    // Pobierz dokument żeby wiedzieć gdzie jest plik
    const doc = await firestore.collection('models3D').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
    }

    const data = doc.data()!;
    const modelUrl: string | undefined = data.modelUrl;

    // Najpierw usuń plik — jeśli wywali błąd, Firestore zostaje (atomowość)
    if (modelUrl) {
      const s3Prefix = 'https://kupmax-downloads.s3.eu-central-1.amazonaws.com/';
      const firebasePrefix = 'https://firebasestorage.googleapis.com/';

      if (modelUrl.startsWith(s3Prefix)) {
        const s3Key = decodeURIComponent(modelUrl.replace(s3Prefix, ''));
        await S3Service.deleteFile(s3Key);
        logger.log(`S3 file deleted: ${s3Key}`);
      } else if (modelUrl.startsWith(firebasePrefix)) {
        const url = new URL(modelUrl);
        const match = url.pathname.match(/\/o\/(.+)$/);
        if (match) {
          const filePath = decodeURIComponent(match[1]);
          await storageBucket.file(filePath).delete();
          logger.log(`Firebase Storage file deleted: ${filePath}`);
        }
      }
    }

    // Plik usunięty — teraz usuń z Firestore
    await firestore.collection('models3D').doc(id).delete();
    logger.log(`Model ${id} deleted from Firestore`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('models3d DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
