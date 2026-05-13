import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { firestore } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { validateUrl } from '@/lib/validate-url';

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
    const { title, userDescription, category, modelUrl, shopUrl, backgroundMusicUrl, embeddedVideoUrl, thumbnailUrl } = body;

    const urlsToValidate = [modelUrl, shopUrl, backgroundMusicUrl, embeddedVideoUrl, thumbnailUrl].filter(Boolean);
    for (const url of urlsToValidate) {
      if (!validateUrl(url)) {
        return NextResponse.json(
          { success: false, error: `Nieprawidłowy URL: ${url}` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title.substring(0, 100);
    if (title !== undefined) updateData.displayName = title.substring(0, 100);
    if (modelUrl !== undefined) updateData.modelUrl = modelUrl;
    if (userDescription !== undefined) updateData.userDescription = userDescription.substring(0, 1000);
    if (category !== undefined) updateData.category = category;
    if (shopUrl !== undefined) updateData.shopUrl = shopUrl;
    if (backgroundMusicUrl !== undefined) updateData.backgroundMusicUrl = backgroundMusicUrl;
    if (embeddedVideoUrl !== undefined) updateData.embeddedVideoUrl = embeddedVideoUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

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

    await firestore.collection('models3D').doc(id).delete();
    logger.log(`Model ${id} deleted`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('models3d DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
