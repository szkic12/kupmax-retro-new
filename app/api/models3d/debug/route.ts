import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const ADMIN_EMAILS = ['kontakt@kupmax.pl', 'investcrewe@gmail.com'];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const info = {
    FIREBASE_PROJECT_ID: projectId || 'MISSING',
    FIREBASE_CLIENT_EMAIL: clientEmail || 'MISSING',
    FIREBASE_PRIVATE_KEY_length: privateKey?.length || 0,
    FIREBASE_PRIVATE_KEY_starts: privateKey?.substring(0, 30) || 'MISSING',
    FIREBASE_PRIVATE_KEY_hasRealNewlines: privateKey?.includes('\n') || false,
    FIREBASE_PRIVATE_KEY_hasLiteralBackslashN: privateKey?.includes('\\n') || false,
  };

  try {
    const admin = await import('firebase-admin');
    if (!admin.default.apps.length) {
      admin.default.initializeApp({
        credential: admin.default.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey?.replace(/\\n/g, '\n'),
        }),
        storageBucket: 'vibe3d-ece08.firebasestorage.app',
      });
    }
    const db = admin.default.firestore();
    const snap = await db.collection('models3D').limit(1).get();
    return NextResponse.json({ ok: true, docs: snap.size, info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, info });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
