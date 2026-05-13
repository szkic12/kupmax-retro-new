import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storageBucket } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_EXTENSIONS = ['glb', 'gltf', 'obj'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Brak pliku' }, { status: 400 });
    }

    // Walidacja rozmiaru
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Plik za duży. Maks. ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Walidacja rozszerzenia
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Dozwolone formaty: .glb, .gltf, .obj' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `models3d/${timestamp}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileRef = storageBucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || 'model/gltf-binary' },
    });

    // Signed URL ważny 10 lat — kompromis między bezpieczeństwem a UX w apce mobilnej
    // (appka publiczna, URL musi działać długo; nie zawiera danych osobowych)
    const [firebaseUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-2036',
    });

    logger.log(`Firebase Storage upload: ${storagePath} (${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      firebaseUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    logger.error('Firebase Storage upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
