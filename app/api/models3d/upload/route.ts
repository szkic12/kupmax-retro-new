import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { storageBucket } from '@/lib/firebase-admin';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

// POST /api/models3d/upload
// Odbiera plik GLB i wgrywa go do Firebase Storage (models3d/ — prywatny)
// Zwraca: firebaseUrl (publiczny download URL z Firebase)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Brak pliku' }, { status: 400 });
    }

    const allowedExtensions = ['glb', 'gltf', 'obj'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ success: false, error: 'Dozwolone: .glb, .gltf, .obj' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `models3d/${timestamp}_${safeName}`;

    // Wgraj plik do Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileRef = storageBucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || 'model/gltf-binary',
      },
    });

    // Pobierz publiczny download URL (wymaga makePublic lub signedUrl)
    // Używamy getSignedUrl z bardzo długim czasem (100 lat) — de facto permanentny
    const [firebaseUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-2125',
    });

    return NextResponse.json({
      success: true,
      firebaseUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
